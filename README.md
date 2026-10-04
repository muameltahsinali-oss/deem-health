# Deem Health — Store & Admin

Arabic-first (RTL) ecommerce store and admin dashboard for **Deem Health** — vitamins, supplements, weight care and tonics.
Iraq-only delivery, **Cash on Delivery**, Meta Pixel + Conversions API with event deduplication, first-party attribution and analytics.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 6 · Zod 4 · React Hook Form · Recharts · Vitest · Playwright

---

## 1. Run it locally (Windows / macOS / Linux)

### Quick start on Windows (one command)
Open a terminal (PowerShell) **in this folder** and run:
```powershell
npm run setup
```
It creates `.env` (with a generated encryption key and admin password), starts PostgreSQL with Docker if it isn't running,
installs dependencies, creates the database schema, seeds the demo store, then runs type-check, lint, unit tests and a
production build. Everything is logged to `setup-log.txt`. It prints the admin login at the end.
After code changes, `npm run verify` re-runs the checks + build (log: `verify-log.txt`).

### Manual setup

### Requirements
- **Node.js 20.9+** (22 LTS recommended) — `node -v`
- **PostgreSQL 14+** — easiest: [Docker Desktop](https://www.docker.com/products/docker-desktop/) and `docker compose up -d` (uses `docker-compose.yml`), or a hosted database (Railway, Neon, Supabase…)

### Steps
```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Configure environment
cp .env.example .env            # Windows PowerShell: Copy-Item .env.example .env
npm run secret:generate          # paste the output into APP_ENCRYPTION_KEY
#   then edit .env: DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD (10+ chars)

# 3. Start PostgreSQL (if using Docker)
docker compose up -d

# 4. Create the database schema + demo data + admin account
npx prisma migrate dev --name init   # first time only — creates prisma/migrations
npm run db:seed

# 5. Start
npm run dev
```
- Store: http://localhost:3000
- Admin: http://localhost:3000/admin (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

Reset everything to fresh demo data at any time: `npm run db:reset`.

### Quality checks
```bash
npm run typecheck         # tsc --noEmit
npm run lint              # eslint (Next.js core-web-vitals + TypeScript rules)
npm test                  # unit tests (no database needed)
npm run test:integration  # needs TEST_DATABASE_URL — a disposable database (it is wiped)
npm run build             # production build (needs the database migrated + seeded)
npx playwright install chromium && npm run test:e2e   # E2E against `npm run start` (build first)
```
To create the test database with Docker: `docker compose exec db createdb -U deem deem_health_test`.

---

## 2. What's in the box

### Storefront (`/`)
| Route | |
|---|---|
| `/` | Hero (brand lifestyle photography), categories, best sellers, offers campaign, trust, featured, reviews, FAQ, WhatsApp contact |
| `/shop` | Search (Arabic-spelling tolerant), sort, in-stock / on-sale filters, pagination. `?q=` `?sort=` `?stock=1` `?sale=1` `?page=` |
| `/category/[slug]` | Same listing scoped to a category |
| `/product/[slug]` | Gallery, price/discount, stock, quantity, Add to cart / Buy now, sticky mobile bar, tabs (summary, benefits, ingredients, usage, warnings, details), reviews (+ submission, moderated), product FAQ, related |
| `/cart` | Persistent cart (localStorage), server-priced quote, coupon, free-shipping progress |
| `/checkout` | Guest checkout: name, Iraqi phone, governorate, district, address, notes · COD only |
| `/order-success/[token]` | Confirmation (unguessable token, not the DB id) |

### Admin (`/admin`) — Arabic, protected
Dashboard · Orders (status lifecycle, payment status, internal notes, timeline, attribution) · Products (CRUD, images upload, publish/draft/archive) · Categories · Customers (+ detail/history) · Coupons · Inventory (quick stock edit, low/out of stock) · Reviews (moderation) · Analytics · Marketing & Tracking · Settings (store info, order limits, low-stock threshold, free-shipping threshold, announcement bar, **shipping fees per governorate**).

---

## 3. Key decisions (documented)

| Topic | Decision |
|---|---|
| **Brand** | Colors, logo and photography come from the Deem Health identity PDF. Logo is the **vector extracted from the PDF** (`src/components/brand/logo-paths.ts`). Tokens in `src/app/globals.css` (`plum`, `lavender`, `sun`, neutrals) — no ad-hoc colors. |
| **Font** | The identity uses *Neue Power* — the PDF embeds the **Trial** licence, which is not licensed for the web, so it is not embedded. **Readex Pro** (OFL, Google Fonts) is used: geometric and wide-set like the identity, with excellent Arabic. Swap in licensed Neue Power via `next/font/local` in `src/app/layout.tsx` when purchased (Latin headings only). |
| **Language** | Arabic-first RTL. Storefront strings live in `src/i18n/ar.ts` (typed `Dictionary`); add `en.ts` to localize. No fake English content was created. Admin UI is Arabic-only (internal tool). |
| **Money** | Whole Iraqi dinars (`Int`), displayed with Western digits: `25,000 د.ع`. |
| **Payments** | COD only. `src/features/checkout/payment-methods.ts` is the registry — new methods plug in without rewriting checkout. Delivered COD orders are auto-marked **PAID**. |
| **Pricing integrity** | The browser sends only product ids + quantities + coupon code. `buildQuote()` (`src/server/checkout/quote.ts`) prices everything from the DB — used by the cart UI and re-run inside the order transaction. |
| **Stock** | Reserved at order creation with a conditional decrement (`stock >= qty`) → never negative, no overselling under concurrency. Cancelling an order restores stock **once** (`stockRestored`) and releases the coupon use. |
| **Order numbers** | `DH-YYYYMMDD-NNNN` (Baghdad day) from an atomic per-day counter. |
| **Shipping** | `ShippingRate` per governorate (fee + active), plus optional free-shipping threshold in Settings. District overrides / campaign rules can extend `resolveShippingFee()`. |
| **Customers** | Guest checkout; customers are identified by normalized phone `07XXXXXXXXX`. |
| **Reviews** | Customers can submit; nothing is shown until approved in Admin → Reviews. |
| **Auth** | Admin-only. scrypt password hashing (no native deps), DB-backed sessions (only a SHA-256 of the token is stored), `httpOnly` + `SameSite=Lax` + `Secure` cookies, login rate limiting, `proxy.ts` gate + `requireAdmin()` in every admin page/action. |
| **Rate limiting** | In-memory (single instance). Swap `src/server/rate-limit.ts` for Redis when running multiple instances. |
| **Uploads** | Stored on local disk (`UPLOAD_DIR`) and served by `/api/uploads/*`; file type checked by magic bytes, 5 MB limit. On serverless hosts replace `src/server/uploads.ts` with S3/R2. |
| **UI kit** | Lightweight in-house components in `src/components/ui` in the shadcn style (native `<dialog>`, accessible tabs, toasts) — no Radix/icon dependencies. |

---

## 4. Meta Pixel + Conversions API

Configure in **Admin → Marketing & Tracking** (preferred) or env vars (`NEXT_PUBLIC_META_PIXEL_ID` / `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_TEST_EVENT_CODE`). Admin values override env.

- The CAPI token is **encrypted (AES-256-GCM, `APP_ENCRYPTION_KEY`)**, never sent to the browser and never displayed after saving (only the last 4 characters).
- One tracking entry point: `trackEvent()` in `src/features/tracking/client.ts`.

| Event | Browser Pixel | Server (CAPI) | Dedup |
|---|---|---|---|
| PageView | every navigation | – | – |
| ViewContent | product page | relayed via `/api/track` | same `event_id` |
| Search | `/shop?q=` | – | – |
| AddToCart | add to cart | relayed | same `event_id` |
| InitiateCheckout | checkout opened | relayed | same `event_id` |
| AddPaymentInfo | place-order click (COD) | – | – |
| **Purchase** | confirmation page, once per order | **sent from the real order creation** (after the DB transaction commits) | server-generated `purchaseEventId` stored on the order and reused by the browser |
| Lead | WhatsApp CTA | – | – |

`CompleteRegistration` is not used — there is no customer registration (guest checkout).
Server events include hashed (SHA-256) phone, first/last name, district (city), governorate (state), country `iq` and customer id (`external_id`), plus IP, user agent, `_fbp`, `_fbc`. Purchase deliveries and any failures are logged in **Admin → Marketing → delivery log**. See `docs/TRACKING.md`.

## 5. Attribution
`utm_source/medium/campaign/content/term` and `fbclid` are captured on landing into a first-party cookie (30 days, last campaign touch wins; external referrers recorded as `referral` if nothing else is stored) and saved on each order. Visible on the order page, customer page and in Analytics → "Order sources".

## 6. Analytics rules
Computed from database rows only — see `docs/ANALYTICS.md`. Revenue = sum of non-cancelled orders; conversion rate = orders ÷ first-party sessions (`StoreSession`, bots excluded).

## 7. Demo data
`prisma/seed-data.ts` holds the catalog (14 products, 4 categories, coupons `WELCOME10`, `DEEM5000`, `EXPIRED20`), customers, ~20 orders, reviews and demo sessions. 11 products are **demo** — their copy makes **no health claims** ("benefits" are product features). 3 are **real Nutriplus products** (`real: true`: مستخلص البابونج، قهوة الهندباء بالكولاجين، ريشارج) whose copy uses only the information provided by the owner; their **price (25,000) and stock (20) are placeholders**, their content/usage/warnings are empty until known, and they get no demo reviews or demo orders. Set real values from Admin → Products. Placeholder product images (marked "DEMO IMAGE") are in `public/images/products` — regenerate with `node scripts/generate-placeholders.mjs`, replace via the admin. Shipping fees are demo values — set real ones in Admin → Settings.

## 8. Deployment notes
- Set `NEXT_PUBLIC_APP_URL` to the real domain, `APP_ENCRYPTION_KEY`, `DATABASE_URL`.
- `npm run db:deploy` (applies migrations) → `npm run build` → `npm run start`.
- Build pre-renders the home page from the database — the database must be reachable during `next build`.
- Uploaded images need a persistent disk (`UPLOAD_DIR`), e.g. a Railway volume.
- Create the production admin with `npm run admin:create -- owner@yourdomain.com "strong-password"`; don't run the demo seed in production.
- Remove `META_TEST_EVENT_CODE` / the admin test code before going live.

## 9. Project structure
```
src/
  app/(store)/…            storefront routes          app/admin/…   admin routes
  app/api/…                route handlers (quote, orders, track, sessions, reviews, uploads)
  components/ui            design-system primitives    components/store|admin|tracking|brand|seo
  features/…               shared domain logic (pricing, orders, checkout, cart, tracking, attribution, analytics)
  server/…                 server-only code (db, auth, catalog, quote, orders, tracking/CAPI, admin actions)
  i18n/                    dictionaries             config/  site, governorates, FAQ
prisma/                    schema, seed, demo data
tests/unit|integration|e2e
docs/                      analytics & tracking specs
```
