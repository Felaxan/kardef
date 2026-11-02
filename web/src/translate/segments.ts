/*
  Çevrilecek metni parçalara ayırır ve çeviriyi geri yerleştirir.
  Zengin metinde her paragraf tek parça olarak gönderilir; kalın, eğik, bağlantı gibi
  biçimler paragraf içinde <span id="tN"> işaretleriyle korunur.
*/
import { createHash } from 'crypto'

type LexNode = { type?: string; text?: string; children?: LexNode[]; [k: string]: unknown }
const INLINE = new Set(['text', 'link', 'autolink', 'linebreak', 'tab'])

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const unesc = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&')

/** Özel adları çeviriden korur */
export function makeProtector(terms: string[]) {
  const list = [...new Set(terms.filter((t) => t && t.trim().length > 1))].sort((a, b) => b.length - a.length)
  if (!list.length) return (s: string) => s
  const re = new RegExp(list.map((t) => esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
  return (escaped: string) => escaped.replace(re, (m) => `<span class="notranslate">${m}</span>`)
}
const unprotect = (html: string) => html.replace(/<span class="notranslate">([\s\S]*?)<\/span>/g, '$1')

/* ---------- Düz metin ---------- */
export const textUnit = (s: string, protect: (s: string) => string) => protect(esc(s))
export const textBack = (html: string) => unesc(unprotect(html).replace(/<[^>]+>/g, '')).trim()

/* ---------- Zengin metin (Lexical) ---------- */
function inlineTexts(node: LexNode, acc: LexNode[]) {
  for (const c of node.children ?? []) {
    if (c.type === 'text') acc.push(c)
    else if (c.children) inlineTexts(c, acc)
  }
  return acc
}
function blocks(node: LexNode, acc: LexNode[]) {
  const kids = node.children ?? []
  if (kids.some((c) => INLINE.has(c.type ?? ''))) acc.push(node)
  else kids.forEach((c) => blocks(c, acc))
  return acc
}

/** Zengin metinden çevrilecek paragraf parçaları ve çeviriyi yerleştiren işlev */
export function richUnits(value: unknown, protect: (s: string) => string) {
  const root = (value as { root?: LexNode } | null)?.root
  if (!root) return { units: [] as string[], build: () => value }
  const units = blocks(root, []).map((b) =>
    inlineTexts(b, []).map((t, i) => `<span id="t${i}">${protect(esc(t.text ?? ''))}</span>`).join(''))
  const build = (outs: string[]) => {
    const copy = structuredClone(value) as { root: LexNode }
    blocks(copy.root, []).forEach((b, bi) => {
      const html = unprotect(outs[bi] ?? '')
      const parts = new Map<number, string>()
      for (const m of html.matchAll(/<span id="t(\d+)">([\s\S]*?)<\/span>/g)) parts.set(Number(m[1]), unesc(m[2].replace(/<[^>]+>/g, '')))
      inlineTexts(b, []).forEach((t, i) => { if (parts.has(i)) t.text = parts.get(i) })
    })
    return copy
  }
  return { units, build }
}

/* ---------- Karşılaştırma ---------- */
export function plain(value: unknown, kind: 'text' | 'rich'): string {
  if (kind === 'text') return typeof value === 'string' ? value.trim() : ''
  const root = (value as { root?: LexNode } | null)?.root
  return root ? inlineTexts({ children: blocks(root, []) }, []).map((t) => t.text ?? '').join(' ').replace(/\s+/g, ' ').trim() : ''
}
export const hash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 16)
