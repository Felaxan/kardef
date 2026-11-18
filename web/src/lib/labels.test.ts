import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Announcements } from '../collections/Announcements'
import { AdImages } from '../collections/AdSlots'
import { Media } from '../collections/Media'
import { validateSafeUrl, validateSafeUrlOrContact } from '../fields'
import { ANNOUNCEMENT_TYPES, announcementTypeLabel, occasionLabel } from './labels'

test('duyuru türlerinde ve liste sabitinde Düğün ve Özel gün var', () => {
  const type = Announcements.fields.find((f) => 'name' in f && f.name === 'type') as { options: { value: string }[] }
  const values = type.options.map((o) => o.value)
  assert.ok(values.includes('dugun'))
  assert.ok(values.includes('ozel-gun'))
  assert.ok(ANNOUNCEMENT_TYPES.includes('dugun'))
  assert.ok(ANNOUNCEMENT_TYPES.includes('ozel-gun'))
})

test('medya ve reklam görselleri SVG (XSS) kabul etmez', () => {
  const mediaMimes = (Media.upload as { mimeTypes?: string[] })?.mimeTypes ?? []
  const adMimes = (AdImages.upload as { mimeTypes?: string[] })?.mimeTypes ?? []
  assert.ok(!mediaMimes.includes('image/*'))
  assert.ok(!mediaMimes.includes('image/svg+xml'))
  assert.ok(!adMimes.includes('image/*'))
  assert.ok(!adMimes.includes('image/svg+xml'))
  assert.ok(mediaMimes.includes('image/webp'))
})

test('bağlantı doğrulayıcıları javascript: ve data: şemalarını reddeder', () => {
  assert.equal(validateSafeUrl('https://karakocan.net'), true)
  assert.equal(validateSafeUrl('/tr/duyurular'), true)
  assert.equal(validateSafeUrl(''), true)
  assert.notEqual(validateSafeUrl('javascript:alert(1)'), true)
  assert.notEqual(validateSafeUrl('data:text/html,<script>alert(1)</script>'), true)
  assert.notEqual(validateSafeUrl('//evil.com'), true)
  assert.equal(validateSafeUrlOrContact('+90 555 111 22 33'), true)
  assert.notEqual(validateSafeUrlOrContact('javascript:alert(1)'), true)
})

test('yeni türlerin site etiketleri', () => {
  assert.equal(announcementTypeLabel('tr', 'dugun'), 'Düğün')
  assert.equal(announcementTypeLabel('tr', 'ozel-gun'), 'Özel gün')
  assert.equal(announcementTypeLabel('de', 'dugun'), 'Hochzeit')
})

test('özel gün çeşitlerinin etiketleri', () => {
  assert.equal(occasionLabel('tr', 'kina'), 'Kına')
  assert.equal(occasionLabel('en', 'sunnet'), 'Circumcision feast')
})
