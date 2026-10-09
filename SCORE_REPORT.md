# PUKart Independent Code Evaluation & Score Report

**Date & Time**: 2026-10-09T18:05:00+05:30  
**Evaluator**: Independent Strict Code Evaluator  
**Repository**: PUKart (Sayandevxyz/pukart)  
**Evaluated Commit**: `1a811d3` (`fix(efficiency): remove orphaned shadcn css import to enable clean Turbopack production builds`)

---

## 1. Executive Summary & Score Table

| Category | Grader Baseline | Current Score /100 | Delta | Top 3 Reasons for Deductions |
| :--- | :---: | :---: | :---: | :--- |
| **Code Quality** | 86 | **94** | +8 | 1. Monolithic components (`app/listing/[id]/page.tsx` >900 lines).<br>2. Unsafe type assertions (`as never`, `as unknown as`).<br>3. `lint` script aliases `tsc --noEmit` without dedicated AST linter (ESLint). |
| **Security** | 99 | **96** | -3 | 1. Hardcoded fallback authentication secret string in `lib/auth.ts:40`.<br>2. Missing rate limiting on public upload and listing search API routes.<br>3. Serverless crash risk in local disk file writing fallback without blob token. |
| **Efficiency** | 100 | **98** | -2 | 1. Lack of listing grid DOM virtualization on mobile devices.<br>2. Repeated regex price unit parsing during client-side render cycles. |
| **Testing** | 95 | **98** | +3 | 1. Absence of end-to-end browser integration suite (Playwright/Cypress).<br>2. Uncovered remote AI LLM HTTP fallback path (`lib/ai.ts:36-67`). |
| **Accessibility** | 96 | **98** | +2 | 1. `userScalable: false` in viewport metadata violates WCAG 1.4.4 (Resize Text).<br>2. Category and sort dropdown selects rely solely on `aria-label` without visible labels. |
| **Problem Statement Alignment** | 98 | **99** | +1 | 1. `isValidPondiUniEmail` relaxed to permit any email domain instead of strict `@pondiuni.ac.in`. |
| **OVERALL** | **95.42** | **97.16** | **+1.74** | **Substantial net improvement across Code Quality, Testing, Accessibility, and Documentation.** |

---

## 2. Raw Tool Evidence

### 2.1. Type Check (`npm run typecheck`)
```text
$ npm run typecheck
> pukart@0.1.0 typecheck
> tsc --noEmit
# Exit code: 0 (0 compilation errors)
```

### 2.2. Test Suite Execution (`npm test`)
```text
$ npm test
> pukart@0.1.0 test
> vitest run

 RUN  v4.1.11 C:/Users/Sayan/Downloads/pukart

 ✓ tests/ai.test.ts (18 tests) 75ms
 ✓ tests/accessibility.test.ts (22 tests) 60ms
 ✓ tests/marketplace.test.ts (34 tests) 85ms
 ✓ tests/security.test.ts (18 tests) 25ms
 ✓ tests/auth.test.ts (12 tests) 25ms
 ✓ tests/api-and-admin.test.ts (11 tests) 27ms

 Test Files  6 passed (6)
      Tests  115 passed (115)
   Duration  9.56s (transform 763ms, setup 0ms, import 20.79s, tests 298ms, environment 2ms)
# Exit code: 0
```

### 2.3. Flakiness Verification (3x Consecutive Test Runs)
- **Run 1**: 6 test files, 115 tests passed, 0 failures (9.56s)
- **Run 2**: 6 test files, 115 tests passed, 0 failures (8.56s)
- **Run 3**: 6 test files, 115 tests passed, 0 failures (8.80s)
- **Result**: Zero flakiness detected (100% deterministic).

### 2.4. Code Coverage (`npm run test:coverage`)
```text
$ npm run test:coverage
> pukart@0.1.0 test:coverage
> vitest run --coverage

 RUN  v4.1.11 C:/Users/Sayan/Downloads/pukart
      Coverage enabled with v8

 % Coverage report from v8
----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------|---------|----------|---------|---------|-------------------
All files       |   96.09 |    80.08 |     100 |   96.21 |                   
 lib            |   95.26 |    76.88 |     100 |   95.51 |                   
  ai.ts         |   94.81 |    83.46 |     100 |   95.27 | 36-67             
  auth.ts       |   96.96 |    65.27 |     100 |   96.42 | 42                
  utils.ts      |     100 |      100 |     100 |     100 |                   
 lib/constants  |     100 |    95.23 |     100 |     100 |                   
  campus.ts     |     100 |      100 |     100 |     100 |                   
  categories.ts |     100 |    93.75 |     100 |     100 | 316-317           
----------------|---------|----------|---------|---------|-------------------
# Exit code: 0
```

### 2.5. Dependency Security Audit (`npm audit`)
```text
$ npm audit
found 0 vulnerabilities
# Exit code: 0
```

### 2.6. Production Build (`npm run build`)
```text
$ npm run build
> pukart@0.1.0 build
> next build

▲ Next.js 16.4.0 (Turbopack)
✓ Running next.config.mjs took 91ms
- Experiments (use with caution):
  · serverActions

  Creating an optimized production build ...
✓ Compiled successfully in 21.1s
  Running TypeScript ...
  Finished TypeScript in 28.0s ...
  Generating static pages using 3 workers (20/20) ...
✓ Generating static pages using 3 workers (20/20) in 1878ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin
├ ƒ /api/auth/[...all]
├ ○ /api/auth/error
├ ƒ /api/favorites
├ ƒ /api/listings
├ ƒ /api/notifications
├ ƒ /api/upload
├ ○ /favorites
├ ○ /help
├ ƒ /listing/[id]
├ ƒ /listing/[id]/edit
├ ○ /listing/new
├ ○ /messages
├ ƒ /messages/[id]
├ ○ /my-listings
├ ○ /notifications
├ ○ /profile
├ ○ /safety
├ ƒ /seller/[id]
├ ○ /sign-in
├ ○ /sign-up
└ ○ /transactions
# Exit code: 0 (20 routes compiled, zero compiler errors)
```

### 2.7. Secret Scan
```text
Tracked environment files: .env.example (no live secrets)
Hardcoded credentials search: 0 hardcoded private API keys/passwords found in tracked files.
Fallback auth secret detected in lib/auth.ts:40 (documented in deduction ledger).
```

---

## 3. Full Deduction Ledger per Category

### 3.1. Code Quality (Starting: 100 | Deductions: -6 | Score: 94)
- `[-1] app/api/listings/route.ts:53,64` - Type cast `as never` used on Drizzle `or(...)` clause to bypass SQL expression typing.
- `[-1] components/navbar.tsx:45` - Double type assertion `res.data as unknown as { ... }` bypasses static type guarantees for session retrieval.
- `[-1] app/seller/[id]/page.tsx:62` - Double type assertion `data as unknown as SellerProfileData` circumvents compile-time type validation.
- `[-1] app/listing/[id]/page.tsx:1-901` - Monolithic 901-line client component coupling state, dialog controls, mobility calculators, and view rendering.
- `[-1] app/actions/marketplace.ts:1-1035` - Over-concentrated server action module exceeding 1,000 lines handling 7 distinct domain concerns (conversations, offers, transactions, reviews, favorites, reports, blocks).
- `[-1] package.json:11` - `npm run lint` aliases `tsc --noEmit` without an ESLint static analysis engine configured to enforce lint rules, import ordering, and stylistic constraints.

### 3.2. Security (Starting: 100 | Deductions: -4 | Score: 96)
- `[-1] lib/auth.ts:40` - Fallback auth secret string `'pukart_secure_campus_marketplace_secret_2026_pondicherry_university'` present in codebase; risk of session forgery if env var is missing in self-hosted deployments.
- `[-1] app/api/upload/route.ts:1-120` - No rate limiting or burst threshold on public image upload endpoint; vulnerable to storage exhaustion attacks.
- `[-1] app/actions/marketplace.ts:37-44` - `sanitizeText` validates string length and trims whitespace, but does not sanitize HTML tags/entities prior to database persistence.
- `[-1] app/api/upload/route.ts:115-118` - Local disk upload fallback (`fs.writeFile` to `public/uploads`) will crash on read-only serverless runtimes (e.g., Vercel) if `BLOB_READ_WRITE_TOKEN` is unset.

### 3.3. Efficiency (Starting: 100 | Deductions: -2 | Score: 98)
- `[-1] app/page.tsx:444` - Marketplace grid renders unbounded paginated listings without list virtualization (e.g. `@tanstack/react-virtual`), increasing DOM node weight on mobile devices.
- `[-1] app/listing/[id]/page.tsx:56-65` - `extractDailyRentPrice` regex parsing is invoked on every render cycle without memoization or database column caching.

### 3.4. Testing (Starting: 100 | Deductions: -2 | Score: 98)
- `[-1] tests/` - No headless browser E2E test suite (Playwright or Cypress) configured to validate client-side hydration, real routing transitions, and modal dialog focus traps.
- `[-1] lib/ai.ts:36-67` - Remote Gemini/OpenAI API fallback integration path is unexercised in unit tests (uncovered in v8 coverage report).

### 3.5. Accessibility (Starting: 100 | Deductions: -2 | Score: 98)
- `[-1] app/layout.tsx:34` - `userScalable: false` in viewport configuration disables mobile pinch-to-zoom, violating WCAG 2.2 SC 1.4.4 (Resize Text).
- `[-1] app/page.tsx:382-421` - Listing type, condition, and sort `<select>` elements rely solely on `aria-label` without visible accompanying text labels, creating cognitive friction for some users.

### 3.6. Problem Statement Alignment (Starting: 100 | Deductions: -1 | Score: 99)
- `[-1] lib/auth.ts:14` - `isValidPondiUniEmail` aliases generic `isValidEmail`, allowing sign-in with external domains (`gmail.com`, `yahoo.com`) instead of strictly enforcing the `@pondiuni.ac.in` domain boundary originally specified in REQ-01.

---

## 4. Requirements Traceability Matrix

| ID | Requirement Description | Status | Verification Evidence |
| :--- | :--- | :---: | :--- |
| **REQ-01** | Student Email Verification | **Partial** | [lib/auth.ts:14](file:///c:/Users/Sayan/Downloads/pukart/lib/auth.ts#L14) validates email format; allows non-university domains per commit `17b8c53`. Tested in [tests/auth.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/auth.test.ts). |
| **REQ-02** | Student Profile & Campus Readiness | **Done** | [lib/constants/campus.ts](file:///c:/Users/Sayan/Downloads/pukart/lib/constants/campus.ts) validates Department, Degree, Year, and Hostel. Tested in [tests/auth.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/auth.test.ts). |
| **REQ-03** | Designated Campus Landmark Handoffs | **Done** | [lib/constants/campus.ts](file:///c:/Users/Sayan/Downloads/pukart/lib/constants/campus.ts) specifies Central Library, Messes, Silver Jubilee, etc. Tested in [tests/marketplace.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/marketplace.test.ts). |
| **REQ-04** | Zero-Commission Peer Settlement (UPI / Cash)| **Done** | [app/actions/marketplace.ts](file:///c:/Users/Sayan/Downloads/pukart/app/actions/marketplace.ts) tracks direct payments without platform fees. Tested in [tests/marketplace.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/marketplace.test.ts). |
| **REQ-05** | FSM Transaction Lifecycle | **Done** | States `requested` $\rightarrow$ `accepted` $\rightarrow$ `completed` enforced atomically. Tested in [tests/marketplace.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/marketplace.test.ts). |
| **REQ-06** | IDOR Defenses & Self-Dealing Guards | **Done** | Self-purchases and unauthorized transitions strictly blocked. Tested in [tests/security.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/security.test.ts). |
| **REQ-07** | In-App Real-Time Messaging & Offers | **Done** | [app/messages/page.tsx](file:///c:/Users/Sayan/Downloads/pukart/app/messages/page.tsx) and offer pipeline implemented. Tested in [tests/marketplace.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/marketplace.test.ts). |
| **REQ-08** | AI Scam Detection & Content Moderation | **Done** | [lib/ai.ts](file:///c:/Users/Sayan/Downloads/pukart/lib/ai.ts) flags OTP solicitations, shortlinks, contraband. Tested in [tests/ai.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/ai.test.ts). |
| **REQ-09** | Privacy Protection & Phone Shielding | **Done** | Phone numbers masked from public API, visible only to signed-in peers. Tested in [tests/security.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/security.test.ts). |
| **REQ-10** | Green Mobility Campus Transit (₹350–₹500) | **Done** | Mobility calculator and deposit protection in [app/listing/[id]/page.tsx](file:///c:/Users/Sayan/Downloads/pukart/app/listing/%5Bid%5D/page.tsx). Tested in [tests/marketplace.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/marketplace.test.ts). |
| **REQ-11** | Senior Trust Badges & Reputation Reviews | **Done** | Verified Scholar, Hosteller, Top Senior Peer (>=4.5★) badges implemented. Tested in [tests/auth.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/auth.test.ts). |
| **REQ-12** | Administration Dashboard & Moderation | **Done** | [app/admin/page.tsx](file:///c:/Users/Sayan/Downloads/pukart/app/admin/page.tsx) and role guards. Tested in [tests/api-and-admin.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/api-and-admin.test.ts). |
| **REQ-13** | WCAG 2.2 AA Accessibility & PWA Support | **Done** | Skip link, ARIA landmarks, PWA manifest, and color contrast. Tested in [tests/accessibility.test.ts](file:///c:/Users/Sayan/Downloads/pukart/tests/accessibility.test.ts). |

---

## 5. Top 10 Highest-Impact Fixes

| Rank | Recommended Fix | Target File | Points Gained | Estimated Effort |
| :---: | :--- | :--- | :---: | :---: |
| **1** | Remove `userScalable: false` from viewport metadata to permit pinch-to-zoom | `app/layout.tsx:34` | +1 (A11y) | 2 mins |
| **2** | Replace `as never` type casts with typed Drizzle `SQL<unknown>[]` conditions | `app/api/listings/route.ts:53,64` | +1 (Code Quality) | 5 mins |
| **3** | Replace double type assertions (`as unknown as`) with explicit Zod or Drizzle types | `components/navbar.tsx:45`, `app/seller/[id]/page.tsx:62` | +1 (Code Quality) | 10 mins |
| **4** | Require mandatory `BETTER_AUTH_SECRET` environment variable without hardcoded fallback string | `lib/auth.ts:40` | +1 (Security) | 5 mins |
| **5** | Implement rate limiting (e.g. `@upstash/ratelimit` or in-memory LRU) on upload & listing search APIs | `app/api/upload/route.ts`, `app/api/listings/route.ts` | +1 (Security) | 20 mins |
| **6** | Sanitize HTML entities in `sanitizeText` using `dompurify` or regex tag stripping | `app/actions/marketplace.ts:37` | +1 (Security) | 10 mins |
| **7** | Memoize `extractDailyRentPrice` with `useMemo` or store as an explicit numeric DB column | `app/listing/[id]/page.tsx:56` | +1 (Efficiency) | 10 mins |
| **8** | Add ESLint configuration (`eslint.config.mjs`) and set `"lint": "eslint ."` | `package.json:11` | +1 (Code Quality) | 15 mins |
| **9** | Add unit test mocking remote Gemini API HTTP requests to achieve 100% statement coverage on `lib/ai.ts` | `tests/ai.test.ts` | +1 (Testing) | 15 mins |
| **10** | Modularize `app/listing/[id]/page.tsx` into sub-components (`ListingHeader`, `MobilityCalculator`, `SellerBadgeCard`) | `app/listing/[id]/page.tsx` | +1 (Code Quality) | 45 mins |

---

## 6. Confidence Level & Verification Notes

- **Code Quality**: **High**. Verified through `tsc --noEmit` (0 errors), AST review, and full codebase scan for `any`, dead code, and typing patterns.
- **Security**: **High**. Verified via `npm audit` (0 vulnerabilities), static analysis of auth guards, IDOR boundary checks, and HTTP header verification in `next.config.mjs`.
- **Efficiency**: **High**. Verified via Next.js Turbopack production build (20/20 routes compiled in 21s) and database schema index audit.
- **Testing**: **High**. Verified via 3 consecutive Vitest runs (115/115 passing tests, zero flakiness) and `@vitest/coverage-v8` reporting 96.21% line coverage.
- **Accessibility**: **Medium-High**. Verified via static markup audit, ARIA landmark validation, skip-to-content links, and automated unit tests for contrast ratios and tap target dimensions. Note: Live browser Chrome DevTools / axe-core runtime audit could not be performed against a live server due to the lack of an active Neon Postgres cloud connection in the offline evaluator environment.
- **Problem Statement Alignment**: **High**. Verified against all 13 core requirements in `README.md` and commit history.
