'use client'
import { useAuth } from '@payloadcms/ui'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

/** Menünün üstünde: bekleyen yeni katkı sayısı (yalnızca editör ve yönetici görür) */
export const SubmissionCount = () => {
  const { user } = useAuth<{ role?: string }>()
  const allowed = user?.role === 'admin' || user?.role === 'editor'
  const [count, setCount] = useState(0)

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
    return () => { alive = false; window.clearInterval(t) }
  }, [allowed])

  if (!allowed || count === 0) return null
  return (
    <Link className="kd-subcount" href="/admin/collections/submissions?where[status][equals]=new">
      <span className="kd-subcount-n">{count}</span>
      <span>yeni arşiv katkısı bekliyor</span>
    </Link>
  )
}
