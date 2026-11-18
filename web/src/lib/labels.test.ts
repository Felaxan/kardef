import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Announcements } from '../collections/Announcements'
import { announcementTypeLabel, occasionLabel } from './labels'

test('duyuru türlerinde Düğün ve Özel gün var', () => {
  const type = Announcements.fields.find((f) => 'name' in f && f.name === 'type') as { options: { value: string }[] }
  const values = type.options.map((o) => o.value)
  assert.ok(values.includes('dugun'))
  assert.ok(values.includes('ozel-gun'))
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
