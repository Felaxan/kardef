'use client'
import React, { useEffect, useState } from 'react'

const icons: Record<string, React.ReactNode> = {
  wa: <path d="M20.5 3.5A11 11 0 0 0 3.2 17.2L2 22l4.9-1.3A11 11 0 0 0 20.5 3.5zM12 20.1a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 1 1 12 20.1zm4.5-6c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />,
  fb: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z" />,
  x: <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zM16.7 19.2h1.7L7.4 4.7H5.6z" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
}

/** Paylaş: WhatsApp, Facebook, X ve bağlantıyı kopyala */
export function Share({ title, labels, compact }: { title: string; labels: { share: string; copy: string; copied: string }; compact?: boolean }) {
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => setUrl(window.location.href), [])
  const u = encodeURIComponent(url), tx = encodeURIComponent(title)
  const links = [
    { k: 'wa', label: 'WhatsApp', href: `https://wa.me/?text=${tx}%20${u}` },
    { k: 'fb', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { k: 'x', label: 'X', href: `https://x.com/intent/post?text=${tx}&url=${u}` },
  ]
  const copy = async () => {
    try { await navigator.clipboard.writeText(url) } catch { /* eski tarayıcı */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className={`share${compact ? ' share--row' : ''}`}>
      <span className="share-label">{labels.share}</span>
      {links.map((l) => (
        <a key={l.k} className={`share-btn share-${l.k}`} href={l.href} target="_blank" rel="noreferrer" aria-label={l.label} title={l.label}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{icons[l.k]}</svg>
        </a>
      ))}
      <button type="button" className={`share-btn share-link${copied ? ' ok' : ''}`} onClick={copy} aria-label={labels.copy} title={labels.copy}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{icons.link}</svg>
        <span className="share-tip" role="status">{copied ? labels.copied : ''}</span>
      </button>
    </div>
  )
}
