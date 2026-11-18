# Yayına hazırlık özellikleri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zazaca dili, reklam alanları, kur şeridi, canlı yayın, yeni duyuru türleri ve ziyaretçi arşiv katkı formunu mevcut siteye eklemek.

**Architecture:** Hepsi `web/` içindeki Next.js 16 + Payload 3.91 uygulamasında; yeni Payload koleksiyon/globalleri, `[lang]` altında yeni sayfalar, saf mantık `src/lib/*` içinde test edilebilir modüller.

**Tech Stack:** Next.js 16 (App Router), Payload 3.91, SQLite (`@payloadcms/db-sqlite`), React 19, testler `tsx --test` (node:test).

**Spec:** `docs/superpowers/specs/2026-11-18-yayina-hazirlik-design.md`

## Global Constraints

- Kod yazmadan önce ilgili Next.js 16 rehberi `web/node_modules/next/dist/docs/` içinden okunur.
- Roller: `admin`, `editor`, `author`. Reklamlar yalnızca `admin`; canlı yayın `admin`+`editor`; gelen katkılar `admin`+`editor`.
- Zazaca dil kodu `zza`, etiket "Kirmanckî (Zazaki)"; otomatik çeviri `zza`'yı atlar; fallback Türkçe.
- Reklam yeri başına en fazla 20 reklam; dönme süresi 3–60 sn, varsayılan 8.
- Kur şeridi 30 dk (1800 sn) önbellek; kalemler gram, çeyrek, yarım, tam altın, EUR, USD, GBP.
- Katkı formu: en fazla 10 dosya, her biri en fazla 50 MB; resim/ses/video/PDF; IP başına saatte 5 gönderim.
- `DEMO` maket modunda form ve tüm yazma kapalı.
- Adaptöre özel SQL yok (PostgreSQL'e geçiş kolay kalsın). Yeni ücretli servis yok.
- Yeni ekranlar açık/koyu temada okunur ve animasyonludur; mevcut site CSS dilini kullanır.

## Review Focus

- Editör/yazar oturumuyla `/api/ad-slots` üzerine POST/PATCH → 403 olmalı (Task 3 testi).
- Kur kaynağı zaman aşımı/bozuk JSON → son iyi veri ya da şerit gizli, sayfa hatasız (Task 4 testi).
- Ziyaretçinin onaysız dosyası `/api/submission-files/file/...` ile açılmamalı (Task 6 testi).
- 51 MB dosya, `.exe` uzantısı, 11 dosya, izin kutusu boş → gönderim reddi ve anlaşılır mesaj (Task 6 testi).
- Zazaca sayfada çevrilmemiş içerik → Türkçe görünür, boş değil (Task 1 doğrulaması).

---

### Task 1: Zazaca dili

**Files:**
- Modify: `web/src/i18n/ui.ts` (LOCALES, LANG_NAMES, `extra.zza`, `decadeLabel`, `fmt`)
- Modify: `web/src/i18n/ui-dict.json` (`dict.zza`, `zza.months`, `zza.days`)
- Modify: `web/src/payload.config.ts` (localization.locales), `web/src/proxy.ts` (LANGS)
- Modify: `web/src/components/admin/TranslationStatus.tsx` (Zazaca: "elle girilecek")
- Create: `web/src/i18n/ui.test.ts`; Modify `web/package.json` script `"test": "tsx --test src/**/*.test.ts"`

**Interfaces:** Produces `Lang` now including `'zza'`; every later task's labels must have a `zza` entry (fallback to `tr` is automatic via `t`).

- [ ] Step 1: Test `isLang('zza') === true`, `fmt('zza', '2026-01-15T10:00:00Z','dm')` contains first month name from `zza.months`, `decadeLabel('zza',1980)` is a non-empty string.
- [ ] Step 2: `npm test` → FAIL.
- [ ] Step 3: Implement. `fmt` handles `zza` like `ku` (manual month/day arrays). Zazaca UI strings drafted from Turkish; top of `dict.zza` block gets `"_note": "Zazaca taslak — Zazaca bilen biri kontrol etmeli"`.
- [ ] Step 4: `npm test` → PASS; `/zza` page loads, untranslated content shows Turkish.
- [ ] Step 5: Commit.

### Task 2: Düğün ve Özel gün duyuruları

**Files:** Modify `web/src/collections/Announcements.ts`, `web/src/app/(frontend)/[lang]/duyuru/[slug]/page.tsx`, `web/src/app/(frontend)/[lang]/details.css`, `web/src/i18n/ui.ts` (keys `cat.dugun`, `cat.ozel-gun`, `not.couple`, `not.families`, `not.occasion`, occasion kinds).

- [ ] Step 1: Add types `dugun`, `ozel-gun`. Groups: `dugun {bride, groom, families(textarea), village(rel villages), date(dayAndTime), place}`; `ozelGun {kind: nisan|kina|sunnet|dogum|mezuniyet|diger, person, date(dayAndTime), place}`; conditions on `type`.
- [ ] Step 2: Detail page renders info card for each (DateTile + dl like `toplanti`); badge colors in CSS for `.cat.dugun`, `.cat.ozel-gun`, `.an--dugun`, `.an--ozel-gun`.
- [ ] Step 3: Verify in browser with a seeded example of each. Commit.

### Task 3: Reklam alanları

**Files:**
- Create: `web/src/lib/ads.ts`, `web/src/lib/ads.test.ts`, `web/src/collections/AdSlots.ts`, `web/src/components/site/AdSlot.tsx` (client), CSS in `site.css`
- Modify: `payload.config.ts` (collections), `layout.tsx` + home `page.tsx` + `haberler/page.tsx` + `haber/[slug]/page.tsx` (placements)

**Interfaces:**
- Produces: `type Ad = { image: string; mobileImage?: string|null; link?: string|null; advertiser: string; startsAt?: string|null; endsAt?: string|null; active: boolean }`; `activeAds(ads: Ad[], now: Date): Ad[]`; `clampSeconds(n: unknown): number` (3–60, default 8); `getSlot(key: 'top'|'feed'|'side', lang): Promise<{ seconds: number; ads: Ad[] } | null>`.

- [ ] Step 1: Tests: `activeAds` drops inactive, not-yet-started, ended (endsAt < now) ads and keeps open-ended ones; `clampSeconds(1)===3`, `(99)===60`, `(undefined)===8`.
- [ ] Step 2: FAIL → implement `ads.ts` → PASS.
- [ ] Step 3: Collection `ad-images` (upload, `staticDir: 'ad-images'`, read `anyone`, write `isAdmin`, `admin.hidden: onlyAdminSees`). Collection `ad-slots` (labels "Reklam yeri/Reklam yerleri", group "Yönetim"): fields `key` select top|feed|side unique, `name`, `enabled`, `seconds` number min 3 max 60 default 8, `ads` array `maxRows: 20` (image/mobileImage → `ad-images`). Access: read/create/update/delete `isAdmin`; `admin.hidden: onlyAdminSees`. `getSlot` reads with `overrideAccess: true` on the server only.
- [ ] Step 4: Test via local API: user with role `editor` → `payload.find`/`update` on `ad-slots` with `overrideAccess:false, user` throws Forbidden.
- [ ] Step 5: `AdSlot` client component: one ad static; several rotate every `seconds` with fade, pause on hover, "Reklam" label, `rel="sponsored noopener"` target `_blank`; returns null when empty; respects `prefers-reduced-motion`.
- [ ] Step 6: Place `top` under header (layout), `feed` between home sections and inside news list, `side` beside news detail. Browser check 1 and 3 ads. Commit.

### Task 4: Kur şeridi

**Files:** Create `web/src/lib/rates.ts`, `web/src/lib/rates.test.ts`, `web/src/components/site/RatesTicker.tsx`; Modify `web/src/globals/index.ts` (site-settings group `rates {enabled, items[]}`), `Header.tsx`/`layout.tsx`, `site.css`.

**Interfaces:**
- Produces: `type RateKey = 'gram'|'ceyrek'|'yarim'|'tam'|'eur'|'usd'|'gbp'`; `type Rate = { key: RateKey; sell: number; change: number }`; `parseRates(json: unknown): Rate[]` (source adapter); `getRates(): Promise<{ rates: Rate[]; updatedAt: string } | null>`.

- [ ] Step 1: Tests: `parseRates` maps a fixture of the source JSON to 7 rates with numbers (Turkish decimal strings "6.123,45" → 6123.45); bad JSON shape → `[]`.
- [ ] Step 2: FAIL → implement adapter for Truncgil Finans `https://finans.truncgil.com/v4/today.json` (keys `GRA`, `CEYREKALTIN`, `YARIMALTIN`, `TAMALTIN`, `EUR`, `USD`, `GBP`; confirm by fetching once) → PASS.
- [ ] Step 3: `getRates` uses `fetch(url, { next: { revalidate: 1800 } })` with 5 s timeout; on failure returns last good value kept in module memory, else `null`.
- [ ] Step 4: `RatesTicker` thin scrolling strip above breaking ticker; arrows by sign of `change`; paused under reduced motion; shows "güncelleme HH:MM". Hidden when `null` or `enabled` false. Admin chooses items.
- [ ] Step 5: Browser check light/dark. Commit.

### Task 5: Canlı yayın

**Files:** Create `web/src/lib/youtube.ts` (+test; move `youTubeId` from `cms.ts`, re-export), `web/src/globals/Live.ts`, `web/src/app/(frontend)/[lang]/canli/page.tsx`, `web/src/components/site/LiveBox.tsx`; Modify `payload.config.ts`, `Header.tsx` navItems (+ `live` flag), home `page.tsx`, CSS, ui strings (`nav.canli`, `live.*`).

**Interfaces:** `youTubeId(url?: string|null): string|null` (watch, youtu.be, shorts, embed, live/). Global slug `live`: `isLive`, `url`, `title`(localized), `description`(localized), `next {date, title(localized)}`, `past[] {title, url, date}`. Access read anyone, update admin|editor; hidden from authors.

- [ ] Step 1: Tests for `youTubeId` incl. `https://www.youtube.com/live/abcdefghijk?si=x` → `abcdefghijk`.
- [ ] Step 2: FAIL → implement → PASS.
- [ ] Step 3: Page: live → responsive iframe `youtube-nocookie.com/embed/{id}?autoplay=1`; not live → next broadcast card + past list. Nav item "Canlı" always present; red pulsing dot when live. Home: LiveBox at top when live.
- [ ] Step 4: Browser check both states. Commit.

### Task 6: Arşive katkı formu

**Files:**
- Create: `web/src/lib/submission.ts` (+test), `web/src/collections/Submissions.ts`, `web/src/collections/SubmissionFiles.ts`, `web/src/app/(frontend)/[lang]/arsive-katki/page.tsx`, `web/src/app/(frontend)/[lang]/arsive-katki/gonder/route.ts`, `web/src/components/site/ContributeForm.tsx` (client), `web/src/components/admin/ConvertSubmission.tsx`, `web/src/components/admin/SubmissionCount.tsx`
- Modify: `payload.config.ts`, all `#katki` links → `/{lang}/arsive-katki`, ui strings, CSS.

**Interfaces:**
- `validateSubmission(fields: Record<string,string>, files: {name:string; type:string; size:number}[]): { ok: true } | { ok: false; errors: string[] }` — error keys: `name`, `contact`, `description`, `consent`, `files.count`, `files.size`, `files.type`.
- `rateLimit(ip: string, now: number): boolean` (5/saat, bellek içi).
- Collection `submissions`: name, phone, email, village(rel), kind, year, description, link, consent, files (rel `submission-files` hasMany), status new|review|done|rejected (default new), note, ip (hidden), archiveItem (rel archive). Access: create none via API (route uses overrideAccess), read/update/delete admin|editor; hidden from authors.
- Collection `submission-files`: upload `staticDir: 'submissions'`, read admin|editor only, no public URL.

- [ ] Step 1: Tests: valid input ok; missing consent → `consent`; no phone & no email → `contact`; 11 files → `files.count`; 51 MB → `files.size`; `application/x-msdownload` → `files.type`; `rateLimit` 6th call within hour false.
- [ ] Step 2: FAIL → implement → PASS.
- [ ] Step 3: Route `POST`: refuses in DEMO (403); honeypot field `website` non-empty → silent 200; Turnstile verify when `TURNSTILE_SECRET` set; validate; create files then submission with `overrideAccess: true`; returns `{ ok: true }` or `{ ok:false, errors }` (400) / 429.
- [ ] Step 4: Test: anonymous `GET /api/submission-files/file/<name>` → 403.
- [ ] Step 5: Form page: fields per spec, file picker with live list and size, inline errors in user's language, success screen, Turnstile widget when `NEXT_PUBLIC_TURNSTILE_SITEKEY` set.
- [ ] Step 6: Admin: "Arşive aktar" button (edit view `beforeDocumentControls`/UI field) → server endpoint creates ONE draft `archive` doc (type from `kind`: photo→photo, audio→audio, video→video, document/other→document; title from description, donor=name, permission true, village, all files copied into `media`), sets status `done` and `archiveItem`. Nav count of `new` items via `beforeNavLinks` component visible to admin|editor.
- [ ] Step 7: Browser: submit with a photo, see it in panel, convert, confirm draft archive exists and nothing is public. Commit.

### Task 7: Seed, tipler, derleme, doğrulama

- [ ] Step 1: Seed: 3 ad slots (one sample ad in `top`), `live` global (not live, one past item), one `dugun` and one `ozel-gun` announcement.
- [ ] Step 2: `npm run generate:types && npm run generate:importmap && npm test && npm run lint && npm run build` → all succeed.
- [ ] Step 3: Extend `scripts/make-demo-db.mjs` to `DELETE` submissions (+rels) and submission files rows and skip copying `submissions/` folder; copy `ad-images/` into `demo/ad-images` and point `AdImages.staticDir` to it in DEMO like `Media`. Run it to refresh maket DB; `DEMO_MODE=1` build still works and form says closed.
- [ ] Step 4: Browser pass in tr/zza/de, light+dark, mobile width. Commit.
