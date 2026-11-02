import { isLang } from '@/i18n/ui'
import { cms, loc } from '@/lib/cms'
import { kurumLabel } from '@/lib/labels'

/*
  Etkinliği takvime eklemek için .ics dosyası (Google Takvim, Outlook, iPhone takvimi açar).
  Adres: /{dil}/etkinlik/{slug}/takvim
*/
export const dynamic = 'force-dynamic'

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
/** RFC 5545: satırlar 75 baytı geçmesin */
const fold = (line: string) => {
  const out: string[] = []
  let cur = ''
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 73) { out.push(cur); cur = ' ' }
    cur += ch
  }
  return [...out, cur].join('\r\n')
}

export async function GET(req: Request, { params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params
  if (!isLang(lang)) return new Response('Not found', { status: 404 })
  const payload = await cms()
  const { docs } = await payload.find({
    collection: 'events', where: { slug: { equals: decodeURIComponent(slug) } },
    limit: 1, depth: 0, locale: loc(lang), overrideAccess: false,
  })
  const e = docs[0]
  if (!e) return new Response('Not found', { status: 404 })

  const start = new Date(e.startDate)
  const end = e.endDate ? new Date(e.endDate) : new Date(start.getTime() + 2 * 3600_000)
  const url = new URL(`/${lang}/etkinlik/${e.slug}`, req.url).toString()
  const where = [e.place, e.address].filter(Boolean).join(', ') || (e.region === 'online' ? e.onlineLink ?? '' : '')

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KAR-DEF//Etkinlik takvimi//TR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:etkinlik-${e.id}@kar-def.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    where && `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc(`${kurumLabel(e.kurum)}\n${url}`)}`,
    `URL:${url}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).map((l) => fold(l as string)).join('\r\n')

  return new Response(ics + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${e.slug}.ics"`,
      'Cache-Control': 'no-store',
    },
  })
}
