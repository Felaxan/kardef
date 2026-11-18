import { NextResponse, type NextRequest } from 'next/server'
import { DEMO } from './demo'
import {
  clampApiQueryLimits,
  globalShield,
  SECURITY_HEADERS,
  verifyCsrfOrigin,
} from './lib/security'
import { clientIp } from './lib/submission'

const LANGS = ['tr', 'ku', 'zza', 'en', 'de', 'nl', 'fr']
const PANEL_COOKIE = 'payload-lng'

function withSecurityHeaders(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!res.headers.has(k)) res.headers.set(k, v)
  }
  return res
}

/*
  1) Kök adres (/) ziyaretçinin dilindeki ana sayfaya yönlenir:
     önce daha önce seçtiği dil (k-lang çerezi), sonra tarayıcı dili, yoksa Türkçe.
  2) Yönetim paneli ilk açılışta tarayıcının dili ne olursa olsun Türkçe gelir.
  3) API ve yönetim uç noktalarında IP engeli, CSRF, hız sınırı, GraphQL kilidi ve
     toplu veri çekme (scraping) sınırlandırması uygulanır.
*/
export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl
  const ip = clientIp(req.headers, process.env.TRUSTED_IP_HEADER)

  // Engellenmiş IP kontrolü
  if (globalShield.isIpBlocked(ip)) {
    return withSecurityHeaders(new NextResponse('Erişiminiz güvenlik politikası gereği kısıtlanmıştır.', { status: 403 }))
  }

  // Kullanılmayan GraphQL uç noktaları her ortamda kapalıdır (Introspection ve DoS koruması)
  if (pathname.startsWith('/api/graphql')) {
    return withSecurityHeaders(new NextResponse('GraphQL devre dışı', { status: 403 }))
  }

  // Maket modu: panel kapalı, içerik yalnızca okunur
  if (DEMO) {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return withSecurityHeaders(NextResponse.redirect(new URL('/', req.url)))
    }
    if (pathname.startsWith('/api/') && req.method !== 'GET') {
      return withSecurityHeaders(new NextResponse('Maket sürümünde kapalı', { status: 403 }))
    }
  }

  if (pathname.startsWith('/api/')) {
    // Acil koruma modu (Lockdown): güvenlik müdahale ucu hariç yazma isteklerini durdur
    if (
      globalShield.isLockdown() &&
      req.method !== 'GET' &&
      req.method !== 'HEAD' &&
      !pathname.startsWith('/api/security-logs/')
    ) {
      return withSecurityHeaders(
        Response.json({ error: 'Sistem şu an acil güvenlik koruma modundadır (salt okunur).' }, { status: 503 }) as unknown as NextResponse,
      )
    }

    // Durum değiştiren API isteklerinde CSRF (Origin/Referer) kontrolü
    if (!verifyCsrfOrigin(req.method, req.headers, process.env.NEXT_PUBLIC_SERVER_URL)) {
      return withSecurityHeaders(
        Response.json({ error: 'Geçersiz istek kaynağı (CSRF koruması)', errors: [{ message: 'Geçersiz istek kaynağı (CSRF koruması)' }] }, { status: 403 }) as unknown as NextResponse,
      )
    }

    // Giriş ve şifre sıfırlama uçlarında sıkı hız sınırı (Brute-Force / Credential Stuffing koruması)
    const isAuthEndpoint =
      req.method === 'POST' &&
      (pathname === '/api/users/login' || pathname === '/api/users/forgot-password' || pathname === '/api/users/reset-password')
    if (isAuthEndpoint && !globalShield.checkAuthRate(ip)) {
      return withSecurityHeaders(
        Response.json({ errors: [{ message: 'Çok fazla deneme yapıldı. Lütfen biraz bekleyin.' }] }, { status: 429 }) as unknown as NextResponse,
      )
    }

    // Genel API hız sınırı
    if (!globalShield.checkApiRate(ip)) {
      return withSecurityHeaders(
        Response.json({ error: 'Çok fazla istek gönderildi.', errors: [{ message: 'Çok fazla istek gönderildi.' }] }, { status: 429 }) as unknown as NextResponse,
      )
    }

    // Toplu veri çekme (Scraping) koruması: aşırı yüksek limit/depth parametrelerini sınırla
    if (req.method === 'GET') {
      const hasSession = Boolean(req.cookies.get('payload-token')?.value)
      const { clamped, limit, depth } = clampApiQueryLimits(searchParams, hasSession ? 300 : 100, hasSession ? 3 : 2)
      if (clamped) {
        const cleanUrl = req.nextUrl.clone()
        if (limit !== undefined) cleanUrl.searchParams.set('limit', String(limit))
        if (depth !== undefined) cleanUrl.searchParams.set('depth', String(depth))
        return withSecurityHeaders(NextResponse.rewrite(cleanUrl))
      }
    }

    return withSecurityHeaders(NextResponse.next())
  }

  if (pathname === '/') {
    const saved = req.cookies.get('k-lang')?.value
    const accept = (req.headers.get('accept-language') || '')
      .split(',')
      .map((s) => s.split(';')[0].trim().slice(0, 2).toLowerCase())
    const lang = (saved && LANGS.includes(saved) && saved) || accept.find((l) => LANGS.includes(l)) || 'tr'
    return withSecurityHeaders(NextResponse.redirect(new URL(`/${lang}`, req.url)))
  }

  if (req.cookies.get(PANEL_COOKIE)) return withSecurityHeaders(NextResponse.next())
  const headers = new Headers(req.headers)
  const cookie = headers.get('cookie')
  headers.set('cookie', cookie ? `${cookie}; ${PANEL_COOKIE}=tr` : `${PANEL_COOKIE}=tr`)
  const res = NextResponse.next({ request: { headers } })
  res.cookies.set(PANEL_COOKIE, 'tr', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  return withSecurityHeaders(res)
}

export const config = { matcher: ['/', '/admin', '/admin/:path*', '/api/:path*'] }
