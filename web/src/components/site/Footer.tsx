import Link from 'next/link'
import React from 'react'
import { t, type Lang } from '@/i18n/ui'

export function Footer({ lang, siteName, note, credits }: { lang: Lang; siteName: string; note?: string | null; credits: string[] }) {
  const L = (k: string) => t(lang, k)
  return (
    <footer>
      <div className="wrap">
        <div className="foot">
          <div>
            <p className="foot-brand">
              <img src="/brand/kar-def-logo.png" alt="" />
              <img src="/brand/av-kardep-logo.png" alt="" /> {siteName}
            </p>
            <p>{note || L('foot.about')}</p>
          </div>
          <div>
            <h3>KAR-DEF</h3>
            <ul>
              <li><Link href={`/${lang}#kurumlar`}>{L('foot.hakkinda')}</Link></li>
              <li><Link href={`/${lang}#duyurular`}>{L('not.title')}</Link></li>
              <li><Link href={`/${lang}#kurumlar`}>{L('foot.iletisim')}</Link></li>
            </ul>
          </div>
          <div>
            <h3>AV-KARDEP</h3>
            <ul>
              <li><Link href={`/${lang}#kurumlar`}>{L('foot.hakkinda')}</Link></li>
              <li><Link href={`/${lang}#etkinlikler`}>{L('nav.etkinlikler')}</Link></li>
              <li><Link href={`/${lang}#kurumlar`}>{L('foot.iletisim')}</Link></li>
            </ul>
          </div>
          <div>
            <h3>{L('foot.site')}</h3>
            <ul>
              <li><Link href={`/${lang}/koyler`}>{L('nav.koyler')}</Link></li>
              <li><Link href={`/${lang}#arsiv`}>{L('nav.arsiv')}</Link></li>
              <li><Link href={`/${lang}#katki`}>{L('cta.katki')}</Link></li>
              <li><Link href="/admin">Panel</Link></li>
            </ul>
          </div>
        </div>
        {credits.length > 0 && (
          <p className="foot-credits"><span>{L('foot.photos')}</span>: {credits.join(', ')}.</p>
        )}
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} KAR-DEF · AV-KARDEP</span>
          <span>{L('foot.rights')}</span>
        </div>
      </div>
    </footer>
  )
}
