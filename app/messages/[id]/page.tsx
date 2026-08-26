'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import {
  Send,
  Upload,
  ArrowLeft,
  ShieldCheck,
  Tag,
  ExternalLink,
  Ban,
  CheckCheck,
  Clock,
  Sparkles,
} from 'lucide-react'
import {
  getConversationById,
  sendMessage,
  blockUser,
  makeOffer,
} from '@/app/actions/marketplace'
import { authClient } from '@/lib/auth-client'

export default function ConversationChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = Number(params?.id)

  const [session, setSession] = useState<any>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Offer modal in chat
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')

  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(''), 3000)
  }

  async function loadConversation() {
    if (!conversationId || isNaN(conversationId)) return
    try {
      const res = await getConversationById(conversationId)
      setData(res)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res?.data?.user) {
        setSession(res.data)
        loadConversation()
      } else {
        router.push('/sign-in')
      }
    }).catch(() => router.push('/sign-in'))

    // Fast poll for new messages in active chat
    const interval = setInterval(loadConversation, 4000)
    return () => clearInterval(interval)
  }, [conversationId, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!inputText.trim() || sending) return

    const textToSend = inputText.trim()
    setInputText('')
    setSending(true)

    try {
      await sendMessage(conversationId, textToSend)
      await loadConversation()
    } catch (err: any) {
      showToast(err.message || 'Failed to send message')
      setInputText(textToSend)
    } finally {
      setSending(false)
    }
  }

  async function handleMakeOffer(e: React.FormEvent) {
    e.preventDefault()
    const val = Number(offerAmount)
    if (!val || val <= 0) return
    try {
      await makeOffer(data.listing.id, val, `Offer made via chat: ₹${val}`)
      await sendMessage(conversationId, `💬 Proposed an offer of ₹${val.toLocaleString('en-IN')}. Check transactions tab to respond.`)
      setOfferModalOpen(false)
      showToast(`Offer of ₹${val} submitted!`)
      loadConversation()
    } catch (err: any) {
      showToast(err.message || 'Failed to submit offer')
    }
  }

  async function handleBlockUser() {
    if (!data?.otherUser?.id) return
    if (!confirm(`Are you sure you want to block ${data.otherUser.name}? You won't receive messages from them.`)) return
    try {
      await blockUser(data.otherUser.id)
      showToast('User blocked')
      router.push('/messages')
    } catch (err: any) {
      showToast(err.message || 'Failed to block user')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-4xl py-20 text-center animate-pulse">Loading chat...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-xl py-20 text-center">
          <p className="font-bold text-lg">Conversation not found</p>
          <Link href="/messages" className="mt-4 inline-block text-sm text-primary underline">
            Return to messages
          </Link>
        </div>
      </div>
    )
  }

  const { conversation, listing, otherUser, messages } = data

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-2xl"
        >
          {toastMessage}
        </div>
      )}

      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col px-4 py-4 sm:px-6">
        {/* Chat Header with other user details & listing snapshot */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/messages" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <ArrowLeft size={18} />
              </Link>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {otherUser.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-primary">{otherUser.name || 'Campus Student'}</h2>
                  <ShieldCheck size={14} className="text-accent" />
                </div>
                <p className="text-[11px] text-muted-foreground">Pondicherry University Verified Account</p>
              </div>
            </div>

            <button
              onClick={handleBlockUser}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition"
              title="Block communication"
            >
              <Ban size={13} /> Block
            </button>
          </div>

          {/* Listing Context Banner */}
          {listing && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/40 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={listing.imageUrl || '/images/campus-marketplace.png'}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary truncate">{listing.title}</p>
                  <p className="text-xs font-extrabold text-accent">₹{listing.price.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setOfferModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-bold text-accent hover:bg-accent/20"
                >
                  <Tag size={12} /> Offer
                </button>
                <Link
                  href={`/listing/${listing.id}`}
                  className="rounded-lg border border-border bg-background p-1.5 text-primary hover:bg-muted"
                  title="View full listing"
                >
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Message Stream */}
        <div className="my-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-4 min-h-[360px] max-h-[58vh]">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Send your first message to discuss price, item condition, or campus meetup location.
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMine = msg.senderId === session?.user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card text-card-foreground border border-border rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="mt-1 px-1 text-[10px] text-muted-foreground flex items-center gap-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMine && msg.readAt && <CheckCheck size={11} className="text-accent" />}
                  </span>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message to the student..."
            className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="flex h-12 items-center justify-center rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50 transition"
          >
            <Send size={16} />
          </button>
        </form>
      </main>

      {/* IN-CHAT MAKE OFFER MODAL */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-primary">Make an In-Chat Offer</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Listed at ₹{listing.price.toLocaleString('en-IN')}. Submit a student counter-offer.
            </p>
            <form onSubmit={handleMakeOffer} className="mt-4 space-y-4">
              <input
                type="number"
                min="1"
                required
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Enter amount ₹"
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-bold outline-none focus:border-accent"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-accent py-2.5 text-xs font-bold text-accent-foreground"
                >
                  Submit Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
