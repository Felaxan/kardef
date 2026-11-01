import type { DefaultServerCellComponentProps } from 'payload'
import React from 'react'

/*
  Haber listesindeki "Kategori" sütunu.
  Varsayılan hücre bazı satırlarda kategoriyi geç/eksik yüklüyordu;
  bu bileşen adı sunucuda doğrudan okur.
*/
export async function CategoryCell({ cellData, payload }: DefaultServerCellComponentProps) {
  const id = cellData && typeof cellData === 'object' ? (cellData as { id: number }).id : cellData
  if (!id) return <span className="kd-cell-empty">—</span>
  const doc = await payload
    .findByID({ collection: 'categories', id: id as number, depth: 0, locale: 'tr', overrideAccess: true })
    .catch(() => null)
  return <span className="kd-chip">{doc?.name ?? '—'}</span>
}
