import Link from 'next/link'
import { Mail, Instagram, ShieldCheck, HelpCircle } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-xs">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-primary">
              PU<span className="text-accent">K</span>art
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              An exclusive, peer-to-peer campus marketplace designed for the Pondicherry University student community.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Explore</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="transition hover:text-foreground">
                  Browse Marketplace
                </Link>
              </li>
              <li>
                <Link href="/listing/new" className="transition hover:text-foreground">
                  Sell an Item / Service
                </Link>
              </li>
              <li>
                <Link href="/my-listings" className="transition hover:text-foreground">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="transition hover:text-foreground">
                  Campus Alerts & Deals
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Support */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Trust & Support</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/safety" className="flex items-center gap-1.5 transition hover:text-foreground">
                  <ShieldCheck size={14} className="text-accent" />
                  Campus Safety Guidelines
                </Link>
              </li>
              <li>
                <Link href="/help" className="flex items-center gap-1.5 transition hover:text-foreground">
                  <HelpCircle size={14} className="text-accent" />
                  Help Center & FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Contact & Community</h3>
            <p className="text-xs text-muted-foreground">
              Have questions, feedback, or need help with a listing? Reach out to the student support team:
            </p>
            <div className="space-y-2.5 pt-1">
              <a
                href="mailto:contactpukart@gmail.com"
                className="group flex items-center gap-2.5 rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:border-accent hover:text-accent"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition">
                  <Mail size={14} />
                </div>
                <span className="truncate">contactpukart@gmail.com</span>
              </a>

              <a
                href="https://www.instagram.com/pu_kart?igsi=aDdsODBoeTVsMzNn"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:border-pink-500 hover:text-pink-500"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition">
                  <Instagram size={14} />
                </div>
                <span className="truncate">@pu_kart on Instagram</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PUKart. Built exclusively for Pondicherry University.</p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:contactpukart@gmail.com"
              className="hover:text-foreground transition underline underline-offset-4"
            >
              contactpukart@gmail.com
            </a>
            <a
              href="https://www.instagram.com/pu_kart?igsi=aDdsODBoeTVsMzNn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition underline underline-offset-4"
            >
              Instagram (@pu_kart)
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
