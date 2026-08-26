'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import { getMyListings, setListingStatus, deleteListing } from '@/app/actions/listings'
import { authClient } from '@/lib/auth-client'

export default function MyListingsPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'reserved' | 'sold' | 'rented' | 'archived'>('all')
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')

  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(''), 3000)
  }

  async function loadListings(tab = activeTab) {
    setLoading(true)
    try {
      const data = await getMyListings(tab)
      setListings(data)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to load your listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res?.data?.user) {
        setSession(res.data)
        loadListings('all')
      } else {
        router.push('/sign-in')
      }
    }).catch(() => router.push('/sign-in'))
  }, [router])

  async function handleStatusChange(id: number, newStatus: 'active' | 'reserved' | 'sold' | 'rented' | 'archived') {
    try {
      await setListingStatus(id, newStatus)
      showToast(`Listing status updated to ${newStatus.toUpperCase()}`)
      loadListings(activeTab)
    } catch (err: any) {
      showToast(err.message || 'Failed to update status')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this listing permanently?')) return
    try {
      await deleteListing(id)
      showToast('Listing deleted successfully')
      loadListings(activeTab)
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-2xl"
        >
          {toastMessage}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">My Listings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your campus products, update statuses, and track views.</p>
          </div>
          <Link
            href="/listing/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow hover:opacity-90"
          >
            <Plus size={16} /> List New Item
          </Link>
        </div>

        {/* Tab Filter Bar */}
        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border pb-3 text-xs sm:text-sm font-semibold">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'active', label: 'Active / Available' },
            { id: 'reserved', label: 'Reserved' },
            { id: 'sold', label: 'Sold' },
            { id: 'rented', label: 'Rented' },
            { id: 'archived', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any)
                loadListings(tab.id as any)
              }}
              className={`rounded-xl px-4 py-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Listings List */}
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">Loading your listings...</div>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <Package className="mx-auto size-14 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-bold text-primary">No listings found in this tab</h3>
            <p className="mt-1 text-xs text-muted-foreground">Have unused hostel essentials or textbooks? Post them for campus buyers.</p>
            <Link
              href="/listing/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground"
            >
              <Plus size={15} /> Create Listing
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {listings.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={item.imageUrl || '/images/campus-marketplace.png'}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'reserved'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'sold'
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                    </div>
                    <Link
                      href={`/listing/${item.id}`}
                      className="font-serif text-base sm:text-lg font-bold text-primary hover:text-accent line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <p className="text-sm font-extrabold text-primary">₹{item.price.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span>{item.viewsCount || 0} views</span>
                      <span>•</span>
                      <span>Created {new Date(item.createdAt).toLocaleDateString('en-IN')}</span>
                    </p>
                  </div>
                </div>

                {/* Actions & Status Changers */}
                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-accent"
                  >
                    <option value="active">Active</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                    <option value="archived">Archived</option>
                  </select>

                  <Link
                    href={`/listing/${item.id}/edit`}
                    className="flex h-10 items-center gap-1 rounded-xl border border-border bg-background px-3 text-xs font-bold text-primary hover:bg-muted"
                  >
                    <Edit size={14} /> Edit
                  </Link>

                  <Link
                    href={`/listing/${item.id}`}
                    className="flex h-10 items-center gap-1 rounded-xl border border-border bg-background px-3 text-xs font-bold text-primary hover:bg-muted"
                  >
                    <ExternalLink size={14} /> View
                  </Link>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex h-10 items-center gap-1 rounded-xl border border-destructive/20 bg-destructive/10 px-3 text-xs font-bold text-destructive hover:bg-destructive/20"
                    title="Delete listing"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
