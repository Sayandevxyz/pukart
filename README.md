# PUKart — Your Campus. Your Marketplace.

> Buy, sell, and rent with verified Pondicherry University students.

🌐 **Live Website**: [https://pukart.shop](https://pukart.shop) (or [pukart.shop](https://pukart.shop))

---

## 🚀 Features

- **Campus Marketplace**: Buy, sell, or rent items exclusively within the Pondicherry University student community.
- **Verified Student Profiles**: Safe, community-driven commerce with authentication.
- **Fast & Responsive**: Built with Next.js App Router, Tailwind CSS, and optimized for both mobile and desktop.
- **PWA & Web Push**: Stay updated with push notifications and seamless mobile experience.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [better-auth](https://better-auth.com/)
- **Storage & Analytics**: Vercel Blob & Vercel Analytics

---

## 💻 Getting Started

First, install dependencies:

```bash
npm install
# or
pnpm install
```

Set up your environment variables in `.env.local` (database credentials, auth secrets, etc.).

Run the database migrations (if needed):

```bash
npm run db:migrate
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🌐 Deployment

The production application is deployed and live at:
- **[https://pukart.shop](https://pukart.shop)**
