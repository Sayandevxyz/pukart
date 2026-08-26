import { and, desc, eq, gte, ilike, lte, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { listings } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const query = params.get('q')?.trim().slice(0, 120)
  const category = params.get('category')?.trim().slice(0, 80)
  const type = params.get('type')?.trim().slice(0, 30)
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)
  const limit = Math.min(40, Math.max(1, Number.parseInt(params.get('limit') ?? '24', 10) || 24))
  const minPrice = Math.max(0, Number.parseInt(params.get('minPrice') ?? '0', 10) || 0)
  const maxPriceValue = Number.parseInt(params.get('maxPrice') ?? '', 10)
  const conditions = [eq(listings.status, 'active')]
  if (query) conditions.push(or(ilike(listings.title, `%${query}%`), ilike(listings.description, `%${query}%`)) as never)
  if (category && category !== 'All') conditions.push(eq(listings.category, category))
  if (type && type !== 'All') conditions.push(eq(listings.type, type.toLowerCase()))
  if (minPrice > 0) conditions.push(gte(listings.price, minPrice))
  if (Number.isFinite(maxPriceValue) && maxPriceValue > 0) conditions.push(lte(listings.price, maxPriceValue))
  const rows = await db.select().from(listings).where(and(...conditions)).orderBy(desc(listings.createdAt)).limit(limit).offset((page - 1) * limit)
  return NextResponse.json({ listings: rows, page, limit, hasMore: rows.length === limit })
}
