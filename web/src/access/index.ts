import type { Access, CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

/*
  Roller
  - admin  (Yönetici): her şey, kullanıcı ve ayar yönetimi dahil
  - editor (Editör):   tüm içerikleri düzenler, yayınlar, siler
  - author (Yazar):    içerik ekler, yalnızca kendi içeriğini düzenler, yayınlayamaz
*/
export type Role = 'admin' | 'editor' | 'author'

type AnyUser = { id: number | string; role?: Role | null } | null | undefined
const roleOf = (user: unknown) => (user as AnyUser)?.role

export const isAdmin: Access = ({ req: { user } }) => roleOf(user) === 'admin'
export const isAdminOrEditor: Access = ({ req: { user } }) => {
  const r = roleOf(user)
  return r === 'admin' || r === 'editor'
}
export const isLoggedIn: Access = ({ req: { user } }) => Boolean(user)
export const anyone: Access = () => true

/** Ziyaretçiler yalnızca yayınlanmış içeriği görür; giriş yapanlar taslakları da. */
export const publishedOrLoggedIn: Access = ({ req: { user } }) =>
  user ? true : { _status: { equals: 'published' } }

/** Editör ve yönetici her şeyi; yazar yalnızca kendi eklediğini düzenler. */
export const editorsOrOwn: Access = ({ req: { user } }) => {
  if (!user) return false
  const r = roleOf(user)
  if (r === 'admin' || r === 'editor') return true
  return { createdBy: { equals: (user as { id: number | string }).id } }
}

/* ---------- Menüde görünürlük ---------- */
// Payload'da admin.hidden "true" dönerse bölüm menüden ve ana sayfadan gizlenir.
type HiddenArgs = { user: unknown }
/** Yalnızca yönetici görür (kullanıcılar, site ayarları...). */
export const onlyAdminSees = ({ user }: HiddenArgs) => roleOf(user) !== 'admin'
/** Yönetici ve editör görür; yazardan gizlenir (kategoriler, kurumlar, ana sayfa ayarı). */
export const hiddenFromAuthors = ({ user }: HiddenArgs) => roleOf(user) === 'author'

/** İçerik koleksiyonları için standart izinler. */
export const contentAccess = {
  read: publishedOrLoggedIn,
  create: isLoggedIn,
  update: editorsOrOwn,
  delete: isAdminOrEditor,
}

/** Yeni kayıtta "Ekleyen" alanını doldurur. */
export const setCreatedBy: CollectionBeforeChangeHook = ({ req, operation, data }) => {
  if (operation === 'create' && req.user && !data.createdBy) data.createdBy = req.user.id
  return data
}

/** Yazarlar yayınlayamaz: taslak kaydeder, editör yayınlar. */
export const authorsCannotPublish: CollectionBeforeChangeHook = ({ req, data }) => {
  if (roleOf(req.user) === 'author' && data?._status === 'published') {
    throw new APIError(
      'Yazarlar içerik yayınlayamaz. "Taslak olarak kaydet" deyin; bir editör kontrol edip yayınlayacak.',
      403,
      null,
      true,
    )
  }
  return data
}
