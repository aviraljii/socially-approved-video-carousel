from fastapi import APIRouter, HTTPException, status

from app.models.video import VideosResponse
from app.services.video_service import VideoDataError, get_videos as load_videos


router = APIRouter(tags=["videos"])


@router.get("/videos", response_model=VideosResponse)
def get_videos() -> VideosResponse:
    """Return the current videos listed in the local data source."""
    try:
        return VideosResponse(videos=load_videos())
    except VideoDataError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to read valid video metadata.",
        ) from error
