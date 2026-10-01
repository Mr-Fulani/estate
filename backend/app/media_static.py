import re
from starlette.staticfiles import StaticFiles


class MediaStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        if response.status_code in {200, 206, 304} and re.fullmatch(r"properties/optimized/[a-f0-9]{64}\.(webp|mp4)", path):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response
