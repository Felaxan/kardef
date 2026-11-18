'use client'
import Script from 'next/script'
import React, { useRef, useState } from 'react'
import { ACCEPT, MAX_FILE_BYTES, MAX_FILES, SUBMISSION_KINDS, validateSubmission, type SubmissionError } from '@/lib/submission'

type Labels = Record<string, string>
type Village = { id: number; name: string }

const mb = (n: number) =>
  n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB`

/** Arşive katkı formu: anında doğrulama, sürükle-bırak dosya listesi, yükleme ilerlemesi */
export function ContributeForm({
  action, labels: L, kindLabels, villages, siteKey, demo,
}: {
  action: string; labels: Labels; kindLabels: Record<string, string>; villages: Village[]; siteKey?: string; demo?: boolean
}) {
  const form = useRef<HTMLFormElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [drag, setDrag] = useState(false)

  const addFiles = (list: FileList | null) => {
    if (!list) return
    setFiles((cur) => [...cur, ...Array.from(list)].slice(0, MAX_FILES + 5))
    setErrors((e) => e.filter((x) => !x.startsWith('files')))
  }
  const has = (k: SubmissionError | string) => errors.includes(k)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (demo) return setErrors(['demo'])
    const fd = new FormData(form.current!)
    const fields = Object.fromEntries(['name', 'phone', 'email', 'description', 'link', 'consent'].map((k) => [k, String(fd.get(k) ?? '')]))
    const v = validateSubmission(fields, files.map((f) => ({ name: f.name, type: f.type, size: f.size })))
    if (!v.ok) {
      setErrors(v.errors)
      form.current?.querySelector<HTMLElement>(`[data-err="${v.errors[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    fd.delete('files')
    files.forEach((f) => fd.append('files', f))
    setErrors([])
    setState('sending')
    setProgress(0)

    // XHR: büyük dosyalarda yükleme ilerlemesi görünsün
    const xhr = new XMLHttpRequest()
    xhr.open('POST', action)
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(ev.loaded / ev.total)
    xhr.onload = () => {
      let res: { ok?: boolean; errors?: string[] } = {}
      try { res = JSON.parse(xhr.responseText) } catch { /* boş */ }
      if (xhr.status < 300 && res.ok) {
        setState('done')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setState('idle')
        setErrors(res.errors?.length ? res.errors : ['server'])
        const w = window as unknown as { turnstile?: { reset: () => void } }
        w.turnstile?.reset()
      }
    }
    xhr.onerror = () => { setState('idle'); setErrors(['server']) }
    xhr.send(fd)
  }

  if (state === 'done') {
    return (
      <div className="kf-done" role="status">
        <span className="kf-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
        <h2>{L['form.ok.title']}</h2>
        <p>{L['form.ok.text']}</p>
        <button type="button" className="btn" onClick={() => { setFiles([]); setState('idle'); form.current?.reset() }}>{L['form.again']}</button>
      </div>
    )
  }

  const general = errors.filter((e) => ['rate', 'captcha', 'server', 'demo', 'form'].includes(e))
  const Err = ({ k }: { k: string }) => (has(k) ? <p className="kf-err" role="alert" data-err={k}>{L[`err.${k}`]}</p> : null)

  return (
    <form ref={form} className="kf" onSubmit={submit} noValidate>
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}

      <fieldset className="kf-group" data-reveal="">
        <legend>{L['form.what']}</legend>
        <div className="kf-kinds" role="radiogroup" aria-label={L['form.kind']}>
          {SUBMISSION_KINDS.map((k, i) => (
            <label key={k} className="kf-kind">
              <input type="radio" name="kind" value={k} defaultChecked={i === 0} />
              <span>{kindLabels[k]}</span>
            </label>
          ))}
        </div>

        <div
          className={`kf-drop${drag ? ' is-drag' : ''}${has('files.none') || has('files.count') || has('files.size') || has('files.type') ? ' is-err' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
        >
          <label className="kf-pick">
            <input type="file" name="files" multiple accept={ACCEPT} onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0l-5 5m5-5l5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></svg>
            <b>{L['form.pick']}</b>
            <small>{L['form.filesHint']}</small>
          </label>
          {files.length > 0 && (
            <ul className="kf-files">
              {files.map((f, i) => (
                <li key={i + f.name} className={f.size > MAX_FILE_BYTES || i >= MAX_FILES ? 'is-bad' : ''}>
                  <span className="kf-fname">{f.name}</span>
                  <span className="kf-fsize">{mb(f.size)}</span>
                  <button type="button" onClick={() => setFiles((c) => c.filter((_, j) => j !== i))} aria-label={`${L['form.remove']}: ${f.name}`}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {['files.none', 'files.count', 'files.size', 'files.type'].map((k) => <Err key={k} k={k} />)}

        <div className="kf-row">
          <label className="kf-field">
            <span>{L['form.link']}</span>
            <input name="link" type="url" inputMode="url" placeholder="https://" />
            <small>{L['form.linkHint']}</small>
          </label>
        </div>

        <label className={`kf-field${has('description') ? ' is-err' : ''}`}>
          <span>{L['form.desc']} *</span>
          <textarea name="description" rows={5} maxLength={4000} />
          <small>{L['form.descHint']}</small>
        </label>
        <Err k="description" />

        <div className="kf-row">
          <label className="kf-field">
            <span>{L['form.year']}</span>
            <input name="year" inputMode="numeric" maxLength={20} />
            <small>{L['form.yearHint']}</small>
          </label>
          <label className="kf-field">
            <span>{L['form.village']}</span>
            <select name="village" defaultValue="">
              <option value="">{L['form.villageNone']}</option>
              {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="kf-group" data-reveal="">
        <legend>{L['form.who']}</legend>
        <label className={`kf-field${has('name') ? ' is-err' : ''}`}>
          <span>{L['form.name']} *</span>
          <input name="name" autoComplete="name" maxLength={120} />
        </label>
        <Err k="name" />
        <div className="kf-row">
          <label className={`kf-field${has('contact') ? ' is-err' : ''}`}>
            <span>{L['form.phone']}</span>
            <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
          </label>
          <label className={`kf-field${has('contact') ? ' is-err' : ''}`}>
            <span>{L['form.email']}</span>
            <input name="email" type="email" autoComplete="email" maxLength={160} />
          </label>
        </div>
        <p className="kf-hint">{L['form.contactHint']}</p>
        <Err k="contact" />

        {/* Robot tuzağı: insanlar görmez */}
        <label className="kf-hp" aria-hidden="true">
          Web sitesi <input name="website" tabIndex={-1} autoComplete="off" />
        </label>

        <label className={`kf-consent${has('consent') ? ' is-err' : ''}`}>
          <input type="checkbox" name="consent" value="on" />
          <span>{L['form.consent']}</span>
        </label>
        <Err k="consent" />
        <p className="kf-privacy">{L['form.privacy']}</p>

        {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" />}
      </fieldset>

      {general.map((k) => <p key={k} className="kf-err kf-err-general" role="alert">{L[`err.${k}`]}</p>)}

      <div className="kf-actions">
        <button type="submit" className="btn btn-brand kf-send" disabled={state === 'sending'}>
          <span>{state === 'sending' ? L['form.sending'] : L['form.send']}</span>
          {state === 'sending' && <span className="kf-bar" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />}
        </button>
        {state === 'sending' && files.length > 0 && <span className="kf-pct">%{Math.round(progress * 100)}</span>}
      </div>
    </form>
  )
}
