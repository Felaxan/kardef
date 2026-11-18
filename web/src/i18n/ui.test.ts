import assert from 'node:assert/strict'
import { test } from 'node:test'
import base from './ui-dict.json'
import { decadeLabel, fmt, isLang, LANG_NAMES, t } from './ui'

const ZZA = (base as unknown as { zza: { months: string[]; days: string[] } }).zza

test('Zazaca geçerli bir site dili', () => {
  assert.equal(isLang('zza'), true)
  assert.match(LANG_NAMES['zza' as never], /Kirmanck/)
})

test('Zazaca tarih ay adlarını kendi listesinden yazar', () => {
  assert.equal(ZZA.months.length, 12)
  assert.equal(ZZA.days.length, 7)
  const s = fmt('zza' as never, '2026-01-15T10:00:00Z', 'dm')
  assert.equal(s, `15 ${ZZA.months[0]}`)
})

test('Zazaca dönem adı boş değil', () => {
  assert.ok(decadeLabel('zza' as never, 1980).includes('1980'))
})

test('Zazaca çevrilmemiş arayüz metni Türkçeye düşer', () => {
  assert.equal(t('zza' as never, '__yok__'), '__yok__')
  assert.equal(t('zza' as never, 'not.apply').length > 0, true)
})
