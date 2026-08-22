from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config import get_settings
from app.media_storage import detect_image_extension, save_news_image
from app.models.admin_user import AdminUser
from app.security import require_permission


router = APIRouter(prefix="/api/v1/uploads", tags=["Uploads"])
settings = get_settings()


@router.post("/news", status_code=status.HTTP_201_CREATED)
async def upload_news_image(
    file: Annotated[UploadFile, File(...)],
    _: AdminUser = Depends(require_permission("news:write", csrf=True)),
):
    max_bytes = settings.MEDIA_MAX_IMAGE_MB * 1024 * 1024
    content = await file.read(max_bytes + 1)
    await file.close()
    if not content:
        raise HTTPException(status_code=422, detail="The image file is empty")
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image must be smaller than {settings.MEDIA_MAX_IMAGE_MB} MB",
        )
    if detect_image_extension(content) is None:
        raise HTTPException(
            status_code=415,
            detail="Supported image formats: JPEG, PNG, WebP and GIF",
        )
    url = await save_news_image(content)
    return {"url": url}
