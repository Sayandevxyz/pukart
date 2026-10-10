'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'

export interface ListingPhotosFieldProps {
  images: string[]
  uploading: boolean
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage?: (index: number) => void
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove?: (index: number) => void
  title?: string
  moderationWarning?: string | null
  setModerationWarning?: (warning: string | null) => void
}

export function ListingPhotosField({
  images,
  uploading,
  onImageUpload,
  onRemoveImage,
  onUpload,
  onRemove,
  title = 'Photos',
}: ListingPhotosFieldProps) {
  const handleUpload = onUpload || onImageUpload
  const handleRemove = onRemove || onRemoveImage
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">{images.length}/6 uploaded</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
          >
            <Image src={img} alt={`Photo ${idx + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove?.(idx)}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-destructive hover:bg-background shadow transition"
              aria-label={`Remove photo ${idx + 1}`}
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
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 text-center hover:border-accent transition-colors">
            <Upload className="size-6 text-muted-foreground" />
            <span className="mt-2 text-xs font-semibold text-primary">
              {images.length === 0 ? 'Upload Photos' : 'Add More'}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  )
}

export function useListingImages(initialImages: string[] = [], onError?: (msg: string) => void) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [moderationWarning, setModerationWarning] = useState<string | null>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (images.length + files.length > 6) {
      onError?.('Maximum 6 images allowed per listing.')
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
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return {
    images,
    setImages,
    uploading,
    moderationWarning,
    setModerationWarning,
    handleImageUpload,
    removeImage,
  }
}
