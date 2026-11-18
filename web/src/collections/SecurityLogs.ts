import type { CollectionConfig, Endpoint, PayloadRequest } from 'payload'
import { isAdmin, onlyAdminSees } from '../access'
import { globalShield, redactSensitive } from '../lib/security'
import { createDatabaseBackup, ipFromReq, logSecurityEvent, syncShieldFromSettings } from '../lib/security-server'

/*
  Güvenlik Kayıtları ve Denetim İzi (Audit Log)
  - Yalnızca yöneticiler (admin) görebilir; editör, yazar ve ziyaretçilere tamamen kapalıdır.
  - Kayıtlar API üzerinden oluşturulamaz, düzenlenemez ve silinemez (değiştirilemez denetim izi).
  - Üst bölümdeki Güvenlik Merkezi üzerinden anlık müdahale (IP engelleme, oturum sonlandırma,
    hesap askıya alma, acil koruma modu ve veritabanı yedekleme) yapılır.
*/

const isReqAdmin = (req: PayloadRequest) => (req.user as { role?: string } | null)?.role === 'admin'

/** GET /api/security-logs/durum → Güvenlik Merkezi özet verileri (yalnızca yönetici) */
const statusEndpoint: Endpoint = {
  path: '/durum',
  method: 'get',
  handler: async (req) => {
    if (!isReqAdmin(req)) return Response.json({ error: 'Yetkiniz yok' }, { status: 403 })
    const { payload } = req
    await syncShieldFromSettings(payload)

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const [critical, high, failed24h, totalLogs, usersRes] = await Promise.all([
      payload.count({ collection: 'security-logs' as never, where: { severity: { equals: 'critical' } }, overrideAccess: true }),
      payload.count({ collection: 'security-logs' as never, where: { severity: { equals: 'high' } }, overrideAccess: true }),
      payload.count({
        collection: 'security-logs' as never,
        where: { and: [{ event: { equals: 'login_failed' } }, { createdAt: { greater_than_equal: since24h } }] },
        overrideAccess: true,
      }),
      payload.count({ collection: 'security-logs' as never, overrideAccess: true }),
      payload.find({ collection: 'users', limit: 100, depth: 0, overrideAccess: true }),
    ])

    const users = usersRes.docs.map((u) => {
      const raw = u as unknown as {
        id: number | string
        name: string
        email: string
        role: string
        suspended?: boolean | null
        lockUntil?: string | null
        sessions?: { id: string }[] | null
      }
      return {
        id: raw.id,
        name: raw.name,
        email: raw.email,
        role: raw.role,
        suspended: Boolean(raw.suspended),
        locked: Boolean(raw.lockUntil && new Date(raw.lockUntil).getTime() > Date.now()),
        sessionCount: Array.isArray(raw.sessions) ? raw.sessions.length : 0,
      }
    })

    return Response.json({
      lockdown: globalShield.isLockdown(),
      blockedIps: globalShield.listBlockedIps(),
      counts: {
        critical: critical.totalDocs,
        high: high.totalDocs,
        failed24h: failed24h.totalDocs,
        total: totalLogs.totalDocs,
      },
      users,
    })
  },
}

/** POST /api/security-logs/mudahale → Yönetici güvenlik müdahale aksiyonları */
const actionEndpoint: Endpoint = {
  path: '/mudahale',
  method: 'post',
  handler: async (req) => {
    if (!isReqAdmin(req)) return Response.json({ error: 'Yetkiniz yok' }, { status: 403 })
    const { payload } = req
    const adminUser = req.user as { id: number | string; email?: string }
    const ip = ipFromReq(req)

    let body: Record<string, unknown> = {}
    try {
      body = (await req.json?.()) as Record<string, unknown>
    } catch {
      return Response.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
    }

    const action = String(body.action || '')

    if (action === 'lockdown') {
      const enabled = Boolean(body.enabled)
      globalShield.setLockdown(enabled)
      await payload
        .updateGlobal({
          slug: 'security-settings' as never,
          data: { lockdownMode: enabled } as never,
          overrideAccess: true,
          context: { skipAudit: true },
        })
        .catch(() => {})
      await logSecurityEvent(payload, {
        event: 'lockdown_changed',
        severity: enabled ? 'critical' : 'medium',
        ip,
        userEmail: adminUser.email,
        target: 'global:security-settings',
        summary: `Acil koruma modu (Lockdown) ${adminUser.email || 'yönetici'} tarafından ${enabled ? 'AÇILDI' : 'KAPATILDI'}.`,
      })
      return Response.json({ ok: true, lockdown: enabled })
    }

    if (action === 'block-ip') {
      const targetIp = String(body.ip || '').trim().slice(0, 64)
      const reason = String(body.reason || 'Yönetici tarafından engellendi').trim().slice(0, 160)
      if (!targetIp) return Response.json({ error: 'IP adresi gerekli' }, { status: 400 })
      globalShield.blockIp(targetIp, reason, null)
      const cur = (await payload
        .findGlobal({ slug: 'security-settings' as never, depth: 0, overrideAccess: true })
        .catch(() => ({ blockedIps: [] }))) as { blockedIps?: { ip: string; reason?: string; active?: boolean }[] }
      const list = (cur.blockedIps ?? []).filter((x) => x.ip !== targetIp)
      list.push({ ip: targetIp, reason, active: true })
      await payload
        .updateGlobal({
          slug: 'security-settings' as never,
          data: { blockedIps: list } as never,
          overrideAccess: true,
          context: { skipAudit: true },
        })
        .catch(() => {})
      await logSecurityEvent(payload, {
        event: 'ip_blocked',
        severity: 'high',
        ip,
        userEmail: adminUser.email,
        target: targetIp,
        summary: `${targetIp} IP adresi yönetici (${adminUser.email}) tarafından engellendi: ${reason}`,
      })
      return Response.json({ ok: true })
    }

    if (action === 'unblock-ip') {
      const targetIp = String(body.ip || '').trim()
      globalShield.unblockIp(targetIp)
      const cur = (await payload
        .findGlobal({ slug: 'security-settings' as never, depth: 0, overrideAccess: true })
        .catch(() => ({ blockedIps: [] }))) as { blockedIps?: { ip: string; reason?: string; active?: boolean }[] }
      const list = (cur.blockedIps ?? []).filter((x) => x.ip !== targetIp)
      await payload
        .updateGlobal({
          slug: 'security-settings' as never,
          data: { blockedIps: list } as never,
          overrideAccess: true,
          context: { skipAudit: true },
        })
        .catch(() => {})
      return Response.json({ ok: true })
    }

    if (action === 'revoke-sessions') {
      const userId = body.userId as number | string
      if (!userId) return Response.json({ error: 'Kullanıcı kimliği gerekli' }, { status: 400 })
      const targetUser = await payload.findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true })
      await payload.update({
        collection: 'users',
        id: userId,
        data: { sessions: [] } as never,
        overrideAccess: true,
        context: { skipAudit: true },
      })
      await logSecurityEvent(payload, {
        event: 'session_revoked',
        severity: 'high',
        ip,
        userEmail: adminUser.email,
        target: `users #${userId} (${targetUser.email})`,
        summary: `${targetUser.email} kullanıcısının tüm aktif oturumları yönetici (${adminUser.email}) tarafından sonlandırıldı.`,
      })
      return Response.json({ ok: true })
    }

    if (action === 'toggle-suspend') {
      const userId = body.userId as number | string
      const suspended = Boolean(body.suspended)
      if (!userId) return Response.json({ error: 'Kullanıcı kimliği gerekli' }, { status: 400 })
      if (String(userId) === String(adminUser.id) && suspended) {
        return Response.json({ error: 'Kendi yönetici hesabınızı askıya alamazsınız.' }, { status: 400 })
      }
      const targetUser = await payload.findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true })
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          suspended,
          ...(suspended ? { sessions: [] } : { loginAttempts: 0, lockUntil: null }),
        } as never,
        overrideAccess: true,
        context: { skipAudit: true },
      })
      await logSecurityEvent(payload, {
        event: 'user_suspended',
        severity: suspended ? 'high' : 'medium',
        ip,
        userEmail: adminUser.email,
        target: `users #${userId} (${targetUser.email})`,
        summary: `${targetUser.email} hesabı yönetici (${adminUser.email}) tarafından ${suspended ? 'ASKIYA ALINDI ve oturumları kapatıldı' : 'yeniden kullanıma açıldı'}.`,
      })
      return Response.json({ ok: true, suspended })
    }

    if (action === 'backup') {
      const res = createDatabaseBackup()
      if (!res.ok) return Response.json({ error: res.error }, { status: 500 })
      await logSecurityEvent(payload, {
        event: 'backup_created',
        severity: 'low',
        ip,
        userEmail: adminUser.email,
        target: res.file,
        summary: `Veritabanı yedeği alındı ve bütünlüğü doğrulandı: ${res.file} (${Math.round((res.bytes ?? 0) / 1024)} KB).`,
      })
      return Response.json({ ok: true, file: res.file, bytes: res.bytes })
    }

    return Response.json({ error: 'Bilinmeyen işlem' }, { status: 400 })
  },
}

export const SecurityLogs: CollectionConfig = {
  slug: 'security-logs',
  labels: { singular: 'Güvenlik kaydı', plural: 'Güvenlik merkezi' },
  admin: {
    useAsTitle: 'summary',
    group: 'Güvenlik',
    hidden: onlyAdminSees,
    defaultColumns: ['severity', 'event', 'summary', 'ip', 'userEmail', 'createdAt'],
    listSearchableFields: ['summary', 'ip', 'userEmail', 'target'],
    description:
      'Yalnızca yöneticilere özel güvenlik ve müdahale merkezi. Kayıtlar değiştirilemez ve silinemez; şifre ve oturum anahtarları otomatik maskelenir.',
    components: {
      beforeListTable: ['/components/admin/SecurityCenter#SecurityCenter'],
    },
  },
  defaultSort: '-createdAt',
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  endpoints: [statusEndpoint, actionEndpoint],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.details) {
          data.details = redactSensitive(data.details)
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'severity',
          label: 'Önem derecesi',
          type: 'select',
          required: true,
          defaultValue: 'low',
          index: true,
          admin: { width: '25%', readOnly: true },
          options: [
            { label: 'Düşük (Bilgi)', value: 'low' },
            { label: 'Orta (Uyarı)', value: 'medium' },
            { label: 'Yüksek (Tehdit)', value: 'high' },
            { label: 'Kritik (Acil)', value: 'critical' },
          ],
        },
        {
          name: 'event',
          label: 'Olay türü',
          type: 'select',
          required: true,
          index: true,
          admin: { width: '25%', readOnly: true },
          options: [
            { label: 'Başarısız giriş', value: 'login_failed' },
            { label: 'Başarılı giriş', value: 'login_success' },
            { label: 'Yetkisiz erişim (403)', value: 'unauthorized' },
            { label: 'Hız sınırı aşımı', value: 'rate_limit' },
            { label: 'IP engellendi', value: 'ip_blocked' },
            { label: 'CSRF engellendi', value: 'csrf_blocked' },
            { label: 'Zararlı dosya reddi', value: 'file_rejected' },
            { label: 'Kayıt oluşturma', value: 'audit_create' },
            { label: 'Kayıt güncelleme', value: 'audit_update' },
            { label: 'Kayıt silme', value: 'audit_delete' },
            { label: 'Oturum sonlandırma', value: 'session_revoked' },
            { label: 'Hesap askıya alma', value: 'user_suspended' },
            { label: 'Acil koruma modu', value: 'lockdown_changed' },
            { label: 'Yedekleme', value: 'backup_created' },
          ],
        },
        { name: 'ip', label: 'IP adresi', type: 'text', index: true, admin: { width: '25%', readOnly: true } },
        { name: 'userEmail', label: 'Kullanıcı', type: 'text', index: true, admin: { width: '25%', readOnly: true } },
      ],
    },
    { name: 'target', label: 'Hedef kaynak / Adres', type: 'text', admin: { readOnly: true } },
    { name: 'summary', label: 'Açıklama', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'details', label: 'Teknik ayrıntılar (maskelenmiş)', type: 'json', admin: { readOnly: true } },
  ],
}
