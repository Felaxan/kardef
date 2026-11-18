'use client'
import { useAuth } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

type BlockedIp = { ip: string; reason: string; expiresAt: number | null; createdAt: number }
type SecUser = {
  id: number | string
  name: string
  email: string
  role: string
  suspended: boolean
  locked: boolean
  sessionCount: number
}
type StatusData = {
  lockdown: boolean
  blockedIps: BlockedIp[]
  counts: { critical: number; high: number; failed24h: number; total: number }
  users: SecUser[]
}

const ROLE_TR: Record<string, string> = { admin: 'Yönetici', editor: 'Editör', author: 'Yazar' }

/**
  Yönetici Paneli — Gizli Güvenlik ve Müdahale Merkezi
  Güvenlik kayıtları sayfasının üstünde çalışır:
  - Acil Koruma Modu (Lockdown) açma/kapatma
  - Şüpheli IP engelleme ve engeli kaldırma
  - Kullanıcı oturumlarını anında sonlandırma ve hesabı askıya alma
  - Bütünlüğü doğrulanmış veritabanı yedeği alma
*/
export const SecurityCenter = () => {
  const { user } = useAuth<{ role?: string }>()
  const [data, setData] = useState<StatusData | null>(null)
  const [ipInput, setIpInput] = useState('')
  const [reasonInput, setReasonInput] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; tone: 'ok' | 'err' } | null>(null)

  const load = useCallback(() => {
    fetch('/api/security-logs/durum', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: StatusData | null) => {
        if (d) setData(d)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin') return
    const id = window.setTimeout(load, 0)
    return () => window.clearTimeout(id)
  }, [user?.role, load])

  if (user?.role !== 'admin' || !data) return null

  const runAction = async (key: string, payload: Record<string, unknown>, okText?: string) => {
    setBusy(key)
    setMsg(null)
    try {
      const r = await fetch('/api/security-logs/mudahale', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const res = (await r.json()) as { ok?: boolean; error?: string; file?: string }
      if (!r.ok || !res.ok) {
        setMsg({ text: res.error || 'İşlem gerçekleştirilemedi.', tone: 'err' })
      } else {
        setMsg({ text: res.file ? `Yedek oluşturuldu: ${res.file}` : okText || 'İşlem uygulandı.', tone: 'ok' })
        load()
      }
    } catch {
      setMsg({ text: 'Sunucu bağlantı hatası.', tone: 'err' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="kd-sec" aria-label="Güvenlik ve Müdahale Merkezi">
      {/* Özet ve Acil Müdahale Çubuğu */}
      <div className={`kd-sec-banner${data.lockdown ? ' is-lockdown' : ''}`}>
        <div className="kd-sec-banner-info">
          <div className="kd-sec-banner-head">
            <span className={`kd-sec-dot${data.lockdown ? ' is-alert' : ''}`} />
            <strong>
              {data.lockdown ? 'ACİL KORUMA MODU AÇIK (Salt Okunur)' : 'Proaktif Güvenlik Kalkanı Etkin'}
            </strong>
          </div>
          <div className="kd-sec-metrics">
            <span>Kritik olay: <b>{data.counts.critical}</b></span>
            <span>Yüksek tehdit: <b>{data.counts.high}</b></span>
            <span>Son 24s başarısız giriş: <b>{data.counts.failed24h}</b></span>
            <span>Engelli IP: <b>{data.blockedIps.length}</b></span>
          </div>
        </div>
        <div className="kd-sec-banner-actions">
          <button
            type="button"
            className="kd-sec-btn kd-sec-btn--ghost"
            disabled={busy !== null}
            onClick={() => runAction('backup', { action: 'backup' })}
          >
            {busy === 'backup' ? 'Yedekleniyor…' : 'Veritabanı Yedeği Al'}
          </button>
          <button
            type="button"
            className={`kd-sec-btn ${data.lockdown ? 'kd-sec-btn--safe' : 'kd-sec-btn--danger'}`}
            disabled={busy !== null}
            onClick={() =>
              runAction(
                'lockdown',
                { action: 'lockdown', enabled: !data.lockdown },
                data.lockdown ? 'Acil koruma modu kapatıldı.' : 'Acil koruma modu etkinleştirildi.',
              )
            }
          >
            {data.lockdown ? 'Koruma Modunu Kapat' : 'Acil Korumaya Al (Lockdown)'}
          </button>
        </div>
      </div>

      {msg && (
        <p role="status" className={`kd-sec-toast is-${msg.tone}`}>
          {msg.text}
        </p>
      )}

      <div className="kd-sec-grid">
        {/* IP Engelleme Bölümü */}
        <div className="kd-sec-card">
          <h3 className="kd-sec-title">Şüpheli IP Engelleme</h3>
          <form
            className="kd-sec-form"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!ipInput.trim() || busy !== null) return
              await runAction('block-ip', { action: 'block-ip', ip: ipInput, reason: reasonInput || 'Şüpheli işlem' }, 'IP engellendi.')
              setIpInput('')
              setReasonInput('')
            }}
          >
            <input
              type="text"
              className="kd-sec-input"
              placeholder="IP adresi (ör. 203.0.113.5)"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
            />
            <input
              type="text"
              className="kd-sec-input"
              placeholder="Neden (isteğe bağlı)"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
            />
            <button
              type="submit"
              className="kd-sec-btn kd-sec-btn--danger"
              disabled={!ipInput.trim() || busy !== null}
            >
              Engelle
            </button>
          </form>
          {data.blockedIps.length === 0 ? (
            <p className="kd-sec-empty">Şu an engellenmiş IP adresi yok.</p>
          ) : (
            <ul className="kd-sec-list">
              {data.blockedIps.map((b) => (
                <li key={b.ip} className="kd-sec-row">
                  <div className="kd-sec-row-main">
                    <b>{b.ip}</b>
                    <small>{b.reason}</small>
                  </div>
                  <button
                    type="button"
                    className="kd-sec-btn kd-sec-btn--sm"
                    disabled={busy !== null}
                    onClick={() => runAction(`unblock-${b.ip}`, { action: 'unblock-ip', ip: b.ip }, `${b.ip} engeli kaldırıldı.`)}
                  >
                    Engeli Kaldır
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Oturum ve Hesap Müdahale Bölümü */}
        <div className="kd-sec-card">
          <h3 className="kd-sec-title">Kullanıcı Oturumları ve Hesap Durumu</h3>
          <ul className="kd-sec-list">
            {data.users.map((u) => (
              <li key={String(u.id)} className="kd-sec-row">
                <div className="kd-sec-row-main">
                  <div className="kd-sec-user">
                    <b>{u.name}</b>
                    <span className="kd-sec-badge">{ROLE_TR[u.role] || u.role}</span>
                    {u.suspended && <span className="kd-sec-badge is-danger">Askıya alındı</span>}
                    {u.locked && <span className="kd-sec-badge is-warn">Kilitli</span>}
                  </div>
                  <small>
                    {u.email} · Aktif oturum: <b>{u.sessionCount}</b>
                  </small>
                </div>
                <div className="kd-sec-row-actions">
                  {u.sessionCount > 0 && (
                    <button
                      type="button"
                      className="kd-sec-btn kd-sec-btn--sm"
                      disabled={busy !== null}
                      onClick={() =>
                        runAction(`rev-${u.id}`, { action: 'revoke-sessions', userId: u.id }, `${u.email} oturumları kapatıldı.`)
                      }
                    >
                      Oturumu Kapat
                    </button>
                  )}
                  <button
                    type="button"
                    className={`kd-sec-btn kd-sec-btn--sm ${u.suspended ? 'kd-sec-btn--safe' : ''}`}
                    disabled={busy !== null}
                    onClick={() =>
                      runAction(
                        `sus-${u.id}`,
                        { action: 'toggle-suspend', userId: u.id, suspended: !u.suspended },
                        `${u.email} ${!u.suspended ? 'askıya alındı.' : 'etkinleştirildi.'}`,
                      )
                    }
                  >
                    {u.suspended ? 'Hesabı Aç' : 'Askıya Al'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
