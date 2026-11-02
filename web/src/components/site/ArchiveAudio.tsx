'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Ico } from './Icons'

const mmss = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00')

/** Arşivdeki ses kaydı: dalga çubukları ilerledikçe dolar, tıklayınca o noktaya atlar */
export function ArchiveAudio({ src, bars, labels }: { src: string; bars: number[]; labels: { play: string; pause: string } }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)

  useEffect(() => {
    const a = audio.current
    if (!a) return
    let raf = 0
    const tick = () => { setCur(a.currentTime); raf = requestAnimationFrame(tick) }
    const on = () => { setPlaying(true); raf = requestAnimationFrame(tick) }
    const off = () => { setPlaying(false); cancelAnimationFrame(raf); setCur(a.currentTime) }
    const meta = () => setDur(a.duration)
    a.addEventListener('play', on)
    a.addEventListener('pause', off)
    a.addEventListener('ended', off)
    a.addEventListener('loadedmetadata', meta)
    if (a.readyState >= 1) meta()
    return () => {
      cancelAnimationFrame(raf)
      a.removeEventListener('play', on); a.removeEventListener('pause', off)
      a.removeEventListener('ended', off); a.removeEventListener('loadedmetadata', meta)
    }
  }, [])

  const toggle = () => { const a = audio.current; if (a) (a.paused ? a.play() : a.pause())?.catch?.(() => {}) }
  const jump = (to: number) => {
    const a = audio.current
    if (!a || !dur) return
    a.currentTime = Math.max(0, Math.min(dur, to))
    setCur(a.currentTime)
  }
  const p = dur ? cur / dur : 0

  return (
    <div className={`arc-audio${playing ? ' is-playing' : ''}`}>
      <button type="button" className="aa-btn" onClick={toggle} aria-label={playing ? labels.pause : labels.play}>
        <Ico name={playing ? 'pause' : 'play'} />
      </button>
      <div
        className="aa-wave"
        role="slider"
        tabIndex={0}
        aria-label={labels.play}
        aria-valuemin={0}
        aria-valuemax={Math.round(dur)}
        aria-valuenow={Math.round(cur)}
        aria-valuetext={`${mmss(cur)} / ${mmss(dur)}`}
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); jump(((e.clientX - r.left) / r.width) * dur) }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); jump(cur + 5) }
          if (e.key === 'ArrowLeft') { e.preventDefault(); jump(cur - 5) }
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle() }
        }}
      >
        {bars.map((h, j) => (
          <i key={j} className={(j + 0.5) / bars.length <= p ? 'on' : ''} style={{ height: `${h}%`, '--j': j } as React.CSSProperties} />
        ))}
      </div>
      <span className="aa-time">{mmss(cur)} <span>/ {mmss(dur)}</span></span>
      <audio ref={audio} src={src} preload="metadata" />
    </div>
  )
}
