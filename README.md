# PUKart — Your Campus. Your Marketplace.

> A verified, hyper-local peer-to-peer marketplace and rental network for Pondicherry University students.

🌐 **Live Website**: [https://pukart.shop](https://pukart.shop) (or [pukart.shop](https://pukart.shop))

---

## 🎯 1. Chosen Vertical

**Hyperlocal Campus Marketplace & Circular Economy for Higher-Education Ecosystems**

- **Problem Context**: College students repeatedly spend thousands of rupees each semester on textbooks, reference materials, calculators, cycles, scooters, hostel appliances, and room essentials. Conversely, graduating students routinely discard or undersell functional assets due to the lack of an organized campus exchange.
- **Why Generic Marketplaces Fail**: Platforms like OLX or Facebook Marketplace expose students to external strangers, require risky off-campus travel, and are prone to advance-deposit or courier scams.
- **The PUKart Solution**: A trusted, closed-loop community marketplace built specifically for Pondicherry University (Main Campus), enabling students to safely buy, sell, rent, and share resources within their hostels and academic departments.

---

## 🧠 2. Approach & Logic

1. **High-Trust Identity & Campus Verification**:
   - Authentication is integrated with verified student profiles.
   - Users must complete mandatory campus credentials (**Department / School**, **Degree Program**, **Year of Study**, and **Campus Hostel**) before creating listings, establishing social accountability.
2. **Safe Campus Meetup Workflow**:
   - Rather than relying on couriers or unverified remote payments, trade happens at designated, well-lit campus landmarks (e.g., Central Library, Silver Jubilee Campus, Science Complex, Hostel Messes).
3. **Finite State-Machine Transaction Lifecycle**:
   - Formal transition states prevent ambiguity: `requested` ➔ `accepted` ➔ `completed` ➔ `reviewed` (with explicit cancellation/rejection paths).
   - Only sellers can accept buy requests; only confirmed completed exchanges unlock the 1–5 star rating review system.
4. **Security by Design & IDOR Protection**:
   - Server Actions enforce strict ownership boundaries—users cannot buy their own listings, accept their own requests, or alter transactions between other students.
   - Automated content rules flag suspicious keywords, advance OTP requests, and unauthorized external shortlinks.
5. **Fast & Lightweight Architecture**:
   - Fully typed TypeScript codebase with Next.js App Router, PostgreSQL with Drizzle ORM, and optimized database indexing.

---

## ⚙️ 3. How the Solution Works

### System Flow
```
Student Browse / Search ➔ Item Detail ➔ In-App Chat / Make Offer ➔ Handoff at Campus Landmark ➔ Transaction Complete ➔ Peer Review
```

### Key Modules
- **Listing & Discovery**:
  - Filter by campus categories (Books, Electronics, Cycles, Bikes, Scooty, Hostel Gear, Sports, Services).
  - Multi-word search with price boundaries and condition filtering (Brand New, Like New, Good, Fair).
- **Offers & Direct Communication**:
  - Direct buyer-seller conversations linked to individual listings.
  - Make offer, counter-offer, and acceptance pipeline.
- **Transaction & Order Management**:
  - Dedicated dashboard tracking incoming requests, active exchanges, and completed history.
  - Campus meetup location selection and cash / peer-to-peer UPI settlement tracking.
- **Reputation, Safety & Senior Trust Badges**:
  - Mutual rating and review system visible on seller profile cards.
  - Campus Senior Trust Badges (`Verified Scholar`, `Hosteller`, `Top Senior Peer` >= 4.5★, `Same-Day Handoff`, `Meetups Completed`).
  - Reporting mechanism for suspicious listings with admin moderation tools.
- **Campus Transit & Green Mobility Rental (Feature 4 & 5)**:
  - Purpose-built mobility estimator for Pondicherry University's expansive 800-acre campus.
  - Supports flexible durations (Daily Pass, Weekend 3-Day, Weekly Transit, Semester Month) with refundable hostel security deposit protection and 1-click rental proposals.

---

## 📌 4. Assumptions Made

1. **Main Campus Geographic Scope**:
   - The platform focuses on the Pondicherry University Main Campus (Kalapet) to guarantee that buyers and sellers are within walking/cycling distance for physical handoffs (excluding distant off-campus centers like Karaikal and Port Blair).
2. **Zero-Commission Handoff Model**:
   - Assumes student-to-student payments occur directly via cash upon physical inspection or UPI on meetup. PUKart does not take platform fees or hold escrow, keeping transactions frictionless and 100% student-friendly.
3. **Mobile-First Student Usage**:
   - Assumes students predominantly access the marketplace on smartphones while on the move between hostels and lecture halls. Layouts, tap targets, and image handling are fully mobile-optimized.
4. **Community Moderation Standard**:
   - Assumes campus community self-policing backed by administrative controls: students can flag inappropriate items or bad actors, which student admins can review and deactivate.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16.3.0 (App Router, React 19, Server Actions)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) with custom campus color system
- **Database & ORM**: PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/) 0.45.2
- **Authentication**: [better-auth](https://better-auth.com/) 1.7.1 with university domain & OAuth verification
- **Storage & Analytics**: Vercel Blob & Vercel Analytics
- **Test Runner & Coverage**: [Vitest](https://vitest.dev/) 4.1.11 with `@vitest/coverage-v8` (115 comprehensive unit, a11y WCAG 2.2 AA, security IDOR, and marketplace integration tests across 6 test suites)

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         PUKart Client App                              │
│         Next.js App Router (PWA / Mobile-First / Dark Palette)         │
│  [Browse & Search]  [Mobility Estimator]  [Chat & Offers]  [Admin UI]  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js Server Actions                          │
│  - app/actions/listings.ts    (Listing CRUD, Privacy Masking)          │
│  - app/actions/marketplace.ts (FSM Transactions, Offers, Chat, Reviews)│
│  - app/actions/admin.ts       (Governance, Suspensions, Moderation)    │
└──────────────────┬─────────────────┬─────────────────┬─────────────────┘
                   │                 │                 │
                   ▼                 ▼                 ▼
          ┌────────────────┐ ┌───────────────┐ ┌───────────────┐
          │   Better Auth  │ │  AI Gateway   │ │  PostgreSQL   │
          │ Identity & Role│ │ NLP & Fraud   │ │  Drizzle ORM  │
          │  Verification  │ │   Moderation  │ │  (Indexed DB) │
          └────────────────┘ └───────────────┘ └───────────────┘
```

### Architecture Highlights
1. **Zero-Trust Identity**: Every server action invokes `getAuthenticatedUser()` which asserts session validity and student verification against university email standards.
2. **Atomic FSM Transitions**: Deals follow rigorous database transactions ensuring status shifts (`requested` $\rightarrow$ `accepted` $\rightarrow$ `completed`) cannot collide or double-sell an asset.
3. **Data Privacy Shielding**: Student contact numbers and academic hostel credentials are scrubbed from public payload responses, accessible only by verified peers upon authorized transaction requests.

---

## 🔒 Security Architecture & Threat Model

* **IDOR Prevention**: Hardened server boundaries ensure buyers cannot accept their own offers, sellers cannot transact with their own listings, and unrelated users cannot modify active exchanges.
* **Content Moderation & Anti-Scam**: Built-in AI heuristics inspect listings for OTP advance solicitation, shortlinks (`bit.ly`, `tinyurl`), off-platform phishing vectors, and prohibited campus contraband.
* **Security Headers**: Configured in `next.config.mjs`:
  - `Content-Security-Policy`: Restricts resource injection and cross-site scripts.
  - `X-Frame-Options`: `SAMEORIGIN` (clickjacking defense).
  - `X-Content-Type-Options`: `nosniff`.
  - `Referrer-Policy`: `strict-origin-when-cross-origin`.
  - `Strict-Transport-Security`: HSTS with 2-year preload.
  - `Permissions-Policy`: Microphone, camera, and geolocation restricted.
* **Zero Secret Leakage**: Credentials strictly segregated into `.env.local` with fallback development guards.

---

## ♿ Accessibility Notes (WCAG 2.2 AA Compliance)

PUKart is engineered for universal campus accessibility:
1. **ARIA Landmark Hierarchy**: Dedicated semantic `<header role="banner">`, `<nav aria-label="Main Navigation">`, `<main id="main-content">`, and `<footer role="contentinfo">` across every page.
2. **Keyboard Bypass (Skip Link)**: Visible `#main-content` skip navigation link in `app/layout.tsx` for immediate screen reader and keyboard access.
3. **Modal Dialog Focus Management**: Buy, Offer, and Report dialogs adhere to WCAG 2.1 SC 2.1.2 / 2.4.3 with explicit `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and labeled close triggers.
4. **Contrast Ratios**: Dark theme palette ensures body text exceeds 4.5:1 ratio (measured at 12.0:1) and UI components exceed 3.0:1 ratio.
5. **Touch Targets**: All interactive buttons satisfy the WCAG 2.2 SC 2.5.5 minimum of 44×44px.
6. **Reduced Motion**: Gracefully respects `prefers-reduced-motion` media queries across all animations.

---

## 📋 Requirements Traceability Matrix

| Requirement | Description | Implementation Files | Verification Test Suites | Status |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Hyperlocal Pondicherry University Marketplace | `lib/constants/campus.ts`, `app/page.tsx` | `tests/marketplace.test.ts`, `tests/auth.test.ts` | **DONE** |
| **REQ-02** | Student Identity & Academic Profile Verification | `lib/constants/campus.ts`, `app/listing/new/page.tsx` | `tests/auth.test.ts`, `tests/marketplace.test.ts` | **DONE** |
| **REQ-03** | Designated Campus Landmark Handoffs | `lib/constants/campus.ts`, `app/transactions/page.tsx` | `tests/marketplace.test.ts`, `tests/accessibility.test.ts` | **DONE** |
| **REQ-04** | Zero-Commission Peer Settlement (UPI / Cash) | `app/actions/marketplace.ts`, `app/transactions/page.tsx` | `tests/marketplace.test.ts`, `tests/security.test.ts` | **DONE** |
| **REQ-05** | Finite State-Machine Lifecycle (`requested` ➔ `accepted` ➔ `completed`) | `app/actions/marketplace.ts`, `lib/types.ts` | `tests/marketplace.test.ts`, `tests/security.test.ts` | **DONE** |
| **REQ-06** | IDOR Defenses & Self-Dealing Prevention | `app/actions/marketplace.ts`, `app/actions/listings.ts` | `tests/security.test.ts` | **DONE** |
| **REQ-07** | In-App Real-Time Messaging & Offer System | `app/messages/page.tsx`, `app/messages/[id]/page.tsx` | `tests/marketplace.test.ts`, `tests/api-and-admin.test.ts` | **DONE** |
| **REQ-08** | AI Scam Detection & Content Moderation | `lib/ai.ts`, `app/actions/listings.ts` | `tests/ai.test.ts` | **DONE** |
| **REQ-09** | Privacy Protection & Phone Shielding | `app/actions/listings.ts`, `app/listing/[id]/page.tsx` | `tests/security.test.ts`, `tests/marketplace.test.ts` | **DONE** |
| **REQ-10** | Green Mobility Campus Transit (₹350–₹500 / Day) | `app/listing/[id]/page.tsx`, `lib/constants/categories.ts` | `tests/marketplace.test.ts` | **DONE** |
| **REQ-11** | Senior Trust Badges & Reputation Reviews (1–5★) | `app/actions/marketplace.ts`, `app/seller/[id]/page.tsx` | `tests/marketplace.test.ts`, `tests/auth.test.ts` | **DONE** |
| **REQ-12** | Administration Dashboard & Moderation Controls | `app/actions/admin.ts`, `app/admin/page.tsx` | `tests/api-and-admin.test.ts`, `tests/security.test.ts` | **DONE** |
| **REQ-13** | Accessibility (WCAG 2.2 AA) & Mobile PWA | `app/layout.tsx`, `components/navbar.tsx`, `public/manifest.json` | `tests/accessibility.test.ts` | **DONE** |

---

## 💻 Getting Started

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

### Run Type Checking & Linting
```bash
npm run typecheck
npm run lint
```

### Run Tests & Code Coverage
```bash
npm test
npm run test:coverage
```

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🌐 Production Deployment

- **Live Application**: **[https://pukart.shop](https://pukart.shop)**

