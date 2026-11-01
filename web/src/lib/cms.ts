import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'
import type { Media } from '@/payload-types'
import type { Lang } from '@/i18n/ui'

/** İstek başına tek Payload örneği */
export const cms = cache(async () => getPayload({ config }))

/** Yerel API'nin locale tipini dar tutmak için */
export const loc = (lang: Lang) => lang as 'tr'

type MaybeMedia = number | Media | null | undefined
export const isMedia = (m: MaybeMedia): m is Media => !!m && typeof m === 'object'

/** Görsel adresi: istenen boyut yoksa asıl dosya */
export function mediaUrl(m: MaybeMedia, size?: 'thumbnail' | 'card' | 'hero'): string | null {
  if (!isMedia(m)) return null
  const s = size ? m.sizes?.[size]?.url : null
  return s || m.url || null
}

/** Lexical zengin metin boş mu? */
export function hasRichText(v: unknown): boolean {
  const root = (v as { root?: { children?: { children?: { text?: string }[] }[] } } | null)?.root
  if (!root?.children?.length) return false
  return root.children.some((c) => (c.children ?? []).some((t) => (t.text ?? '').trim()) || !('children' in c))
}

/** Zengin metnin düz yazısı (okuma süresi için) */
export function richTextPlain(v: unknown): string {
  const out: string[] = []
  const walk = (n: { text?: string; children?: unknown[] } | null | undefined) => {
    if (!n) return
    if (typeof n.text === 'string') out.push(n.text)
    ;(n.children as { text?: string; children?: unknown[] }[] | undefined)?.forEach(walk)
  }
  walk((v as { root?: { children?: unknown[] } } | null)?.root as never)
  return out.join(' ')
}

/** YouTube bağlantısından video kimliği */
export function youTubeId(url?: string | null): string | null {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)
  return m ? m[1] : null
}

/** Ses dalgası çubukları (sunucuda sabit, her kayıtta aynı) */
export function waveBars(seed: number, n = 44): number[] {
  return Array.from({ length: n }, (_, i) =>
    Math.round(16 + Math.abs(Math.sin(i * 0.55 + seed * 2.1) * Math.cos(i * 0.19 + seed)) * 84),
  )
}
