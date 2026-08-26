import { put } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { moderateImageContent } from '@/lib/ai'
import fs from 'node:fs/promises'
import path from 'node:path'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * Validates file signature (magic bytes) to prevent extension spoofing.
 */
function isValidImageSignature(buffer: Uint8Array): boolean {
  if (buffer.length < 12) return false

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Sign in with your @pondiuni.ac.in account.' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const singleFile = formData.get('file') as File | null

    const uploadList: File[] = []
    if (files && files.length > 0) {
      for (const f of files) if (f instanceof File) uploadList.push(f)
    } else if (singleFile instanceof File) {
      uploadList.push(singleFile)
    }

    if (uploadList.length === 0) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    if (uploadList.length > 8) {
      return NextResponse.json({ error: 'Maximum 8 images allowed per upload batch' }, { status: 400 })
    }

    const uploadedUrls: string[] = []

    for (const file of uploadList) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json({ error: `Unsupported image format: ${file.type}. Only JPG, PNG, or WebP allowed.` }, { status: 415 })
      }

      if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `Image ${file.name} exceeds max size of 5 MB.` }, { status: 413 })
      }

      const buffer = new Uint8Array(await file.arrayBuffer())
      if (!isValidImageSignature(buffer)) {
        return NextResponse.json({ error: `Security check failed: File ${file.name} does not match valid image signature.` }, { status: 400 })
      }

      // ── AI Content Moderation: Check for NSFW/Sexual/Violent content ───
      const moderation = moderateImageContent(file.name, buffer)
      if (moderation.rejected) {
        console.warn(
          `[Upload Moderation] REJECTED image "${file.name}" from user ${session.user.id}: ${moderation.details.join('; ')}`
        )
        return NextResponse.json(
          {
            error: '⚠️ Image Rejected: This image has been flagged as potentially inappropriate or violating PUKart campus community guidelines. Please upload a genuine product photo.',
            moderationWarning: true,
            reason: moderation.reason,
            warningLevel: moderation.warningLevel,
          },
          { status: 422 }
        )
      }

      const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
      const filename = `${crypto.randomUUID()}.${ext}`

      // Check if Vercel Blob is configured
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const pathname = `listings/${session.user.id}/${filename}`
        const blob = await put(pathname, file, { access: 'public', addRandomSuffix: false })
        uploadedUrls.push(blob.url)
      } else {
        // Local file storage fallback
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', session.user.id)
        await fs.mkdir(uploadDir, { recursive: true })
        const targetPath = path.join(uploadDir, filename)
        await fs.writeFile(targetPath, Buffer.from(buffer))
        uploadedUrls.push(`/uploads/${session.user.id}/${filename}`)
      }
    }

    return NextResponse.json({
      url: uploadedUrls[0],
      urls: uploadedUrls,
      count: uploadedUrls.length,
    })
  } catch (error) {
    console.error('[Upload Error]', error)
    return NextResponse.json({ error: 'Image upload failed. Please try again.' }, { status: 500 })
  }
}

