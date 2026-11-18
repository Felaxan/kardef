import path from 'path'
import type { CollectionConfig, Endpoint, PayloadRequest } from 'payload'
import { hiddenFromAuthors, isAdminOrEditor } from '../access'

/*
  Ziyaretçilerin arşive katkı formundan gelen gönderiler.
  - Kayıtlar yalnızca sitedeki form üzerinden oluşur (API ile oluşturulamaz).
  - Yalnızca editör ve yönetici görür; yazara görünmez.
  - Dosyalar herkese kapalıdır; "Arşive aktar" taslak arşiv kaydı oluşturur, yayını editör yapar.
*/

const roleOf = (u: unknown) => (u as { role?: string } | null)?.role
const editorOrAdmin = (req: PayloadRequest) => ['admin', 'editor'].includes(roleOf(req.user) ?? '')

/** Gönderen türü → arşiv türü */
const ARCHIVE_TYPE: Record<string, 'photo' | 'audio' | 'video' | 'document'> = {
  photo: 'photo', audio: 'audio', video: 'video', document: 'document', other: 'document',
}

const rich = (text: string) => ({
  root: {
    type: 'root', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const,
    children: text.split(/\n{2,}/).map((p) => ({
      type: 'paragraph', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const, textFormat: 0, textStyle: '',
      children: [{ type: 'text', text: p.trim(), format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    })),
  },
})

/** POST /api/submissions/:id/aktar → tek bir taslak arşiv kaydı */
const convertEndpoint: Endpoint = {
  path: '/:id/aktar',
  method: 'post',
  handler: async (req) => {
    if (!editorOrAdmin(req)) return Response.json({ error: 'Yetkiniz yok' }, { status: 403 })
    const id = req.routeParams?.id as string
    const { payload } = req
    const sub = await payload.findByID({ collection: 'submissions', id, depth: 1, overrideAccess: true })
    if (sub.archiveItem) {
      const existing = typeof sub.archiveItem === 'object' ? sub.archiveItem.id : sub.archiveItem
      return Response.json({ archiveId: existing, already: true })
    }

    // Dosyaları kapalı klasörden medya kütüphanesine kopyala
    const mediaIds: number[] = []
    for (const f of sub.files ?? []) {
      if (!f || typeof f !== 'object' || !f.filename) continue
      const filePath = path.resolve(process.cwd(), 'submissions', f.filename)
      const m = await payload.create({
        collection: 'media',
        data: { alt: sub.description?.slice(0, 120) || f.filename, credit: sub.name },
        filePath,
        overrideAccess: true,
        req,
      })
      mediaIds.push(m.id as number)
    }

    const year = Number(sub.year)
    const title = (sub.description || 'Gönderilen kayıt').split('\n')[0].slice(0, 90)
    const doc = await payload.create({
      collection: 'archive',
      draft: true,
      overrideAccess: true,
      req,
      data: {
        _status: 'draft',
        title,
        type: ARCHIVE_TYPE[sub.kind ?? 'other'] ?? 'document',
        ...(Number.isFinite(year) && year > 1800 ? { year, approximate: false } : {}),
        files: mediaIds,
        ...(sub.link ? { videoUrl: sub.link } : {}),
        description: rich(sub.description || ''),
        village: typeof sub.village === 'object' && sub.village ? sub.village.id : sub.village || undefined,
        donor: sub.name,
        permission: Boolean(sub.consent),
      } as never,
    })

    await payload.update({
      collection: 'submissions', id, overrideAccess: true, req,
      data: { status: 'done', archiveItem: doc.id },
    })
    return Response.json({ archiveId: doc.id })
  },
}

export const SubmissionFiles: CollectionConfig = {
  slug: 'submission-files',
  labels: { singular: 'Gönderi dosyası', plural: 'Gönderi dosyaları' },
  admin: { hidden: true },
  access: { read: isAdminOrEditor, create: () => false, update: () => false, delete: isAdminOrEditor },
  upload: { staticDir: 'submissions', disableLocalStorage: false },
  fields: [],
}

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  labels: { singular: 'Gelen katkı', plural: 'Gelen katkılar' },
  admin: {
    useAsTitle: 'name',
    group: 'İçerik',
    hidden: hiddenFromAuthors,
    defaultColumns: ['name', 'kind', 'status', 'createdAt'],
    description:
      'Ziyaretçilerin "Arşive katkı ver" formuyla gönderdikleri. Dosyalara bakın, uygunsa "Arşive aktar" deyin: taslak arşiv kaydı oluşur, yayınlamadan önce düzenleyebilirsiniz.',
    components: { edit: { beforeDocumentControls: ['/components/admin/ConvertSubmission#ConvertSubmission'] } },
  },
  defaultSort: '-createdAt',
  access: { read: isAdminOrEditor, create: () => false, update: isAdminOrEditor, delete: isAdminOrEditor },
  endpoints: [convertEndpoint],
  fields: [
    {
      name: 'status',
      label: 'Durum',
      type: 'select',
      defaultValue: 'new',
      required: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'Yeni', value: 'new' },
        { label: 'İnceleniyor', value: 'review' },
        { label: 'Arşive aktarıldı', value: 'done' },
        { label: 'Reddedildi', value: 'rejected' },
      ],
    },
    { name: 'note', label: 'Editör notu', type: 'textarea', admin: { position: 'sidebar' } },
    { name: 'archiveItem', label: 'Oluşan arşiv kaydı', type: 'relationship', relationTo: 'archive', admin: { position: 'sidebar', readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Gönderen', type: 'text', required: true, admin: { width: '34%', readOnly: true } },
        { name: 'phone', label: 'Telefon', type: 'text', admin: { width: '33%', readOnly: true } },
        { name: 'email', label: 'E-posta', type: 'text', admin: { width: '33%', readOnly: true } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          label: 'Ne gönderdi?',
          type: 'select',
          admin: { width: '34%', readOnly: true },
          options: [
            { label: 'Fotoğraf', value: 'photo' },
            { label: 'Ses kaydı', value: 'audio' },
            { label: 'Video', value: 'video' },
            { label: 'Belge', value: 'document' },
            { label: 'Diğer', value: 'other' },
          ],
        },
        { name: 'year', label: 'Yaklaşık yılı', type: 'text', admin: { width: '33%', readOnly: true } },
        { name: 'village', label: 'Köy', type: 'relationship', relationTo: 'villages', admin: { width: '33%', readOnly: true } },
      ],
    },
    { name: 'description', label: 'Açıklama', type: 'textarea', required: true, admin: { readOnly: true } },
    { name: 'link', label: 'Bağlantı (video, Drive...)', type: 'text', admin: { readOnly: true } },
    { name: 'files', label: 'Dosyalar', type: 'upload', relationTo: 'submission-files', hasMany: true, admin: { readOnly: true } },
    { name: 'consent', label: 'Yayın izni verdi', type: 'checkbox', admin: { readOnly: true } },
    { name: 'ip', type: 'text', admin: { hidden: true } },
  ],
}
