"""Warehouse image upload: size cap, magic-byte sniffing, that the size
check now happens on a bounded read instead of buffering the whole body,
and that the endpoint requires admin/manager auth (it previously had none)."""

from datetime import date

import pytest

from app.auth.dependencies import get_current_user
from app.main import app
from app.uploads.router import MAX_FILE_SIZE, WAREHOUSE_DIR
from app.users.models import User

JPEG_HEADER = b"\xff\xd8\xff"
PNG_HEADER = b"\x89PNG\r\n\x1a\n"


@pytest.fixture(autouse=True)
def _cleanup_uploaded_files():
    before = set(WAREHOUSE_DIR.iterdir())
    yield
    for path in set(WAREHOUSE_DIR.iterdir()) - before:
        path.unlink()


@pytest.fixture(autouse=True)
def _authenticate_as_admin(db_session):
    admin = User(id="u-admin", name="Admin User", email="admin@grandroyal.com",
                 hashed_password="x", role="admin", warehouse_id=None,
                 status="active", joined_date=date(2024, 1, 1))
    db_session.add(admin)
    db_session.commit()
    app.dependency_overrides[get_current_user] = lambda: admin
    yield
    app.dependency_overrides.pop(get_current_user, None)


def test_valid_jpeg_uploads_successfully(client):
    contents = JPEG_HEADER + b"\x00" * 100
    response = client.post(
        "/uploads/warehouse-image",
        files={"file": ("photo.jpg", contents, "image/jpeg")},
    )
    assert response.status_code == 201
    assert response.json()["url"].endswith(".jpg")


def test_oversized_file_is_rejected_with_413(client):
    contents = JPEG_HEADER + b"\x00" * (MAX_FILE_SIZE + 1)
    response = client.post(
        "/uploads/warehouse-image",
        files={"file": ("big.jpg", contents, "image/jpeg")},
    )
    assert response.status_code == 413


def test_spoofed_content_type_is_rejected_by_magic_bytes(client):
    # Content-Type claims JPEG, but the actual bytes aren't any known format --
    # the client-supplied type is never trusted on its own.
    contents = b"not-actually-an-image" + b"\x00" * 100
    response = client.post(
        "/uploads/warehouse-image",
        files={"file": ("fake.jpg", contents, "image/jpeg")},
    )
    assert response.status_code == 415


def test_oversized_upload_does_not_buffer_the_full_body(client, monkeypatch):
    """Regression test for the fix: file.read() used to have no size cap, so
    an oversized upload was fully read into memory before the 413 check ran.
    Patches UploadFile.read to record what size argument it was actually
    called with, proving the endpoint asks for a bounded chunk."""
    import starlette.datastructures as sd

    seen_sizes = []
    original_read = sd.UploadFile.read

    async def spy_read(self, size=-1):
        seen_sizes.append(size)
        return await original_read(self, size)

    monkeypatch.setattr(sd.UploadFile, "read", spy_read)

    contents = JPEG_HEADER + b"\x00" * (MAX_FILE_SIZE * 2)
    response = client.post(
        "/uploads/warehouse-image",
        files={"file": ("huge.jpg", contents, "image/jpeg")},
    )

    assert response.status_code == 413
    assert seen_sizes, "file.read() was never called"
    assert seen_sizes[0] == MAX_FILE_SIZE + 1


def test_upload_rejected_for_staff(client, db_session):
    staff = User(id="u-staff", name="Staff User", email="staff@grandroyal.com",
                 hashed_password="x", role="staff", warehouse_id=None,
                 status="active", joined_date=date(2024, 1, 1))
    db_session.add(staff)
    db_session.commit()
    app.dependency_overrides[get_current_user] = lambda: staff

    contents = JPEG_HEADER + b"\x00" * 100
    response = client.post(
        "/uploads/warehouse-image",
        files={"file": ("photo.jpg", contents, "image/jpeg")},
    )
    assert response.status_code == 403


def test_upload_rejected_without_authentication(client):
    app.dependency_overrides.pop(get_current_user, None)

    contents = JPEG_HEADER + b"\x00" * 100
    response = client.post(
        "/uploads/warehouse-image",
        files={"file": ("photo.jpg", contents, "image/jpeg")},
    )
    assert response.status_code in (401, 403)
