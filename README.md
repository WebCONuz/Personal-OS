# Personal OS

Shaxsiy rivojlanish platformasi: **maqsad → haftalik reja → kundalik harakat → natija → tahlil → keyingi reja**.

Maqsadlar, haftalik rejalashtirish, vazifalar, vaqt kuzatuvi, karyera, biznes loyihalari, ta’lim, moliya, odatlar
va statistika bitta ilovada jamlangan. Backend yo‘q: barcha ma’lumotlar brauzerning `localStorage` xotirasida
saqlanadi va JSON eksport/import orqali zaxiralanadi.

## Mundarija

- [Ishga tushirish](#ishga-tushirish)
- [Stack](#stack)
- [Imkoniyatlar](#imkoniyatlar)
- [Arxitektura](#arxitektura)
- [Ma’lumotlar qatlami](#malumotlar-qatlami)
- [Domen qoidalari](#domen-qoidalari)
- [Dasturchi uchun qo‘llanma](#dasturchi-uchun-qollanma)
- [Testlar va sifat](#testlar-va-sifat)
- [Keyingi bosqichlar va cheklovlar](#keyingi-bosqichlar-va-cheklovlar)

## Ishga tushirish

Talablar: Node.js 20+ (Node 25 bilan sinovdan o‘tgan), npm.

```bash
npm install
npm run dev
```

Ilova <http://localhost:5173> manzilida ochiladi. Birinchi kirishda `/welcome` sahifasi bo‘sh ish maydoni yoki
demo ma’lumotlar bilan boshlashni taklif qiladi.

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Dev server (Vite, HMR) |
| `npm run build` | `tsc -b` + `vite build` → `dist/` |
| `npm run preview` | Build natijasini lokal ko‘rish |
| `npm run typecheck` | Faqat TypeScript tekshiruvi |
| `npm run lint` | `oxlint src` |
| `npm run test` | Vitest — barcha testlar bir marta |
| `npm run test:watch` | Vitest — kuzatuv rejimi |

### Statik hostingga joylash

`dist/` papkasini istalgan statik hostingga qo‘yish mumkin. Ilova `BrowserRouter` ishlatadi, shuning uchun barcha
yo‘llar `index.html`ga yo‘naltirilishi kerak (Netlify uchun `public/_redirects` tayyor; Vercel/Nginx’da SPA fallback
sozlanadi). Hostingga joylash ma’lumotlarni qurilmalar o‘rtasida **sinxronlamaydi** — har bir brauzer o‘z
ma’lumotlarini saqlaydi.

## Stack

| Soha | Texnologiya |
|---|---|
| Build | Vite 8, TypeScript 6 |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix, `radix-nova` uslubi), lucide-react, Geist shrifti |
| Routing | React Router 8 (`createBrowserRouter`, har bir bo‘lim lazy chunk) |
| State | Zustand 5 |
| Formalar | React Hook Form + Zod 4 |
| Grafiklar | Recharts 3 |
| Sana | date-fns 4 |
| Boshqa | sonner (toast), cmdk (Ctrl/⌘+K qidiruv), react-markdown |
| Test | Vitest 4, Testing Library, jsdom, axe-core |
| Lint | oxlint |

`@/` aliasi `src/` papkasiga ishora qiladi (`vite.config.ts`, `tsconfig.app.json`).

## Imkoniyatlar

| Bo‘lim | Yo‘l | Imkoniyatlar |
|---|---|---|
| Onboarding | `/welcome` | Bo‘sh ish maydoni yoki demo ma’lumotlar; ism |
| Dashboard | `/` | Salomlashuv, bugungi 3 ta vazifa, haftalik progress va ustuvorliklar, faol maqsadlar, XP/daraja/streak, vaqt taqsimoti, oylik moliya (valyuta bo‘yicha), odatlar va challenge, insight’lar, review CTA, “Boshlash” checklist |
| Maqsadlar | `/goals`, `/goals/:goalId` | CRUD, 4 xil o‘lchov (bajarildi, foiz, sonli, bosqichlar), ota/bola maqsad, bosqichlar, progress tarixi + grafik, bog‘langan vazifa/loyihalar, filtr (holat/soha/muddat), karta va ro‘yxat ko‘rinishi |
| Rejalashtirish | `/planning/*` | Haftalik reja (qoralama → faol → yakunlangan; 3–5 ustuvor natija, sig‘im va buffer, ortiqcha reja ogohlantirishi, kunlarga taqsimlash, challenge), “Bugun” sahifasi va kun yakuni, vazifalar (Inbox, rejalashtirilmagan, bugun, muddati o‘tgan, qidiruv, filtr, saralash), vaqt kuzatuvi (taymer + qo‘lda), haftalik review |
| Karyera | `/career/*` | Ko‘nikmalar matritsasi, o‘rganish yo‘nalishlari (daraja farqi, reja, resurslar, vaqt, dalillar), yutuqlar timeline’i, ish arizalari pipeline’i, intervyu qaydlari |
| Biznes va loyihalar | `/business/*` | Umumiy loyiha modeli (biznes/portfolio/ilmiy/shaxsiy), progress vazifalardan, “keyingi eng kichik qadam”, g‘oyalar kanbani va baholash, g‘oyani loyihaga aylantirish, mijozlar, parallel loyihalar ogohlantirishi |
| Ta’lim va bilim | `/learning/*` | O‘quv resurslari (resursga bog‘langan vazifalar, sarflangan vaqt, ko‘nikma, amaliy natija), bilimlar bazasi (teglar, qidiruv, xavfsiz Markdown), ingliz tili iboralari va mashq logi, ilmiy ish loyihalari |
| Moliya | `/finance/*` | Daromad/xarajat CRUD, UZS/USD alohida, oylik va 6 oylik grafiklar, kategoriyalar, budjet limitlari, jamg‘arma maqsadlari (hissa yozuvlari yagona manba), CSV eksport |
| Hayot tarzi | `/lifestyle/*` | Odatlar (kunlik/haftalik target, haftalik jadval, streak qoidasi), salomatlik ko‘rsatkichlari, oila: har yili takrorlanadigan muhim sanalar, rejalar, vazifalar |
| Statistika | `/analytics` | 8 haftalik trendlar, sohalar bo‘yicha vaqt, odatlar, maqsadlar, oylik moliya jadvali, streak tarixi (30 kun, eng uzun streak), XP tarixi, nishonlar, qoidaga asoslangan insight’lar |
| Sozlamalar | `/settings` | Profil, haftalik sig‘im, gamifikatsiyani o‘chirish, hayot sohalarini yashirish/nomlash, JSON eksport, preview’li import (birlashtirish/almashtirish), demo yuklash/tozalash, zaxira nusxalar, reset, maxfiylik eslatmasi |
| Global | — | Ctrl/⌘+K qidiruv (natija o‘z sahifasida tahrirlash oynasi bilan ochiladi), tezkor qo‘shish menyusi (vazifa, maqsad, qayd, xarajat), ishlayotgan taymer indikatori, saqlash holati, xotira muammolari banneri |

## Arxitektura

Loyiha **feature-based** tuzilgan: har bir domen o‘z papkasida, umumiy narsalar alohida qatlamlarda.

```text
src/
  main.tsx              # kirish nuqtasi
  index.css             # Tailwind + dizayn tokenlari (light va .dark)
  app/
    App.tsx             # provider’lar + RouterProvider
    router/             # marshrutlar (lazy sahifalar), RouteError, 404
    layouts/            # AppLayout, Sidebar, TopBar, SectionLayout (tab’li bo‘limlar),
                        # CommandSearch (Ctrl/⌘+K), EditorHosts, StorageIssuesBanner
    config/             # navigatsiya va sahifa sarlavhalari
  components/
    ui/                 # shadcn/ui komponentlari (generatsiya qilingan)
    shared/             # PageHeader, EmptyState, SectionCard, confirm, ProgressBar, StatCard, …
    forms/              # FormField, FormDialog, entity select’lar, zod helperlari
    charts/             # Recharts wrapperlari (tooltip + ekran o‘quvchi uchun jadval)
  features/<feature>/
    components/         # sahifalar va feature UI
    service.ts          # domen amallari — UI faqat shu orqali yozadi
    editor.ts           # forma dialogini istalgan joydan ochish uchun store
    schemas.ts          # forma validatsiyasi (kerak bo‘lsa)
    hooks.ts            # hisoblangan (derived) ma’lumot hook’lari (kerak bo‘lsa)
  services/             # sof domen logikasi, React’siz:
                        # date, money, progress, gamification, analytics, backup
  data/
    schema/             # Zod entity sxemalari + DbState (yagona manba)
    storage/            # StorageAdapter (localStorage / memory), yuklash, atomik yozish, recovery
    repositories/       # umumiy CRUD repository (har bir to‘plam uchun `repos.<nom>`)
    migrations/         # schemaVersion va migratsiya funksiyalari
    seed/               # standart hayot sohalari va demo ma’lumotlar
    relations.ts        # cascade / unlink qoidalari (o‘chirish va import uchun)
    mutate.ts           # sof “recipe” → atomik commit + toast
    store.ts            # Zustand store: avval saqlaydi, keyin UI holatini yangilaydi
  constants/labels.ts   # enum label’lari (kelajakdagi i18n uchun bitta joy)
  hooks/                # umumiy hook’lar (useCollection, useToday, …)
  lib/                  # cn, id, notify, createEditorStore, uiPrefs
  types/                # Zod’dan chiqarilgan TypeScript turlari
  test/                 # test setup, render helperi, factory’lar
```

Features: `analytics`, `business`, `career`, `dashboard`, `finance`, `gamification`, `goals`, `habits`,
`knowledge`, `learning`, `lifestyle`, `projects`, `reviews`, `settings`, `tasks`, `time-tracking`,
`weekly-planning`.

### Asosiy qoidalar

- Komponentlar `localStorage`ga to‘g‘ridan-to‘g‘ri murojaat qilmaydi.
- Statistika (progress, foizlar, XP yig‘indisi, daraja, streak, budjet holati, insight’lar) **saqlanmaydi** —
  har safar asosiy yozuvlardan hisoblanadi.
- Bir nechta to‘plamni o‘zgartiradigan amallar atomik: biror kalitni yozish muvaffaqiyatsiz bo‘lsa, yozilganlari
  orqaga qaytariladi va UI holati o‘zgarmaydi.
- XP miqdorlari va boshqa “sehrli sonlar” komponentlarda emas, `services/` konfiguratsiyasida turadi.
- Barcha forma dialoglari `EditorHosts` ichida bir marta mount qilinadi va `editor.ts` store’lari orqali
  istalgan joydan (sahifa, qidiruv, tezkor qo‘shish) ochiladi.

## Ma’lumotlar qatlami

### Yozish oqimi

```text
Komponent ──► features/<x>/service.ts ──► repos.<nom> / mutate(recipe)
                                              │
                                              ▼
                               store.commit(patch)  (Zustand)
                                              │  1) persistPatch → StorageAdapter (atomik, rollback)
                                              │  2) muvaffaqiyatli bo‘lsa → set(state)
                                              ▼
                                  localStorage  `personal-os:*`
```

- `mutate(recipe)` joriy holatni oladi, sof funksiya qaytargan `Partial<DbState>` patch’ni commit qiladi.
  Xato bo‘lsa toast ko‘rsatiladi va `false` qaytadi — xatolar hech qachon jim yutilmaydi.
- `createRepository(name)` har bir to‘plam uchun `getAll`, `getById`, `create`, `update`, `remove` hamda bir nechta
  to‘plamni birga o‘zgartirish uchun sof `withCreated` / `withUpdated` helperlarini beradi. `id`, `createdAt`,
  `updatedAt` avtomatik qo‘yiladi.
- O‘chirish `relations.ts`dagi qoidalar bo‘yicha ishlaydi: `cascade` — bog‘liq yozuvlar ham o‘chadi (masalan, odat
  loglari, maqsad bosqichlari), `unlink` — havola tozalanadi, yozuv qoladi (masalan, o‘chirilgan maqsadning
  vazifalari).
- `localStorage` mavjud bo‘lmasa (maxfiy rejim, bloklangan), ilova xotiradagi adapterga o‘tadi va foydalanuvchiga
  ogohlantirish chiqaradi.

### Saqlash formati

- 26 ta massiv to‘plam (`goals`, `tasks`, `habits`, `transactions`, …) va 2 ta yagona qiymat (`profile`, `timer`).
  Har biri alohida kalitda: `personal-os:goals`, `personal-os:tasks`, …; ro‘yxat — `src/data/schema/db.ts`.
- `personal-os:meta` — `schemaVersion` va boshqa meta ma’lumotlar.
- Sana-only qiymatlar `YYYY-MM-DD`, vaqt belgilari ISO formatda saqlanadi.

### Ma’lumotlar xavfsizligi

- Buzilgan JSON yoki noto‘g‘ri yozuvlar yuklanishda aniqlanadi: asl nusxa `personal-os:recovery:*` ga ko‘chiriladi,
  yaroqli yozuvlar saqlanib qoladi, foydalanuvchiga banner ko‘rsatiladi.
- Yangiroq sxema versiyasidagi ma’lumotlar topilsa yozish bloklanadi (ma’lumot ustidan yozilmaydi).
- Import: JSON parse → ilova/versiya tekshiruvi → migratsiya → Zod validatsiya → takroriy ID → osilgan
  bog‘lanishlarni tuzatish → preview → tasdiq. Xato bo‘lsa mavjud ma’lumotlar o‘zgarmaydi.
- Reset recovery nusxalarini saqlab qoladi.

## Domen qoidalari

- Haftalik bajarilish foizi faqat shu haftaga rejalashtirilgan vazifalardan, **bekor qilinganlarsiz** hisoblanadi.
- Bajarilmagan vazifalar keyingi haftaga **avtomatik ko‘chmaydi** — faqat foydalanuvchi tasdig‘i bilan.
- Streak: kamida bitta vazifa yoki odat bajarilgan ketma-ket kunlar; bugun hali belgilanmagan bo‘lsa streak
  buzilmaydi.
- UZS va USD hech qachon qo‘shilmaydi (kurs xizmati yo‘q). Sonlar `services/money`dagi `formatNumber` /
  `formatMoney` orqali formatlanadi (brauzerlarda `uz` locale ma’lumotlari yo‘q).
- Taymer vaqti `startedAt`dan hisoblanadi; bir vaqtda bitta taymer, yangisi boshlansa eskisi yozuv sifatida
  saqlanadi.
- Sana-only qiymatlar lokal vaqtda parse qilinadi (kun siljimaydi); hafta dushanbadan boshlanadi.

### Gamifikatsiya

XP faqat **birinchi** yakunlashda beriladi. Qayta ochish XP tarixini o‘chirmaydi, qayta bajarish ikkinchi marta XP
bermaydi. Sozlamalarda gamifikatsiyani butunlay o‘chirish mumkin.

| Harakat | XP |
|---|---|
| Vazifa (past / o‘rta / yuqori ustuvorlik) | 10 / 20 / 30 |
| Odat (bir kun) | 5 |
| Bosqich (milestone) | 25 |
| Maqsad | 100 |
| Haftalik review | 30 |
| Haftalik challenge | 40 |

Daraja: `L` darajaga yetish uchun `100 · L · (L−1) / 2` XP kerak (0, 100, 300, 600, 1000, …).
Qiymatlar: `src/services/gamification/config.ts`.

## Dasturchi uchun qo‘llanma

### Yangi feature qo‘shish

1. `src/features/<nom>/` papkasini yarating: `service.ts`, `components/`, kerak bo‘lsa `editor.ts`, `schemas.ts`,
   `hooks.ts`.
2. Yozish amallarini `service.ts`ga qo‘ying (`repos.<nom>` yoki `mutate` orqali). Murakkab hisob-kitobni sof funksiya
   qilib yozing — uni testlash oson.
3. Forma dialogi bo‘lsa, `createEditorStore<T>()` bilan `editor.ts` yarating va dialogni
   `src/app/layouts/EditorHosts.tsx`ga qo‘shing.
4. Sahifani `src/app/router/index.tsx`da `page(loader, "ExportNomi")` orqali ulang; kerak bo‘lsa
   `src/app/config/navigation.ts`ga menyu bandi va sarlavha qo‘shing.
5. Enum label’larini `src/constants/labels.ts`ga yozing.

### Yangi to‘plam (collection) qo‘shish

1. `src/data/schema/entities.ts`da Zod sxemasini yozing.
2. `src/data/schema/db.ts`dagi `arrayCollections`ga kalit bilan qo‘shing.
3. `src/data/repositories/index.ts`dagi `repos`ga `createRepository('<nom>')` qo‘shing.
4. Boshqa to‘plamlarga havolalar bo‘lsa, `src/data/relations.ts`ga `cascade`/`unlink` qoidasini yozing.
5. Mavjud ma’lumotlar shakli o‘zgarsa — migratsiya qo‘shing (pastga qarang).

### Sxemani o‘zgartirish (migratsiya)

Saqlangan ma’lumot shaklini buzadigan har bir o‘zgarishda:

1. `src/data/migrations/index.ts`da `CURRENT_SCHEMA_VERSION`ni oshiring.
2. `migrations` obyektiga yangi versiya kaliti bilan funksiya qo‘shing — u validatsiyadan oldingi “xom” ma’lumotni
   oldingi versiyadan yangisiga o‘tkazadi.

Migratsiyalar `localStorage`dan yuklashda ham, eski zaxira nusxani import qilishda ham ishlaydi. Yangi
**ixtiyoriy** maydon `.default()` bilan qo‘shilsa, odatda migratsiya shart emas.

### shadcn/ui komponentlari

`npx shadcn add <komponent>` dan keyin tekshiring: CLI ba’zan `cn` importini noto‘g‘ri yozadi (`from "cn"`),
alohida `cn` npm paketini o‘rnatadi yoki `src/lib/utils.ts`ni qayta yozadi. Importlarni `@/lib/utils`ga tuzating
va kerak bo‘lsa `npm uninstall cn` qiling.

## Testlar va sifat

`npm run test` — 14 ta fayl, 84 ta test. Muhit: jsdom, setup — `src/test/setup.ts`.

- **Domen:** sana/hafta hisoblari, valyuta formati va ajratish, progress, daraja va XP qoidalari, streak’lar va
  streak tarixi, cascade/unlink, atomik yozish va rollback, buzilgan JSON, migratsiya bloki, demo ma’lumotlar
  validatsiyasi va tozalanishi, eksport/import, vazifa/odat/taymer/jamg‘arma/haftalik reja servislari.
- **Komponentlar** (Testing Library + `axe-core`): Vazifalar, Maqsadlar (forma validatsiyasi), Haftalik reja
  (holatlar, ortiqcha reja), Odatlar, Sozlamalar (import), global qidiruv.

Test yordamchilari (`src/test/`):

- `resetDb()` — har bir test uchun toza xotiradagi baza;
- `renderPage(ui, { route, path, hosts })` — sahifani router va provider’lar bilan render qiladi;
- `axeViolations(container)` — accessibility tekshiruvi (kontrast va landmark qoidalari jsdom’da o‘chirilgan,
  ular brauzerda tekshiriladi);
- `factories.ts` — test entity’lari uchun factory’lar.

### Accessibility

Barcha sahifalar, formalar va dialoglar brauzerda `axe-core` bilan tekshirilgan (kontrast, label’lar, ARIA,
sarlavhalar tartibi) — buzilish yo‘q. Yagona qolgan izoh: ochiq dropdown menyular portal orqali landmark’dan
tashqarida render qilinadi (`region`, best-practice darajasi); menyu `role="menu"` bilan to‘g‘ri e’lon qilingan.
Drag-and-drop o‘rniga select’lar ishlatiladi — hammasi klaviatura bilan boshqariladi.
Layout 360px, 375px, ~800px va 1440px kengliklarda tekshirilgan, gorizontal scroll yo‘q.

## Keyingi bosqichlar va cheklovlar

### Rejadagi ishlar

- **Qorong‘i rejim** — `.dark` tokenlari `src/index.css`da tayyor, `profile.theme` maydoni (`light`/`dark`/`system`)
  bor; hali ulanmagan (Toaster ham `theme="light"`da qotirilgan).
- **Ko‘p tillilik** — enum label’lari `src/constants/labels.ts`da markazlashgan, komponent matnlari hali ichida.
- Takrorlanuvchi vazifalar.
- Drag-and-drop (hozir kun/holat select orqali tanlanadi).
- IndexedDB adapteri (`StorageAdapter` interfeysi tayyor).
- Bilimlar bazasida backlink grafi, murakkabroq editor.

### Ma’lum cheklovlar

- Ma’lumotlar faqat joriy brauzer profilida; qurilmalar o‘rtasida sinxronlash yo‘q. Muntazam JSON eksport qiling.
- `localStorage` hajmi odatda ~5 MB; juda katta tarixda IndexedDB’ga o‘tish kerak bo‘ladi.
- `localStorage` shifrlanmagan — parol yoki bank rekvizitlarini kiritmang.
