'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

type Row = { advertiser?: string; active?: boolean; startsAt?: string; endsAt?: string }

const day = (iso?: string) => (iso ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(iso)) : '')

/** Reklam satırı başlığı: "3. Karakoçan Kuyumcusu · 1 Ara – 31 Ara · yayında" */
export const AdRowLabel = () => {
  const { data, rowNumber } = useRowLabel<Row>()
  const range = data?.startsAt || data?.endsAt ? `${day(data.startsAt) || '…'} – ${day(data.endsAt) || '…'}` : 'süresiz'
  return (
    <span className={`kd-adrow${data?.active === false ? ' is-off' : ''}`}>
      <b>{(rowNumber ?? 0) + 1}. {data?.advertiser || 'Yeni reklam'}</b>
      <small>{range} · {data?.active === false ? 'durduruldu' : 'yayında'}</small>
    </span>
  )
}
