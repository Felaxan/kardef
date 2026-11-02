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
    "days.left": "gün kaldı", "ev.today": "Bugün", "ev.tomorrow": "Yarın", "ev.past": "Sona erdi", "ev.cal": "Takvime ekle", "ev.map": "Haritada aç", "ev.upcoming": "Yaklaşan etkinlikler", "ev.local": "yerel saat", "not.more": "Diğer duyurular", "not.closed": "Başvurular kapandı", "arc.no": "Kayıt no", "arc.nofile": "Dosya henüz eklenmedi", "arc.timeline": "Arşivin zaman çizelgesi", "arc.near": "Yakın dönemden kayıtlar", "arc.details": "Künye", "arc.play": "Dinle", "arc.pause": "Duraklat", "vil.filter": "Köy veya mahalle ara", "vil.count": "köy ve mahalle", "vil.send": "Köyünüzün fotoğraflarını ve hikâyesini bize gönderin; bu sayfa sizinle büyüyecek.", "search.all": "Tümü", "search.n": "sonuç", "search.lede": "Haberler, duyurular, etkinlikler, arşiv ve köy sayfalarında arayın.", "ev.org": "Düzenleyen", "not.by": "Yayımlayan", "auto.note": "Bu metin Türkçeden otomatik olarak çevrildi.", "auto.orig": "Türkçe aslı",
    "news.lede": "Karakoçan'dan ve gurbetten en son haberler.", "ev.lede": "Karakoçan'da, Avrupa'da ve çevrim içi düzenlenen etkinlikler.", "ev.tabUp": "Yaklaşan", "ev.tabPast": "Geçmiş", "not.lede": "Vefat, burs, toplantı, yardım ve üyelik duyuruları.", "oral.lede": "Büyüklerimizin anlattıkları: göç yılları, köy hayatı, ninniler ve ağıtlar.", "org.lede": "Bu platformu birlikte yürüten iki kurum.", "page.prev": "Önceki", "page.next": "Sonraki", "org.contact": "İletişim",
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
    "days.left": "roj maye", "ev.today": "Îro", "ev.tomorrow": "Sibê", "ev.past": "Qediya", "ev.cal": "Li salnameyê zêde bike", "ev.map": "Li ser nexşeyê veke", "ev.upcoming": "Çalakiyên nêzîk", "ev.local": "demjimêra herêmî", "not.more": "Danezanên din", "not.closed": "Serlêdan girtî ne", "arc.no": "Hejmara tomarê", "arc.nofile": "Pel hîn nehatiye zêdekirin", "arc.timeline": "Rêzika demê ya arşîvê", "arc.near": "Tomarên ji heman demê", "arc.details": "Nasname", "arc.play": "Guhdarî bike", "arc.pause": "Rawestîne", "vil.filter": "Li gund an taxê bigere", "vil.count": "gund û tax", "vil.send": "Wêne û çîroka gundê xwe ji me re bişînin; ev rûpel bi we re mezin dibe.", "search.all": "Hemû", "search.n": "encam", "search.lede": "Di nûçe, danezan, çalakî, arşîv û rûpelên gundan de bigerin.", "ev.org": "Amadekar", "not.by": "Weşanger", "auto.note": "Ev nivîs bi awayekî otomatîk ji tirkî hatiye wergerandin.", "auto.orig": "Eslê tirkî",
    "news.lede": "Nûçeyên herî dawî ji Karakoçanê û ji xerîbiyê.", "ev.lede": "Çalakiyên li Karakoçanê, li Ewropayê û serhêl.", "ev.tabUp": "Nêzîk", "ev.tabPast": "Borî", "not.lede": "Danezanên mirin, bursê, civînê, alîkarî û endametiyê.", "oral.lede": "Tiştên ku mezinên me vedibêjin: salên koçê, jiyana gund, lorî û stran.", "org.lede": "Du saziyên ku vê platformê bi hev re birêve dibin.", "page.prev": "Berê", "page.next": "Paşê", "org.contact": "Têkilî",
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
    "days.left": "days left", "ev.today": "Today", "ev.tomorrow": "Tomorrow", "ev.past": "Ended", "ev.cal": "Add to calendar", "ev.map": "Open in maps", "ev.upcoming": "Upcoming events", "ev.local": "local time", "not.more": "More announcements", "not.closed": "Applications closed", "arc.no": "Record no.", "arc.nofile": "File not added yet", "arc.timeline": "Archive timeline", "arc.near": "From around the same time", "arc.details": "Details", "arc.play": "Listen", "arc.pause": "Pause", "vil.filter": "Find a village or neighbourhood", "vil.count": "villages and neighbourhoods", "vil.send": "Send us photos and stories from your village; this page grows with you.", "search.all": "All", "search.n": "results", "search.lede": "Search news, announcements, events, the archive and village pages.", "ev.org": "Organiser", "not.by": "Published by", "auto.note": "This text was translated automatically from Turkish.", "auto.orig": "Read the Turkish original",
    "news.lede": "The latest news from Karakoçan and from abroad.", "ev.lede": "Events in Karakoçan, across Europe and online.", "ev.tabUp": "Upcoming", "ev.tabPast": "Past", "not.lede": "Obituaries, scholarships, meetings, aid and membership notices.", "oral.lede": "In their own words: the migration years, village life, lullabies and laments.", "org.lede": "The two organisations that run this platform together.", "page.prev": "Previous", "page.next": "Next", "org.contact": "Contact",
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
    "days.left": "Tage übrig", "ev.today": "Heute", "ev.tomorrow": "Morgen", "ev.past": "Beendet", "ev.cal": "Zum Kalender hinzufügen", "ev.map": "In Karten öffnen", "ev.upcoming": "Kommende Veranstaltungen", "ev.local": "Ortszeit", "not.more": "Weitere Mitteilungen", "not.closed": "Bewerbungsfrist abgelaufen", "arc.no": "Eintrag Nr.", "arc.nofile": "Datei noch nicht hinzugefügt", "arc.timeline": "Zeitleiste des Archivs", "arc.near": "Aus derselben Zeit", "arc.details": "Angaben", "arc.play": "Anhören", "arc.pause": "Pause", "vil.filter": "Dorf oder Ortsteil suchen", "vil.count": "Dörfer und Ortsteile", "vil.send": "Schicken Sie uns Fotos und Geschichten aus Ihrem Dorf; diese Seite wächst mit Ihnen.", "search.all": "Alle", "search.n": "Ergebnisse", "search.lede": "Suchen Sie in Nachrichten, Mitteilungen, Veranstaltungen, im Archiv und auf den Dorfseiten.", "ev.org": "Veranstalter", "not.by": "Herausgegeben von", "auto.note": "Dieser Text wurde automatisch aus dem Türkischen übersetzt.", "auto.orig": "Türkisches Original",
    "news.lede": "Die neuesten Nachrichten aus Karakoçan und aus der Ferne.", "ev.lede": "Veranstaltungen in Karakoçan, in Europa und online.", "ev.tabUp": "Kommend", "ev.tabPast": "Vergangen", "not.lede": "Traueranzeigen, Stipendien, Versammlungen, Hilfe und Mitgliedschaft.", "oral.lede": "In eigenen Worten: die Jahre der Auswanderung, das Dorfleben, Wiegenlieder und Klagelieder.", "org.lede": "Die zwei Organisationen, die diese Plattform gemeinsam betreiben.", "page.prev": "Zurück", "page.next": "Weiter", "org.contact": "Kontakt",
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
    "days.left": "dagen te gaan", "ev.today": "Vandaag", "ev.tomorrow": "Morgen", "ev.past": "Afgelopen", "ev.cal": "Aan agenda toevoegen", "ev.map": "Open in kaart", "ev.upcoming": "Komende evenementen", "ev.local": "lokale tijd", "not.more": "Meer mededelingen", "not.closed": "Aanmelding gesloten", "arc.no": "Itemnr.", "arc.nofile": "Bestand nog niet toegevoegd", "arc.timeline": "Tijdlijn van het archief", "arc.near": "Uit dezelfde periode", "arc.details": "Gegevens", "arc.play": "Luisteren", "arc.pause": "Pauze", "vil.filter": "Zoek een dorp of wijk", "vil.count": "dorpen en wijken", "vil.send": "Stuur ons foto's en verhalen uit uw dorp; deze pagina groeit met u mee.", "search.all": "Alles", "search.n": "resultaten", "search.lede": "Zoek in nieuws, mededelingen, evenementen, het archief en de dorpspagina’s.", "ev.org": "Organisator", "not.by": "Gepubliceerd door", "auto.note": "Deze tekst is automatisch uit het Turks vertaald.", "auto.orig": "Turks origineel",
    "news.lede": "Het laatste nieuws uit Karakoçan en uit het buitenland.", "ev.lede": "Evenementen in Karakoçan, in Europa en online.", "ev.tabUp": "Komend", "ev.tabPast": "Afgelopen", "not.lede": "Overlijdensberichten, beurzen, vergaderingen, hulp en lidmaatschap.", "oral.lede": "In hun eigen woorden: de migratiejaren, het dorpsleven, slaapliedjes en klaagzangen.", "org.lede": "De twee organisaties die dit platform samen beheren.", "page.prev": "Vorige", "page.next": "Volgende", "org.contact": "Contact",
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
    "days.left": "jours restants", "ev.today": "Aujourd'hui", "ev.tomorrow": "Demain", "ev.past": "Terminé", "ev.cal": "Ajouter au calendrier", "ev.map": "Ouvrir le plan", "ev.upcoming": "Événements à venir", "ev.local": "heure locale", "not.more": "Autres annonces", "not.closed": "Candidatures closes", "arc.no": "N° de fiche", "arc.nofile": "Fichier pas encore ajouté", "arc.timeline": "Chronologie des archives", "arc.near": "De la même période", "arc.details": "Fiche", "arc.play": "Écouter", "arc.pause": "Pause", "vil.filter": "Chercher un village ou un quartier", "vil.count": "villages et quartiers", "vil.send": "Envoyez-nous des photos et des histoires de votre village ; cette page grandit avec vous.", "search.all": "Tout", "search.n": "résultats", "search.lede": "Cherchez dans les actualités, annonces, événements, archives et pages des villages.", "ev.org": "Organisateur", "not.by": "Publié par", "auto.note": "Ce texte a été traduit automatiquement du turc.", "auto.orig": "Original en turc",
    "news.lede": "Les dernières nouvelles de Karakoçan et de la diaspora.", "ev.lede": "Événements à Karakoçan, en Europe et en ligne.", "ev.tabUp": "À venir", "ev.tabPast": "Passés", "not.lede": "Avis de décès, bourses, réunions, aide et adhésions.", "oral.lede": "Avec leurs mots : les années de migration, la vie au village, berceuses et complaintes.", "org.lede": "Les deux organisations qui animent ensemble cette plateforme.", "page.prev": "Précédent", "page.next": "Suivant", "org.contact": "Contact",
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
