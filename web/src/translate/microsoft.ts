/*
  Microsoft Translator (Azure AI Translator) istemcisi
  Ücretsiz paket (F0): ayda 2 milyon karakter. Kota dolunca çeviri durur, ücret çıkmaz.
  .env: AZURE_TRANSLATOR_KEY, AZURE_TRANSLATOR_REGION (ör. westeurope)
*/
const ENDPOINT = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=tr&textType=html'

/** Bir istekte gönderilen Türkçe metin sınırı (hedef dil sayısıyla çarpılınca 50.000 sınırının altında kalsın) */
const MAX_CHARS = 9000
const MAX_ITEMS = 100

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Deneme modu: servise gitmeden metne dil etiketi ekler (TRANSLATOR_MOCK=1) */
function mock(html: string, to: string) {
  return /<[^>]+>/.test(html) ? html.replace(/>([^<]+)</g, (_, s) => `>${s}·${to}<`) : `${html}·${to}`
}

async function call(texts: string[], to: string[]): Promise<Record<string, string[]>> {
  if (process.env.TRANSLATOR_MOCK === '1') {
    return Object.fromEntries(to.map((l) => [l, texts.map((t) => mock(t, l))]))
  }
  const key = process.env.AZURE_TRANSLATOR_KEY
  if (!key) throw new Error('AZURE_TRANSLATOR_KEY tanımlı değil')
  const url = ENDPOINT + to.map((l) => `&to=${l}`).join('')
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        ...(process.env.AZURE_TRANSLATOR_REGION ? { 'Ocp-Apim-Subscription-Region': process.env.AZURE_TRANSLATOR_REGION } : {}),
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(texts.map((Text) => ({ Text }))),
    })
    if (res.status === 429 && attempt < 4) {
      // Ücretsiz pakette dakikalık sınır: biraz bekleyip tekrar dene
      await sleep((Number(res.headers.get('retry-after')) || 10) * 1000)
      continue
    }
    if (!res.ok) throw new Error(`Microsoft Translator ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const json = (await res.json()) as { translations: { text: string; to: string }[] }[]
    const out: Record<string, string[]> = Object.fromEntries(to.map((l) => [l, [] as string[]]))
    for (const item of json) for (const tr of item.translations) out[tr.to]?.push(tr.text)
    return out
  }
}

/** Türkçe HTML parçalarını verilen dillere çevirir; büyük içerikleri sınırlara göre böler */
export async function translateHtml(texts: string[], to: string[]): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = Object.fromEntries(to.map((l) => [l, [] as string[]]))
  let batch: string[] = []
  let size = 0
  const flush = async () => {
    if (!batch.length) return
    const res = await call(batch, to)
    for (const l of to) out[l].push(...res[l])
    batch = []
    size = 0
  }
  for (const t of texts) {
    if (batch.length && (size + t.length > MAX_CHARS || batch.length >= MAX_ITEMS)) await flush()
    batch.push(t)
    size += t.length
  }
  await flush()
  return out
}
