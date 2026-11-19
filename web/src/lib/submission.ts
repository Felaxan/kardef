/* Arşive katkı formu: doğrulama kuralları ve hız sınırı (saf, test edilebilir) */

export const MAX_FILES = 10
export const MAX_FILE_BYTES = 50 * 1024 * 1024
/** İstek gövdesi üst sınırı: 10 × 50 MB + form alanları için pay */
export const MAX_BODY_BYTES = MAX_FILES * MAX_FILE_BYTES + 2 * 1024 * 1024
export const SUBMISSION_KINDS = ['photo', 'audio', 'video', 'document', 'other'] as const
export type SubmissionKind = (typeof SUBMISSION_KINDS)[number]

/** İzinli dosyalar: tür ve uzantı birlikte tutmalı */
const ALLOWED: { mime: RegExp; ext: RegExp }[] = [
  { mime: /^image\/(jpeg|png|webp|gif|heic|heif|tiff)$/, ext: /\.(jpe?g|png|webp|gif|heic|heif|tiff?)$/i },
  { mime: /^audio\/(mpeg|mp3|mp4|x-m4a|m4a|aac|wav|x-wav|ogg|webm|amr|3gpp)$/, ext: /\.(mp3|m4a|aac|wav|ogg|oga|webm|amr|3gp)$/i },
  { mime: /^video\/(mp4|quicktime|webm|3gpp|x-msvideo|x-matroska)$/, ext: /\.(mp4|mov|webm|3gp|avi|mkv)$/i },
  { mime: /^application\/pdf$/, ext: /\.pdf$/i },
]
export const ACCEPT = 'image/*,audio/*,video/*,application/pdf'

export type FileInfo = { name: string; type: string; size: number }
export type SubmissionError =
  | 'name' | 'contact' | 'description' | 'consent' | 'privacy' | 'files.none' | 'files.count' | 'files.size' | 'files.type'
export type Validation = { ok: true } | { ok: false; errors: SubmissionError[] }

const filled = (v?: string | null) => Boolean(v && v.trim())
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const isAllowedFile = (f: FileInfo) => ALLOWED.some((a) => a.mime.test(f.type) && a.ext.test(f.name))

export function validateSubmission(fields: Record<string, string | undefined>, files: FileInfo[]): Validation {
  const errors: SubmissionError[] = []
  if (!filled(fields.name)) errors.push('name')
  const phone = (fields.phone ?? '').replace(/[^\d+]/g, '')
  const email = (fields.email ?? '').trim()
  const phoneOk = phone.replace(/\D/g, '').length >= 7
  const emailOk = EMAIL.test(email)
  if (!phoneOk && !emailOk) errors.push('contact')
  if (!filled(fields.description)) errors.push('description')
  if (!fields.consent) errors.push('consent')
  if (!fields.privacy) errors.push('privacy')

  // Dosya şart değil: yalnızca yazılı bir anı da gönderilebilir
  if (files.length > MAX_FILES) errors.push('files.count')
  else if (files.some((f) => f.size > MAX_FILE_BYTES)) errors.push('files.size')
  else if (files.some((f) => !isAllowedFile(f))) errors.push('files.type')

  return errors.length ? { ok: false, errors } : { ok: true }
}

/** Bellek içi hız sınırı: aynı adresten `max` gönderim / `windowMs` */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>()
  return (key: string, now: number): boolean => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    if (recent.length >= max) {
      hits.set(key, recent)
      return false
    }
    recent.push(now)
    hits.set(key, recent)
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
    return true
  }
}

/** Content-Length sınırı aşıyor mu? (gövde okunmadan önce) */
export function bodyTooLarge(contentLength: string | null): boolean {
  const n = Number(contentLength)
  return Number.isFinite(n) && n > MAX_BODY_BYTES
}

/**
  Ziyaretçi IP'si: yalnızca kendi sunucumuzun koyduğu başlık okunur.
  Varsayılan x-real-ip (nginx bunu her istekte üzerine yazar). Cloudflare arkasında
  TRUSTED_IP_HEADER=cf-connecting-ip yapılır. İstemcinin kendi yazdığı başlıklara güvenilmez.
*/
export function clientIp(headers: Headers, trusted: string | undefined): string {
  const name = (trusted || 'x-real-ip').toLowerCase()
  return headers.get(name)?.split(',')[0]?.trim() || 'bilinmiyor'
}

/** Turnstile: iki anahtar da varsa açık, hiçbiri yoksa kapalı, biri eksikse ayar hatası */
export function turnstileMode(env: Record<string, string | undefined>): 'on' | 'off' | 'misconfigured' {
  const s = Boolean(env.TURNSTILE_SECRET), k = Boolean(env.NEXT_PUBLIC_TURNSTILE_SITEKEY)
  return s && k ? 'on' : !s && !k ? 'off' : 'misconfigured'
}

/**
  Gönderideki serbest yıl metnini ("1978", "1970'ler", "~1985", boş...)
  Arşiv koleksiyonunun kabul ettiği (1850–2100) sayısal yıla çevirir.
*/
export function parseSubmissionYear(raw?: string | null, fallback = new Date().getFullYear()): { year: number; approximate: boolean } {
  const s = (raw ?? '').trim()
  if (!s) return { year: fallback, approximate: true }
  const m = s.match(/\b(18[5-9]\d|19\d\d|20\d\d|2100)\b/)
  if (!m) return { year: fallback, approximate: true }
  const year = Number(m[1])
  const exact = /^\d{4}$/.test(s)
  return { year, approximate: !exact }
}

/**
  Dosya içeriğinin (magic bytes) uzantı/MIME ile uyumlu ve güvenli olduğunu doğrular.
  Adı .jpg veya .pdf yapılmış .exe, .html, .svg, betik dosyalarını reddeder.
*/
export function hasValidFileSignature(bytes: Uint8Array, mime: string): boolean {
  if (bytes.length < 4) return false
  // Çalıştırılabilir dosyalar: Windows MZ (.exe/.dll), Linux ELF, kabuk betiği (#!)
  if (bytes[0] === 0x4d && bytes[1] === 0x5a) return false
  if (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) return false
  if (bytes[0] === 0x23 && bytes[1] === 0x21) return false

  // İlk 256 baytta HTML / SVG / XML / script imzası varsa reddet
  const head = Buffer.from(bytes.subarray(0, 256)).toString('utf8').trimStart().toLowerCase()
  if (/^(<!doctype\s+html|<html|<script|<svg|<\?xml)/i.test(head)) return false

  if (mime === 'application/pdf') {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
  }
  if (mime === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (mime === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  }
  if (mime === 'image/gif') {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38
  }
  if (mime === 'image/webp') {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    )
  }
  return true
}

