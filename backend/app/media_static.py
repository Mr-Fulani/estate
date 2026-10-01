import mimetypes
import re
from starlette.staticfiles import StaticFiles


class MediaStaticFiles(StaticFiles):
    def __init__(self, *args, **kwargs):
        # Slim container images may omit the OS MIME database.
        if not mimetypes.inited:
            mimetypes.init()
        mimetypes.add_type("image/webp", ".webp")
        mimetypes.add_type("video/mp4", ".mp4")
        super().__init__(*args, **kwargs)

    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        if response.status_code in {200, 206, 304} and re.fullmatch(r"properties/optimized/[a-f0-9]{64}\.(webp|mp4)", path):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response
