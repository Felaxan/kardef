import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import { nl } from '@payloadcms/translations/languages/nl'
import { tr } from '@payloadcms/translations/languages/tr'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
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
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },

  // Geliştirmede SQLite. Sunucuda @payloadcms/db-postgres ile PostgreSQL'e geçilecek.
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URL || 'file:./kardef.db' },
  }),
  sharp,
  plugins: [],
})
