'use client'
import { useAuth } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

/** Sol menünün üst kısmı: Ana pano bağlantısı + bekleyen yeni arşiv katkısı sayacı */
export const SubmissionCount = () => {
  const { user } = useAuth<{ role?: string; name?: string }>()
  const pathname = usePathname()
  const allowed = user?.role === 'admin' || user?.role === 'editor'
  const [count, setCount] = useState(0)
  const isHome = pathname === '/admin' || pathname === '/admin/'

  useEffect(() => {
    if (!allowed) return
    let alive = true
    const load = () =>
      fetch('/api/submissions?where[status][equals]=new&limit=0&depth=0', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { totalDocs?: number } | null) => alive && setCount(d?.totalDocs ?? 0))
        .catch(() => {})
    load()
    const t = window.setInterval(load, 60_000)
    return () => {
      alive = false
      window.clearInterval(t)
    }
  }, [allowed])

  return (
    <div className="kd-nav-head">
      <Link href="/admin" className={`kd-nav-home${isHome ? ' is-active' : ''}`}>
        <svg className="kd-nav-home-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4v-9z" />
        </svg>
        <span>Ana pano</span>
      </Link>
      {allowed && count > 0 && (
        <Link className="kd-subcount" href="/admin/collections/submissions?where[status][equals]=new">
          <span className="kd-subcount-n">{count}</span>
          <span>yeni arşiv katkısı bekliyor</span>
        </Link>
      )}
    </div>
  )
}
