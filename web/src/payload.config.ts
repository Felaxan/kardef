import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import { nl } from '@payloadcms/translations/languages/nl'
import { tr } from '@payloadcms/translations/languages/tr'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Announcements } from './collections/Announcements'
import { ArchiveItems } from './collections/ArchiveItems'
import { Categories } from './collections/Categories'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { Organizations } from './collections/Organizations'
import { Posts } from './collections/Posts'
import { AdImages, AdSlots } from './collections/AdSlots'
import { SecurityLogs } from './collections/SecurityLogs'
import { SubmissionFiles, Submissions } from './collections/Submissions'
import { Users } from './collections/Users'
import { Villages } from './collections/Villages'
import { Homepage, SiteSettings } from './globals'
import { Live } from './globals/Live'
import { SecuritySettings } from './globals/SecuritySettings'
import { DEMO } from './demo'
import { globalShield, resolvePayloadSecret } from './lib/security'
import { ipFromReq, logSecurityEvent, syncShieldFromSettings } from './lib/security-server'
import { withAutoTranslate, withAutoTranslateGlobal } from './translate/fields'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Maket modunda veritabanı kopyası yazılabilir /tmp klasörüne alınır */
function demoDbUrl(): string {
  const src = path.join(process.cwd(), 'demo', 'kardef-demo.db')
  const dest = path.join(os.tmpdir(), 'kardef-demo.db')
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest)
  return `file:${dest}`
}

export default buildConfig({
  // Maket modunda boş: resim adresleri göreli olur, her alan adında çalışır
  serverURL: DEMO ? '' : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    suppressHydrationWarning: true,
    avatar: { Component: '/components/admin/AccountAvatar#AccountAvatar' },
    importMap: { baseDir: path.resolve(dirname) },
    dateFormat: 'd MMMM yyyy, HH:mm',
    meta: {
      titleSuffix: ' · KAR-DEF Panel',
      icons: [{ rel: 'icon', type: 'image/png', url: '/brand/kar-def-logo.png' }],
    },
    components: {
      graphics: {
        Logo: '/components/admin/Logo#Logo',
        Icon: '/components/admin/Icon#Icon',
      },
      views: { dashboard: { Component: '/components/admin/dashboard/Dashboard#Dashboard' } },
      beforeNavLinks: ['/components/admin/SubmissionCount#SubmissionCount'],
      beforeLogin: ['/components/admin/LoginArt#LoginArt'],
      actions: ['/components/admin/ThemeToggle#ThemeToggle'],
    },
  },

  // Panelin arayüz dili (Kurmancî için Payload çevirisi yok)
  i18n: {
    fallbackLanguage: 'tr',
    supportedLanguages: { tr, en, de, nl, fr },
  },

  // İçeriklerin yazılabildiği diller
  localization: {
    locales: [
      { code: 'tr', label: 'Türkçe' },
      { code: 'ku', label: 'Kurdî' },
      { code: 'zza', label: 'Kirmanckî (Zazakî)' },
      { code: 'en', label: 'English' },
      { code: 'de', label: 'Deutsch' },
      { code: 'nl', label: 'Nederlands' },
      { code: 'fr', label: 'Français' },
    ],
    defaultLocale: 'tr',
    fallback: true,
  },

  // Türkçe içerik yayınlanınca diğer dillere otomatik çeviri (src/translate)
  collections: [Posts, Events, Announcements, ArchiveItems, Villages, Media, Categories, Organizations, Submissions, SubmissionFiles, AdSlots, AdImages, Users, SecurityLogs].map(withAutoTranslate),
  globals: [Homepage, SiteSettings, Live, SecuritySettings].map(withAutoTranslateGlobal),
  editor: lexicalEditor(),
  graphQL: {
    disablePlaygroundInProduction: true,
    disable: true,
  },
  onInit: async (payload) => {
    await syncShieldFromSettings(payload)
  },
  hooks: {
    afterError: [
      async ({ error, req, collection }) => {
        const status = (error as { status?: number })?.status
        const name = (error as { name?: string })?.name || ''
        const ip = ipFromReq(req)
        const pathUrl = req?.url || collection?.slug || 'api'

        // Başarısız giriş denemesi: kademeli gecikme + otomatik IP engelleme + loglama
        if (
          status === 401 ||
          /Authentication|InvalidLogin|LockedAuth/i.test(name) ||
          (collection?.slug === 'users' && String(pathUrl).includes('login'))
        ) {
          const { attempts, autoBanned, delayMs } = globalShield.recordFailedLogin(ip)
          await new Promise((r) => setTimeout(r, delayMs))
          if (req?.payload) {
            await logSecurityEvent(req.payload, {
              event: autoBanned ? 'ip_blocked' : 'login_failed',
              severity: autoBanned ? 'critical' : attempts >= 3 ? 'high' : 'medium',
              ip,
              target: 'POST /api/users/login',
              summary: autoBanned
                ? `${ip} adresi ${attempts} başarısız giriş denemesi sonrası 30 dakika otomatik engellendi.`
                : `Başarısız yönetim paneli giriş denemesi (#${attempts}).`,
            })
          }
        } else if (status === 403 && req?.payload) {
          const u = req.user as { email?: string; role?: string } | null
          await logSecurityEvent(req.payload, {
            event: 'unauthorized',
            severity: 'medium',
            ip,
            userEmail: u?.email,
            target: `${collection?.slug || 'api'} (${pathUrl})`,
            summary: `Yetkisiz erişim denemesi (403) engellendi: ${collection?.slug || pathUrl}`,
          })
        }
      },
    ],
  },
  // Maket modunda giriş kapalı; canlı ortamda güçlü PAYLOAD_SECRET zorunlu
  secret: resolvePayloadSecret(process.env, DEMO),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },

  // Geliştirmede SQLite. Sunucuda @payloadcms/db-postgres ile PostgreSQL'e geçilecek.
  db: sqliteAdapter({
    client: { url: DEMO ? demoDbUrl() : process.env.DATABASE_URL || 'file:./kardef.db' },
  }),
  sharp,
  plugins: [],
})
