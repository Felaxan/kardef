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
import { Users } from './collections/Users'
import { Villages } from './collections/Villages'
import { Homepage, SiteSettings } from './globals'
import { DEMO } from './demo'

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
      beforeDashboard: ['/components/admin/Welcome#Welcome'],
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
      { code: 'en', label: 'English' },
      { code: 'de', label: 'Deutsch' },
      { code: 'nl', label: 'Nederlands' },
      { code: 'fr', label: 'Français' },
    ],
    defaultLocale: 'tr',
    fallback: true,
  },

  collections: [Posts, Events, Announcements, ArchiveItems, Villages, Media, Categories, Organizations, Users],
  globals: [Homepage, SiteSettings],
  editor: lexicalEditor(),
  // Maket modunda giriş kapalı olduğu için anahtar zorunlu değil
  secret: process.env.PAYLOAD_SECRET || (DEMO ? 'kardef-maket-salt-okunur' : ''),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },

  // Geliştirmede SQLite. Sunucuda @payloadcms/db-postgres ile PostgreSQL'e geçilecek.
  db: sqliteAdapter({
    client: { url: DEMO ? demoDbUrl() : process.env.DATABASE_URL || 'file:./kardef.db' },
  }),
  sharp,
  plugins: [],
})
