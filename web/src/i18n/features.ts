/*
  Yayına hazırlık turunda eklenen özelliklerin arayüz metinleri
  (duyuru türleri, reklam, kur şeridi, canlı yayın, arşive katkı formu).
  Zazaca (zza) metinler taslaktır; Zazaca bilen biri kontrol etmeli.
*/
type Dict = Record<string, string>

export const FEATURES: Record<string, Dict> = {
  tr: {
    'rate.gram': 'Gram altın', 'rate.ceyrek': 'Çeyrek', 'rate.yarim': 'Yarım', 'rate.tam': 'Tam altın', 'rate.eur': 'Euro', 'rate.usd': 'Dolar', 'rate.gbp': 'Sterlin', 'rate.title': 'Altın ve döviz', 'rate.updated': 'Güncelleme',
    'ad.label': 'Reklam',
    'cat.dugun': 'Düğün', 'cat.ozel-gun': 'Özel gün',
    'occ.nisan': 'Nişan', 'occ.kina': 'Kına', 'occ.sunnet': 'Sünnet düğünü', 'occ.dogum': 'Doğum', 'occ.mezuniyet': 'Mezuniyet', 'occ.diger': 'Özel gün',
    'not.couple': 'Gelin ve damat', 'not.families': 'Aileler', 'not.person': 'Kimin için', 'not.occasion': 'Etkinlik',
  },
  ku: {
    'rate.gram': 'Gram zêr', 'rate.ceyrek': 'Çarîk', 'rate.yarim': 'Nîv', 'rate.tam': 'Zêrê tam', 'rate.eur': 'Euro', 'rate.usd': 'Dolar', 'rate.gbp': 'Sterlîn', 'rate.title': 'Zêr û dovîz', 'rate.updated': 'Nûkirin',
    'ad.label': 'Reklam',
    'cat.dugun': 'Dawet', 'cat.ozel-gun': 'Roja taybet',
    'occ.nisan': 'Dergistî', 'occ.kina': 'Şeva hinê', 'occ.sunnet': 'Daweta sinetê', 'occ.dogum': 'Zayîn', 'occ.mezuniyet': 'Mezûnbûn', 'occ.diger': 'Roja taybet',
    'not.couple': 'Bûk û zava', 'not.families': 'Malbat', 'not.person': 'Ji bo kê', 'not.occasion': 'Bûyer',
  },
  zza: {
    'rate.gram': 'Gram zern', 'rate.ceyrek': 'Çarek', 'rate.yarim': 'Nêm', 'rate.tam': 'Zerno tam', 'rate.eur': 'Euro', 'rate.usd': 'Dolar', 'rate.gbp': 'Sterlîn', 'rate.title': 'Zern û dovîz', 'rate.updated': 'Rojanekerdiş',
    'ad.label': 'Reklam',
    'cat.dugun': 'Veyve', 'cat.ozel-gun': 'Roja xase',
    'occ.nisan': 'Nîşane', 'occ.kina': 'Şewa hene', 'occ.sunnet': 'Veyvê sunetî', 'occ.dogum': 'Biyayîş', 'occ.mezuniyet': 'Mezunîye', 'occ.diger': 'Roja xase',
    'not.couple': 'Veyve û zama', 'not.families': 'Keyeyî', 'not.person': 'Seba kamî', 'not.occasion': 'Bûyer',
  },
  en: {
    'rate.gram': 'Gram gold', 'rate.ceyrek': 'Quarter gold', 'rate.yarim': 'Half gold', 'rate.tam': 'Full gold', 'rate.eur': 'Euro', 'rate.usd': 'Dollar', 'rate.gbp': 'Pound', 'rate.title': 'Gold & currency', 'rate.updated': 'Updated',
    'ad.label': 'Advertisement',
    'cat.dugun': 'Wedding', 'cat.ozel-gun': 'Special day',
    'occ.nisan': 'Engagement', 'occ.kina': 'Henna night', 'occ.sunnet': 'Circumcision feast', 'occ.dogum': 'Birth', 'occ.mezuniyet': 'Graduation', 'occ.diger': 'Special day',
    'not.couple': 'Bride and groom', 'not.families': 'Families', 'not.person': 'In honour of', 'not.occasion': 'Occasion',
  },
  de: {
    'rate.gram': 'Gramm Gold', 'rate.ceyrek': 'Viertel-Gold', 'rate.yarim': 'Halb-Gold', 'rate.tam': 'Ganz-Gold', 'rate.eur': 'Euro', 'rate.usd': 'Dollar', 'rate.gbp': 'Pfund', 'rate.title': 'Gold & Devisen', 'rate.updated': 'Stand',
    'ad.label': 'Anzeige',
    'cat.dugun': 'Hochzeit', 'cat.ozel-gun': 'Besonderer Tag',
    'occ.nisan': 'Verlobung', 'occ.kina': 'Henna-Abend', 'occ.sunnet': 'Beschneidungsfest', 'occ.dogum': 'Geburt', 'occ.mezuniyet': 'Abschluss', 'occ.diger': 'Besonderer Tag',
    'not.couple': 'Braut und Bräutigam', 'not.families': 'Familien', 'not.person': 'Für', 'not.occasion': 'Anlass',
  },
  nl: {
    'rate.gram': 'Gram goud', 'rate.ceyrek': 'Kwart goud', 'rate.yarim': 'Half goud', 'rate.tam': 'Heel goud', 'rate.eur': 'Euro', 'rate.usd': 'Dollar', 'rate.gbp': 'Pond', 'rate.title': 'Goud & valuta', 'rate.updated': 'Bijgewerkt',
    'ad.label': 'Advertentie',
    'cat.dugun': 'Bruiloft', 'cat.ozel-gun': 'Bijzondere dag',
    'occ.nisan': 'Verloving', 'occ.kina': 'Hennanacht', 'occ.sunnet': 'Besnijdenisfeest', 'occ.dogum': 'Geboorte', 'occ.mezuniyet': 'Diploma-uitreiking', 'occ.diger': 'Bijzondere dag',
    'not.couple': 'Bruid en bruidegom', 'not.families': 'Families', 'not.person': 'Voor', 'not.occasion': 'Gelegenheid',
  },
  fr: {
    'rate.gram': 'Or (gramme)', 'rate.ceyrek': 'Quart d’or', 'rate.yarim': 'Demi-or', 'rate.tam': 'Or entier', 'rate.eur': 'Euro', 'rate.usd': 'Dollar', 'rate.gbp': 'Livre', 'rate.title': 'Or et devises', 'rate.updated': 'Mise à jour',
    'ad.label': 'Publicité',
    'cat.dugun': 'Mariage', 'cat.ozel-gun': 'Jour spécial',
    'occ.nisan': 'Fiançailles', 'occ.kina': 'Nuit du henné', 'occ.sunnet': 'Fête de circoncision', 'occ.dogum': 'Naissance', 'occ.mezuniyet': 'Remise de diplôme', 'occ.diger': 'Jour spécial',
    'not.couple': 'Les mariés', 'not.families': 'Familles', 'not.person': 'En l’honneur de', 'not.occasion': 'Occasion',
  },
}
