from typing import Annotated, Literal
import subprocess
from PIL import UnidentifiedImageError

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config import get_settings
from app.media_storage import detect_image_extension, detect_video_extension, save_image, save_video
from app.models.admin_user import AdminUser
from app.security import require_permission


router = APIRouter(prefix="/api/v1/uploads", tags=["Uploads"])
settings = get_settings()


@router.post("/news", status_code=status.HTTP_201_CREATED)
async def upload_news_image(
    file: Annotated[UploadFile, File(...)],
    _: AdminUser = Depends(require_permission("news:write", csrf=True)),
):
    return await upload_image(file, "news")


@router.post("/properties", status_code=status.HTTP_201_CREATED)
async def upload_property_image(
    file: Annotated[UploadFile, File(...)],
    kind: Literal["photo", "plan"] = "photo",
    _: AdminUser = Depends(require_permission("properties:write", csrf=True)),
):
    return await upload_image(file, "properties", plan=kind == "plan")


@router.post("/properties/videos", status_code=status.HTTP_201_CREATED)
async def upload_property_video(
    file: Annotated[UploadFile, File(...)],
    _: AdminUser = Depends(require_permission("properties:write", csrf=True)),
):
    max_bytes = settings.MEDIA_MAX_VIDEO_MB * 1024 * 1024
    try:
        size = file.size
        if size is None or size <= 0:
            raise HTTPException(status_code=422, detail="The video file is empty")
        if size > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"Video must be smaller than {settings.MEDIA_MAX_VIDEO_MB} MB",
            )
        header = await file.read(32)
        extension = detect_video_extension(header, file.filename or "")
        if extension is None:
            raise HTTPException(
                status_code=415,
                detail="Supported video formats: MP4, MOV, WebM and Ogg",
            )
        await file.seek(0)
        try:
            return {"url": await save_video(file.file, "properties", extension)}
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, ValueError):
            raise HTTPException(status_code=422, detail="Video could not be processed; check the file and its duration")
    finally:
        await file.close()


async def upload_image(file: UploadFile, collection: str, *, plan: bool = False):
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
    try:
        url = await save_image(content, collection, plan=plan)
    except (UnidentifiedImageError, ValueError, OSError):
        raise HTTPException(status_code=422, detail="Image could not be processed; animated images must be uploaded as video")
    return {"url": url}
