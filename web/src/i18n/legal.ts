/*
  KVKK aydınlatma metni ve çerez politikası (/[lang]/gizlilik).
  Türkçe metin esastır; en, de, nl, fr çeviridir. Kurmancî ve Zazaca için Türkçe gösterilir.
  {org} → veri sorumlusu kurumların adı, {mail} → başvuru e-postası (Kurumlar kayıtlarından gelir).
  Yayına almadan önce bir hukukçuya okutulmalı.
*/
import type { Lang } from './ui'

export type LegalSection = { id?: string; h: string; p?: string[]; list?: string[] }
export type LegalText = {
  title: string; lede: string; updated: string; kvkk: string; cookies: string
  kvkkSections: LegalSection[]
  cookieIntro: string[]
  cookieHead: [string, string, string]
  cookieRows: [string, string, string][]
  cookieOutro: string[]
  noMail: string
}

const tr: LegalText = {
  title: 'Gizlilik ve KVKK',
  lede: 'Hangi kişisel verileri neden işlediğimizi, ne kadar sakladığımızı ve haklarınızı sade bir dille anlatıyoruz.',
  updated: 'Son güncelleme',
  kvkk: 'KVKK Aydınlatma Metni',
  cookies: 'Çerez Politikası',
  kvkkSections: [
    { h: 'Veri sorumlusu', p: ['6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu {org}. Bu metin, sitemizi kullanırken ve arşive katkı gönderirken işlenen kişisel verileriniz hakkında sizi bilgilendirmek için hazırlanmıştır.'] },
    { h: 'Hangi verileri işliyoruz?', list: [
      'Arşive katkı formu: adınız soyadınız, telefonunuz ve/veya e-posta adresiniz, gönderdiğiniz fotoğraf, ses, video, belge ve açıklamalar, gönderim sırasındaki IP adresiniz.',
      'Gönderilen içeriklerde yer alan kişiler: fotoğraf ve kayıtlarda görünen ya da adı geçen kişilerin görüntüsü, sesi ve adı.',
      'Güvenlik kayıtları: siteye ve yönetim paneline yapılan isteklerde IP adresi, tarih-saat ve yapılan işlem.',
      'Yönetim paneli kullanıcıları (editör ve yöneticiler): ad, e-posta ve panelde yapılan işlemler.',
    ] },
    { h: 'Hangi amaçlarla?', list: [
      'Gönderdiğiniz içeriği incelemek, doğrulamak ve gerektiğinde size ulaşmak.',
      'İzin verdiğiniz içerikleri, künyesiyle (bağışlayan adı ve kayıtta geçen kişiler dahil) dijital arşivde yayınlamak.',
      'Siteyi saldırılara, sahte gönderilere ve kötüye kullanıma karşı korumak.',
      'Yasal yükümlülüklerimizi yerine getirmek.',
    ] },
    { h: 'Hukuki sebepler', p: ['Verileriniz KVKK madde 5 uyarınca şu sebeplere dayanılarak işlenir: içeriğin arşivde yayınlanması için verdiğiniz açık rıza; formu doldurmanızla kurulan ilişkinin gereği olarak sizinle iletişim kurulması; bilgi güvenliği için veri sorumlusunun meşru menfaati; kanunlarda öngörülmesi ve hukuki yükümlülüklerin yerine getirilmesi. Telefon ve e-posta adresiniz sitede yayınlanmaz.'] },
    { h: 'Kimlere aktarılır?', p: [
      'Kişisel verileriniz satılmaz ve reklam amacıyla kimseyle paylaşılmaz. Site Türkiye’deki bir sunucuda barındırılır. Veriler yalnızca yetkili editörlerimiz tarafından görülür; kanunen yetkili kamu kurumlarına, talep halinde ve ölçülü olarak aktarılabilir.',
      'Canlı yayınlar ve bazı video kayıtları YouTube (Google) üzerinden gösterilir. Bir videoyu başlattığınızda ya da önizleme görselleri yüklendiğinde IP adresiniz Google’a iletilir. Robot doğrulaması açıksa formda Cloudflare Turnstile kullanılır ve tarayıcı bilgileriniz Cloudflare’e iletilir. Bu hizmet sağlayıcıların sunucuları yurt dışındadır.',
    ] },
    { h: 'Ne kadar saklıyoruz?', list: [
      'Arşive alınmayan gönderiler ve iletişim bilgileri: inceleme bittikten sonra en geç 1 yıl içinde silinir.',
      'Arşive alınan içerikler: arşiv yayında kaldığı sürece; iletişim bilgileriniz ayrıca en geç 2 yıl saklanır.',
      'Güvenlik kayıtları: en fazla 2 yıl.',
      'Rızanızı geri aldığınızda ilgili içerik yayından kaldırılır.',
    ] },
    { id: 'haklar', h: 'Haklarınız (KVKK madde 11)', p: ['Verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltilmesini, silinmesini veya yok edilmesini isteme, aktarıldığı kişileri öğrenme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz. Arşivde kendinizin ya da bir yakınınızın yer aldığı bir fotoğraf, kayıt veya haberin kaldırılmasını da isteyebilirsiniz.', 'Başvurularınızı şu adrese yazabilirsiniz: {mail}. Başvurunuz en geç 30 gün içinde ücretsiz olarak yanıtlanır.'] },
  ],
  cookieIntro: ['Sitemizde reklam, pazarlama veya ziyaretçi takip çerezi kullanılmaz; Google Analytics, Meta Pixel gibi araçlar yoktur. Yalnızca sitenin çalışması için gerekli, tarayıcınızda saklanan aşağıdaki kayıtlar kullanılır. Bunlar zorunlu olduğu için ayrıca onayınız istenmez.'],
  cookieHead: ['Ad', 'Ne işe yarar?', 'Süre'],
  cookieRows: [
    ['k-lang (çerez)', 'Seçtiğiniz dili hatırlar.', '1 yıl'],
    ['k-theme, k-fs (tarayıcı belleği)', 'Açık/koyu tema ve yazı boyutu tercihinizi hatırlar.', 'Siz silene kadar'],
    ['payload-token, payload-lng (çerez)', 'Yalnızca yönetim paneline giriş yapan editörler için oturum ve panel dili.', 'Oturum süresince / 1 yıl'],
    ['Cloudflare Turnstile', 'Açıksa, arşiv formunda robot gönderilerini engeller.', 'Oturum'],
  ],
  cookieOutro: ['Canlı yayın oynatıcısı siz “Yayını aç” düğmesine basana kadar yüklenmez. Bastığınızda YouTube’un gizlilik odaklı (youtube-nocookie.com) oynatıcısı açılır ve YouTube kendi çerezlerini kullanabilir.', 'Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz; bu durumda dil ve tema tercihiniz hatırlanmaz.'],
  noMail: 'Kurumlar sayfasındaki iletişim bilgileri',
}

const en: LegalText = {
  title: 'Privacy',
  lede: 'Which personal data we process and why, how long we keep it, and your rights, in plain language.',
  updated: 'Last updated',
  kvkk: 'Privacy Notice',
  cookies: 'Cookie Policy',
  kvkkSections: [
    { h: 'Data controller', p: ['The data controller under the Turkish Personal Data Protection Law No. 6698 (KVKK) and, where applicable, the EU General Data Protection Regulation (GDPR) is {org}. This notice explains how we handle your personal data when you use this site or contribute to the archive.'] },
    { h: 'What we process', list: [
      'Archive contribution form: your name, phone number and/or email, the photos, audio, video, documents and descriptions you send, and your IP address at the time of sending.',
      'People in submitted material: the image, voice and name of people who appear in or are named in photos and recordings.',
      'Security logs: IP address, date, time and action for requests to the site and the admin panel.',
      'Admin panel users (editors and administrators): name, email and actions taken in the panel.',
    ] },
    { h: 'Why', list: [
      'To review and verify your submission and to contact you if needed.',
      'To publish material you have permitted in the digital archive with its credits (including the donor’s name and the people in the record).',
      'To protect the site against attacks, fake submissions and abuse.',
      'To meet our legal obligations.',
    ] },
    { h: 'Legal basis', p: ['Your consent for publishing material in the archive; the need to contact you about a submission you made; our legitimate interest in information security; and legal obligations. Your phone number and email are never published on the site.'] },
    { h: 'Who receives it', p: [
      'We do not sell your data or share it for advertising. The site is hosted on a server in Türkiye. Only our authorised editors can see submissions; data may be disclosed to public authorities where the law requires it.',
      'Live streams and some videos are shown via YouTube (Google). When you start a video or preview images load, your IP address is sent to Google. If bot protection is enabled, the form uses Cloudflare Turnstile, which receives browser information. These providers’ servers are outside Türkiye and the EU.',
    ] },
    { h: 'How long we keep it', list: [
      'Submissions not added to the archive, and their contact details: deleted within 1 year after review.',
      'Material added to the archive: for as long as the archive is online; contact details are kept for up to 2 years.',
      'Security logs: up to 2 years.',
      'If you withdraw consent, the material is taken offline.',
    ] },
    { id: 'haklar', h: 'Your rights', p: ['You can ask whether we process your data, request access, correction or deletion, learn who it was shared with, object, and seek compensation. You can also ask us to remove a photo, recording or article in which you or a relative appears. In the EU you may also lodge a complaint with your local data protection authority.', 'Write to {mail}. We reply free of charge within 30 days.'] },
  ],
  cookieIntro: ['We do not use advertising, marketing or tracking cookies, and there is no Google Analytics, Meta Pixel or similar tool. Only the following strictly necessary items are stored in your browser, so no consent banner is needed.'],
  cookieHead: ['Name', 'Purpose', 'Duration'],
  cookieRows: [
    ['k-lang (cookie)', 'Remembers your language.', '1 year'],
    ['k-theme, k-fs (local storage)', 'Remembers light/dark theme and text size.', 'Until you clear it'],
    ['payload-token, payload-lng (cookies)', 'Session and panel language, only for editors who log in to the admin panel.', 'Session / 1 year'],
    ['Cloudflare Turnstile', 'If enabled, blocks bot submissions on the archive form.', 'Session'],
  ],
  cookieOutro: ['The live stream player does not load until you press “Load stream”. It then opens YouTube’s privacy-enhanced (youtube-nocookie.com) player, and YouTube may set its own cookies.', 'You can delete or block cookies in your browser settings; your language and theme will then not be remembered.'],
  noMail: 'the contact addresses on the Organisations page',
}

const de: LegalText = {
  title: 'Datenschutz',
  lede: 'Welche personenbezogenen Daten wir warum verarbeiten, wie lange wir sie speichern und welche Rechte Sie haben.',
  updated: 'Stand',
  kvkk: 'Datenschutzerklärung',
  cookies: 'Cookie-Richtlinie',
  kvkkSections: [
    { h: 'Verantwortlicher', p: ['Verantwortlich nach dem türkischen Datenschutzgesetz Nr. 6698 (KVKK) und, soweit anwendbar, nach der DSGVO ist {org}. Diese Erklärung beschreibt, wie wir Ihre Daten bei der Nutzung der Website und bei Beiträgen zum Archiv verarbeiten.'] },
    { h: 'Welche Daten', list: [
      'Archiv-Beitragsformular: Name, Telefonnummer und/oder E-Mail, die gesendeten Fotos, Ton- und Videoaufnahmen, Dokumente und Beschreibungen sowie Ihre IP-Adresse beim Absenden.',
      'Personen in eingesandtem Material: Bild, Stimme und Name von Personen, die auf Fotos und Aufnahmen zu sehen sind oder genannt werden.',
      'Sicherheitsprotokolle: IP-Adresse, Datum, Uhrzeit und Aktion bei Anfragen an die Website und das Verwaltungsportal.',
      'Nutzer des Verwaltungsportals (Redaktion und Verwaltung): Name, E-Mail und ausgeführte Aktionen.',
    ] },
    { h: 'Zwecke', list: [
      'Prüfung Ihres Beitrags und Kontaktaufnahme bei Rückfragen.',
      'Veröffentlichung freigegebener Inhalte im digitalen Archiv mit Angaben (einschließlich Name der spendenden Person und der abgebildeten Personen).',
      'Schutz der Website vor Angriffen, Spam und Missbrauch.',
      'Erfüllung gesetzlicher Pflichten.',
    ] },
    { h: 'Rechtsgrundlagen', p: ['Ihre Einwilligung zur Veröffentlichung im Archiv (Art. 6 Abs. 1 lit. a DSGVO); die Bearbeitung Ihres Beitrags (lit. b); unser berechtigtes Interesse an IT-Sicherheit (lit. f); gesetzliche Pflichten (lit. c). Telefonnummer und E-Mail werden nie veröffentlicht.'] },
    { h: 'Empfänger', p: [
      'Wir verkaufen Ihre Daten nicht und geben sie nicht zu Werbezwecken weiter. Die Website wird auf einem Server in der Türkei betrieben; die Übermittlung aus der EU in die Türkei erfolgt auf Grundlage Ihrer Einwilligung bzw. zur Bearbeitung Ihres Beitrags. Nur befugte Redakteure sehen Einsendungen; Behörden erhalten Daten nur, wenn das Gesetz es verlangt.',
      'Livestreams und einige Videos werden über YouTube (Google) gezeigt. Wenn Sie ein Video starten oder Vorschaubilder geladen werden, wird Ihre IP-Adresse an Google übermittelt. Ist der Bot-Schutz aktiv, nutzt das Formular Cloudflare Turnstile, das Browserdaten erhält.',
    ] },
    { h: 'Speicherdauer', list: [
      'Nicht ins Archiv übernommene Beiträge und Kontaktdaten: Löschung spätestens 1 Jahr nach der Prüfung.',
      'Ins Archiv übernommene Inhalte: solange das Archiv online ist; Kontaktdaten höchstens 2 Jahre.',
      'Sicherheitsprotokolle: höchstens 2 Jahre.',
      'Bei Widerruf der Einwilligung wird der Inhalt offline genommen.',
    ] },
    { id: 'haklar', h: 'Ihre Rechte', p: ['Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch sowie auf Widerruf Ihrer Einwilligung. Sie können auch verlangen, dass ein Foto, eine Aufnahme oder ein Artikel, in dem Sie oder Angehörige vorkommen, entfernt wird. Sie können sich zudem bei einer Datenschutzaufsichtsbehörde beschweren.', 'Schreiben Sie an {mail}. Wir antworten kostenlos innerhalb von 30 Tagen.'] },
  ],
  cookieIntro: ['Wir verwenden keine Werbe-, Marketing- oder Tracking-Cookies; es gibt kein Google Analytics, kein Meta Pixel o. Ä. Gespeichert werden nur die folgenden technisch notwendigen Einträge, für die keine Einwilligung erforderlich ist.'],
  cookieHead: ['Name', 'Zweck', 'Dauer'],
  cookieRows: [
    ['k-lang (Cookie)', 'Speichert Ihre Sprachwahl.', '1 Jahr'],
    ['k-theme, k-fs (lokaler Speicher)', 'Speichert helles/dunkles Design und Schriftgröße.', 'Bis Sie es löschen'],
    ['payload-token, payload-lng (Cookies)', 'Sitzung und Sprache des Verwaltungsportals, nur für angemeldete Redakteure.', 'Sitzung / 1 Jahr'],
    ['Cloudflare Turnstile', 'Falls aktiv: verhindert Bot-Einsendungen im Archivformular.', 'Sitzung'],
  ],
  cookieOutro: ['Der Livestream-Player wird erst geladen, wenn Sie auf „Stream laden“ klicken. Dann öffnet sich der datenschutzfreundliche Player von YouTube (youtube-nocookie.com); YouTube kann eigene Cookies setzen.', 'Sie können Cookies in Ihren Browsereinstellungen löschen oder blockieren; Sprache und Design werden dann nicht gespeichert.'],
  noMail: 'die Kontaktadressen auf der Seite „Organisationen“',
}

const nl: LegalText = {
  title: 'Privacy',
  lede: 'Welke persoonsgegevens we verwerken en waarom, hoe lang we ze bewaren en welke rechten u heeft.',
  updated: 'Laatst bijgewerkt',
  kvkk: 'Privacyverklaring',
  cookies: 'Cookiebeleid',
  kvkkSections: [
    { h: 'Verwerkingsverantwoordelijke', p: ['Verantwoordelijk volgens de Turkse privacywet nr. 6698 (KVKK) en, waar van toepassing, de AVG is {org}. Deze verklaring legt uit hoe we uw gegevens verwerken wanneer u de site gebruikt of bijdraagt aan het archief.'] },
    { h: 'Welke gegevens', list: [
      'Bijdrageformulier: naam, telefoonnummer en/of e-mail, de foto’s, geluids- en video-opnamen, documenten en beschrijvingen die u stuurt, en uw IP-adres bij verzending.',
      'Personen in ingestuurd materiaal: beeld, stem en naam van personen die op foto’s en opnamen staan of genoemd worden.',
      'Beveiligingslogs: IP-adres, datum, tijd en handeling bij verzoeken aan de site en het beheerpaneel.',
      'Gebruikers van het beheerpaneel (redactie en beheer): naam, e-mail en uitgevoerde handelingen.',
    ] },
    { h: 'Doeleinden', list: [
      'Uw bijdrage beoordelen en zo nodig contact met u opnemen.',
      'Toegestaan materiaal met vermelding (inclusief naam van de schenker en de personen in de opname) in het digitale archief publiceren.',
      'De site beschermen tegen aanvallen, spam en misbruik.',
      'Voldoen aan wettelijke verplichtingen.',
    ] },
    { h: 'Rechtsgronden', p: ['Uw toestemming voor publicatie in het archief; de afhandeling van uw bijdrage; ons gerechtvaardigd belang bij informatiebeveiliging; wettelijke verplichtingen. Telefoonnummer en e-mail worden nooit gepubliceerd.'] },
    { h: 'Ontvangers', p: [
      'We verkopen uw gegevens niet en delen ze niet voor reclame. De site draait op een server in Turkije. Alleen bevoegde redacteuren zien inzendingen; overheden ontvangen gegevens alleen als de wet dat vereist.',
      'Livestreams en sommige video’s worden via YouTube (Google) getoond. Als u een video start of voorbeeldafbeeldingen laden, wordt uw IP-adres naar Google gestuurd. Als botbescherming aan staat, gebruikt het formulier Cloudflare Turnstile, dat browsergegevens ontvangt.',
    ] },
    { h: 'Bewaartermijn', list: [
      'Inzendingen die niet in het archief komen, en contactgegevens: uiterlijk 1 jaar na beoordeling verwijderd.',
      'Materiaal in het archief: zolang het archief online is; contactgegevens maximaal 2 jaar.',
      'Beveiligingslogs: maximaal 2 jaar.',
      'Trekt u uw toestemming in, dan wordt het materiaal offline gehaald.',
    ] },
    { id: 'haklar', h: 'Uw rechten', p: ['U heeft recht op inzage, correctie, verwijdering, beperking, overdraagbaarheid en bezwaar, en u kunt uw toestemming intrekken. U kunt ook vragen een foto, opname of artikel waarin u of een familielid voorkomt te verwijderen. U kunt een klacht indienen bij de Autoriteit Persoonsgegevens.', 'Schrijf naar {mail}. We antwoorden kosteloos binnen 30 dagen.'] },
  ],
  cookieIntro: ['We gebruiken geen advertentie-, marketing- of trackingcookies en geen Google Analytics, Meta Pixel of iets vergelijkbaars. Alleen de volgende strikt noodzakelijke gegevens worden in uw browser opgeslagen; daarvoor is geen toestemming nodig.'],
  cookieHead: ['Naam', 'Doel', 'Duur'],
  cookieRows: [
    ['k-lang (cookie)', 'Onthoudt uw taal.', '1 jaar'],
    ['k-theme, k-fs (lokale opslag)', 'Onthoudt licht/donker thema en tekstgrootte.', 'Tot u het wist'],
    ['payload-token, payload-lng (cookies)', 'Sessie en taal van het beheerpaneel, alleen voor ingelogde redacteuren.', 'Sessie / 1 jaar'],
    ['Cloudflare Turnstile', 'Indien actief: blokkeert botinzendingen in het archiefformulier.', 'Sessie'],
  ],
  cookieOutro: ['De livestreamspeler laadt pas als u op “Stream laden” klikt. Dan opent de privacyvriendelijke speler van YouTube (youtube-nocookie.com); YouTube kan eigen cookies plaatsen.', 'U kunt cookies in uw browserinstellingen wissen of blokkeren; taal en thema worden dan niet onthouden.'],
  noMail: 'de contactadressen op de pagina Organisaties',
}

const fr: LegalText = {
  title: 'Confidentialité',
  lede: 'Quelles données personnelles nous traitons et pourquoi, combien de temps nous les conservons et quels sont vos droits.',
  updated: 'Mise à jour',
  kvkk: 'Politique de confidentialité',
  cookies: 'Politique relative aux cookies',
  kvkkSections: [
    { h: 'Responsable du traitement', p: ['Le responsable du traitement au sens de la loi turque n° 6698 (KVKK) et, le cas échéant, du RGPD est {org}. Ce texte explique comment nous traitons vos données lorsque vous utilisez le site ou contribuez aux archives.'] },
    { h: 'Données traitées', list: [
      'Formulaire de contribution : nom, téléphone et/ou e-mail, photos, enregistrements audio et vidéo, documents et descriptions envoyés, et votre adresse IP lors de l’envoi.',
      'Personnes figurant dans les contenus : image, voix et nom des personnes visibles ou citées dans les photos et enregistrements.',
      'Journaux de sécurité : adresse IP, date, heure et action pour les requêtes vers le site et l’espace d’administration.',
      'Utilisateurs de l’espace d’administration (rédaction et administration) : nom, e-mail et actions effectuées.',
    ] },
    { h: 'Finalités', list: [
      'Examiner votre contribution et vous contacter si nécessaire.',
      'Publier les contenus autorisés dans les archives numériques avec leurs mentions (y compris le nom du donateur et des personnes figurant dans l’enregistrement).',
      'Protéger le site contre les attaques, les envois frauduleux et les abus.',
      'Respecter nos obligations légales.',
    ] },
    { h: 'Bases juridiques', p: ['Votre consentement à la publication dans les archives ; le traitement de votre contribution ; notre intérêt légitime à la sécurité informatique ; nos obligations légales. Votre téléphone et votre e-mail ne sont jamais publiés.'] },
    { h: 'Destinataires', p: [
      'Nous ne vendons pas vos données et ne les partageons pas à des fins publicitaires. Le site est hébergé sur un serveur en Turquie. Seuls nos rédacteurs autorisés voient les envois ; les autorités ne reçoivent des données que si la loi l’exige.',
      'Les directs et certaines vidéos sont diffusés via YouTube (Google). Lorsque vous lancez une vidéo ou que des miniatures se chargent, votre adresse IP est transmise à Google. Si la protection anti-robots est active, le formulaire utilise Cloudflare Turnstile, qui reçoit des informations sur le navigateur.',
    ] },
    { h: 'Durée de conservation', list: [
      'Envois non retenus pour les archives et coordonnées : supprimés au plus tard 1 an après examen.',
      'Contenus versés aux archives : tant que les archives sont en ligne ; coordonnées conservées 2 ans au plus.',
      'Journaux de sécurité : 2 ans au plus.',
      'Si vous retirez votre consentement, le contenu est retiré du site.',
    ] },
    { id: 'haklar', h: 'Vos droits', p: ['Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, de portabilité et d’opposition, et pouvez retirer votre consentement. Vous pouvez aussi demander le retrait d’une photo, d’un enregistrement ou d’un article où vous ou un proche apparaissez. Vous pouvez introduire une réclamation auprès de la CNIL.', 'Écrivez à {mail}. Nous répondons gratuitement sous 30 jours.'] },
  ],
  cookieIntro: ['Nous n’utilisons aucun cookie publicitaire, marketing ou de suivi, ni Google Analytics, Meta Pixel ou équivalent. Seuls les éléments strictement nécessaires ci-dessous sont enregistrés dans votre navigateur ; ils ne requièrent pas votre consentement.'],
  cookieHead: ['Nom', 'Finalité', 'Durée'],
  cookieRows: [
    ['k-lang (cookie)', 'Mémorise votre langue.', '1 an'],
    ['k-theme, k-fs (stockage local)', 'Mémorise le thème clair/sombre et la taille du texte.', 'Jusqu’à suppression'],
    ['payload-token, payload-lng (cookies)', 'Session et langue de l’espace d’administration, uniquement pour les rédacteurs connectés.', 'Session / 1 an'],
    ['Cloudflare Turnstile', 'Si actif : bloque les envois automatisés dans le formulaire.', 'Session'],
  ],
  cookieOutro: ['Le lecteur du direct ne se charge que lorsque vous cliquez sur « Charger le direct ». Il ouvre alors le lecteur à confidentialité renforcée de YouTube (youtube-nocookie.com) ; YouTube peut déposer ses propres cookies.', 'Vous pouvez supprimer ou bloquer les cookies dans votre navigateur ; votre langue et votre thème ne seront alors plus mémorisés.'],
  noMail: 'l’une des adresses de la page Organisations',
}

/** Kurmancî ve Zazaca: hukuki metin Türkçe gösterilir */
export const LEGAL: Record<Lang, LegalText> = { tr, ku: tr, zza: tr, en, de, nl, fr }
/** Metnin son güncellenme tarihi (metin değişince güncelleyin) */
export const LEGAL_UPDATED = '2026-11-19'
