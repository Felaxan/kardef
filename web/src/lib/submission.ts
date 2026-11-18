/* Arşive katkı formu: doğrulama kuralları ve hız sınırı (saf, test edilebilir) */

export const MAX_FILES = 10
export const MAX_FILE_BYTES = 50 * 1024 * 1024
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
  | 'name' | 'contact' | 'description' | 'consent' | 'files.none' | 'files.count' | 'files.size' | 'files.type'
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

  if (files.length === 0 && !filled(fields.link)) errors.push('files.none')
  else if (files.length > MAX_FILES) errors.push('files.count')
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
