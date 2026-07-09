"""Image upload endpoint.

Stores uploaded files on local disk under `UPLOAD_DIR` and serves them back
via the `/uploads` static mount in `main.py`. This is a minimal stand-in for
real object storage (e.g. S3) — swap the `save` step for a cloud upload when
one is wired up; the response shape (`{"url": ...}`) can stay the same.
"""
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, status

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads"
WAREHOUSE_DIR = UPLOAD_ROOT / "warehouses"
WAREHOUSE_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Real file-format signatures (magic numbers), keyed by extension. The
# client-supplied `content_type` header is just a form field the caller sets
# themselves and proves nothing about what's actually in the file, so a
# renamed/relabeled non-image could otherwise slip through and later be
# served back to browsers as "safe" image content. Checking the actual bytes
# closes that gap.
def _sniff_extension(contents: bytes) -> str | None:
    if contents.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if contents.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if contents[:4] == b"RIFF" and contents[8:12] == b"WEBP":
        return ".webp"
    return None


@router.post("/warehouse-image", status_code=status.HTTP_201_CREATED)
async def upload_warehouse_image(file: UploadFile) -> dict[str, str]:
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Image must be 5MB or smaller",
        )

    ext = _sniff_extension(contents)
    if ext is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, or WebP images are allowed",
        )

    filename = f"{uuid.uuid4().hex}{ext}"
    (WAREHOUSE_DIR / filename).write_bytes(contents)

    return {"url": f"/uploads/warehouses/{filename}"}
