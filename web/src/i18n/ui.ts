import base from './ui-dict.json'

export const LOCALES = ['tr', 'ku', 'en', 'de', 'nl', 'fr'] as const
export type Lang = (typeof LOCALES)[number]
export const DEFAULT_LANG: Lang = 'tr'
export const isLang = (v: string): v is Lang => (LOCALES as readonly string[]).includes(v)

export const LANG_NAMES: Record<Lang, string> = {
  tr: 'Türkçe', ku: 'Kurdî', en: 'English', de: 'Deutsch', nl: 'Nederlands', fr: 'Français',
}

/* Prototipte olmayan, sitenin yeni sayfaları için eklenen metinler */
const extra: Record<Lang, Record<string, string>> = {
  tr: {
    'search.results': 'Arama sonuçları', 'search.none': 'Sonuç bulunamadı.', 'back.home': 'Ana sayfaya dön',
    related: 'Diğer haberler', 'ev.when': 'Ne zaman', 'ev.where': 'Nerede', 'ev.register': 'Kayıt', 'ev.join': 'Katılım bağlantısı',
    'ev.none': 'Yaklaşan etkinlik yok.', 'arc.donor': 'Bağışlayan', 'arc.people': 'Kayıtta geçen kişiler', 'arc.transcript': 'Deşifre',
    'arc.watch': "YouTube'da izle", 'vil.all': 'Tüm köyler', 'vil.news': 'Köyden haberler', 'vil.archive': 'Köyün arşivi',
    'vil.nohistory': 'Tarihçe henüz eklenmedi.', 'not.funeral': 'Cenaze', 'not.condolence': 'Taziye', 'not.deadline': 'Son başvuru',
    'not.apply': 'Başvur', 'not.attachments': 'Ekler', 'news.desk': 'Haber Merkezi', 'join.soon': 'Bülten çok yakında açılıyor.',
    notfound: 'Aradığınız sayfa bulunamadı.', 'arc.approx': 'yaklaşık',
    share: 'Paylaş', copy: 'Bağlantıyı kopyala', copied: 'Kopyalandı', readmin: 'dk okuma',
  },
  ku: {
    'search.results': 'Encamên lêgerînê', 'search.none': 'Tu encam nehat dîtin.', 'back.home': 'Vegere rûpela sereke',
    related: 'Nûçeyên din', 'ev.when': 'Kengî', 'ev.where': 'Li ku', 'ev.register': 'Qeyd', 'ev.join': 'Girêdana beşdarbûnê',
    'ev.none': 'Çalakiyeke nêzîk tune.', 'arc.donor': 'Bexşdar', 'arc.people': 'Kesên di tomarê de', 'arc.transcript': 'Nivîsandin',
    'arc.watch': 'Li YouTubeê temaşe bike', 'vil.all': 'Hemû gund', 'vil.news': 'Nûçeyên gund', 'vil.archive': 'Arşîva gund',
    'vil.nohistory': 'Dîrok hîn nehatiye zêdekirin.', 'not.funeral': 'Cenaze', 'not.condolence': 'Serxweşî', 'not.deadline': 'Dawiya serlêdanê',
    'not.apply': 'Serlêdan bike', 'not.attachments': 'Pêvek', 'news.desk': 'Navenda Nûçeyan', 'join.soon': 'Bulten di demek nêzîk de dest pê dike.',
    notfound: 'Rûpela ku hûn lê digerin nehat dîtin.', 'arc.approx': 'nêzîkî',
    share: 'Parve bike', copy: 'Girêdanê kopî bike', copied: 'Hate kopîkirin', readmin: 'deqe xwendin',
  },
  en: {
    'search.results': 'Search results', 'search.none': 'No results found.', 'back.home': 'Back to home',
    related: 'More news', 'ev.when': 'When', 'ev.where': 'Where', 'ev.register': 'Registration', 'ev.join': 'Join link',
    'ev.none': 'No upcoming events.', 'arc.donor': 'Donated by', 'arc.people': 'People in this record', 'arc.transcript': 'Transcript',
    'arc.watch': 'Watch on YouTube', 'vil.all': 'All villages', 'vil.news': 'News from the village', 'vil.archive': 'Village archive',
    'vil.nohistory': 'No history added yet.', 'not.funeral': 'Funeral', 'not.condolence': 'Condolences', 'not.deadline': 'Deadline',
    'not.apply': 'Apply', 'not.attachments': 'Attachments', 'news.desk': 'Newsroom', 'join.soon': 'The newsletter is launching soon.',
    notfound: 'Page not found.', 'arc.approx': 'approx.',
    share: 'Share', copy: 'Copy link', copied: 'Copied', readmin: 'min read',
  },
  de: {
    'search.results': 'Suchergebnisse', 'search.none': 'Keine Ergebnisse gefunden.', 'back.home': 'Zur Startseite',
    related: 'Weitere Nachrichten', 'ev.when': 'Wann', 'ev.where': 'Wo', 'ev.register': 'Anmeldung', 'ev.join': 'Teilnahmelink',
    'ev.none': 'Keine anstehenden Veranstaltungen.', 'arc.donor': 'Gespendet von', 'arc.people': 'Personen in diesem Eintrag', 'arc.transcript': 'Transkript',
    'arc.watch': 'Auf YouTube ansehen', 'vil.all': 'Alle Dörfer', 'vil.news': 'Nachrichten aus dem Dorf', 'vil.archive': 'Dorfarchiv',
    'vil.nohistory': 'Noch keine Geschichte hinzugefügt.', 'not.funeral': 'Beerdigung', 'not.condolence': 'Beileid', 'not.deadline': 'Bewerbungsschluss',
    'not.apply': 'Bewerben', 'not.attachments': 'Anhänge', 'news.desk': 'Redaktion', 'join.soon': 'Der Newsletter startet in Kürze.',
    notfound: 'Seite nicht gefunden.', 'arc.approx': 'ca.',
    share: 'Teilen', copy: 'Link kopieren', copied: 'Kopiert', readmin: 'Min. Lesezeit',
  },
  nl: {
    'search.results': 'Zoekresultaten', 'search.none': 'Geen resultaten gevonden.', 'back.home': 'Terug naar home',
    related: 'Meer nieuws', 'ev.when': 'Wanneer', 'ev.where': 'Waar', 'ev.register': 'Aanmelding', 'ev.join': 'Deelnamelink',
    'ev.none': 'Geen komende evenementen.', 'arc.donor': 'Geschonken door', 'arc.people': 'Personen in dit item', 'arc.transcript': 'Transcriptie',
    'arc.watch': 'Bekijk op YouTube', 'vil.all': 'Alle dorpen', 'vil.news': 'Nieuws uit het dorp', 'vil.archive': 'Dorpsarchief',
    'vil.nohistory': 'Nog geen geschiedenis toegevoegd.', 'not.funeral': 'Uitvaart', 'not.condolence': 'Condoleances', 'not.deadline': 'Deadline',
    'not.apply': 'Aanvragen', 'not.attachments': 'Bijlagen', 'news.desk': 'Redactie', 'join.soon': 'De nieuwsbrief start binnenkort.',
    notfound: 'Pagina niet gevonden.', 'arc.approx': 'ca.',
    share: 'Delen', copy: 'Link kopiëren', copied: 'Gekopieerd', readmin: 'min lezen',
  },
  fr: {
    'search.results': 'Résultats de recherche', 'search.none': 'Aucun résultat.', 'back.home': "Retour à l'accueil",
    related: 'Autres actualités', 'ev.when': 'Quand', 'ev.where': 'Où', 'ev.register': 'Inscription', 'ev.join': 'Lien de participation',
    'ev.none': 'Aucun événement à venir.', 'arc.donor': 'Don de', 'arc.people': 'Personnes mentionnées', 'arc.transcript': 'Transcription',
    'arc.watch': 'Regarder sur YouTube', 'vil.all': 'Tous les villages', 'vil.news': 'Actualités du village', 'vil.archive': 'Archives du village',
    'vil.nohistory': "Pas encore d'histoire.", 'not.funeral': 'Funérailles', 'not.condolence': 'Condoléances', 'not.deadline': 'Date limite',
    'not.apply': 'Postuler', 'not.attachments': 'Pièces jointes', 'news.desk': 'Rédaction', 'join.soon': "La lettre d'information arrive bientôt.",
    notfound: 'Page introuvable.', 'arc.approx': 'env.',
    share: 'Partager', copy: 'Copier le lien', copied: 'Copié', readmin: 'min de lecture',
  },
}

const dict = base.dict as Record<Lang, Record<string, string>>

/** Arayüz metni: seçilen dil, yoksa Türkçe */
export const t = (lang: Lang, key: string): string =>
  extra[lang][key] ?? dict[lang]?.[key] ?? extra.tr[key] ?? dict.tr[key] ?? key

/** Dönem adı: 1960'lar, 1960s, 1960er... */
export function decadeLabel(lang: Lang, y: number): string {
  switch (lang) {
    case 'tr': {
      const s = String(y).slice(-2)
      const lar = ['60', '90', '30', '40', '10'].some((e) => s === e) ? "'lar" : "'ler"
      return `${y}${y === 2000 ? "'ler" : lar}`
    }
    case 'ku': return `Salên ${y}an`
    case 'en': return `${y}s`
    case 'de': return `${y}er`
    case 'nl': return y < 2000 ? `jaren '${String(y).slice(2)}` : `jaren ${y}`
    case 'fr': return `Années ${y}`
  }
}

const LOCALE_TAG: Record<Exclude<Lang, 'ku'>, string> = { tr: 'tr-TR', en: 'en-GB', de: 'de-DE', nl: 'nl-NL', fr: 'fr-FR' }
const KU = base.ku as { months: string[]; days: string[] }
const cap = (s: string, loc: string) => (s ? s.charAt(0).toLocaleUpperCase(loc) + s.slice(1) : s)

type Kind = 'full' | 'date' | 'dm' | 'month' | 'weekday' | 'time' | 'datetime'
/** Tarihleri seçilen dile göre yazar (Kurmancî elle). Saat dilimi: Türkiye. */
export function fmt(lang: Lang, input: string | Date | null | undefined, kind: Kind = 'date', tz = 'Europe/Istanbul'): string {
  if (!input) return ''
  const d = typeof input === 'string' ? new Date(input) : input
  if (lang === 'ku') {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric', month: 'numeric', year: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d)
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
    const day = +get('day'), m = +get('month') - 1, year = get('year')
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
    const time = `${get('hour')}:${get('minute')}`
    switch (kind) {
      case 'full': return `${day} ${KU.months[m]} ${year}, ${KU.days[wd]}`
      case 'dm': return `${day} ${KU.months[m]}`
      case 'month': return KU.months[m]
      case 'weekday': return KU.days[wd]
      case 'time': return time
      case 'datetime': return `${day} ${KU.months[m]} ${year}, ${time}`
      default: return `${day} ${KU.months[m]} ${year}`
    }
  }
  const loc = LOCALE_TAG[lang]
  const o: Intl.DateTimeFormatOptions =
    kind === 'full' ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : kind === 'dm' ? { day: 'numeric', month: 'long' }
    : kind === 'month' ? { month: 'long' }
    : kind === 'weekday' ? { weekday: 'long' }
    : kind === 'time' ? { hour: '2-digit', minute: '2-digit' }
    : kind === 'datetime' ? { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'long', year: 'numeric' }
  const s = new Intl.DateTimeFormat(loc, { ...o, timeZone: tz }).format(d)
  return kind === 'month' || kind === 'weekday' || kind === 'full' ? cap(s, loc) : s
}

/** Dili değiştirirken aynı sayfanın diğer dildeki adresi */
export const swapLang = (pathname: string, lang: Lang) => {
  const parts = pathname.split('/')
  if (parts[1] && isLang(parts[1])) parts[1] = lang
  else parts.splice(1, 0, lang)
  return parts.join('/') || `/${lang}`
}
