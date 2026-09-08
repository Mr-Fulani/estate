from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class ImageText(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    alt: str = Field(default="", max_length=500)
    caption: str = Field(default="", max_length=1000)
    decorative: bool = False


ImageDetails = dict[str, dict[Literal["ru", "en", "tr", "ar"], ImageText]]
