#!/usr/bin/env node
/*
  Alan adı kontrol aracı
  ----------------------
  Bir alan adının boşta olup olmadığını, alınmışsa ne zaman bittiğini gösterir.
  Ek paket gerekmez, Node.js 18+ yeterli.

  Kullanım:
    node tools/alan-adi-kontrol.mjs karakocan
        -> karakocan.org.tr, .com.tr, .org, .com, .net, .eu, .de hepsini dener
    node tools/alan-adi-kontrol.mjs karakocan kardef avkardep
        -> birden fazla isim
    node tools/alan-adi-kontrol.mjs karakocan.org.tr kardef.org
        -> sadece yazılan tam adresler
    node tools/alan-adi-kontrol.mjs karakocan --uzanti org.tr,org
        -> sadece seçilen uzantılar

  Kaynaklar:
    .tr uzantıları  -> TRABİS WHOIS (whois.trabis.gov.tr)
    .org .com .net  -> RDAP (IANA listesinden bulunan resmi sunucu)
    .eu             -> EURid WHOIS
    .de             -> DENIC WHOIS
*/
import net from 'node:net';
import { domainToASCII } from 'node:url';

const VARSAYILAN_UZANTILAR = ['org.tr', 'com.tr', 'org', 'com', 'net', 'eu', 'de'];
const WHOIS = {
  tr: { sunucu: 'whois.trabis.gov.tr', bos: /no match found/i, bitis: /Expires on\.*:\s*([^\r\n]+?)\.?\s*$/im },
  eu: { sunucu: 'whois.eu', bos: /Status:\s*AVAILABLE/i, bitis: null },
  de: { sunucu: 'whois.denic.de', bos: /Status:\s*free/i, bitis: null }
};

// ---------- Argümanlar ----------
const argv = process.argv.slice(2);
let uzantilar = VARSAYILAN_UZANTILAR;
const isimler = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--uzanti' || argv[i] === '-u') { uzantilar = (argv[++i] || '').split(',').map(s => s.trim().replace(/^\./, '')).filter(Boolean); }
  else if (argv[i] === '--yardim' || argv[i] === '-h') { isimler.length = 0; break; }
  else isimler.push(argv[i]);
}
if (!isimler.length) {
  console.log('Kullanım: node tools/alan-adi-kontrol.mjs <isim veya alan adı> [...] [--uzanti org.tr,org]');
  console.log('Örnek:    node tools/alan-adi-kontrol.mjs karakocan kardef');
  process.exit(0);
}

const adaylar = [];
for (const isim of isimler) {
  const temiz = isim.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (temiz.includes('.')) adaylar.push(temiz);
  else for (const u of uzantilar) adaylar.push(`${temiz}.${u}`);
}

// ---------- Sorgular ----------
function whoisSorgu(sunucu, sorgu) {
  return new Promise((resolve, reject) => {
    let veri = '';
    const s = net.connect(43, sunucu, () => s.write(sorgu + '\r\n'));
    s.setEncoding('utf8');
    s.setTimeout(10000, () => { s.destroy(); reject(new Error('zaman aşımı')); });
    s.on('data', c => { veri += c; });
    s.on('end', () => resolve(veri));
    s.on('error', reject);
  });
}

let rdapListesi = null;
async function rdapSunucusu(tld) {
  if (!rdapListesi) rdapListesi = await fetch('https://data.iana.org/rdap/dns.json').then(r => r.json());
  const kayit = rdapListesi.services.find(s => s[0].includes(tld));
  return kayit ? kayit[1][0] : null;
}

function tarih(s) {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d) ? s : d.toISOString().slice(0, 10);
}

async function kontrol(alanAdi) {
  const ascii = domainToASCII(alanAdi);
  if (!ascii) return { alanAdi, durum: 'GEÇERSİZ', bilgi: 'Alan adı yazımı hatalı' };
  const parcalar = ascii.split('.');
  const tld = parcalar[parcalar.length - 1];

  try {
    if (WHOIS[tld]) {
      const w = WHOIS[tld];
      const cevap = await whoisSorgu(w.sunucu, ascii);
      if (w.bos.test(cevap)) return { alanAdi, durum: 'BOŞ', bilgi: '' };
      const m = w.bitis && cevap.match(w.bitis);
      return { alanAdi, durum: 'ALINMIŞ', bilgi: m ? 'bitiş ' + m[1].trim() : '' };
    }
    const taban = await rdapSunucusu(tld);
    if (!taban) return { alanAdi, durum: 'BİLİNMİYOR', bilgi: `.${tld} için sorgu sunucusu yok` };
    const r = await fetch(taban.replace(/\/?$/, '/') + 'domain/' + ascii, { headers: { accept: 'application/rdap+json' } });
    if (r.status === 404) return { alanAdi, durum: 'BOŞ', bilgi: '' };
    if (!r.ok) return { alanAdi, durum: 'BİLİNMİYOR', bilgi: 'sunucu cevabı ' + r.status };
    const j = await r.json();
    const bitis = (j.events || []).find(e => e.eventAction === 'expiration');
    return { alanAdi, durum: 'ALINMIŞ', bilgi: bitis ? 'bitiş ' + tarih(bitis.eventDate) : '' };
  } catch (e) {
    return { alanAdi, durum: 'HATA', bilgi: e.message };
  }
}

// ---------- Çıktı ----------
const renk = process.stdout.isTTY
  ? { BOŞ: s => `\x1b[32m${s}\x1b[0m`, ALINMIŞ: s => `\x1b[31m${s}\x1b[0m`, def: s => `\x1b[33m${s}\x1b[0m` }
  : { BOŞ: s => s, ALINMIŞ: s => s, def: s => s };

const sonuclar = [];
for (const a of adaylar) sonuclar.push(await kontrol(a)); // sırayla: sunucuları yormamak için

const gen = Math.max(...sonuclar.map(s => s.alanAdi.length), 9) + 2;
console.log('\nAlan adı'.padEnd(gen + 1) + 'Durum'.padEnd(12) + 'Bilgi');
console.log('-'.repeat(gen + 32));
for (const s of sonuclar) {
  const boya = renk[s.durum] || renk.def;
  console.log(s.alanAdi.padEnd(gen) + boya(s.durum.padEnd(12)) + s.bilgi);
}
const bos = sonuclar.filter(s => s.durum === 'BOŞ').length;
console.log(`\n${bos} boş, ${sonuclar.length - bos} alınmış veya bilinmiyor.`);
console.log('Not: "BOŞ" sonucu anlık durumdur; satın almadan önce kayıt firmasının sitesinde de kontrol edin.\n');
