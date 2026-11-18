import assert from 'node:assert/strict'
import { test } from 'node:test'
import { youTubeId } from './youtube'

test('YouTube bağlantılarının her biçiminden kimlik çıkar', () => {
  const id = 'abcdefghijk'
  for (const url of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?t=10`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/live/${id}?si=x`,
    `https://m.youtube.com/watch?feature=share&v=${id}`,
  ]) assert.equal(youTubeId(url), id, url)
})

test('geçersiz bağlantı null döner', () => {
  assert.equal(youTubeId(''), null)
  assert.equal(youTubeId(null), null)
  assert.equal(youTubeId('https://example.com/video'), null)
})
