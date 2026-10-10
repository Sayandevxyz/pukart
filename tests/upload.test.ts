import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  POST,
  isValidImageSignature,
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
} from '../app/api/upload/route'
import { auth } from '../lib/auth'
import * as blobModule from '@vercel/blob'
import fs from 'node:fs/promises'

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}))

vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}))

function createMockSession(userId: string, email: string) {
  return {
    user: {
      id: userId,
      email,
      name: 'Pondicherry University Student',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: `session-${userId}`,
      userId,
      token: `token-${userId}`,
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }
}

describe('Upload API Route & Validation Suite (/api/upload)', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.BLOB_READ_WRITE_TOKEN
    Reflect.set(process.env, 'NODE_ENV', 'test')
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Image Signature (Magic Bytes) Verification', () => {
    it('should validate standard JPEG magic bytes', () => {
      const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
      expect(isValidImageSignature(jpeg)).toBe(true)
    })

    it('should validate standard PNG magic bytes', () => {
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
      expect(isValidImageSignature(png)).toBe(true)
    })

    it('should validate standard WebP (RIFF....WEBP) magic bytes', () => {
      const webp = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
      ])
      expect(isValidImageSignature(webp)).toBe(true)
    })

    it('should reject truncated byte buffers (< 12 bytes)', () => {
      const truncated = new Uint8Array([0xff, 0xd8, 0xff])
      expect(isValidImageSignature(truncated)).toBe(false)
    })

    it('should reject disguised text/executable files with invalid signatures', () => {
      const text = new TextEncoder().encode('Hello World! This is a plain text file disguised as png.')
      expect(isValidImageSignature(text)).toBe(false)

      const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a, 0x25, 0xd0, 0xd4])
      expect(isValidImageSignature(pdf)).toBe(false)
    })
  })

  describe('MIME Types & Size Limit Constraints', () => {
    it('should only allow JPG, PNG, and WebP in the allowlist', () => {
      expect(ALLOWED_TYPES.has('image/jpeg')).toBe(true)
      expect(ALLOWED_TYPES.has('image/png')).toBe(true)
      expect(ALLOWED_TYPES.has('image/webp')).toBe(true)

      expect(ALLOWED_TYPES.has('image/gif')).toBe(false)
      expect(ALLOWED_TYPES.has('image/svg+xml')).toBe(false)
      expect(ALLOWED_TYPES.has('application/pdf')).toBe(false)
      expect(ALLOWED_TYPES.has('text/html')).toBe(false)
    })

    it('should strictly limit file size to 5MB', () => {
      expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024)
    })
  })

  describe('POST Route Handler Security & Error Paths', () => {
    function createMockRequest(formData: FormData, ip = '127.0.0.1') {
      return new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'x-forwarded-for': ip,
        },
        body: formData,
      })
    }

    function createValidImageFile(name: string, type: string, size = 100): File {
      const bytes = new Uint8Array(Math.max(16, size))
      if (type === 'image/jpeg') {
        bytes.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
      } else if (type === 'image/png') {
        bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
      } else if (type === 'image/webp') {
        bytes.set([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
      }
      return new File([bytes], name, { type })
    }

    function makeUploadRequest(fileName = 'item.jpg', mime = 'image/jpeg', clientIp?: string) {
      const form = new FormData()
      form.append('file', createValidImageFile(fileName, mime))
      return createMockRequest(form, clientIp)
    }

    async function executeUpload(req: NextRequest, expectedStatus = 200) {
      const res = await POST(req)
      expect(res.status).toBe(expectedStatus)
      return res.json()
    }

    it('should reject unauthenticated requests with 401', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as never)
      const data = await executeUpload(makeUploadRequest(), 401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 503 when BLOB_READ_WRITE_TOKEN is unset in production', async () => {
      Reflect.set(process.env, 'NODE_ENV', 'production')
      delete process.env.BLOB_READ_WRITE_TOKEN

      vi.mocked(auth.api.getSession).mockResolvedValueOnce(
        createMockSession('usr-prod-test', 'test@pondiuni.ac.in')
      )

      const data = await executeUpload(makeUploadRequest('valid.jpg', 'image/jpeg', '203.0.113.1'), 503)
      expect(data.error).toContain('unavailable')
    })

    async function executeFormUpload(
      form: FormData,
      expectedStatus = 200,
      userId = 'usr-123',
      email = 'student@pondiuni.ac.in'
    ) {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(
        createMockSession(userId, email)
      )
      return executeUpload(createMockRequest(form), expectedStatus)
    }

    it('should reject request with 400 when no files are provided', async () => {
      const data = await executeFormUpload(new FormData(), 400)
      expect(data.error).toContain('No image file provided')
    })

    it('should reject request with 400 when batch exceeds 8 images', async () => {
      const form = new FormData()
      for (let i = 0; i < 9; i++) {
        form.append('files', createValidImageFile(`img${i}.jpg`, 'image/jpeg'))
      }

      const data = await executeFormUpload(form, 400)
      expect(data.error).toContain('Maximum 8 images allowed')
    })

    it('should reject unsupported MIME type with 415', async () => {
      const form = new FormData()
      const badFile = new File([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])], 'bad.gif', {
        type: 'image/gif',
      })
      form.append('file', badFile)

      const data = await executeFormUpload(form, 415)
      expect(data.error).toContain('Unsupported image format')
    })

    it('should reject file exceeding 5MB with 413', async () => {
      const form = new FormData()
      const largeBytes = new Uint8Array(5 * 1024 * 1024 + 64)
      largeBytes.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
      const largeFile = new File([largeBytes], 'huge.jpg', { type: 'image/jpeg' })
      form.append('file', largeFile)

      const data = await executeFormUpload(form, 413)
      expect(data.error).toContain('5 MB')
    })

    it('should reject fake image with mismatched magic bytes with 400', async () => {
      const form = new FormData()
      const fakeBytes = new TextEncoder().encode('fake image content payload')
      const fakeImage = new File([fakeBytes], 'fake.jpg', { type: 'image/jpeg' })
      form.append('file', fakeImage)

      const data = await executeFormUpload(form, 400)
      expect(data.error).toContain('Security check failed')
    })

    it('should save to local disk fallback in development/test and return local URL (no data-URI)', async () => {
      delete process.env.BLOB_READ_WRITE_TOKEN
      Reflect.set(process.env, 'NODE_ENV', 'test')

      vi.mocked(auth.api.getSession).mockResolvedValueOnce(
        createMockSession('student-dev-1', 'dev@pondiuni.ac.in')
      )

      const data = await executeUpload(makeUploadRequest(), 200)
      expect(data.url).toMatch(/^\/uploads\/student-dev-1\/[a-f0-9-]+\.jpg$/)
      expect(data.url).not.toContain('data:image')
      expect(fs.mkdir).toHaveBeenCalled()
      expect(fs.writeFile).toHaveBeenCalled()
    })

    it('should upload to Vercel Blob when BLOB_READ_WRITE_TOKEN is configured', async () => {
      process.env.BLOB_READ_WRITE_TOKEN = 'test_blob_token_value'

      vi.mocked(auth.api.getSession).mockResolvedValueOnce(
        createMockSession('student-blob-1', 'blob@pondiuni.ac.in')
      )

      vi.mocked(blobModule.put).mockResolvedValueOnce({
        url: 'https://blob.vercel-storage.com/listings/student-blob-1/photo.jpg',
        downloadUrl: 'https://blob.vercel-storage.com/listings/student-blob-1/photo.jpg',
        pathname: 'listings/student-blob-1/photo.jpg',
        contentType: 'image/jpeg',
        contentDisposition: 'inline',
        etag: '"mock-etag"',
      })

      const data = await executeUpload(makeUploadRequest(), 200)
      expect(data.url).toBe('https://blob.vercel-storage.com/listings/student-blob-1/photo.jpg')
      expect(blobModule.put).toHaveBeenCalled()
    })
  })
})
