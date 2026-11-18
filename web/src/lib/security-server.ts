/*
  Sunucu tarafı güvenlik kayıtçısı, denetim izi (Audit Log) kancaları,
  oturum sonlandırma, yedekleme ve acil müdahale işlemleri.
*/
import fs from 'fs'
import path from 'path'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook, Payload, PayloadRequest } from 'payload'
import { clientIp } from './submission'
import {
  globalShield,
  redactSensitive,
  type SecurityEventType,
  type SecuritySeverity,
} from './security'

export type LogEventInput = {
  event: SecurityEventType
  severity: SecuritySeverity
  ip?: string
  userEmail?: string | null
  target?: string
  summary: string
  details?: Record<string, unknown>
}

export function ipFromReq(req?: PayloadRequest): string {
  if (!req?.headers) return 'bilinmiyor'
  return clientIp(req.headers, process.env.TRUSTED_IP_HEADER)
}

/**
  Güvenlik olayını veritabanına (security-logs) kaydeder ve kritik olaylarda
  tanımlıysa yönetici bildirim webhook'unu tetikler.
  Hassas veriler (şifre, token, çerez) yazılmadan önce maskelenir.
*/
export async function logSecurityEvent(payload: Payload, input: LogEventInput): Promise<void> {
  try {
    const cleanDetails = input.details ? (redactSensitive(input.details) as Record<string, unknown>) : undefined
    await payload.create({
      collection: 'security-logs' as never,
      overrideAccess: true,
      data: {
        event: input.event,
        severity: input.severity,
        ip: input.ip || 'bilinmiyor',
        userEmail: input.userEmail || undefined,
        target: input.target || undefined,
        summary: input.summary.slice(0, 300),
        details: cleanDetails,
      } as never,
    })

    if (input.severity === 'critical' || input.severity === 'high') {
      notifySecurityWebhook(payload, input).catch(() => {})
    }
  } catch (e) {
    payload.logger.warn({ err: e }, 'Güvenlik kaydı yazılamadı')
  }
}

async function notifySecurityWebhook(payload: Payload, input: LogEventInput) {
  const settings = (await payload
    .findGlobal({ slug: 'security-settings' as never, depth: 0, overrideAccess: true })
    .catch(() => null)) as { alertWebhookUrl?: string | null } | null
  const url = settings?.alertWebhookUrl?.trim()
  if (!url || !/^https:\/\//i.test(url)) return

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `[KAR-DEF GÜVENLİK ALARMI · ${input.severity.toUpperCase()}] ${input.summary} (IP: ${input.ip ?? 'bilinmiyor'}, Hedef: ${input.target ?? '-'})`,
      event: input.event,
      severity: input.severity,
      ip: input.ip,
      target: input.target,
      summary: input.summary,
      at: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(5000),
  })
}

/**
  Veritabanındaki güvenlik ayarlarını (engelli IP'ler ve acil koruma modu)
  bellek içi globalShield ile eşitler.
*/
export async function syncShieldFromSettings(payload: Payload): Promise<void> {
  try {
    const settings = (await payload.findGlobal({
      slug: 'security-settings' as never,
      depth: 0,
      overrideAccess: true,
    })) as {
      lockdownMode?: boolean | null
      blockedIps?: { ip?: string; reason?: string | null; active?: boolean | null }[] | null
    } | null
    if (!settings) return
    globalShield.setLockdown(Boolean(settings.lockdownMode))
    for (const item of settings.blockedIps ?? []) {
      if (item.ip && item.active !== false) {
        globalShield.blockIp(item.ip, item.reason || 'Yönetici tarafından engellendi', null)
      }
    }
  } catch {
    // İlk kurulumda tablo henüz yoksa sessizce geç
  }
}

/** Kritik koleksiyonlarda oluşturma ve güncelleme işlemlerini denetim izine (Audit Log) yazar. */
export const auditCollectionChange =
  (slug: string): CollectionAfterChangeHook =>
  async ({ doc, operation, req, context }) => {
    if (context?.skipAudit || context?.skipTranslate || !req?.user) return doc
    // 3 saniyede bir çalışan otomatik taslak kaydı (autosave) denetim izini şişirmesin ve SQLite kilidi oluşturmasın
    const isAutosave =
      req.url?.includes('autosave=true') ||
      (req.query as { autosave?: string | boolean } | undefined)?.autosave === 'true' ||
      (req.query as { autosave?: string | boolean } | undefined)?.autosave === true
    if (isAutosave && operation === 'update') return doc
    const user = req.user as { email?: string; role?: string }
    const title = (doc as { title?: string; name?: string; email?: string })?.title ||
      (doc as { name?: string })?.name ||
      (doc as { email?: string })?.email ||
      `#${(doc as { id?: string | number })?.id}`
    const isCreate = operation === 'create'
    void logSecurityEvent(req.payload, {
      event: isCreate ? 'audit_create' : 'audit_update',
      severity: slug === 'users' || slug === 'ad-slots' ? 'medium' : 'low',
      ip: ipFromReq(req),
      userEmail: user.email,
      target: `${slug} #${(doc as { id?: string | number })?.id}`,
      summary: `${user.email || 'Kullanıcı'} (${user.role || 'üye'}) ${slug} bölümünde "${String(title).slice(0, 60)}" kaydını ${isCreate ? 'oluşturdu' : 'güncelledi'}.`,
    })
    return doc
  }

/** Kritik koleksiyonlarda silme işlemlerini denetim izine (Audit Log) yazar. */
export const auditCollectionDelete =
  (slug: string): CollectionAfterDeleteHook =>
  async ({ doc, id, req }) => {
    if (!req?.user) return doc
    const user = req.user as { email?: string; role?: string }
    const title = (doc as { title?: string; name?: string; email?: string })?.title ||
      (doc as { name?: string })?.name ||
      (doc as { email?: string })?.email ||
      `#${id}`
    void logSecurityEvent(req.payload, {
      event: 'audit_delete',
      severity: 'medium',
      ip: ipFromReq(req),
      userEmail: user.email,
      target: `${slug} #${id}`,
      summary: `${user.email || 'Kullanıcı'} (${user.role || 'üye'}) ${slug} bölümünden "${String(title).slice(0, 60)}" kaydını sildi.`,
    })
    return doc
  }

/** Kritik genel ayar değişikliklerini denetim izine yazar. */
export const auditGlobalChange =
  (slug: string): GlobalAfterChangeHook =>
  async ({ doc, req, context }) => {
    if (context?.skipAudit || context?.skipTranslate || !req?.user) return doc
    const user = req.user as { email?: string; role?: string }
    void logSecurityEvent(req.payload, {
      event: 'audit_update',
      severity: slug === 'security-settings' || slug === 'site-settings' ? 'medium' : 'low',
      ip: ipFromReq(req),
      userEmail: user.email,
      target: `global:${slug}`,
      summary: `${user.email || 'Yönetici'} "${slug}" genel ayarlarını güncelledi.`,
    })
    return doc
  }

/**
  Veritabanının (kardef.db) zaman damgalı ve bütünlüğü doğrulanmış yedeğini
  `backups/` klasörüne alır.
*/
export function createDatabaseBackup(): { ok: boolean; file?: string; bytes?: number; error?: string } {
  try {
    const dbUrl = process.env.DATABASE_URL || 'file:./kardef.db'
    const relPath = dbUrl.replace(/^file:/, '')
    const src = path.resolve(process.cwd(), relPath)
    if (!fs.existsSync(src)) {
      return { ok: false, error: 'Kaynak veritabanı dosyası bulunamadı.' }
    }
    const backupDir = path.resolve(process.cwd(), 'backups')
    fs.mkdirSync(backupDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const fileName = `kardef-backup-${stamp}.db`
    const dest = path.join(backupDir, fileName)
    fs.copyFileSync(src, dest)
    const stat = fs.statSync(dest)
    // Yedek dosyasının SQLite başlığını ("SQLite format 3\0") doğrula
    const fd = fs.openSync(dest, 'r')
    const header = Buffer.alloc(16)
    fs.readSync(fd, header, 0, 16, 0)
    fs.closeSync(fd)
    if (!header.toString('utf8').startsWith('SQLite format 3')) {
      fs.unlinkSync(dest)
      return { ok: false, error: 'Yedek bütünlük doğrulaması başarısız oldu.' }
    }
    return { ok: true, file: fileName, bytes: stat.size }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Yedekleme hatası' }
  }
}
