/*
  KAR-DEF Proaktif Güvenlik Çekirdeği
  - Dosya adı rastgeleleştirme ve Path Traversal koruması
  - CSRF (Origin / Referer) doğrulaması
  - API hız sınırı, kaba kuvvet (Brute-Force) tespiti ve otomatik geçici IP engelleme
  - Toplu veri çekme (Scraping / limit) sınırlandırması
  - Hassas veri maskeleme (şifre, token ve çerezler loglara asla yazılmaz)
*/
import crypto from 'crypto'
import path from 'path'

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'
export type SecurityEventType =
  | 'login_failed'
  | 'login_success'
  | 'unauthorized'
  | 'rate_limit'
  | 'ip_blocked'
  | 'csrf_blocked'
  | 'file_rejected'
  | 'audit_create'
  | 'audit_update'
  | 'audit_delete'
  | 'session_revoked'
  | 'user_suspended'
  | 'lockdown_changed'
  | 'backup_created'

const WEAK_SECRETS = new Set([
  '',
  'uzun-rastgele-bir-anahtar',
  'secret',
  'payload-secret',
  'changeme',
  '123456',
])

/**
  PAYLOAD_SECRET anahtarını doğrular.
  Canlı ortamda zayıf veya boş anahtarla başlamayı reddeder.
*/
export function resolvePayloadSecret(env: Record<string, string | undefined>, demo: boolean): string {
  if (demo) return 'kardef-maket-salt-okunur-2026-guvenli-anahtar'
  const raw = (env.PAYLOAD_SECRET ?? '').trim()
  const isWeak = raw.length < 24 || WEAK_SECRETS.has(raw)
  if (isWeak && env.NODE_ENV === 'production') {
    throw new Error('GÜVENLİK HATASI: Canlı ortamda PAYLOAD_SECRET en az 24 karakterli güçlü bir değer olmalıdır.')
  }
  if (isWeak) {
    return crypto.createHash('sha256').update(`kardef-dev-${raw || 'fallback'}`).digest('hex')
  }
  return raw
}

/**
  Yüklenen dosya adını güvenli ve tahmin edilemez hale getirir.
  Çift uzantıları (virus.exe.jpg), dizin geçişlerini (../) ve özel karakterleri temizler.
*/
export function safeRandomFilename(originalName: string): string {
  const base = path.basename(originalName || 'dosya')
  const extMatch = base.match(/\.(jpe?g|png|webp|gif|avif|heic|heif|tiff?|mp3|m4a|aac|wav|ogg|oga|webm|amr|3gp|mp4|mov|avi|mkv|pdf)$/i)
  const ext = extMatch ? extMatch[0].toLowerCase() : '.bin'
  const stem = base
    .slice(0, base.length - (extMatch ? extMatch[0].length : 0))
    .replace(/\.(exe|bat|cmd|sh|php|pl|py|js|mjs|html?|svg|xml|dll|msi|vbs|ps1)/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'dosya'
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  return `${rand}-${stem}${ext}`
}

/**
  Bir dosya yolunun yalnızca izin verilen klasörün (baseDir) içinde kaldığını doğrular.
  Path Traversal (../) girişimlerinde null döner.
*/
export function safeResolveUnder(baseDir: string, unsafeFilename: string): string | null {
  if (!unsafeFilename || typeof unsafeFilename !== 'string') return null
  if (unsafeFilename.includes('\0') || unsafeFilename.includes('..') || /[\\/]/.test(unsafeFilename)) {
    return null
  }
  const cleanName = path.basename(unsafeFilename)
  const root = path.resolve(baseDir)
  const target = path.resolve(root, cleanName)
  if (!target.startsWith(root + path.sep) && target !== root) return null
  return target
}

/**
  Durum değiştiren (POST, PUT, PATCH, DELETE) isteklerde CSRF koruması.
  Origin veya Referer başlığı mevcut sunucu adresiyle (Host) eşleşmelidir.
*/
export function verifyCsrfOrigin(
  method: string,
  headers: Headers,
  allowedServerUrl?: string,
): boolean {
  const m = method.toUpperCase()
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return true

  const host = headers.get('x-forwarded-host') || headers.get('host')
  const origin = headers.get('origin')
  const referer = headers.get('referer')

  const allowedHosts = new Set<string>()
  if (host) allowedHosts.add(host.toLowerCase())
  if (allowedServerUrl) {
    try { allowedHosts.add(new URL(allowedServerUrl).host.toLowerCase()) } catch { /* yoksay */ }
  }

  if (origin) {
    if (origin === 'null') return false
    try {
      return allowedHosts.has(new URL(origin).host.toLowerCase())
    } catch {
      return false
    }
  }
  if (referer) {
    try {
      return allowedHosts.has(new URL(referer).host.toLowerCase())
    } catch {
      return false
    }
  }
  // Tarayıcı dışı doğrudan API çağrılarında Sec-Fetch-Site kontrolü
  const fetchSite = headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return false
  return true
}

const SENSITIVE_KEYS = /pass(word)?|secret|token|cookie|authorization|salt|hash|api[-_]?key|turnstile/i

/**
  Loglara yazılacak nesnelerden şifre, token, oturum çerezi ve gizli anahtarları temizler (Kural 6).
*/
export function redactSensitive(input: unknown, depth = 0): unknown {
  if (depth > 4 || input == null) return input
  if (typeof input === 'string') {
    return input
      .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[MASKELENDİ]')
      .replace(/(payload-token=)[^;\s]+/gi, '$1[MASKELENDİ]')
      .slice(0, 1000)
  }
  if (typeof input !== 'object') return input
  if (Array.isArray(input)) return input.slice(0, 20).map((x) => redactSensitive(x, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.test(k)) {
      out[k] = '[MASKELENDİ]'
    } else {
      out[k] = redactSensitive(v, depth + 1)
    }
  }
  return out
}

/**
  API üzerinden toplu veri çekme (scraping) girişimlerini önlemek için
  URL'deki `limit` ve `depth` parametrelerini güvenli üst sınıra çeker.
*/
export function clampApiQueryLimits(searchParams: URLSearchParams, maxLimit = 100, maxDepth = 2): { clamped: boolean; limit?: number; depth?: number } {
  let clamped = false
  let limit: number | undefined
  let depth: number | undefined

  const rawLimit = searchParams.get('limit')
  if (rawLimit !== null) {
    const n = Number(rawLimit)
    if (!Number.isFinite(n) || n > maxLimit || n < 0) {
      clamped = true
      limit = maxLimit
    } else {
      limit = n
    }
  }
  const rawDepth = searchParams.get('depth')
  if (rawDepth !== null) {
    const d = Number(rawDepth)
    if (!Number.isFinite(d) || d > maxDepth || d < 0) {
      clamped = true
      depth = maxDepth
    } else {
      depth = d
    }
  }
  return { clamped, limit, depth }
}

export type IpBanEntry = { ip: string; reason: string; expiresAt: number | null; createdAt: number }

/**
  Bellek içi proaktif koruma kalkanı:
  - Manuel ve otomatik geçici IP engelleme
  - Başarısız giriş (Brute-Force) sayacı ve kademeli gecikme
  - Genel API ve kimlik doğrulama hız sınırları (Rate Limiting)
  - Acil durum koruma modu (Lockdown)
*/
export function createSecurityShield(opts?: {
  authMaxPer10Min?: number
  apiMaxPerMin?: number
  failedLoginAutoBanThreshold?: number
  autoBanDurationMs?: number
}) {
  const authMax = opts?.authMaxPer10Min ?? 12
  const apiMax = opts?.apiMaxPerMin ?? 120
  const banThreshold = opts?.failedLoginAutoBanThreshold ?? 6
  const banDurationMs = opts?.autoBanDurationMs ?? 30 * 60 * 1000 // 30 dakika

  const bans = new Map<string, IpBanEntry>()
  const authHits = new Map<string, number[]>()
  const apiHits = new Map<string, number[]>()
  const failedLogins = new Map<string, number[]>()
  let lockdown = false

  const slide = (map: Map<string, number[]>, key: string, windowMs: number, now: number): number[] => {
    const list = (map.get(key) ?? []).filter((t) => now - t < windowMs)
    if (map.size > 5000) {
      for (const [k, v] of map) if (!v.some((t) => now - t < windowMs)) map.delete(k)
    }
    return list
  }

  return {
    isLockdown: () => lockdown,
    setLockdown: (v: boolean) => { lockdown = v },

    blockIp(ip: string, reason: string, durationMs: number | null = banDurationMs, now = Date.now()) {
      const clean = ip.trim()
      if (!clean || clean === 'bilinmiyor') return
      bans.set(clean, {
        ip: clean,
        reason,
        expiresAt: durationMs === null ? null : now + durationMs,
        createdAt: now,
      })
    },

    unblockIp(ip: string) {
      bans.delete(ip.trim())
      failedLogins.delete(ip.trim())
    },

    isIpBlocked(ip: string, now = Date.now()): IpBanEntry | null {
      const entry = bans.get(ip.trim())
      if (!entry) return null
      if (entry.expiresAt !== null && now >= entry.expiresAt) {
        bans.delete(ip.trim())
        return null
      }
      return entry
    },

    listBlockedIps(now = Date.now()): IpBanEntry[] {
      const out: IpBanEntry[] = []
      for (const [k, v] of bans) {
        if (v.expiresAt !== null && now >= v.expiresAt) bans.delete(k)
        else out.push(v)
      }
      return out
    },

    /** Giriş ve şifre sıfırlama uç noktaları için sıkı hız sınırı */
    checkAuthRate(ip: string, now = Date.now()): boolean {
      if (this.isIpBlocked(ip, now)) return false
      const recent = slide(authHits, ip, 10 * 60 * 1000, now)
      if (recent.length >= authMax) {
        authHits.set(ip, recent)
        return false
      }
      recent.push(now)
      authHits.set(ip, recent)
      return true
    },

    /** Genel API uç noktaları için hız sınırı */
    checkApiRate(ip: string, now = Date.now()): boolean {
      if (this.isIpBlocked(ip, now)) return false
      const recent = slide(apiHits, ip, 60 * 1000, now)
      if (recent.length >= apiMax) {
        apiHits.set(ip, recent)
        return false
      }
      recent.push(now)
      apiHits.set(ip, recent)
      return true
    },

    /**
      Başarısız giriş denemesini kaydeder.
      Eşik aşılırsa IP'yi otomatik olarak geçici süreyle engeller ve kademeli gecikme (ms) döner.
    */
    recordFailedLogin(ip: string, now = Date.now()): { attempts: number; autoBanned: boolean; delayMs: number } {
      const recent = slide(failedLogins, ip, 15 * 60 * 1000, now)
      recent.push(now)
      failedLogins.set(ip, recent)
      const attempts = recent.length
      const autoBanned = attempts >= banThreshold
      if (autoBanned) {
        this.blockIp(ip, `15 dakikada ${attempts} başarısız giriş denemesi (otomatik koruma)`, banDurationMs, now)
      }
      // Kademeli gecikme: 1. deneme 250ms, 2. deneme 500ms, 3. deneme 1000ms ... en fazla 4000ms
      const delayMs = Math.min(4000, Math.pow(2, Math.max(0, attempts - 1)) * 250)
      return { attempts, autoBanned, delayMs }
    },

    clearFailedLogins(ip: string) {
      failedLogins.delete(ip.trim())
    },
  }
}

/** Uygulama genelinde paylaşılan tekil güvenlik kalkanı */
export const globalShield = createSecurityShield()

/** Standart HTTP güvenlik başlıkları (Clickjacking, XSS, MIME-sniffing ve HSTS koruması) */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://i.ytimg.com https://*.ytimg.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://challenges.cloudflare.com",
    "connect-src 'self' https://challenges.cloudflare.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; '),
}
