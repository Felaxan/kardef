'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { Ico } from '@/components/site/Icons'

/* Bulunamayan sayfa: dili adresten okur (bu dosyaya dil bilgisi gelmez) */
const TEXT = {
  tr: { t: 'Bu sayfa bulunamadı.', p: 'Bağlantı değişmiş ya da sayfa kaldırılmış olabilir. Aradığınızı aşağıdan bulabilirsiniz.', ph: 'Haber, köy, isim veya yıl ara', go: 'Ara', home: 'Ana sayfa', arc: 'Arşiv', vil: 'Köy rehberi' },
  ku: { t: 'Ev rûpel nehat dîtin.', p: 'Dibe ku girêdan hatibe guhertin an rûpel hatibe rakirin. Hûn dikarin li jêr bigerin.', ph: 'Li nûçe, gund, nav an salê bigere', go: 'Bigere', home: 'Rûpela sereke', arc: 'Arşîv', vil: 'Rêbera gundan' },
  en: { t: 'This page could not be found.', p: 'The link may have changed or the page may have been removed. Try searching below.', ph: 'Search news, villages, names or years', go: 'Search', home: 'Home', arc: 'Archive', vil: 'Village guide' },
  de: { t: 'Diese Seite wurde nicht gefunden.', p: 'Der Link hat sich vielleicht geändert oder die Seite wurde entfernt. Suchen Sie hier weiter.', ph: 'Nachrichten, Dörfer, Namen oder Jahre suchen', go: 'Suchen', home: 'Startseite', arc: 'Archiv', vil: 'Dorfführer' },
  nl: { t: 'Deze pagina is niet gevonden.', p: 'De link is misschien gewijzigd of de pagina is verwijderd. Zoek hieronder verder.', ph: 'Zoek nieuws, dorpen, namen of jaren', go: 'Zoeken', home: 'Home', arc: 'Archief', vil: 'Dorpengids' },
  fr: { t: 'Cette page est introuvable.', p: 'Le lien a peut-être changé ou la page a été supprimée. Cherchez ci-dessous.', ph: 'Chercher actualités, villages, noms ou années', go: 'Chercher', home: 'Accueil', arc: 'Archives', vil: 'Guide des villages' },
} as const
type L = keyof typeof TEXT

export default function NotFound() {
  const seg = (usePathname() ?? '').split('/')[1]
  const lang: L = seg && seg in TEXT ? (seg as L) : 'tr'
  const x = TEXT[lang]
  return (
    <div className="wrap nf">
      <p className="nf-code" aria-hidden="true"><span>4</span><span>0</span><span>4</span></p>
      <div className="nf-body">
        <h1>{x.t}</h1>
        <p>{x.p}</p>
        <form className="sp-form" role="search" action={`/${lang}/ara`}>
          <Ico name="search" />
          <label htmlFor="nfq" className="sr">{x.go}</label>
          <input id="nfq" name="q" type="search" placeholder={x.ph} />
          <button type="submit"><span>{x.go}</span><Ico name="arrow" /></button>
        </form>
        <nav className="nf-links">
          <Link href={`/${lang}`}><Ico name="back" />{x.home}</Link>
          <Link href={`/${lang}#arsiv`}>{x.arc}</Link>
          <Link href={`/${lang}/koyler`}>{x.vil}</Link>
        </nav>
      </div>
    </div>
  )
}
