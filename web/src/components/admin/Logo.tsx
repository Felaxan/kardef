import React from 'react'

/** Giriş / şifre sıfırlama ekranlarındaki küçük marka satırı */
export const Logo = () => (
  <div className="kd-logo">
    <span className="kd-seals">
      <img src="/brand/kar-def-logo.png" alt="KAR-DEF" />
      <img src="/brand/av-kardep-logo.png" alt="AV-KARDEP" />
    </span>
    <span className="kd-logo-text">
      <b>KAR-DEF</b>
      <small>Yönetim paneli</small>
    </span>
  </div>
)
