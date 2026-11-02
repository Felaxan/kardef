/*
  Maket modu: Vercel'de (ya da DEMO_MODE=1 ile) site, projedeki demo/ klasöründen
  salt okunur çalışır. Yönetim paneli ve içerik yazma kapalıdır.
  Maket verisini yenilemek için: node scripts/make-demo-db.mjs
*/
export const DEMO = process.env.DEMO_MODE === '1' || (!!process.env.VERCEL && process.env.DEMO_MODE !== '0')
