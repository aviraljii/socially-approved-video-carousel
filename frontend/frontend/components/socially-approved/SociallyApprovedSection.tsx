'use client'

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  SyntheticEvent,
} from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Heart,
  LoaderCircle,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'

import { useVideoLifecycle } from '@/hooks/use-video-lifecycle'
import type { Video } from '@/types/video'
import { mockVideos } from '@/data/mock-videos'
import {
  getVideos,
  likeVideo,
  shareVideo,
} from '@/services/videos'

/* =========================================================
   Poster
========================================================= */

function Poster({
  video,
  active = false,
}: {
  video: Video
  active?: boolean
}) {
  return (
    <div
      className="poster"
      style={
        {
          '--poster-accent': video.accent,
        } as CSSProperties
      }
    >
      {video.thumbnailUrl ? (
        <img
          className="poster-thumbnail"
          src={video.thumbnailUrl}
          alt=""
          draggable={false}
        />
      ) : (
        <div className="poster-thumbnail poster-thumbnail-fallback" />
      )}

      <span className="poster-index">
        {video.id}
      </span>

      <span className="poster-word">
        {video.posterLabel}
      </span>

      <span
        className="poster-play"
        aria-hidden="true"
      >
        <Play
          size={15}
          fill="currentColor"
        />
      </span>

      {active ? (
        <span className="poster-live">
          NOW PLAYING
        </span>
      ) : null}
    </div>
  )
}

/* =========================================================
   Like Button
========================================================= */

function LikeButton({
  video,
  liked,
  onLike,
  compact = false,
  disabled = false,
  busy = false,
}: {
  video: Video
  liked: boolean
  onLike: () => void
  compact?: boolean
  disabled?: boolean
  busy?: boolean
}) {
  const displayedLikes =
    video.likes + (liked ? 1 : 0)

  return (
    <button
      type="button"
      className={`like-button ${
        liked ? 'is-liked' : ''
      } ${compact ? 'compact' : ''}`}
      onClick={(event) => {
        event.stopPropagation()

        if (!disabled && !busy) {
          onLike()
        }
      }}
      aria-pressed={liked}
      aria-busy={busy}
      disabled={disabled || busy}
      aria-label={
        liked
          ? `Liked ${video.title}`
          : `Like ${video.title}`
      }
    >
      {busy ? (
        <LoaderCircle
          size={compact ? 15 : 18}
          className="animate-spin"
        />
      ) : (
        <Heart
          size={compact ? 15 : 18}
          fill={
            liked
              ? 'currentColor'
              : 'none'
          }
        />
      )}

      <span>{displayedLikes}</span>
    </button>
  )
}

/* =========================================================
   Card Video Preview
========================================================= */

const VideoPreview = memo(
  function VideoPreview({
    src,
    title,
  }: {
    src: string
    title: string
  }) {
    const videoRef =
      useRef<HTMLVideoElement>(null)

    useEffect(() => {
      const media =
        videoRef.current

      if (!media) {
        return
      }

      let disposed = false

      const startPreview =
        async () => {
          if (disposed) {
            return
          }

          try {
            media.muted = true
            await media.play()
          } catch {
            // Browser autoplay policy may block muted preview.
          }
        }

      const handleLoadedData =
        () => {
          void startPreview()
        }

      media.addEventListener(
        'loadeddata',
        handleLoadedData,
      )

      if (media.readyState >= 2) {
        void startPreview()
      }

      return () => {
        disposed = true

        media.removeEventListener(
          'loadeddata',
          handleLoadedData,
        )

        media.pause()
        media.removeAttribute('src')
        media.load()
      }
    }, [src])

    if (!src) {
      return null
    }

    return (
      <video
        ref={videoRef}
        className="card-video-preview"
        src={src}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        aria-label={`${title} preview`}
        onError={(event) => {
          const media =
            event.currentTarget

          media.pause()
          media.removeAttribute(
            'src',
          )
          media.load()
        }}
      />
    )
  },
)

/* =========================================================
   Video Card
========================================================= */

const VideoCard = memo(
  function VideoCard({
    video,
    index,
    onOpen,
    liked,
    onLike,
    liking,
  }: {
    video: Video
    index: number
    onOpen: () => void
    liked: boolean
    onLike: () => void
    liking: boolean
  }) {
    const lifecycle =
      useVideoLifecycle(video.id)

    return (
      <article
        className="video-card"
        ref={lifecycle.ref}
        data-video-in-view={
          lifecycle.isInView
        }
        data-video-active={
          lifecycle.isActive
        }
      >
        <button
          type="button"
          className="card-media"
          onClick={onOpen}
          aria-label={`Open video ${
            index + 1
          }: ${video.title}`}
        >
          <Poster video={video} />

          {lifecycle.shouldLoad ? (
            <VideoPreview
              src={video.url}
              title={video.title}
            />
          ) : null}

          <span className="duration">
            {video.duration}
          </span>
        </button>

        <div className="card-copy">
          <div className="card-meta">
            <span>
              {video.creator}
            </span>

            <span>
              {video.role}
            </span>
          </div>

          <h3>{video.title}</h3>

          <div className="card-actions">
            <LikeButton
              video={video}
              liked={liked}
              onLike={onLike}
              compact
              busy={liking}
            />

            <span className="card-share">
              <Share2 size={14} />
              share
            </span>
          </div>
        </div>
      </article>
    )
  },
)

/* =========================================================
   Share Menu
========================================================= */

function ShareMenu({
  video,
  onClose,
  onShare,
  sharing,
  shared,
}: {
  video: Video
  onClose: () => void
  onShare: (
    platform: string,
  ) => Promise<void>
  sharing: boolean
  shared: boolean
}) {
  const [copied, setCopied] =
    useState(false)

  const copyLink =
    async () => {
      try {
        const url =
          video.url ||
          window.location.href

        await navigator.clipboard.writeText(
          url,
        )

        setCopied(true)

        await onShare(
          'copy',
        )

        window.setTimeout(() => {
          setCopied(false)
        }, 1800)
      } catch {
        setCopied(false)
      }
    }

  const handlePlatformShare =
    async (
      platform: string,
    ) => {
      await onShare(
        platform,
      )
    }

  const encodedUrl =
    encodeURIComponent(
      video.url,
    )

  const encodedTitle =
    encodeURIComponent(
      `${video.title} — Socially Approved`,
    )

  return (
    <div
      className="share-menu"
      role="menu"
      onClick={(event) => {
        event.stopPropagation()
      }}
    >
      <button
        type="button"
        onClick={() =>
          void copyLink()
        }
        disabled={sharing}
        role="menuitem"
      >
        {copied ? (
          <Check size={14} />
        ) : (
          <Copy size={14} />
        )}

        {copied
          ? 'Copied'
          : sharing
            ? 'Sharing…'
            : 'Copy link'}
      </button>

      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        role="menuitem"
        onClick={() => {
          void handlePlatformShare(
            'whatsapp',
          )
        }}
      >
        WhatsApp
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        role="menuitem"
        onClick={() => {
          void handlePlatformShare(
            'facebook',
          )
        }}
      >
        Facebook
      </a>

      {shared ? (
        <span
          className="share-dismiss"
          role="status"
        >
          Shared
        </span>
      ) : null}

      <button
        type="button"
        className="share-dismiss"
        onClick={onClose}
        role="menuitem"
      >
        Close
      </button>
    </div>
  )
}

/* =========================================================
   Video Player
========================================================= */

function VideoPlayer({
  video,
  liked,
  onLike,
  liking,
  onShare,
}: {
  video: Video
  liked: boolean
  onLike: () => void
  liking: boolean
  onShare: (
    platform: string,
  ) => Promise<void>
}) {
  const videoRef =
    useRef<HTMLVideoElement>(null)

  const playRequestRef =
    useRef<Promise<void> | null>(
      null,
    )

  const [playing, setPlaying] =
    useState(false)

  const [muted, setMuted] =
    useState(true)

  const [progress, setProgress] =
    useState(0)

  const [loading, setLoading] =
    useState(true)

  const [failed, setFailed] =
    useState(false)

  const [sharing, setSharing] =
    useState(false)

  const [shared, setShared] =
    useState(false)

  useEffect(() => {
    const media =
      videoRef.current

    playRequestRef.current =
      null

    setPlaying(false)
    setMuted(true)
    setProgress(0)
    setLoading(true)
    setFailed(false)
    setSharing(false)
    setShared(false)

    if (media) {
      media.pause()
      media.muted = true

      try {
        media.currentTime = 0
      } catch {
        // Metadata may not be available yet.
      }
    }

    return () => {
      playRequestRef.current =
        null

      if (media) {
        media.pause()
      }
    }
  }, [video.id])

  const updateProgress =
    useCallback(
      (media: HTMLVideoElement) => {
        const duration =
          media.duration

        if (
          !Number.isFinite(
            duration,
          ) ||
          duration <= 0
        ) {
          return
        }

        const value =
          (media.currentTime /
            duration) *
          100

        setProgress(
          Math.max(
            0,
            Math.min(
              100,
              value,
            ),
          ),
        )
      },
      [],
    )

  const playVideo =
    useCallback(async () => {
      const media =
        videoRef.current

      if (!media || failed) {
        return
      }

      if (
        playRequestRef.current
      ) {
        return
          playRequestRef.current
      }

      media.muted = muted

      const request =
        media
          .play()
          .then(() => {
            setPlaying(true)
            setLoading(false)
          })
          .catch((cause: unknown) => {
            if (
              cause instanceof
                DOMException &&
              cause.name ===
                'AbortError'
            ) {
              return
            }

            console.error(
              'Video playback failed:',
              {
                error: cause,
                videoId:
                  video.id,
                videoUrl:
                  video.url,
                muted:
                  media.muted,
                readyState:
                  media.readyState,
                networkState:
                  media.networkState,
                errorCode:
                  media.error?.code,
                errorMessage:
                  media.error
                    ?.message,
              },
            )

            setPlaying(false)
            setLoading(false)
          })
          .finally(() => {
            playRequestRef.current =
              null
          })

      playRequestRef.current =
        request

      await request
    }, [
      failed,
      muted,
      video.id,
      video.url,
    ])

  const togglePlaying =
    useCallback(() => {
      const media =
        videoRef.current

      if (!media || failed) {
        return
      }

      if (media.paused) {
        void playVideo()
      } else {
        media.pause()
      }
    }, [
      failed,
      playVideo,
    ])

  const toggleMuted =
    useCallback(() => {
      const media =
        videoRef.current

      if (!media || failed) {
        return
      }

      const next =
        !media.muted

      media.muted = next
      setMuted(next)
    }, [failed])

  const seek =
    useCallback(
      (
        event: ReactPointerEvent<HTMLDivElement>,
      ) => {
        const media =
          videoRef.current

        if (
          !media ||
          !Number.isFinite(
            media.duration,
          ) ||
          media.duration <= 0
        ) {
          return
        }

        const rect =
          event.currentTarget.getBoundingClientRect()

        if (!rect.width) {
          return
        }

        const ratio =
          Math.max(
            0,
            Math.min(
              1,
              (event.clientX -
                rect.left) /
                rect.width,
            ),
          )

        media.currentTime =
          ratio * media.duration

        setProgress(
          ratio * 100,
        )
      },
      [],
    )

  const handleProgressKeyDown =
    useCallback(
      (
        event: React.KeyboardEvent<HTMLDivElement>,
      ) => {
        const media =
          videoRef.current

        if (
          !media ||
          !Number.isFinite(
            media.duration,
          ) ||
          media.duration <= 0
        ) {
          return
        }

        let next =
          progress

        if (
          event.key ===
          'ArrowRight'
        ) {
          next = Math.min(
            100,
            progress + 5,
          )
        } else if (
          event.key ===
          'ArrowLeft'
        ) {
          next = Math.max(
            0,
            progress - 5,
          )
        } else {
          return
        }

        event.preventDefault()

        media.currentTime =
          (next / 100) *
          media.duration

        setProgress(next)
      },
      [progress],
    )

  const handleVideoError =
    useCallback(
      (
        event: SyntheticEvent<
          HTMLVideoElement,
          Event
        >,
      ) => {
        const media =
          event.currentTarget

        console.error(
          'VIDEO ELEMENT ERROR:',
          {
            videoId:
              video.id,
            videoUrl:
              video.url,
            errorCode:
              media.error?.code,
            errorMessage:
              media.error
                ?.message,
            networkState:
              media.networkState,
            readyState:
              media.readyState,
          },
        )

        setPlaying(false)
        setLoading(false)
        setFailed(true)
      },
      [
        video.id,
        video.url,
      ],
    )

  const handleShare =
    useCallback(
      async (
        platform: string,
      ) => {
        try {
          await onShare(platform)
          setShared(true)

          window.setTimeout(() => {
            setShared(false)
          }, 1800)
        } catch {
          setShared(false)
        }
      },
      [onShare],
    )

  if (
    !video.url ||
    failed
  ) {
    return (
      <div
        className="player"
        style={
          {
            '--player-accent':
              video.accent,
          } as CSSProperties
        }
      >
        <Poster
          video={video}
          active
        />

        <div className="player-error">
          <span>
            Video unavailable
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="player"
      style={
        {
          '--player-accent':
            video.accent,
        } as CSSProperties
      }
    >
      <video
        ref={videoRef}
        className="player-video"
        src={video.url}
        poster={
          video.thumbnailUrl ||
          undefined
        }
        muted={muted}
        playsInline
        preload="auto"
        controls={false}
        onLoadStart={() => {
          setLoading(true)
          setFailed(false)
        }}
        onLoadedMetadata={(event) => {
          setLoading(false)
          updateProgress(
            event.currentTarget,
          )
        }}
        onLoadedData={() => {
          setLoading(false)
        }}
        onCanPlay={() => {
          setLoading(false)
        }}
        onPlay={() => {
          setPlaying(true)
          setLoading(false)
        }}
        onPause={() => {
          setPlaying(false)
        }}
        onPlaying={() => {
          setPlaying(true)
          setLoading(false)
        }}
        onTimeUpdate={(event) => {
          updateProgress(
            event.currentTarget,
          )
        }}
        onEnded={() => {
          setPlaying(false)
          setProgress(100)
        }}
        onError={handleVideoError}
      />

      <div className="player-overlay" />

      {loading ? (
        <div
          className="player-loading"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle
            size={26}
            className="animate-spin"
          />
          <span>
            Loading video…
          </span>
        </div>
      ) : null}

      <button
        type="button"
        className="player-center"
        onClick={(event) => {
          event.stopPropagation()
          togglePlaying()
        }}
        aria-label={
          playing
            ? 'Pause video'
            : 'Play video'
        }
      >
        {playing ? (
          <Pause
            size={30}
            fill="currentColor"
          />
        ) : (
          <Play
            size={30}
            fill="currentColor"
          />
        )}
      </button>

      <div
        className="player-controls"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div
          className="progress-track"
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(
            progress,
          )}
          aria-valuetext={`${Math.round(
            progress,
          )} percent`}
          tabIndex={0}
          onPointerDown={seek}
          onKeyDown={
            handleProgressKeyDown
          }
        >
          <span
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="control-row">
          <button
            type="button"
            onClick={() =>
              togglePlaying()
            }
            aria-label={
              playing
                ? 'Pause video'
                : 'Play video'
            }
          >
            {playing ? (
              <Pause size={17} />
            ) : (
              <Play
                size={17}
                fill="currentColor"
              />
            )}
          </button>

          <button
            type="button"
            onClick={
              toggleMuted
            }
            aria-label={
              muted
                ? 'Unmute video'
                : 'Mute video'
            }
          >
            {muted ? (
              <VolumeX size={17} />
            ) : (
              <Volume2 size={17} />
            )}
          </button>

          <span className="timecode">
            {video.duration}
          </span>

          <span className="control-spacer" />

          <LikeButton
            video={video}
            liked={liked}
            onLike={onLike}
            busy={liking}
          />

          <button
            type="button"
            onClick={() =>
              setSharing(
                (value) =>
                  !value,
              )
            }
            aria-label="Share video"
          >
            <Share2 size={17} />
          </button>
        </div>
      </div>

      {sharing ? (
        <ShareMenu
          video={video}
          onClose={() =>
            setSharing(false)
          }
          onShare={handleShare}
          sharing={sharing}
          shared={shared}
        />
      ) : null}
    </div>
  )
}

/* =========================================================
   Modal
========================================================= */

function VideoModal({
  videos,
  index,
  setIndex,
  onClose,
  liked,
  onLike,
  liking,
  onShare,
}: {
  videos: Video[]
  index: number
  setIndex: (
    value: number,
  ) => void
  onClose: () => void
  liked: Set<string>
  onLike: (
    id: string,
  ) => void
  liking: Set<string>
  onShare: (
    id: string,
    platform: string,
  ) => Promise<void>
}) {
  const video =
    videos[index]

  const touchStart =
    useRef<number | null>(
      null,
    )

  const change =
    useCallback(
      (direction: number) => {
        if (
          !videos.length
        ) {
          return
        }

        const next =
          (index +
            direction +
            videos.length) %
          videos.length

        setIndex(next)
      },
      [
        index,
        setIndex,
        videos.length,
      ],
    )

  useEffect(() => {
    const handleKeyDown =
      (event: KeyboardEvent) => {
        if (
          event.key ===
          'Escape'
        ) {
          onClose()
          return
        }

        if (
          event.key ===
          'ArrowRight'
        ) {
          change(1)
          return
        }

        if (
          event.key ===
          'ArrowLeft'
        ) {
          change(-1)
        }
      }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    const previousOverflow =
      document.body.style
        .overflow

    document.body.style.overflow =
      'hidden'

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )

      document.body.style.overflow =
        previousOverflow
    }
  }, [
    change,
    onClose,
  ])

  if (!video) {
    return null
  }

  const visible =
    [-1, 0, 1].map(
      (offset) =>
        videos[
          (index +
            offset +
            videos.length) %
            videos.length
        ],
    )

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-viewer-title"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div className="modal-shell">
        <div className="modal-topline">
          <span>
            REAL STORIES / SOCIAL PROOF
          </span>

          <button
            type="button"
            className="icon-button"
            onClick={
              onClose
            }
            aria-label="Close video viewer"
          >
            <X size={19} />
          </button>
        </div>

        <div
          className="modal-content"
          onTouchStart={(event) => {
            touchStart.current =
              event.touches[0]?.clientX ??
              null
          }}
          onTouchEnd={(event) => {
            if (
              touchStart.current ===
              null
            ) {
              return
            }

            const endX =
              event.changedTouches[0]?.clientX ??
              touchStart.current

            const distance =
              endX -
              touchStart.current

            if (
              Math.abs(
                distance,
              ) > 40
            ) {
              change(
                distance < 0
                  ? 1
                  : -1,
              )
            }

            touchStart.current =
              null
          }}
        >
          <button
            type="button"
            className="modal-arrow"
            onClick={() =>
              change(-1)
            }
            aria-label="Previous video"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="inner-rail">
            {visible.map(
              (
                item,
                position,
              ) => (
                <div
                  className={`inner-card ${
                    position ===
                    1
                      ? 'is-active'
                      : ''
                  }`}
                  key={`${item.id}-${position}`}
                >
                  <Poster
                    video={item}
                    active={
                      position ===
                      1
                    }
                  />

                  <span className="inner-card-label">
                    {position ===
                    1
                      ? 'Selected story'
                      : item.creator}
                  </span>
                </div>
              ),
            )}
          </div>

          <div className="modal-player">
            <VideoPlayer
              key={video.id}
              video={video}
              liked={liked.has(
                video.id,
              )}
              liking={liking.has(
                video.id,
              )}
              onLike={() =>
                onLike(
                  video.id,
                )
              }
              onShare={(
                platform,
              ) =>
                onShare(
                  video.id,
                  platform,
                )
              }
            />
          </div>

          <button
            type="button"
            className="modal-arrow"
            onClick={() =>
              change(1)
            }
            aria-label="Next video"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="modal-details">
          <div>
            <span className="detail-kicker">
              {video.role}
            </span>

            <h2 id="video-viewer-title">
              {video.title}
            </h2>

            <p>
              {video.description}
            </p>
          </div>

          <div className="counter">
            <strong>
              {String(
                index + 1,
              ).padStart(
                2,
                '0',
              )}
            </strong>

            <span>
              /{' '}
              {String(
                videos.length,
              ).padStart(
                2,
                '0',
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Main Section
========================================================= */

export function SociallyApprovedSection({
  videos: initialVideos,
}: {
  videos?: Video[]
}) {
  const [videos, setVideos] =
    useState<Video[]>(
      initialVideos ?? [],
    )

  const [isLoading, setIsLoading] =
    useState(
      !initialVideos,
    )

  const [error, setError] =
    useState<string | null>(
      null,
    )

  const [
    usingFallback,
    setUsingFallback,
  ] = useState(false)

  const [selected, setSelected] =
    useState<
      number | null
    >(null)

  const [liked, setLiked] =
    useState<Set<string>>(
      new Set(),
    )

  const [liking, setLiking] =
    useState<Set<string>>(
      new Set(),
    )

  const [offset, setOffset] =
    useState(0)

  const railRef =
    useRef<HTMLDivElement>(null)

  const dragStart =
    useRef<number | null>(
      null,
    )

  const loadVideos =
    useCallback(
      async () => {
        if (
          initialVideos
        ) {
          return
        }

        setIsLoading(true)
        setError(null)
        setUsingFallback(false)

        try {
          const response =
            await getVideos()

          setVideos(response)
        } catch (cause) {
          const message =
            cause instanceof
            Error
              ? cause.message
              : 'Unable to load videos.'

          if (
            process.env
              .NODE_ENV ===
            'development'
          ) {
            setVideos(
              mockVideos,
            )
            setUsingFallback(
              true,
            )
          } else {
            setVideos([])
          }

          setError(message)
        } finally {
          setIsLoading(false)
        }
      },
      [initialVideos],
    )

  useEffect(() => {
    void loadVideos()
  }, [loadVideos])

  /*
   * Real backend like integration.
   *
   * The backend currently exposes a POST /like
   * action rather than an unlike action, so a video
   * is liked once per browser session.
   */
  const like =
    useCallback(
      async (id: string) => {
        if (
          liked.has(id) ||
          liking.has(id)
        ) {
          return
        }

        setLiking(
          (current) => {
            const next =
              new Set(current)

            next.add(id)

            return next
          },
        )

        /*
         * Optimistic UI update.
         */
        setLiked(
          (current) => {
            const next =
              new Set(current)

            next.add(id)

            return next
          },
        )

        try {
          const response =
            await likeVideo(
              id,
              'demo-user',
            )

          /*
           * Backend returns the authoritative
           * likes count. Convert it into the
           * Video model's base count because
           * LikeButton adds +1 for liked state.
           */
          setVideos(
            (current) =>
              current.map(
                (item) => {
                  if (
                    item.id !==
                    id
                  ) {
                    return item
                  }

                  return {
                    ...item,
                    likes:
                      Math.max(
                        0,
                        response.likes -
                          1,
                      ),
                  }
                },
              ),
          )
        } catch (cause) {
          /*
           * Roll back optimistic state on failure.
           */
          setLiked(
            (current) => {
              const next =
                new Set(current)

              next.delete(id)

              return next
            },
          )

          setError(
            cause instanceof
              Error
              ? cause.message
              : 'Unable to like video.',
          )
        } finally {
          setLiking(
            (current) => {
              const next =
                new Set(current)

              next.delete(id)

              return next
            },
          )
        }
      },
      [liked, liking],
    )

  /*
   * Real backend share integration.
   */
  const share =
    useCallback(
      async (
        id: string,
        platform: string,
      ) => {
        const response =
          await shareVideo(
            id,
            platform,
          )

        /*
         * Backend returns total shares.
         */
        setVideos(
          (current) =>
            current.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,
                      shares:
                        response.shares,
                    }
                  : item,
            ),
        )
      },
      [],
    )

  const move =
    useCallback(
      (direction: number) => {
        if (
          !videos.length
        ) {
          return
        }

        const next =
          Math.max(
            0,
            Math.min(
              videos.length -
                1,
              offset +
                direction,
            ),
          )

        if (
          next === offset
        ) {
          return
        }

        setOffset(next)

        const child =
          railRef.current
            ?.children[
            next
          ] as
            | HTMLElement
            | undefined

        child?.scrollIntoView(
          {
            behavior:
              'smooth',
            block:
              'nearest',
            inline:
              'start',
          },
        )
      },
      [
        offset,
        videos.length,
      ],
    )

  return (
    <main className="social-page">
      <header className="site-header">
        <span className="brand-mark">
          S / A
        </span>

        <span className="header-note">
          A collection of unsolicited nice things
        </span>

        <span className="header-index">
          VOL. 01 — 2025
        </span>
      </header>

      <section className="hero">
        <div className="section-label">
          <span>01</span>

          <span>
            Social proof / real stories
          </span>
        </div>

        <div className="hero-grid">
          <div>
            <h1>
              Socially
              <br />
              <em>
                approved.
              </em>
            </h1>
          </div>

          <div className="hero-intro">
            <p>
              Good work travels by
              word of mouth. A living
              archive of the people,
              products, and small
              moments worth passing on.
            </p>

            <span className="scroll-cue">
              Scroll to explore
              <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </section>

      <section className="gallery-section">
        <div className="gallery-heading">
          <div>
            <span className="eyebrow">
              THE COLLECTION
            </span>

            <h2>
              Things people
              <br />
              <i>actually</i> liked.
            </h2>
          </div>

          {videos.length >
          0 ? (
            <div className="gallery-controls">
              <span>
                {String(
                  Math.min(
                    offset + 1,
                    videos.length,
                  ),
                ).padStart(
                  2,
                  '0',
                )}
                {' — '}
                {String(
                  videos.length,
                ).padStart(
                  2,
                  '0',
                )}
              </span>

              <button
                type="button"
                onClick={() =>
                  move(-1)
                }
                disabled={
                  offset === 0
                }
                aria-label="Previous cards"
              >
                <ArrowLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() =>
                  move(1)
                }
                disabled={
                  offset >=
                  videos.length -
                    1
                }
                aria-label="Next cards"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div
            className="gallery-status"
            role="status"
          >
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
            Loading stories…
          </div>
        ) : (
          <>
            {error ? (
              <div
                className="gallery-status gallery-status-error"
                role="alert"
              >
                <span>
                  {usingFallback
                    ? `Showing development fallback: ${error}`
                    : error}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    void loadVideos()
                  }
                >
                  Retry
                </button>
              </div>
            ) : null}

            <div
              className="video-rail"
              ref={railRef}
              onPointerDown={(event) => {
                dragStart.current =
                  event.clientX
              }}
              onPointerUp={(event) => {
                if (
                  dragStart.current ===
                  null
                ) {
                  return
                }

                const distance =
                  event.clientX -
                  dragStart.current

                if (
                  Math.abs(
                    distance,
                  ) > 40
                ) {
                  move(
                    distance < 0
                      ? 1
                      : -1,
                  )
                }

                dragStart.current =
                  null
              }}
              onPointerCancel={() => {
                dragStart.current =
                  null
              }}
            >
              {videos.map(
                (
                  video,
                  index,
                ) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    index={
                      index
                    }
                    onOpen={() =>
                      setSelected(
                        index,
                      )
                    }
                    liked={liked.has(
                      video.id,
                    )}
                    liking={liking.has(
                      video.id,
                    )}
                    onLike={() =>
                      void like(
                        video.id,
                      )
                    }
                  />
                ),
              )}
            </div>
          </>
        )}
      </section>

      <footer className="site-footer">
        <span>
          Made for the moments
          that make you stop.
        </span>

        <span>
          Keep scrolling, keep sharing.
        </span>
      </footer>

      {selected !==
      null ? (
        <VideoModal
          videos={videos}
          index={selected}
          setIndex={setSelected}
          onClose={() =>
            setSelected(
              null,
            )
          }
          liked={liked}
          onLike={(id) =>
            void like(id)
          }
          liking={liking}
          onShare={share}
        />
      ) : null}
    </main>
  )
}