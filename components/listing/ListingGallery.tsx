'use client'

import React from 'react'
import Image from 'next/image'
import {
  Heart,
  Share2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { ListingItem } from '@/lib/types'

interface ListingGalleryProps {
  listing: ListingItem
  images: string[]
  activeImageIndex: number
  setActiveImageIndex: React.Dispatch<React.SetStateAction<number>>
  isSaved: boolean
  onToggleFavorite: () => void
  onShare: () => void
}

export function ListingGallery({
  listing,
  images,
  activeImageIndex,
  setActiveImageIndex,
  isSaved,
  onToggleFavorite,
  onShare,
}: ListingGalleryProps) {
  return (
    <div className="space-y-4 lg:col-span-7">
      <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={images[activeImageIndex] || '/images/campus-marketplace.png'}
          alt={listing.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 60vw"
        />

        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-lg bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground shadow">
            {listing.type}
          </span>
          {listing.status !== 'active' && (
            <span className="rounded-lg bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow">
              {listing.status}
            </span>
          )}
        </div>

        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={onShare}
            aria-label="Share"
            className="rounded-full bg-card/90 p-2.5 text-primary shadow-md backdrop-blur hover:bg-card transition"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={onToggleFavorite}
            aria-label={isSaved ? 'Remove from favorites' : 'Save to favorites'}
            className="rounded-full bg-card/90 p-2.5 text-primary shadow-md backdrop-blur hover:text-accent transition"
          >
            <Heart
              size={18}
              fill={isSaved ? 'currentColor' : 'none'}
              className={isSaved ? 'text-accent' : ''}
            />
          </button>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setActiveImageIndex((prev: number) => (prev - 1 + images.length) % images.length)
              }
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 text-primary shadow hover:bg-card"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() =>
                setActiveImageIndex((prev: number) => (prev + 1) % images.length)
              }
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 text-primary shadow hover:bg-card"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img: string, idx: number) => (
            <button
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                activeImageIndex === idx
                  ? 'border-accent shadow-md ring-2 ring-accent/20'
                  : 'border-border/70 opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
        <div className="flex items-center gap-2.5 text-sm font-bold text-primary">
          <ShieldCheck className="size-5 text-accent shrink-0" />
          <span>Pondicherry University Safety Protocol</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Meet the seller in well-lit public campus locations (Library, Gate 1/2, Science Complex,
          Shopping Complex). Never transfer payments before physically inspecting the product.
        </p>
      </div>
    </div>
  )
}
