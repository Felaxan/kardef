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
  const [msg, setMsg] = useState<string | null>(null)

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
        setMsg(res.error || 'İşlem gerçekleştirilemedi.')
      } else {
        setMsg(res.file ? `Yedek oluşturuldu: ${res.file}` : okText || 'İşlem uygulandı.')
        load()
      }
    } catch {
      setMsg('Sunucu bağlantı hatası.')
    } finally {
      setBusy(null)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--theme-elevation-50)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 10,
    padding: '16px 18px',
    marginBottom: 18,
  }

  return (
    <section style={{ marginBottom: 24 }} aria-label="Güvenlik ve Müdahale Merkezi">
      {/* Özet ve Acil Müdahale Çubuğu */}
      <div
        style={{
          ...cardStyle,
          borderColor: data.lockdown ? '#c8161d' : 'var(--theme-elevation-150)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>
            {data.lockdown ? '🚨 ACİL KORUMA MODU AÇIK (Salt Okunur)' : '🛡️ Proaktif Güvenlik Kalkanı Etkin'}
          </strong>
          <span style={{ fontSize: 13, opacity: 0.8 }}>
            Kritik olay: <b>{data.counts.critical}</b> · Yüksek tehdit: <b>{data.counts.high}</b> · Son 24 saat başarısız giriş:{' '}
            <b>{data.counts.failed24h}</b> · Engelli IP: <b>{data.blockedIps.length}</b>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => runAction('backup', { action: 'backup' })}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid var(--theme-elevation-250)',
              background: 'var(--theme-elevation-100)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {busy === 'backup' ? 'Yedekleniyor…' : 'Veritabanı Yedeği Al'}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              runAction(
                'lockdown',
                { action: 'lockdown', enabled: !data.lockdown },
                data.lockdown ? 'Acil koruma modu kapatıldı.' : 'Acil koruma modu etkinleştirildi.',
              )
            }
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              background: data.lockdown ? '#1f7a3f' : '#c8161d',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {data.lockdown ? 'Koruma Modunu Kapat' : 'Acil Korumaya Al (Lockdown)'}
          </button>
        </div>
      </div>

      {msg && (
        <p
          role="status"
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            background: 'var(--theme-elevation-100)',
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {msg}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* IP Engelleme Bölümü */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, margin: '0 0 10px' }}>Şüpheli IP Engelleme</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="IP adresi (ör. 203.0.113.5)"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              style={{ flex: '1 1 130px', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--theme-elevation-200)' }}
            />
            <input
              type="text"
              placeholder="Neden"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              style={{ flex: '1 1 130px', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--theme-elevation-200)' }}
            />
            <button
              type="button"
              disabled={!ipInput.trim() || busy !== null}
              onClick={async () => {
                await runAction('block-ip', { action: 'block-ip', ip: ipInput, reason: reasonInput || 'Şüpheli işlem' }, 'IP engellendi.')
                setIpInput('')
                setReasonInput('')
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: '#c8161d',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Engelle
            </button>
          </div>
          {data.blockedIps.length === 0 ? (
            <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>Şu an engellenmiş IP adresi yok.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13 }}>
              {data.blockedIps.map((b) => (
                <li
                  key={b.ip}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderTop: '1px solid var(--theme-elevation-100)',
                  }}
                >
                  <span>
                    <b>{b.ip}</b> — <small style={{ opacity: 0.8 }}>{b.reason}</small>
                  </span>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => runAction(`unblock-${b.ip}`, { action: 'unblock-ip', ip: b.ip }, `${b.ip} engeli kaldırıldı.`)}
                    style={{
                      padding: '3px 8px',
                      fontSize: 12,
                      borderRadius: 4,
                      border: '1px solid var(--theme-elevation-250)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    Engeli Kaldır
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Oturum ve Hesap Müdahale Bölümü */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, margin: '0 0 10px' }}>Kullanıcı Oturumları ve Hesap Durumu</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13 }}>
            {data.users.map((u) => (
              <li
                key={String(u.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 0',
                  borderTop: '1px solid var(--theme-elevation-100)',
                }}
              >
                <div>
                  <b>{u.name}</b> <small style={{ opacity: 0.75 }}>({u.email} · {u.role})</small>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>
                    Aktif oturum: <b>{u.sessionCount}</b>
                    {u.suspended && <span style={{ color: '#c8161d', fontWeight: 700 }}> · ASKIYA ALINDI</span>}
                    {u.locked && <span style={{ color: '#d97706', fontWeight: 700 }}> · KİLİTLİ</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {u.sessionCount > 0 && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() =>
                        runAction(`rev-${u.id}`, { action: 'revoke-sessions', userId: u.id }, `${u.email} oturumları kapatıldı.`)
                      }
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        borderRadius: 4,
                        border: '1px solid var(--theme-elevation-250)',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      Oturumu Kapat
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      runAction(
                        `sus-${u.id}`,
                        { action: 'toggle-suspend', userId: u.id, suspended: !u.suspended },
                        `${u.email} ${!u.suspended ? 'askıya alındı.' : 'etkinleştirildi.'}`,
                      )
                    }
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: '1px solid var(--theme-elevation-250)',
                      background: u.suspended ? '#1f7a3f' : 'transparent',
                      color: u.suspended ? '#fff' : 'inherit',
                      cursor: 'pointer',
                    }}
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
