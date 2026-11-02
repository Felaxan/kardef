import React from 'react'
import { isMedia, mediaUrl, waveBars, youTubeId } from '@/lib/cms'
import type { Archive as ArchiveItem } from '@/payload-types'
import { Ico } from './Icons'

/** Arşiv kartının görseli: fotoğraf, video kapağı ya da türüne göre çizilmiş belge/kupür/ses dalgası */
export function ArcVis({ a, size = 'card' }: { a: ArchiveItem; size?: 'card' | 'hero' }) {
  const img = (a.files ?? []).find((f) => isMedia(f) && f.mimeType?.startsWith('image'))
  const yt = youTubeId(a.videoUrl)
  if (img && isMedia(img)) return <img src={mediaUrl(img, size) || ''} alt={img.alt || a.title} loading="lazy" />
  if (yt) return <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt={a.title} loading="lazy" />
  if (a.type === 'clipping') return <span className="clip" />
  if (a.type === 'audio' || a.type === 'oral' || a.type === 'video') {
    return (
      <>
        <span className="wave">
          {waveBars(Number(a.id)).map((h, j) => (
            <i key={j} style={{ height: `${h}%`, '--j': j, transitionDelay: `${j * 12}ms` } as React.CSSProperties} />
          ))}
        </span>
        <span className="play"><Ico name="play" /></span>
      </>
    )
  }
  return Number(a.id) % 2 ? <><span className="doc two" /><span className="doc" /></> : <span className="doc" />
}
