import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeText(value: unknown, min: number, max: number): string {
  if (typeof value !== 'string') throw new Error('Invalid text format')
  // Strip script/style blocks, HTML tags, and control characters to prevent stored XSS attacks
  const clean = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
  if (clean.length < min || clean.length > max) {
    throw new Error(`Text must be between ${min} and ${max} characters`)
  }
  return clean
}
