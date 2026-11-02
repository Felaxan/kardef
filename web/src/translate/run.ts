/*
  Bir kaydı (ya da ayar sayfasını) Türkçeden diğer dillere çevirir.

  Kurallar:
  - Türkçe metin son çeviriden beri değişmediyse hiçbir şey yapılmaz (karakter harcanmaz).
  - Bir dilde metin elle düzeltildiyse o dil bir daha ezilmez ("Çevirileri yenile" işaretlenmedikçe).
  - Adres (slug) ve dil dışı alanlar değişmez.
*/
import type { Payload } from 'payload'
import { COLLECTION_FIELDS, GLOBAL_FIELDS, GLOSSARY, TARGETS, TARGET_LANGS, type FieldSpec, type TargetLang } from './config'
import { translateHtml } from './microsoft'
import { hash, makeProtector, plain, richUnits, textBack, textUnit } from './segments'

export type LangState = { hash?: string; at?: string; manual?: boolean }
export type AutoTrMeta = { source?: string; at?: string; langs?: Partial<Record<TargetLang, LangState>> }

type Doc = Record<string, unknown>
type Target = { collection: string; id: number | string } | { global: string }

const get = (o: unknown, path: string): unknown => path.split('.').reduce<unknown>((a, k) => (a as Doc | null)?.[k], o)
/** "notice.text" gibi iç içe alanları, kardeş alanları koruyarak yazar */
function setPath(data: Doc, source: Doc, path: string, value: unknown) {
  const keys = path.split('.')
  let d = data, s: Doc | undefined = source
  keys.slice(0, -1).forEach((k) => {
    s = s?.[k] as Doc | undefined
    d[k] = (d[k] as Doc) ?? { ...(s ?? {}) }
    d = d[k] as Doc
  })
  d[keys[keys.length - 1]] = value
}
const fingerprint = (doc: Doc, fields: FieldSpec[]) => hash(fields.map((f) => plain(get(doc, f.path), f.kind)).join('␞'))
const isEmpty = (doc: Doc, fields: FieldSpec[]) => fields.every((f) => !plain(get(doc, f.path), f.kind))

let glossaryCache: { at: number; terms: string[] } | null = null
async function glossary(payload: Payload) {
  if (glossaryCache && Date.now() - glossaryCache.at < 10 * 60_000) return glossaryCache.terms
  const { docs } = await payload.find({ collection: 'villages', limit: 2000, pagination: false, depth: 0, select: { name: true, otherNames: true } })
  const terms = [...GLOSSARY, ...docs.flatMap((v) => [v.name, ...(v.otherNames ?? [])])]
  glossaryCache = { at: Date.now(), terms }
  return terms
}

export async function translateTarget(payload: Payload, target: Target, opts: { force?: boolean } = {}) {
  const isGlobal = 'global' in target
  const fields = isGlobal ? GLOBAL_FIELDS[target.global] : COLLECTION_FIELDS[target.collection]
  if (!fields) return { translated: [] as string[], skipped: 'alan yok' }

  const read = (locale: string, fallback: boolean): Promise<Doc> =>
    (isGlobal
      ? payload.findGlobal({ slug: target.global as 'homepage', locale: locale as 'tr', fallbackLocale: fallback ? undefined : false, depth: 0, overrideAccess: true })
      : payload.findByID({ collection: target.collection as 'posts', id: target.id, locale: locale as 'tr', fallbackLocale: fallback ? undefined : false, depth: 0, overrideAccess: true, draft: false })
    ) as unknown as Promise<Doc>

  const src = await read('tr', true)
  if (isEmpty(src, fields)) return { translated: [], skipped: 'Türkçe metin boş' }
  const meta: AutoTrMeta = structuredClone((src.autoTr as AutoTrMeta) ?? {})
  meta.langs ??= {}
  const sourceHash = fingerprint(src, fields)

  // Hangi diller çevrilecek?
  const todo: TargetLang[] = []
  for (const l of TARGET_LANGS) {
    const cur = await read(l, false)
    const state = meta.langs[l]
    const untouched = isEmpty(cur, fields) || (state?.hash && state.hash === fingerprint(cur, fields))
    if (opts.force || (untouched && (meta.source !== sourceHash || !state?.hash))) todo.push(l)
    else if (!untouched) meta.langs[l] = { ...state, manual: true }
  }
  if (!todo.length) return { translated: [], skipped: 'güncel' }

  // Parçalara ayır, tek seferde tüm dillere çevir
  const protect = makeProtector(await glossary(payload))
  const plan = fields.map((f) => {
    const v = get(src, f.path)
    if (f.kind === 'text') {
      const s = typeof v === 'string' ? v : ''
      return { f, units: s.trim() ? [textUnit(s, protect)] : [], build: (o: string[]) => (s.trim() ? textBack(o[0] ?? '') : v) }
    }
    const r = richUnits(v, protect)
    return { f, units: r.units, build: r.build }
  })
  const all = plan.flatMap((p) => p.units)
  const out = await translateHtml(all, todo.map((l) => TARGETS[l]))

  const now = new Date().toISOString()
  for (const [i, l] of todo.entries()) {
    const lines = out[TARGETS[l]]
    let k = 0
    const data: Doc = {}
    const written: Doc = {}
    for (const p of plan) {
      const part = lines.slice(k, k + p.units.length)
      k += p.units.length
      const value = p.units.length ? p.build(part) : get(src, p.f.path)
      setPath(data, src, p.f.path, value)
      setPath(written, src, p.f.path, value)
    }
    meta.langs[l] = { hash: fingerprint(written, fields), at: now }
    const last = i === todo.length - 1
    if (last) Object.assign(meta, { source: sourceHash, at: now })
    if (!isGlobal && typeof src.slug === 'string') data.slug = src.slug // adres değişmesin
    if (last) data.autoTr = meta
    const context = { skipTranslate: true }
    if (isGlobal) {
      await payload.updateGlobal({ slug: target.global as 'homepage', locale: l as 'tr', data: data as never, overrideAccess: true, context })
    } else {
      await payload.update({ collection: target.collection as 'posts', id: target.id, locale: l as 'tr', data: data as never, overrideAccess: true, context })
    }
  }
  return { translated: todo, skipped: '' }
}
