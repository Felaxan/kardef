'use client'
import React, { useState } from 'react'

/** Canlı yayın: YouTube'a bağlantı yalnızca ziyaretçi düğmeye basınca kurulur (KVKK/GDPR) */
export function LiveEmbed({ id, title, load, note, privacyHref, privacyLabel }: {
  id: string; title: string; load: string; note: string; privacyHref: string; privacyLabel: string
}) {
  const [on, setOn] = useState(false)
  if (on) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    )
  }
  return (
    <div className="live-load" role="button" tabIndex={0} aria-label={`${load}: ${title}`}
      onClick={() => setOn(true)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOn(true) } }}>
      <span className="live-load-btn" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z" /></svg></span>
      <b>{load}</b>
      <small>{note} <a href={privacyHref} onClick={(e) => e.stopPropagation()}>{privacyLabel}</a></small>
    </div>
  )
}
