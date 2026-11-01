import Link from 'next/link'
import React from 'react'

/* Bulunamayan sayfa (dil bilgisi burada olmadığından metinler Türkçe + İngilizce) */
export default function NotFound() {
  return (
    <div className="wrap article page-enter" style={{ minHeight: '50vh' }}>
      <header className="art-head">
        <span className="kicker">404</span>
        <h1>Aradığınız sayfa bulunamadı.</h1>
        <p className="dek">The page you are looking for could not be found.</p>
      </header>
      <p style={{ marginTop: 24 }}>
        <Link href="/" className="btn btn-brand"><span>Ana sayfa · Home</span></Link>
      </p>
    </div>
  )
}
