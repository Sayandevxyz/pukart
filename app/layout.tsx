import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-dm-serif' })

export const metadata: Metadata = {
  title: 'PUKart — Your Campus. Your Marketplace.',
  description: 'Buy, sell and rent with verified Pondicherry University students.',
  generator: 'PUKart',
  icons: {
    icon: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-EScoY3Dr9cDuwfPiUrfIsTl2QOCJT5.png',
    apple: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-EScoY3Dr9cDuwfPiUrfIsTl2QOCJT5.png',
  },
}

export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#04130d', userScalable: false }

import { PushNotificationBanner } from '@/components/push-notification-banner'

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${geist.variable} ${geistMono.variable} ${dmSerif.variable} bg-background`}>
      <body className="antialiased bg-background text-foreground selection:bg-emerald-500 selection:text-white">
        {children}
        <PushNotificationBanner />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
