'use server'

import { put } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Only JPG, PNG, or WebP images are supported' }, { status: 415 })
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Images must be between 1 byte and 5 MB' }, { status: 413 })

    const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
    const pathname = `listings/${session.user.id}/${crypto.randomUUID()}.${extension}`
    const blob = await put(pathname, file, { access: 'public', addRandomSuffix: false })
    return NextResponse.json({ url: blob.url, pathname: blob.pathname })
  } catch (error) {
    console.error('[v0] upload failed', error)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
