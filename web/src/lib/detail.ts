import { notFound } from 'next/navigation'
import type { CollectionSlug } from 'payload'
import { isLang, type Lang } from '@/i18n/ui'
import { cms, loc } from './cms'

/** Detay sayfaları için: dili doğrula, adresten (slug) yayınlanmış kaydı getir; yoksa 404 */
export async function bySlug<T>(collection: CollectionSlug, rawLang: string, slug: string, depth = 2) {
  if (!isLang(rawLang)) notFound()
  const lang: Lang = rawLang
  const payload = await cms()
  const res = await payload.find({
    collection,
    where: { slug: { equals: decodeURIComponent(slug) } },
    limit: 1,
    depth,
    locale: loc(lang),
    overrideAccess: false, // ziyaretçi gibi: yalnızca yayınlanmış olanlar
  })
  const doc = res.docs[0] as T | undefined
  if (!doc) notFound()
  return { doc, lang, payload }
}
