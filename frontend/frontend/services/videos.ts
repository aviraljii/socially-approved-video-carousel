import type {
  ApiVideo,
  Video,
  VideosResponse,
} from '@/types/video'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(
    /\/$/,
    '',
  )

const accents = [
  '#c4ff62',
  '#ff765f',
  '#8d96ff',
  '#f6d77b',
  '#73d9ce',
  '#ed9fda',
  '#f4a261',
  '#a6e3e9',
  '#d7b5ff',
  '#b8f28d',
]

type LikeResponse = {
  success: boolean
  video_id: string
  likes: number
}

type ShareResponse = {
  success: boolean
  video_id: string
  shares: number
  platform: string
}

type LikeRequest = {
  video_id: string
  user_id: string
}

type ShareRequest = {
  video_id: string
  platform: string
}

function getApiUrl(): string {
  if (!API_URL) {
    throw new Error(
      'The video API URL is not configured.',
    )
  }

  return API_URL
}

function mapVideo(
  video: ApiVideo,
  index: number,
): Video {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    url: video.url,
    thumbnailUrl: video.thumbnail_url,
    likes: video.likes,
    shares: video.shares,

    creator:
      'Socially Approved',

    role:
      'Community story',

    duration: '—',

    accent:
      accents[
        index % accents.length
      ],

    posterLabel:
      video.title,
  }
}

async function parseError(
  response: Response,
  fallback: string,
): Promise<Error> {
  try {
    const payload =
      (await response.json()) as {
        detail?: string
        message?: string
      }

    const message =
      payload.detail ??
      payload.message

    if (message) {
      return new Error(message)
    }
  } catch {
    // Ignore invalid/non-JSON error bodies.
  }

  return new Error(
    `${fallback} (${response.status}).`,
  )
}

export async function getVideos(
  signal?: AbortSignal,
): Promise<Video[]> {
  const baseUrl = getApiUrl()

  const response = await fetch(
    `${baseUrl}/videos`,
    {
      method: 'GET',
      signal,
      headers: {
        Accept:
          'application/json',
      },
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw await parseError(
      response,
      'Unable to load videos',
    )
  }

  const payload =
    (await response.json()) as VideosResponse

  if (
    !payload ||
    !Array.isArray(
      payload.videos,
    )
  ) {
    throw new Error(
      'The video API returned an invalid response.',
    )
  }

  return payload.videos.map(
    mapVideo,
  )
}

export async function likeVideo(
  videoId: string,
  userId = 'demo-user',
): Promise<LikeResponse> {
  const baseUrl = getApiUrl()

  const body: LikeRequest = {
    video_id: videoId,
    user_id: userId,
  }

  const response = await fetch(
    `${baseUrl}/like`,
    {
      method: 'POST',
      headers: {
        Accept:
          'application/json',
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    throw await parseError(
      response,
      'Unable to like video',
    )
  }

  const payload =
    (await response.json()) as LikeResponse

  if (
    payload.success !== true ||
    typeof payload.video_id !==
      'string' ||
    typeof payload.likes !==
      'number'
  ) {
    throw new Error(
      'The like API returned an invalid response.',
    )
  }

  return payload
}

export async function shareVideo(
  videoId: string,
  platform = 'copy',
): Promise<ShareResponse> {
  const baseUrl = getApiUrl()

  const body: ShareRequest = {
    video_id: videoId,
    platform,
  }

  const response = await fetch(
    `${baseUrl}/share`,
    {
      method: 'POST',
      headers: {
        Accept:
          'application/json',
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    throw await parseError(
      response,
      'Unable to share video',
    )
  }

  const payload =
    (await response.json()) as ShareResponse

  if (
    payload.success !== true ||
    typeof payload.video_id !==
      'string' ||
    typeof payload.shares !==
      'number' ||
    typeof payload.platform !==
      'string'
  ) {
    throw new Error(
      'The share API returned an invalid response.',
    )
  }

  return payload
}