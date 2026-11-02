'use client'
import React from 'react'

/*
  Sayfa çizilmeden önce çalışan küçük betik (tema, yazı boyutu, "js" sınıfı).
  Sunucu HTML'inde normal betik olarak gelir ve hemen çalışır. Tarayıcıda React bu öğeyi
  yeniden oluşturursa (ör. 404 sayfasında) çalışmayan bir veri etiketi olur; böylece
  React'in "script etiketi" uyarısı çıkmaz.
*/
export function PrePaint({ code }: { code: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'application/json'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: code }}
    />
  )
}
