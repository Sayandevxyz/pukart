import { and, desc, asc, eq, gte, ilike, lte, or, type SQL } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { listings } from '@/lib/db/schema'
import { checkRateLimit } from '@/lib/rate-limit'
import { parseSearchQueryFilters } from '@/lib/search-helper'

export async function GET(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimit = await checkRateLimit(`listings:${clientIp}`, 120, 60000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many search requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      )
    }

    const params = request.nextUrl.searchParams
    const sortParam = params.get('sort')?.trim().slice(0, 30) || 'newest'
    const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)
    const limit = Math.min(60, Math.max(1, Number.parseInt(params.get('limit') ?? '24', 10) || 24))
    const status = params.get('status')?.trim() || 'active'

    const parsedFilters = parseSearchQueryFilters({
      rawQuery: params.get('q')?.trim().slice(0, 150),
      categoryParam: params.get('category')?.trim().slice(0, 80),
      typeParam: params.get('type')?.trim().slice(0, 30),
      conditionParam: params.get('condition')?.trim().slice(0, 40),
      minPriceParam: params.get('minPrice'),
      maxPriceParam: params.get('maxPrice'),
      aiSearch: params.get('ai') === 'true',
    })

    const rawQuery = parsedFilters.query
    const category = parsedFilters.category
    const type = parsedFilters.type
    const condition = parsedFilters.condition
    const minPrice = parsedFilters.minPrice
    const maxPrice = parsedFilters.maxPrice

    const conditions: SQL<unknown>[] = [eq(listings.status, status)]

    if (rawQuery) {
      const words = rawQuery
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2)

      if (words.length > 0) {
        for (const word of words) {
          const searchClause = or(
            ilike(listings.title, `%${word}%`),
            ilike(listings.description, `%${word}%`),
            ilike(listings.location, `%${word}%`),
            ilike(listings.sellerName, `%${word}%`)
          )
          if (searchClause) {
            conditions.push(searchClause)
          }
        }
      } else {
        const searchClause = or(
          ilike(listings.title, `%${rawQuery}%`),
          ilike(listings.description, `%${rawQuery}%`),
          ilike(listings.location, `%${rawQuery}%`),
          ilike(listings.sellerName, `%${rawQuery}%`)
        )
        if (searchClause) {
          conditions.push(searchClause)
        }
      }
    }

    if (category && category !== 'All') {
      conditions.push(eq(listings.category, category))
    }

    if (type && type !== 'All') {
      conditions.push(eq(listings.type, type.toLowerCase()))
    }

    if (condition && condition !== 'All') {
      conditions.push(eq(listings.condition, condition.toLowerCase()))
    }

    if (minPrice > 0) {
      conditions.push(gte(listings.price, minPrice))
    }

    if (typeof maxPrice === 'number' && Number.isFinite(maxPrice) && maxPrice > 0) {
      conditions.push(lte(listings.price, maxPrice))
    }

    let orderByClause = desc(listings.createdAt)
    if (sortParam === 'price_asc' || sortParam === 'Price low-high') {
      orderByClause = asc(listings.price)
    } else if (sortParam === 'price_desc' || sortParam === 'Price high-low') {
      orderByClause = desc(listings.price)
    } else if (sortParam === 'popular' || sortParam === 'views') {
      orderByClause = desc(listings.viewsCount)
    }

    const offset = (page - 1) * limit

    const rows = await db
      .select({
        id: listings.id,
        userId: listings.userId,
        sellerName: listings.sellerName,
        title: listings.title,
        description: listings.description,
        price: listings.price,
        originalPrice: listings.originalPrice,
        priceUnit: listings.priceUnit,
        type: listings.type,
        category: listings.category,
        condition: listings.condition,
        imageUrl: listings.imageUrl,
        location: listings.location,
        status: listings.status,
        featured: listings.featured,
        viewsCount: listings.viewsCount,
        createdAt: listings.createdAt,
      })
      .from(listings)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      listings: rows,
      page,
      limit,
      count: rows.length,
      hasMore: rows.length === limit,
    })
  } catch (error) {
    console.error('[API Listings Error]', error instanceof Error ? error.message : error)
    return NextResponse.json({
      listings: [],
      page: 1,
      limit: 24,
      count: 0,
      hasMore: false,
      error: 'Unable to connect to database. Please check your DATABASE_URL in .env.local.',
    })
  }
}
