/*
  Yayına hazırlık turunda eklenen özelliklerin arayüz metinleri
  (duyuru türleri, reklam, kur şeridi, canlı yayın, arşive katkı formu).
  Zazaca (zza) metinler taslaktır; Zazaca bilen biri kontrol etmeli.
*/
type Dict = Record<string, string>

export const FEATURES: Record<string, Dict> = {
  tr: {
    'cat.dugun': 'Düğün', 'cat.ozel-gun': 'Özel gün',
    'occ.nisan': 'Nişan', 'occ.kina': 'Kına', 'occ.sunnet': 'Sünnet düğünü', 'occ.dogum': 'Doğum', 'occ.mezuniyet': 'Mezuniyet', 'occ.diger': 'Özel gün',
    'not.couple': 'Gelin ve damat', 'not.families': 'Aileler', 'not.person': 'Kimin için', 'not.occasion': 'Etkinlik',
  },
  ku: {
    'cat.dugun': 'Dawet', 'cat.ozel-gun': 'Roja taybet',
    'occ.nisan': 'Dergistî', 'occ.kina': 'Şeva hinê', 'occ.sunnet': 'Daweta sinetê', 'occ.dogum': 'Zayîn', 'occ.mezuniyet': 'Mezûnbûn', 'occ.diger': 'Roja taybet',
    'not.couple': 'Bûk û zava', 'not.families': 'Malbat', 'not.person': 'Ji bo kê', 'not.occasion': 'Bûyer',
  },
  zza: {
    'cat.dugun': 'Veyve', 'cat.ozel-gun': 'Roja xase',
    'occ.nisan': 'Nîşane', 'occ.kina': 'Şewa hene', 'occ.sunnet': 'Veyvê sunetî', 'occ.dogum': 'Biyayîş', 'occ.mezuniyet': 'Mezunîye', 'occ.diger': 'Roja xase',
    'not.couple': 'Veyve û zama', 'not.families': 'Keyeyî', 'not.person': 'Seba kamî', 'not.occasion': 'Bûyer',
  },
  en: {
    'cat.dugun': 'Wedding', 'cat.ozel-gun': 'Special day',
    'occ.nisan': 'Engagement', 'occ.kina': 'Henna night', 'occ.sunnet': 'Circumcision feast', 'occ.dogum': 'Birth', 'occ.mezuniyet': 'Graduation', 'occ.diger': 'Special day',
    'not.couple': 'Bride and groom', 'not.families': 'Families', 'not.person': 'In honour of', 'not.occasion': 'Occasion',
  },
  de: {
    'cat.dugun': 'Hochzeit', 'cat.ozel-gun': 'Besonderer Tag',
    'occ.nisan': 'Verlobung', 'occ.kina': 'Henna-Abend', 'occ.sunnet': 'Beschneidungsfest', 'occ.dogum': 'Geburt', 'occ.mezuniyet': 'Abschluss', 'occ.diger': 'Besonderer Tag',
    'not.couple': 'Braut und Bräutigam', 'not.families': 'Familien', 'not.person': 'Für', 'not.occasion': 'Anlass',
  },
  nl: {
    'cat.dugun': 'Bruiloft', 'cat.ozel-gun': 'Bijzondere dag',
    'occ.nisan': 'Verloving', 'occ.kina': 'Hennanacht', 'occ.sunnet': 'Besnijdenisfeest', 'occ.dogum': 'Geboorte', 'occ.mezuniyet': 'Diploma-uitreiking', 'occ.diger': 'Bijzondere dag',
    'not.couple': 'Bruid en bruidegom', 'not.families': 'Families', 'not.person': 'Voor', 'not.occasion': 'Gelegenheid',
  },
  fr: {
    'cat.dugun': 'Mariage', 'cat.ozel-gun': 'Jour spécial',
    'occ.nisan': 'Fiançailles', 'occ.kina': 'Nuit du henné', 'occ.sunnet': 'Fête de circoncision', 'occ.dogum': 'Naissance', 'occ.mezuniyet': 'Remise de diplôme', 'occ.diger': 'Jour spécial',
    'not.couple': 'Les mariés', 'not.families': 'Familles', 'not.person': 'En l’honneur de', 'not.occasion': 'Occasion',
  },
}
