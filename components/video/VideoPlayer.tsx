'use client'

import { extractYouTubeId } from '@/lib/utils'

interface VideoPlayerProps {
  url: string
  title: string
}

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
  const videoId = extractYouTubeId(url)

  if (!videoId) {
    return (
      <div className="aspect-video rounded-2xl flex items-center justify-center text-white/40" style={{ background: '#210340' }}>
        <p>رابط الفيديو غير صحيح</p>
      </div>
    )
  }

  return (
    <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        loading="lazy"
      />
    </div>
  )
}
