import json
import os
import tempfile
from pathlib import Path
from threading import RLock
from typing import Any, Literal

from pydantic import ValidationError

from app.models.video import Video, VideosResponse


VIDEO_SOURCE_FILE = Path(__file__).resolve().parents[2] / "video.json"
_source_file_lock = RLock()


class VideoDataError(RuntimeError):
    """Raised when the local video metadata cannot be read or persisted."""


class VideoNotFoundError(LookupError):
    """Raised when a requested video ID is absent from the metadata source."""


def _load_source_data() -> dict[str, Any]:
    try:
        source_data = json.loads(VIDEO_SOURCE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise VideoDataError("Unable to read valid video metadata.") from error

    try:
        VideosResponse.model_validate(source_data)
    except ValidationError as error:
        raise VideoDataError("Video metadata does not match the expected schema.") from error

    if not isinstance(source_data, dict):
        raise VideoDataError("Video metadata must be a JSON object.")

    return source_data


def _write_source_data(source_data: dict[str, Any]) -> None:
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=VIDEO_SOURCE_FILE.parent,
            prefix=f"{VIDEO_SOURCE_FILE.stem}-",
            suffix=".tmp",
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)
            json.dump(source_data, temporary_file, indent=2)
            temporary_file.write("\n")
            temporary_file.flush()
            os.fsync(temporary_file.fileno())

        os.replace(temporary_path, VIDEO_SOURCE_FILE)
    except OSError as error:
        raise VideoDataError("Unable to persist video metadata.") from error
    finally:
        if temporary_path and temporary_path.exists():
            temporary_path.unlink(missing_ok=True)


def get_videos() -> list[Video]:
    """Return validated video records from the current JSON metadata file."""
    with _source_file_lock:
        return VideosResponse.model_validate(_load_source_data()).videos


def increment_counter(video_id: str, counter: Literal["likes", "shares"]) -> int:
    """Atomically increment one persisted interaction counter for a video."""
    with _source_file_lock:
        source_data = _load_source_data()
        records = source_data["videos"]

        for record in records:
            if record["id"] == video_id:
                record[counter] += 1
                _write_source_data(source_data)
                return record[counter]

    raise VideoNotFoundError(video_id)
