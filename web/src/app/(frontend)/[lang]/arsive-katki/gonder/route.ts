import { DEMO } from '@/demo'
import { cms } from '@/lib/cms'
import { createRateLimiter, SUBMISSION_KINDS, validateSubmission, type FileInfo } from '@/lib/submission'

/*
  Arşive katkı formu gönderimi (ziyaretçi).
  Kayıt yalnızca burada, sunucuda oluşur; gelen her şey editör onayını bekler.
*/

const limit = createRateLimiter(5, 60 * 60 * 1000)

const clientIp = (req: Request) =>
  req.headers.get('cf-connecting-ip') ||
  req.headers.get('x-real-ip') ||
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  'yerel'

async function turnstileOk(token: string | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET
  if (!secret) return true // anahtar yoksa (geliştirme) atlanır
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    })
    const data = (await res.json()) as { success?: boolean }
    return Boolean(data.success)
  } catch {
    return false
  }
}

const str = (v: FormDataEntryValue | null, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: Request) {
  if (DEMO) return Response.json({ ok: false, errors: ['demo'] }, { status: 403 })

  const ip = clientIp(req)
  if (!limit(ip, Date.now())) return Response.json({ ok: false, errors: ['rate'] }, { status: 429 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ ok: false, errors: ['form'] }, { status: 400 })
  }

  // Bal tuzağı: insanlar bu gizli alanı görmez; dolduysa robot. Sessizce "tamam" de.
  if (str(form.get('website'))) return Response.json({ ok: true })

  if (!(await turnstileOk(str(form.get('cf-turnstile-response'), 4000) || null, ip))) {
    return Response.json({ ok: false, errors: ['captcha'] }, { status: 400 })
  }

  const fields = {
    name: str(form.get('name'), 120),
    phone: str(form.get('phone'), 40),
    email: str(form.get('email'), 160),
    description: str(form.get('description'), 4000),
    link: str(form.get('link'), 500),
    year: str(form.get('year'), 20),
    kind: str(form.get('kind'), 20),
    village: str(form.get('village'), 20),
    consent: str(form.get('consent'), 10),
  }
  const files = form.getAll('files').filter((f): f is File => typeof f === 'object' && f !== null && 'size' in f && f.size > 0)
  const infos: FileInfo[] = files.map((f) => ({ name: f.name, type: f.type, size: f.size }))

  const v = validateSubmission(fields, infos)
  if (!v.ok) return Response.json({ ok: false, errors: v.errors }, { status: 400 })

  const payload = await cms()
  const villageId = Number(fields.village)
  const village =
    Number.isInteger(villageId) && villageId > 0
      ? (await payload.find({ collection: 'villages', where: { id: { equals: villageId } }, limit: 1, depth: 0 })).docs[0]
      : undefined

  try {
    const fileIds: (number | string)[] = []
    for (const f of files) {
      const doc = await payload.create({
        collection: 'submission-files',
        data: {},
        file: { data: Buffer.from(await f.arrayBuffer()), mimetype: f.type, name: f.name, size: f.size },
        overrideAccess: true,
      })
      fileIds.push(doc.id)
    }
    await payload.create({
      collection: 'submissions',
      overrideAccess: true,
      data: {
        status: 'new',
        name: fields.name,
        phone: fields.phone || undefined,
        email: fields.email || undefined,
        kind: (SUBMISSION_KINDS as readonly string[]).includes(fields.kind) ? (fields.kind as never) : 'other',
        year: fields.year || undefined,
        village: village?.id,
        description: fields.description,
        link: fields.link || undefined,
        files: fileIds as number[],
        consent: true,
        ip,
      },
    })
  } catch (e) {
    payload.logger.error({ err: e }, 'Arşiv katkısı kaydedilemedi')
    return Response.json({ ok: false, errors: ['server'] }, { status: 500 })
  }

  return Response.json({ ok: true })
}
