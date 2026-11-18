'use client'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React, { useState } from 'react'

/** Gelen katkı ekranında: tek tıkla taslak arşiv kaydı oluşturur */
export const ConvertSubmission = () => {
  const { id } = useDocumentInfo()
  const linked = useFormFields(([f]) => f.archiveItem?.value) as number | { id: number } | undefined
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle')
  const [archiveId, setArchiveId] = useState<number | null>(null)
  const existing = archiveId ?? (typeof linked === 'object' && linked ? linked.id : (linked as number | undefined)) ?? null

  if (!id) return null
  if (existing) {
    return (
      <a className="kd-convert is-done" href={`/admin/collections/archive/${existing}`}>
        Arşiv taslağını aç →
      </a>
    )
  }

  async function convert() {
    setState('busy')
    try {
      const res = await fetch(`/api/submissions/${id}/aktar`, { method: 'POST', credentials: 'include' })
      const data = (await res.json()) as { archiveId?: number }
      if (!res.ok || !data.archiveId) throw new Error()
      setArchiveId(data.archiveId)
      setState('idle')
    } catch {
      setState('error')
    }
  }

  return (
    <button type="button" className="kd-convert" onClick={convert} disabled={state === 'busy'} title="Gönderiden taslak arşiv kaydı oluşturur; dosyalar medyaya kopyalanır">
      {state === 'busy' ? 'Aktarılıyor…' : state === 'error' ? 'Olmadı, tekrar dene' : 'Arşive aktar'}
    </button>
  )
}
