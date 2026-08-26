'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import {
  Sparkles,
  Upload,
  X,
  Plus,
  ShieldCheck,
  Tag,
  IndianRupee,
  Layers,
  MapPin,
  HelpCircle,
} from 'lucide-react'
import { createListing } from '@/app/actions/listings'
import { getCurrentUserProfile } from '@/app/actions/marketplace'
import { generateProductDescription, calculatePriceRecommendation } from '@/lib/ai'
import { authClient } from '@/lib/auth-client'
import { checkProfileCompletion } from '@/lib/constants/campus'
import { getFormOptionsForCategory } from '@/lib/constants/categories'
import { AlertTriangle, UserRound } from 'lucide-react'
import Link from 'next/link'

export default function NewListingPage() {
  const router = useRouter()
  const [session, setSession] = useState<{ user?: { id: string; name?: string; email?: string } } | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [profileIncomplete, setProfileIncomplete] = useState<string[] | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Books')
  const [condition, setCondition] = useState('good')
  const [type, setType] = useState('sell')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [location, setLocation] = useState('Pondicherry University')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [priceInsight, setPriceInsight] = useState<string | null>(null)
  const [moderationWarning, setModerationWarning] = useState<string | null>(null)

  const formOptions = useMemo(() => getFormOptionsForCategory(category), [category])

  function handleCategoryChange(newCat: string) {
    setCategory(newCat)
    const opts = getFormOptionsForCategory(newCat)
    setType(opts.defaultType)
    setCondition(opts.defaultCondition)
  }

  useEffect(() => {
    async function checkAuthAndProfile() {
      try {
        const res = await getCurrentUserProfile()
        if (res?.profile) {
          setSession({ user: res.profile })
          if (!res.completion.isComplete) {
            setProfileIncomplete(res.completion.missingFields)
          } else {
            setProfileIncomplete(null)
          }
        }
      } catch {
        const authRes = await authClient.getSession()
        if (authRes?.data?.user) {
          setSession(authRes.data as any)
          const u = authRes.data.user as any
          const result = checkProfileCompletion({
            department: u.department,
            course: u.course,
            year: u.year,
            hostel: u.hostel,
          })
          if (!result.isComplete) {
            setProfileIncomplete(result.missingFields)
          } else {
            setProfileIncomplete(null)
          }
        } else {
          router.push('/sign-in')
        }
      }
    }

    checkAuthAndProfile()
  }, [router])

  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(''), 3000)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (images.length + files.length > 6) {
      showToast('Maximum 6 images allowed per listing.')
      return
    }

    setUploading(true)
    setModerationWarning(null)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      // Handle AI content moderation rejection
      if (data.moderationWarning) {
        setModerationWarning(
          data.reason ||
          'This image was flagged as inappropriate content. Sexual, violent, or prohibited images are not allowed on PUKart. Please upload a genuine product photo.'
        )
        showToast('⚠️ Image rejected by content moderation')
        return
      }

      if (!res.ok) throw new Error(data.error || 'Upload failed')

      if (data.urls && Array.isArray(data.urls)) {
        setImages((prev) => [...prev, ...data.urls])
      } else if (data.url) {
        setImages((prev) => [...prev, data.url])
      }
      showToast('Images uploaded successfully!')
    } catch (err: any) {
      showToast(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleGenerateAiDescription() {
    if (!title.trim()) {
      showToast('Enter a title first before generating description')
      return
    }
    setAiLoading(true)
    try {
      const desc = await generateProductDescription({
        title,
        category,
        condition,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
      })
      setDescription(desc)
      showToast('AI Description generated!')
    } catch (err: any) {
      showToast(err.message || 'AI generation unavailable')
    } finally {
      setAiLoading(false)
    }
  }

  function handleCalculateAiPrice() {
    const orig = originalPrice ? Number(originalPrice) : price ? Number(price) * 1.5 : 2000
    const rec = calculatePriceRecommendation({
      category,
      condition,
      originalPrice: orig,
      currentPrice: price ? Number(price) : undefined,
    })
    setPrice(String(rec.suggestedPrice))
    setPriceInsight(`Suggested: ₹${rec.suggestedPrice} (Fair range: ₹${rec.minFairPrice} - ₹${rec.maxFairPrice}). ${rec.reasoning}`)
    showToast(`Recommended campus price: ₹${rec.suggestedPrice}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (images.length === 0) {
      showToast('Please upload at least 1 image of your item')
      return
    }

    const priceNum = Number(price)
    if (!priceNum || priceNum <= 0) {
      showToast('Enter a valid price in INR')
      return
    }

    setLoading(true)
    try {
      const listing = await createListing({
        title,
        description,
        price: priceNum,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        category,
        condition,
        type,
        location,
        images,
        imageUrl: images[0],
      })
      showToast('Listing published successfully!')
      router.push(`/listing/${listing.id}`)
    } catch (err: any) {
      showToast(err.message || 'Failed to publish listing')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Profile Incomplete Blocking Modal */}
      {profileIncomplete && profileIncomplete.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold text-foreground">Complete Your Profile</h2>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Before listing items on PUKart, you need to complete your Pondicherry University student profile. This helps buyers verify your identity and arrange safe campus meetups.
            </p>

            <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
              <p className="text-xs font-bold text-amber-300 mb-2">Missing information:</p>
              <ul className="space-y-1">
                {profileIncomplete.map((field) => (
                  <li key={field} className="flex items-center gap-2 text-xs text-amber-200/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/profile?redirect=/listing/new"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg hover:opacity-90 transition"
            >
              <UserRound size={16} />
              Complete Profile Now
            </Link>

            <Link
              href="/"
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-border py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition"
            >
              Go Back Home
            </Link>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-2xl animate-in fade-in slide-in-from-bottom duration-200"
        >
          {toastMessage}
        </div>
      )}

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Pondicherry University</span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-primary sm:text-4xl">Sell an Item on PUKart</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            List your textbooks, electronics, cycles, and hostel gear to fellow verified campus students.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* AI Content Moderation Warning */}
          {moderationWarning && (
            <div className="rounded-2xl border-2 border-destructive/50 bg-destructive/10 p-5 shadow-md animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-lg font-bold">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-destructive">Image Rejected — Content Policy Violation</h3>
                  <p className="mt-1.5 text-sm leading-6 text-destructive/90">
                    {moderationWarning}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    PUKart uses AI-powered image moderation to keep our campus marketplace safe. Sexual, violent, or prohibited content is automatically blocked. Repeated violations may result in account suspension.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModerationWarning(null)}
                    className="mt-3 rounded-lg bg-destructive/20 px-4 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/30 transition"
                  >
                    Dismiss Warning
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Photos */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Product Photos</h2>
                <p className="text-xs text-muted-foreground">Upload up to 6 real photos. First image is the cover thumbnail.</p>
              </div>
              <span className="text-xs font-semibold text-accent">{images.length}/6 uploaded</span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img, idx) => (
                <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                  <Image src={img} alt={`Upload ${idx + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-destructive hover:bg-background shadow transition"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {images.length < 6 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 text-center hover:border-accent hover:bg-muted/60 transition">
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="mt-2 text-xs font-semibold text-primary">Add Photos</span>
                  <span className="text-[10px] text-muted-foreground">JPG, PNG, WebP (max 5MB)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={uploading}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {uploading && <p className="text-xs font-semibold text-accent animate-pulse">Uploading and validating images...</p>}
          </div>

          {/* Section 2: Details */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-foreground">Listing Information</h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                Item Title <span className="text-destructive">*</span>
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Engineering Mathematics Volume 1 - Erwin Kreyszig"
                maxLength={120}
                className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-accent"
                >
                  <option>Books</option>
                  <option>Electronics</option>
                  <option>Cycles</option>
                  <option>Bikes</option>
                  <option>Scooty</option>
                  <option>Hostel</option>
                  <option>Fashion</option>
                  <option>Sports</option>
                  <option>Food</option>
                  <option>Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  {formOptions.conditionLabel}
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-accent"
                >
                  {formOptions.conditions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  {formOptions.typeLabel}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-accent"
                >
                  {formOptions.types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description & AI Button */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  Description <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 text-xs font-bold text-accent hover:underline disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {aiLoading ? 'Drafting...' : 'Auto-Generate with AI'}
                </button>
              </div>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail what is included, how old the item is, defects if any, and pickup preferences."
                className="mt-1.5 w-full rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Section 3: Pricing & Meetup */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Price & Campus Meetup</h2>
              <button
                type="button"
                onClick={handleCalculateAiPrice}
                className="flex items-center gap-1 text-xs font-bold text-accent hover:underline"
              >
                <Sparkles size={13} /> Suggest Fair Price
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  Listing Price (₹ INR) <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max="10000000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1200"
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-bold outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  Original Retail Price (₹ Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="e.g. 2400 (Shows discount %)"
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-accent"
                />
              </div>
            </div>

            {priceInsight && (
              <div className="rounded-xl border border-accent/20 bg-accent/10 p-3 text-xs text-foreground">
                {priceInsight}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                Campus Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Science Complex / Silver Jubilee Campus / Central Library"
                className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg hover:opacity-95 active:scale-98 transition disabled:opacity-50"
          >
            {loading ? 'Publishing listing...' : 'Publish Listing on PUKart'}
          </button>
        </form>
      </main>
    </div>
  )
}
