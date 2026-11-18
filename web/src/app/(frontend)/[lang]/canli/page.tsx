import { notFound } from 'next/navigation'
import React from 'react'
import { DateTile } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { ListHead } from '@/components/site/List'
import { fmt, isLang, t } from '@/i18n/ui'
import { cms, loc } from '@/lib/cms'
import { youTubeId } from '@/lib/youtube'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: t(lang, 'live.title') } : {}
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties

export default async function LivePage({ params }: P) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const L = (k: string) => t(lang, k)
  const payload = await cms()
  const live = await payload.findGlobal({ slug: 'live', locale: loc(lang), depth: 0 })
  const id = live.isLive ? youTubeId(live.url) : null
  const upcoming = live.next?.date && new Date(live.next.date).getTime() > Date.now() ? live.next : null
  const past = (live.past ?? []).map((p) => ({ ...p, yt: youTubeId(p.url) })).filter((p) => p.yt)

  return (
    <div className="story list-page live-page">
      <div className="wrap story-top">
        <ListHead lang={lang} kicker={L('live.title')} title={id ? live.title || L('live.title') : L('live.title')} lede={id ? live.description || L('live.lede') : L('live.lede')} />

        {id ? (
          <section className="live-stage intro" style={css({ '--d': 4 })}>
            <span className="live-badge"><span className="live-dot" aria-hidden="true" />{L('live.badge')}</span>
            <div className="live-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                title={live.title || L('live.title')}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
            <a className="live-yt" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer">{L('live.onyt')} <Ico name="arrow" /></a>
          </section>
        ) : (
          <section className="live-off intro" style={css({ '--d': 4 })}>
            {upcoming?.date ? (
              <div className="live-next">
                <DateTile lang={lang} date={upcoming.date} />
                <div>
                  <span className="kicker">{L('live.next')}</span>
                  <p className="live-next-title">{upcoming.title || L('live.title')}</p>
                  <p className="live-next-when">{fmt(lang, upcoming.date, 'full')} · {fmt(lang, upcoming.date, 'time')}</p>
                </div>
              </div>
            ) : (
              <p className="live-none"><span className="live-dot is-off" aria-hidden="true" />{L('live.none')}</p>
            )}
          </section>
        )}

        {past.length > 0 && (
          <section className="live-past">
            <h2 className="sec-label"><span>{L('live.past')}</span></h2>
            <ul className="live-past-grid">
              {past.map((p, i) => (
                <li key={p.id ?? i} data-reveal="" style={css({ '--i': i })}>
                  <a href={`https://www.youtube.com/watch?v=${p.yt}`} target="_blank" rel="noreferrer">
                    <span className="live-thumb">
                      <img src={`https://i.ytimg.com/vi/${p.yt}/hqdefault.jpg`} alt="" loading="lazy" />
                      <span className="live-play" aria-hidden="true"><Ico name="arrow" /></span>
                    </span>
                    <span className="live-past-title">{p.title}</span>
                    {p.date && <time>{fmt(lang, p.date)}</time>}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
