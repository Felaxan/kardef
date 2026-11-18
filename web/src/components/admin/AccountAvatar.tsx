import React from 'react'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Yönetici',
  editor: 'Editör',
  author: 'Yazar',
}

/** Üst çubuğun sağ köşesindeki kullanıcı rozeti (Payload'un kırık Gravatar resminin yerine) */
export function AccountAvatar({ user }: { user?: { name?: string; email?: string; role?: string } }) {
  const name = user?.name || user?.email || 'Hesabım'
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toLocaleUpperCase('tr'))
      .join('') || 'K'
  const role = user?.role ? ROLE_LABEL[user.role] || user.role : 'Hesap'

  return (
    <span className="kd-account" title={`${name} (${role}) · Hesap ayarları`}>
      <span className="kd-account-initials">{initials}</span>
      <span className="kd-account-dot" aria-hidden="true" />
    </span>
  )
}
