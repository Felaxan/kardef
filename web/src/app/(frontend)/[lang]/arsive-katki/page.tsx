import { notFound } from 'next/navigation'
import React from 'react'
import { ContributeForm } from '@/components/site/ContributeForm'
import { ListHead } from '@/components/site/List'
import { DEMO } from '@/demo'
import { isLang, t } from '@/i18n/ui'
import { cms } from '@/lib/cms'
import { FORM } from '@/i18n/form'
import { turnstileMode } from '@/lib/submission'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: t(lang, 'form.title') } : {}
}

export default async function ContributePage({ params }: P) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const payload = await cms()
  const villages = await payload.find({ collection: 'villages', sort: 'name', limit: 1000, depth: 0, pagination: false, select: { name: true } })

  // Formun bütün metinleri (seçili dil, eksikse Türkçe)
  const labels = Object.fromEntries(Object.keys(FORM.tr).map((k) => [k, t(lang, k)]))
  const kindLabels = {
    photo: t(lang, 'type.photo'), audio: t(lang, 'type.audio'), video: t(lang, 'type.video'),
    document: t(lang, 'type.doc'), other: t(lang, 'form.kind.other'),
  }

  return (
    <div className="story list-page contribute-page">
      <div className="wrap story-top">
        <ListHead lang={lang} kicker={t(lang, 'nav.arsiv')} title={t(lang, 'form.title')} lede={t(lang, 'form.lede')} />
        <ContributeForm
          action={`/${lang}/arsive-katki/gonder`}
          privacyHref={`/${lang}/gizlilik#kvkk`}
          labels={labels}
          kindLabels={kindLabels}
          villages={villages.docs.map((v) => ({ id: v.id as number, name: v.name }))}
          siteKey={turnstileMode(process.env) === 'on' ? process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY : undefined}
          demo={DEMO}
        />
      </div>
    </div>
  )
}
