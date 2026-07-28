"""Warehouse image upload: size cap, magic-byte sniffing, and that the size
check now happens on a bounded read instead of buffering the whole body."""

import pytest

from app.uploads.router import MAX_FILE_SIZE, WAREHOUSE_DIR

JPEG_HEADER = b"\xff\xd8\xff"
PNG_HEADER = b"\x89PNG\r\n\x1a\n"


@pytest.fixture(autouse=True)
def _cleanup_uploaded_files():
    before = set(WAREHOUSE_DIR.iterdir())
    yield
    for path in set(WAREHOUSE_DIR.iterdir()) - before:
        path.unlink()


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
