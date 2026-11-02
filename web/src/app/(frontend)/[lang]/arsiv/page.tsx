import { notFound } from 'next/navigation'
import React from 'react'
import { ArchiveList } from '@/components/site/ArchiveList'
import { isLang, t } from '@/i18n/ui'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }>; searchParams: Promise<{ donem?: string; tur?: string; sayfa?: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: t(lang, 'arc.title') } : {}
}

export default async function Page({ params, searchParams }: P) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const sp = await searchParams
  return <ArchiveList lang={lang} base={`/${lang}/arsiv`} {...sp} />
}
