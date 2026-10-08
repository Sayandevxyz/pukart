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
- **Reputation & Safety**:
  - Mutual rating and review system visible on seller profile cards.
  - Reporting mechanism for suspicious listings with admin moderation tools.

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

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [better-auth](https://better-auth.com/)
- **Storage & Analytics**: Vercel Blob & Vercel Analytics
- **Test Runner**: [Vitest](https://vitest.dev/) (48 unit, security, and integration tests)

---

## 💻 Getting Started

First, install dependencies:

```bash
npm install
```

Set up your environment variables in `.env.local` (database credentials, auth secrets, etc.).

Run the database migrations:

```bash
npm run db:migrate
```

Run test suite:

```bash
npm test
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🌐 Production Deployment

- **Live Application**: **[https://pukart.shop](https://pukart.shop)**
