import React from 'react'

/*
  Giriş ekranı: solda tam yükseklikte Karakoçan fotoğrafı (yavaşça yakınlaşır),
  formun üstünde kısa bir başlık. Fotoğraf panelinin yerini CSS belirler.
*/
export const LoginArt = () => (
  <>
    <aside className="kd-login-art" aria-hidden="true">
      <img className="kd-login-photo" src="/brand/login.jpg" alt="" />
      <div className="kd-login-top">
        <span className="kd-login-seals">
          <img src="/brand/kar-def-logo.png" alt="" />
          <img src="/brand/av-kardep-logo.png" alt="" />
        </span>
        <span>KAR-DEF · AV-KARDEP</span>
      </div>
      <div className="kd-login-copy">
        <p className="kd-login-kicker">Haber ve Arşiv Platformu</p>
        <p className="kd-login-title">Memleketin haberleri ve hafızası, tek yerde.</p>
        <p className="kd-login-credit">Fotoğraf: Karakoçan saat kulesi · LoqaT, CC BY-SA 4.0</p>
      </div>
    </aside>
    <header className="kd-login-head">
      <h1>Giriş yap</h1>
      <p>Haber, duyuru ve arşiv kayıtlarını yönetmek için e-posta adresinizle girin.</p>
    </header>
  </>
)
