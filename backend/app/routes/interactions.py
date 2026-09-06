from fastapi import APIRouter, HTTPException, status

from app.models.interactions import (
    LikeRequest,
    LikeResponse,
    ShareRequest,
    ShareResponse,
)
from app.services.video_service import (
    VideoDataError,
    VideoNotFoundError,
    increment_counter,
)


router = APIRouter(tags=["interactions"])


@router.post(
    "/like",
    response_model=LikeResponse,
    summary="Like a video",
    responses={404: {"description": "Video not found"}},
)
def like_video(payload: LikeRequest) -> LikeResponse:
    """Persist one additional like for the supplied video."""
    try:
        likes = increment_counter(payload.video_id, "likes")
    except VideoNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video '{payload.video_id}' was not found.",
        ) from error
    except VideoDataError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to persist the video like.",
        ) from error

    return LikeResponse(video_id=payload.video_id, likes=likes)


@router.post(
    "/share",
    response_model=ShareResponse,
    summary="Share a video",
    responses={404: {"description": "Video not found"}},
)
def share_video(payload: ShareRequest) -> ShareResponse:
    """Persist one additional share for the supplied video."""
    try:
        shares = increment_counter(payload.video_id, "shares")
    except VideoNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video '{payload.video_id}' was not found.",
        ) from error
    except VideoDataError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to persist the video share.",
        ) from error

    return ShareResponse(
        video_id=payload.video_id,
        shares=shares,
        platform=payload.platform,
    )
