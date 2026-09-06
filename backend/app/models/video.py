from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class Video(BaseModel):
    """A video record supplied by the local video source file."""

    id: str
    title: str
    description: str
    url: HttpUrl
    thumbnail_url: HttpUrl | Literal[""]
    likes: int = Field(ge=0)
    shares: int = Field(ge=0)


class VideosResponse(BaseModel):
    """Response payload for the video carousel."""

    videos: list[Video]
