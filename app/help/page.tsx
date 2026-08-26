import { Navbar } from '@/components/navbar'
import {
  HelpCircle,
  ShoppingBag,
  Tag,
  ShieldCheck,
  RotateCcw,
  MessageCircle,
} from 'lucide-react'

export default function HelpPage() {
  const faqs = [
    {
      q: 'Who can register and trade on PUKart?',
      a: 'PUKart is exclusively accessible to current students, faculty, and research scholars of Pondicherry University. Sign-in is restricted solely to official @pondiuni.ac.in Google accounts.',
    },
    {
      q: 'How does payment work for campus listings?',
      a: 'Payment is completed directly between the buyer and seller during a designated campus meetup. Standard cash or UPI apps (GPay, PhonePe, Paytm) after inspecting the item are recommended.',
    },
    {
      q: 'Can I rent items or offer student services?',
      a: 'Yes! When posting a listing, choose "For Rent" (for cycles, lab aprons, cameras, calculators) or "Campus Service" (for tutoring, coding help, photography).',
    },
    {
      q: 'How do "Offers" work?',
      a: 'Buyers can propose a custom amount using the "Make Offer" button. The seller receives a notification and can Accept, Reject, or propose a Counter Offer in their Deals tab.',
    },
    {
      q: 'What should I do if a listing seems suspicious?',
      a: 'Click "Report listing" on the product detail page. Our campus moderation team immediately reviews flagged listings and suspends non-compliant accounts.',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Pondicherry University</span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-primary sm:text-4xl">Help & Campus FAQ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Frequently asked questions about buying, selling, and campus handoffs on PUKart.
          </p>
        </div>

        <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 space-y-2">
              <h2 className="font-bold text-base text-primary flex items-start gap-2">
                <HelpCircle className="size-5 text-accent shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground pl-7">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
