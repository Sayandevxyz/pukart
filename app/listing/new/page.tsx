'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { createListing } from '@/app/actions/listings'
import { getCurrentUserProfile } from '@/app/actions/marketplace'
import { generateProductDescription, calculatePriceRecommendation } from '@/lib/ai'
import { authClient } from '@/lib/auth-client'
import { checkProfileCompletion } from '@/lib/constants/campus'
import { useToast } from '@/lib/hooks/useToast'
import { PageShell, PageLoadingState } from '@/components/ui/PageShell'
import { ProfileIncompleteModal } from '@/components/listing/ProfileIncompleteModal'
import {
  ListingPhotosField,
  useListingImages,
} from '@/components/listing/ListingPhotosField'
import { useListingFormState } from '@/components/listing/useListingFormState'
import { ListingCoreFormSection } from '@/components/listing/ListingCoreFormSection'

type AuthUserData = {
  id: string
  name?: string
  email?: string
  phone?: string | null
  department?: string | null
  course?: string | null
  year?: string | number | null
  hostel?: string | null
}

export default function NewListingPage() {
  const router = useRouter()
  const [session, setSession] = useState<{ user?: AuthUserData } | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const { toastMessage, showToast } = useToast()
  const [profileIncomplete, setProfileIncomplete] = useState<string[] | null>(null)
  const [priceInsight, setPriceInsight] = useState<string | null>(null)

  const form = useListingFormState()

  const {
    images,
    uploading,
    moderationWarning,
    setModerationWarning,
    handleImageUpload,
    removeImage,
  } = useListingImages([], showToast)

  useEffect(() => {
    async function checkAuthAndProfile() {
      try {
        const res = await getCurrentUserProfile()
        if (res?.profile) {
          setSession({ user: res.profile })
          if (res.profile.phone) form.setPhone(res.profile.phone)
          setProfileIncomplete(res.completion.isComplete ? null : res.completion.missingFields)
          setAuthChecking(false)
          return
        }

        const authRes = await authClient.getSession()
        if (authRes?.data?.user) {
          setSession(authRes.data as { user?: AuthUserData })
          const u = authRes.data.user as AuthUserData
          if (u.phone) form.setPhone(u.phone)
          const parsedYear = typeof u.year === 'number' ? u.year : (u.year ? parseInt(String(u.year), 10) : null)
          const result = checkProfileCompletion({
            department: u.department,
            course: u.course,
            year: Number.isNaN(parsedYear) ? null : parsedYear,
            hostel: u.hostel,
          })
          setProfileIncomplete(result.isComplete ? null : result.missingFields)
          setAuthChecking(false)
        } else {
          router.replace('/sign-in?redirect=' + encodeURIComponent('/listing/new'))
        }
      } catch {
        const authRes = await authClient.getSession()
        if (authRes?.data?.user) {
          setSession(authRes.data as { user?: AuthUserData })
          setAuthChecking(false)
        } else {
          router.replace('/sign-in?redirect=' + encodeURIComponent('/listing/new'))
        }
      }
    }

    checkAuthAndProfile()
  }, [router, form])

  async function handleGenerateAiDescription() {
    if (!form.title.trim()) {
      showToast('Enter a title first before generating description')
      return
    }
    setAiLoading(true)
    try {
      const desc = await generateProductDescription({
        title: form.title,
        category: form.category,
        condition: form.condition,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      })
      form.setDescription(desc)
      showToast('AI Description generated!')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'AI generation unavailable')
    } finally {
      setAiLoading(false)
    }
  }

  function handleCalculateAiPrice() {
    const orig = form.originalPrice ? Number(form.originalPrice) : form.price ? Number(form.price) * 1.5 : 2000
    const rec = calculatePriceRecommendation({
      category: form.category,
      condition: form.condition,
      originalPrice: orig,
      currentPrice: form.price ? Number(form.price) : undefined,
    })
    form.setPrice(String(rec.suggestedPrice))
    setPriceInsight(`Suggested: ₹${rec.suggestedPrice} (Fair range: ₹${rec.minFairPrice} - ₹${rec.maxFairPrice}). ${rec.reasoning}`)
    showToast(`Recommended campus price: ₹${rec.suggestedPrice}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceNum = form.validateListingForm(images.length, showToast)
    if (!priceNum) return

    setLoading(true)
    try {
      const listing = await createListing(form.getPayload(images))
      showToast('Listing published successfully!')
      router.push(`/listing/${listing.id}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to publish listing')
      setLoading(false)
    }
  }

  if (authChecking || !session?.user) {
    return <PageLoadingState message="Checking authentication..." />
  }

  return (
    <PageShell toastMessage={toastMessage} maxWidthClass="max-w-4xl">
      <ProfileIncompleteModal missingFields={profileIncomplete} />

      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-accent">Pondicherry University</span>
        <h1 className="mt-1 font-serif text-3xl font-bold text-primary sm:text-4xl">Sell an Item on PUKart</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          List your textbooks, electronics, cycles, and hostel gear to fellow verified campus students.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <ListingPhotosField
          images={images}
          uploading={uploading}
          moderationWarning={moderationWarning}
          setModerationWarning={setModerationWarning}
          onUpload={handleImageUpload}
          onRemove={removeImage}
        />

        <ListingCoreFormSection
          idPrefix="new"
          form={form}
          aiButton={
            <button
              type="button"
              onClick={handleGenerateAiDescription}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-xs font-bold text-accent hover:underline disabled:opacity-50"
            >
              <Sparkles size={14} />
              {aiLoading ? 'Drafting...' : 'Auto-Generate with AI'}
            </button>
          }
          priceInsight={
            priceInsight ? (
              <div className="rounded-xl border border-accent/20 bg-accent/10 p-3 text-xs text-foreground">
                {priceInsight}
              </div>
            ) : null
          }
          suggestPriceButton={
            <button
              type="button"
              onClick={handleCalculateAiPrice}
              className="flex items-center gap-1 text-xs font-bold text-accent hover:underline"
            >
              <Sparkles size={13} /> Suggest Fair Price
            </button>
          }
        />

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg hover:opacity-95 active:scale-98 transition disabled:opacity-50"
        >
          {loading ? 'Publishing listing...' : 'Publish Listing on PUKart'}
        </button>
      </form>
    </PageShell>
  )
}
