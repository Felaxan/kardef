import React from 'react'

/* Panel ikonları (çizgi, 24px). Sitenin ikon diliyle aynı kalınlıkta. */
const P: Record<string, string> = {
  news: 'M4 5h12v14H6a2 2 0 01-2-2V5zm12 4h4v8a2 2 0 01-2 2M8 9h4M8 13h4',
  bell: 'M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16zm4 4a2 2 0 004 0',
  calendar: 'M4 7a2 2 0 012-2h12a2 2 0 012 2v12H4V7zm0 4h16M9 3v4m6-4v4',
  archive: 'M3 5h18v4H3V5zm2 4h14v10H5V9zm5 4h4',
  image: 'M4 5h16v14H4V5zm0 11l5-5 4 4 3-3 4 4M15 9.5a1 1 0 100-.01',
  tag: 'M4 4h7l9 9-7 7-9-9V4zm4 4.5a.5.5 0 100-.01',
  inbox: 'M4 13l2-8h12l2 8v6H4v-6zm0 0h5l1 2h4l1-2h5',
  live: 'M5 7a10 10 0 000 10M19 7a10 10 0 010 10M8.5 9.5a5 5 0 000 5M15.5 9.5a5 5 0 010 5M12 12a.5.5 0 100-.01',
  village: 'M3 20h18M5 20V11l4-3 4 3v9M13 20v-6l4-3 3 2.5V20M8 14h2',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm-6 9a6 6 0 0112 0M16 4.5a3.5 3.5 0 010 6.5M18 14.5a6 6 0 013 5.5',
  org: 'M4 20V9l8-5 8 5v11M9 20v-5h6v5M4 20h16',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14.5 3h-4l-.4 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2l.4 2.6h4l.4-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4v-9z',
  ad: 'M4 6h16v12H4V6zm3 9l2.5-6L12 15M7.8 13h3.4M15 9v6h1.5a2 2 0 002-2v-2a2 2 0 00-2-2H15z',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  draft: 'M4 20h4L19 9l-4-4L4 16v4zm9-13l4 4',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5H5V6h5',
}

export type IconName = keyof typeof P

export function KdIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg className="kd-ico" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  )
}
