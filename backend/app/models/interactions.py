from typing import Literal

from pydantic import BaseModel, Field


class LikeRequest(BaseModel):
    """Payload used to register a like for a video."""

    video_id: str = Field(min_length=1, examples=["video-01"])
    user_id: str = Field(min_length=1, examples=["demo-user"])


class LikeResponse(BaseModel):
    """Result of a successfully persisted like."""

    success: Literal[True] = True
    video_id: str
    likes: int = Field(ge=0)


class ShareRequest(BaseModel):
    """Payload used to register a share for a video."""

    video_id: str = Field(min_length=1, examples=["video-01"])
    platform: str = Field(min_length=1, examples=["copy"])


class ShareResponse(BaseModel):
    """Result of a successfully persisted share."""

    success: Literal[True] = True
    video_id: str
    shares: int = Field(ge=0)
    platform: str
