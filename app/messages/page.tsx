'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import {
  MessageCircle,
  ShieldCheck,
  Search,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { getMyConversations } from '@/app/actions/marketplace'
import { authClient } from '@/lib/auth-client'

export default function MessagesInboxPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res?.data?.user) {
        setSession(res.data)
        getMyConversations().then((data) => {
          setConversations(data)
          setLoading(false)
        }).catch((err) => {
          console.error(err)
          setLoading(false)
        })
      } else {
        router.push('/sign-in')
      }
    }).catch(() => router.push('/sign-in'))
  }, [router])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">Marketplace Messages</h1>
            <p className="mt-1 text-sm text-muted-foreground">Inquiries, offers, and campus meetup chats with fellow students.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <MessageCircle className="mx-auto size-14 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-bold text-primary">No conversations yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">When you contact a seller or a student asks about your item, chats will appear here.</p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground"
            >
              Explore Listings
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center text-base">
                    {conv.otherUser?.image ? (
                      <Image src={conv.otherUser.image} alt="Avatar" fill className="object-cover" />
                    ) : (
                      conv.otherUser?.name?.[0]?.toUpperCase() || 'P'
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-primary truncate">{conv.otherUser?.name || 'PU Student'}</p>
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-accent">
                        <ShieldCheck size={12} /> Verified
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground/80 truncate">
                      <span className="text-muted-foreground font-normal">Re: </span>
                      {conv.listing?.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage || 'Click to view conversation'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-muted-foreground">
                    {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString('en-IN') : ''}
                  </span>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
