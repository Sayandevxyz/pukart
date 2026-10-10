'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { getListingById, updateListing, deleteListing } from '@/app/actions/listings'
import { authClient } from '@/lib/auth-client'
import { useToast } from '@/lib/hooks/useToast'
import { PageShell, PageLoadingState } from '@/components/ui/PageShell'
import {
  ListingPhotosField,
  useListingImages,
} from '@/components/listing/ListingPhotosField'
import { useListingFormState } from '@/components/listing/useListingFormState'
import { ListingCoreFormSection } from '@/components/listing/ListingCoreFormSection'

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = Number(params?.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toastMessage, showToast } = useToast()
  const form = useListingFormState()

  const { images, setImages, uploading, handleImageUpload, removeImage } = useListingImages([], showToast)

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (!res?.data?.user) router.push('/sign-in')
    }).catch(() => router.push('/sign-in'))

    if (!listingId || isNaN(listingId)) return

    getListingById(listingId).then((item) => {
      if (item) {
        form.setTitle(item.title)
        form.setCategory(item.category)
        form.setCondition(item.condition || 'good')
        form.setType(item.type || 'sell')
        form.setPrice(String(item.price))
        form.setOriginalPrice(item.originalPrice ? String(item.originalPrice) : '')
        form.setLocation(item.location || 'Pondicherry University')
        form.setPhone(item.phone || '')
        form.setDescription(item.description)
        setImages(item.images && item.images.length > 0 ? item.images : (item.imageUrl ? [item.imageUrl] : []))
        const match = item.priceUnit?.match(/daily_?(\d+)/i) || item.priceUnit?.match(/(\d+)/)
        if (match) {
          form.setDailyRentPrice(match[1])
        } else if (item.category === 'Scooty' || item.category === 'Bikes') {
          form.setDailyRentPrice('350')
        } else if (item.category === 'Cycles') {
          form.setDailyRentPrice('80')
        }
      }
      setLoading(false)
    }).catch((err) => {
      console.error(err)
      setLoading(false)
    })
  }, [listingId, router, setImages])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const priceNum = form.validateListingForm(images.length, showToast)
    if (!priceNum) return

    setSaving(true)
    try {
      await updateListing(listingId, form.getPayload(images))
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
    return <PageLoadingState message="Loading listing details..." />
  }

  return (
    <PageShell toastMessage={toastMessage} maxWidthClass="max-w-4xl">
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
        <ListingPhotosField
          images={images}
          uploading={uploading}
          onUpload={handleImageUpload}
          onRemove={removeImage}
        />

        <ListingCoreFormSection idPrefix="edit" form={form} />

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-border py-3.5 text-sm font-semibold hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg hover:opacity-95 disabled:opacity-50 transition"
          >
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </PageShell>
  )
}
