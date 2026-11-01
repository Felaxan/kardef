'use client'
import React, { useState } from 'react'

/** Bülten formu: gönderim altyapısı kurulana kadar "yakında" mesajı gösterir. */
export function NewsletterForm({ labels }: { labels: { ph: string; btn: string; soon: string } }) {
  const [sent, setSent] = useState(false)
  return (
    <>
      <form className="sub" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
        <label htmlFor="mail" className="sr">{labels.ph}</label>
        <input id="mail" type="email" placeholder={labels.ph} required />
        <button type="submit">{labels.btn}</button>
      </form>
      {sent && <p className="sub-msg" role="status">{labels.soon}</p>}
    </>
  )
}
