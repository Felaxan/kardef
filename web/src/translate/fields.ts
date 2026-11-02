/*
  Otomatik çeviriyi içerik bölümlerine bağlar:
  - kenar çubuğunda çeviri durumu ve "Çevirileri yenile" kutusu
  - Türkçe içerik yayınlanınca (ya da ayar kaydedilince) arka planda çeviri
*/
import type { CollectionConfig, Field, GlobalConfig, Payload } from 'payload'
import { COLLECTION_FIELDS, GLOBAL_FIELDS, translatorEnabled } from './config'
import { translateTarget } from './run'

const fields = (): Field[] => [
  { name: 'autoTr', type: 'json', admin: { hidden: true } },
  {
    name: 'translationStatus',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: { Field: { path: '/components/admin/TranslationStatus#TranslationStatus', clientProps: { enabled: translatorEnabled() } } },
    },
  },
  {
    name: 'retranslate',
    label: 'Çevirileri yenile',
    type: 'checkbox',
    admin: {
      position: 'sidebar',
      hidden: !translatorEnabled(), // anahtar yokken gösterme
      description: 'İşaretleyip kaydederseniz bütün diller Türkçe metinden yeniden çevrilir (elle düzeltilenler dahil).',
    },
  },
]

/** Kayıt bittikten sonra, isteği bekletmeden çevir */
function schedule(payload: Payload, run: () => ReturnType<typeof translateTarget>, label: string) {
  setTimeout(() => {
    run()
      .then((r) => r.translated.length && payload.logger.info(`Çeviri tamam: ${label} → ${r.translated.join(', ')}`))
      .catch((e) => payload.logger.error(`Çeviri başarısız (${label}): ${e instanceof Error ? e.message : e}`))
  }, 1500)
}

/** Kullanıcı Türkçeyi düzenliyorsa (başka bir dil sekmesinde değilse) */
const editingTurkish = (locale?: string | null) => !locale || locale === 'tr' || locale === 'all'

export function withAutoTranslate(c: CollectionConfig): CollectionConfig {
  if (!COLLECTION_FIELDS[c.slug]) return c
  return {
    ...c,
    fields: [...c.fields, ...fields()],
    hooks: {
      ...c.hooks,
      beforeChange: [
        ...(c.hooks?.beforeChange ?? []),
        ({ data, context }) => {
          if (data?.retranslate) { context.forceTranslate = true; data.retranslate = false }
          return data
        },
      ],
      afterChange: [
        ...(c.hooks?.afterChange ?? []),
        ({ doc, req, context }) => {
          if (context.skipTranslate || !translatorEnabled() || !editingTurkish(req.locale)) return doc
          if (c.versions && (doc as { _status?: string })._status !== 'published') return doc // taslaklar çevrilmez
          const force = Boolean(context.forceTranslate)
          schedule(req.payload, () => translateTarget(req.payload, { collection: c.slug, id: doc.id }, { force }), `${c.slug} #${doc.id}`)
          return doc
        },
      ],
    },
  }
}

export function withAutoTranslateGlobal(g: GlobalConfig): GlobalConfig {
  if (!GLOBAL_FIELDS[g.slug]) return g
  return {
    ...g,
    fields: [...g.fields, ...fields()],
    hooks: {
      ...g.hooks,
      beforeChange: [
        ...(g.hooks?.beforeChange ?? []),
        ({ data, context }) => {
          if (data?.retranslate) { context.forceTranslate = true; data.retranslate = false }
          return data
        },
      ],
      afterChange: [
        ...(g.hooks?.afterChange ?? []),
        ({ doc, req, context }) => {
          if (context.skipTranslate || !translatorEnabled() || !editingTurkish(req.locale)) return doc
          const force = Boolean(context.forceTranslate)
          schedule(req.payload, () => translateTarget(req.payload, { global: g.slug }, { force }), g.slug)
          return doc
        },
      ],
    },
  }
}
