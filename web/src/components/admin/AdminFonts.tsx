import { Source_Serif_4 } from 'next/font/google'
import React from 'react'

/* Sitedeki gazete yazı tipi (Source Serif 4) panelde de kullanılsın: başlıklar, manşet ve listeler */
const serif = Source_Serif_4({ subsets: ['latin', 'latin-ext'], display: 'swap', style: ['normal', 'italic'] })

export const AdminFonts = () => <style>{`:root{--kd-serif:${serif.style.fontFamily}}`}</style>
