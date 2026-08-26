import { Navbar } from '@/components/navbar'
import {
  ShieldCheck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Lock,
  PhoneCall,
} from 'lucide-react'

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Pondicherry University</span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-primary sm:text-4xl">Campus Safety Guidelines</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            PUKart is strictly restricted to verified @pondiuni.ac.in community members. Follow these core safety rules to ensure secure and seamless exchanges on campus.
          </p>
        </div>

        {/* 4 Golden Rules */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <MapPin size={20} />
            </div>
            <h2 className="font-bold text-base text-primary">1. Meet in Public Campus Zones</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Always arrange meetups in well-lit, populated campus areas such as the Ananda Rangapillai Central Library entrance, Science Complex canteen, Shopping Complex, or Silver Jubilee Campus gate.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 size={20} />
            </div>
            <h2 className="font-bold text-base text-primary">2. Inspect Before You Pay</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Never transfer advance booking amounts or token money. Physically inspect textbooks, test electronic items, and check bicycles before handing over cash or UPI payment.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
              <AlertTriangle size={20} />
            </div>
            <h2 className="font-bold text-base text-primary">3. Never Share OTPs or PINs</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Legitimate transactions on PUKart never require entering your UPI PIN to receive money. Beware of scammers asking you to scan reverse QR codes.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <Lock size={20} />
            </div>
            <h2 className="font-bold text-base text-primary">4. Keep Communication on PUKart</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Keep negotiations, offers, and chat inside PUKart to preserve record integrity. Use the &quot;Report Listing&quot; button immediately if you detect suspicious activities.
            </p>
          </div>
        </div>

        {/* Safe Campus Locations Table */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-primary">Recommended Campus Handoff Locations</h2>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl bg-muted p-3.5">
              <p className="font-bold text-foreground">Central Library</p>
              <p className="text-muted-foreground mt-0.5">Ideal daytime spot with CCTV and active student traffic.</p>
            </div>
            <div className="rounded-xl bg-muted p-3.5">
              <p className="font-bold text-foreground">Shopping Complex / Mess</p>
              <p className="text-muted-foreground mt-0.5">Great for evening exchanges between 5 PM and 8 PM.</p>
            </div>
            <div className="rounded-xl bg-muted p-3.5">
              <p className="font-bold text-foreground">Science Complex Gate</p>
              <p className="text-muted-foreground mt-0.5">Convenient for lab students and academic scholars.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
