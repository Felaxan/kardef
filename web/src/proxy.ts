import { NextResponse, type NextRequest } from 'next/server'
import { DEMO } from './demo'

const LANGS = ['tr', 'ku', 'en', 'de', 'nl', 'fr']
const PANEL_COOKIE = 'payload-lng'

/*
  1) Kök adres (/) ziyaretçinin dilindeki ana sayfaya yönlenir:
     önce daha önce seçtiği dil (k-lang çerezi), sonra tarayıcı dili, yoksa Türkçe.
  2) Yönetim paneli ilk açılışta tarayıcının dili ne olursa olsun Türkçe gelir.
*/
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Maket modu: panel kapalı, içerik yalnızca okunur
  if (DEMO) {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    if (pathname.startsWith('/api/') && (req.method !== 'GET' || pathname.startsWith('/api/graphql'))) {
      return new NextResponse('Maket sürümünde kapalı', { status: 403 })
    }
  }

  if (pathname === '/') {
    const saved = req.cookies.get('k-lang')?.value
    const accept = (req.headers.get('accept-language') || '')
      .split(',')
      .map((s) => s.split(';')[0].trim().slice(0, 2).toLowerCase())
    const lang = (saved && LANGS.includes(saved) && saved) || accept.find((l) => LANGS.includes(l)) || 'tr'
    return NextResponse.redirect(new URL(`/${lang}`, req.url))
  }

  if (pathname.startsWith('/api/')) return NextResponse.next()

  if (req.cookies.get(PANEL_COOKIE)) return NextResponse.next()
  const headers = new Headers(req.headers)
  const cookie = headers.get('cookie')
  headers.set('cookie', cookie ? `${cookie}; ${PANEL_COOKIE}=tr` : `${PANEL_COOKIE}=tr`)
  const res = NextResponse.next({ request: { headers } })
  res.cookies.set(PANEL_COOKIE, 'tr', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  return res
}

export const config = { matcher: ['/', '/admin', '/admin/:path*', '/api/:path*'] }
