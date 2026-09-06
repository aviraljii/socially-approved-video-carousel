export type Video = {
  id: string
  title: string
  description: string
  url: string
  thumbnailUrl: string
  creator: string
  role: string
  likes: number
  shares: number
  duration: string
  accent: string
  posterLabel: string
}

export type ApiVideo = {
  id: string
  title: string
  description: string
  url: string
  thumbnail_url: string
  likes: number
  shares: number
}

export type VideosResponse = {
  videos: ApiVideo[]
}
