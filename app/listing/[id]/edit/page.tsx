'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import {
  Upload,
  X,
  ArrowLeft,
  Trash2,
  Phone,
} from 'lucide-react'
import { getListingById, updateListing, deleteListing } from '@/app/actions/listings'
import { authClient } from '@/lib/auth-client'
import { getFormOptionsForCategory } from '@/lib/constants/categories'

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = Number(params?.id)

  const [_session, setSession] = useState<{ user?: { id: string; name?: string; email?: string } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Books')
  const [condition, setCondition] = useState('good')
  const [type, setType] = useState('sell')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [location, setLocation] = useState('Pondicherry University')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [dailyRentPrice, setDailyRentPrice] = useState('350')
  const [uploading, setUploading] = useState(false)

  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(''), 3000)
  }

  const formOptions = useMemo(() => getFormOptionsForCategory(category), [category])

  function handleCategoryChange(newCat: string) {
    setCategory(newCat)
    const opts = getFormOptionsForCategory(newCat)
    setType(opts.defaultType)
    setCondition(opts.defaultCondition)
  }

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res?.data?.user) setSession(res.data)
      else router.push('/sign-in')
    }).catch(() => router.push('/sign-in'))

    if (!listingId || isNaN(listingId)) return

    getListingById(listingId).then((item) => {
      if (item) {
        setTitle(item.title)
        setCategory(item.category)
        setCondition(item.condition || 'good')
        setType(item.type || 'sell')
        setPrice(String(item.price))
        setOriginalPrice(item.originalPrice ? String(item.originalPrice) : '')
        setLocation(item.location || 'Pondicherry University')
        setPhone(item.phone || '')
        setDescription(item.description)
        setImages(item.images && item.images.length > 0 ? item.images : (item.imageUrl ? [item.imageUrl] : []))
        const match = item.priceUnit?.match(/daily_?(\d+)/i) || item.priceUnit?.match(/(\d+)/)
        if (match) {
          setDailyRentPrice(match[1])
        } else if (item.category === 'Scooty' || item.category === 'Bikes') {
          setDailyRentPrice('350')
        } else if (item.category === 'Cycles') {
          setDailyRentPrice('80')
        }
      }
      setLoading(false)
    }).catch((err) => {
      console.error(err)
      setLoading(false)
    })
  }, [listingId, router])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (images.length + files.length > 6) {
      showToast('Maximum 6 images allowed per listing.')
      return
    }

    setUploading(true)
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
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      if (data.urls && Array.isArray(data.urls)) {
        setImages((prev) => [...prev, ...data.urls])
      } else if (data.url) {
        setImages((prev) => [...prev, data.url])
      }
      showToast('Images added successfully!')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (images.length === 0) {
      showToast('Please keep at least 1 image of your item')
      return
    }

    const priceNum = Number(price)
    if (!priceNum || priceNum <= 0) {
      showToast('Enter a valid price in INR')
      return
    }

    setSaving(true)
    try {
      await updateListing(listingId, {
        title,
        description,
        price: priceNum,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        category,
        condition,
        type,
        location,
        phone: phone.trim() || undefined,
        images,
        imageUrl: images[0],
        dailyRentPrice: (['Cycles', 'Scooty', 'Bikes'].includes(category) || type === 'rent') && dailyRentPrice ? Number(dailyRentPrice) : undefined,
      })
      showToast('Listing updated successfully!')
      router.push(`/listing/${listingId}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update listing')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to permanently delete this listing?')) return
    setSaving(true)
    try {
      await deleteListing(listingId)
      showToast('Listing deleted')
      router.push('/my-listings')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete listing')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-2xl py-20 text-center animate-pulse">Loading listing details...</div>
      </div>
    )
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

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft size={14} /> Back to listing
            </button>
            <h1 className="font-serif text-3xl font-bold text-primary">Edit Listing #{listingId}</h1>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground">Manage Photos</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img, idx) => (
                <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                  <Image src={img} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-destructive hover:bg-background shadow transition"
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
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 text-center hover:border-accent">
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="mt-2 text-xs font-semibold text-primary">Add More</span>
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
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <label htmlFor="edit-title" className="block text-xs font-bold uppercase tracking-wider text-foreground">Title</label>
              <input
                id="edit-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={formOptions.titlePlaceholder}
                className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="edit-category" className="block text-xs font-bold uppercase tracking-wider text-foreground">Category</label>
                <select
                  id="edit-category"
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
                <label htmlFor="edit-condition" className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  {formOptions.conditionLabel}
                </label>
                <select
                  id="edit-condition"
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
                <label htmlFor="edit-type" className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  {formOptions.typeLabel}
                </label>
                <select
                  id="edit-type"
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

            <div>
              <label htmlFor="edit-description" className="block text-xs font-bold uppercase tracking-wider text-foreground">Description</label>
              <textarea
                id="edit-description"
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={formOptions.descriptionPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-price" className="block text-xs font-bold uppercase tracking-wider text-foreground">Price (₹ INR)</label>
                <input
                  id="edit-price"
                  required
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-bold outline-none focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="edit-original-price" className="block text-xs font-bold uppercase tracking-wider text-foreground">Original Retail Price (₹)</label>
                <input
                  id="edit-original-price"
                  type="number"
                  min="1"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-accent"
                />
              </div>
            </div>

            {(['Cycles', 'Scooty', 'Bikes'].includes(category) || type === 'rent') && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="edit-daily-rent" className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Daily Rental Rate (₹/day)
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      For student campus mobility. Recommended PU rate: ₹350 - ₹500/day.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-white">₹{dailyRentPrice || '350'}/day</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">PU Presets:</span>
                  {['350', '400', '450', '500'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDailyRentPrice(val)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                        dailyRentPrice === val
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                          : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      ₹{val}/day
                    </button>
                  ))}
                </div>

                <input
                  id="edit-daily-rent"
                  type="number"
                  min="50"
                  max="5000"
                  value={dailyRentPrice}
                  onChange={(e) => setDailyRentPrice(e.target.value)}
                  placeholder="Custom daily rate e.g. 400"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="edit-location" className="block text-xs font-bold uppercase tracking-wider text-foreground">Location</label>
              <input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="edit-phone" className="block text-xs font-bold uppercase tracking-wider text-foreground">
                Phone / WhatsApp Number <span className="text-xs font-normal text-muted-foreground">(Shown to buyers for direct call / WhatsApp)</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                  <Phone size={16} className="text-accent" />
                </div>
                <input
                  id="edit-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210 (or +91 98765 43210)"
                  maxLength={20}
                  className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm font-medium outline-none focus:border-accent transition-colors"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Buyers can contact you via direct phone call or WhatsApp to finalize campus meetup and product inspection.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-xl border border-border py-4 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
