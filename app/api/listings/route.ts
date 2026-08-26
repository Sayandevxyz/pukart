import { and, desc, asc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { listings, user as userTable } from '@/lib/db/schema'
import { parseNaturalLanguageSearch } from '@/lib/ai'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    let rawQuery = params.get('q')?.trim().slice(0, 150) || ''
    const categoryParam = params.get('category')?.trim().slice(0, 80)
    const typeParam = params.get('type')?.trim().slice(0, 30)
    const conditionParam = params.get('condition')?.trim().slice(0, 40)
    const sortParam = params.get('sort')?.trim().slice(0, 30) || 'newest'
    const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)
    const limit = Math.min(60, Math.max(1, Number.parseInt(params.get('limit') ?? '24', 10) || 24))
    const status = params.get('status')?.trim() || 'active'
    const aiSearch = params.get('ai') === 'true'

    let category = categoryParam
    let type = typeParam
    let condition = conditionParam
    let minPrice = Math.max(0, Number.parseInt(params.get('minPrice') ?? '0', 10) || 0)
    let maxPrice = Number.parseInt(params.get('maxPrice') ?? '', 10)

    // Handle Natural Language / AI Search
    if (aiSearch && rawQuery) {
      const parsed = parseNaturalLanguageSearch(rawQuery)
      rawQuery = parsed.query
      if (!category && parsed.category) category = parsed.category
      if (!type && parsed.type) type = parsed.type
      if (!condition && parsed.condition) condition = parsed.condition
      if (parsed.maxPrice && (!maxPrice || isNaN(maxPrice))) maxPrice = parsed.maxPrice
      if (parsed.minPrice && minPrice === 0) minPrice = parsed.minPrice
    }

    const conditions = [eq(listings.status, status)]

    if (rawQuery) {
      // Split query into individual words for fuzzy multi-word matching
      // e.g. "RRB NTPC" matches "RRB - NTPC - English Medium" because
      // each word is matched independently with AND logic
      const words = rawQuery
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2)

      if (words.length > 0) {
        for (const word of words) {
          conditions.push(
            or(
              ilike(listings.title, `%${word}%`),
              ilike(listings.description, `%${word}%`),
              ilike(listings.location, `%${word}%`),
              ilike(listings.sellerName, `%${word}%`)
            ) as never
          )
        }
      } else {
        // Single short word or original query fallback
        conditions.push(
          or(
            ilike(listings.title, `%${rawQuery}%`),
            ilike(listings.description, `%${rawQuery}%`),
            ilike(listings.location, `%${rawQuery}%`),
            ilike(listings.sellerName, `%${rawQuery}%`)
          ) as never
        )
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

    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      conditions.push(lte(listings.price, maxPrice))
    }

    // Determine sorting
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
  } catch (error: any) {
    console.error('[API Listings Error]', error?.message || error)
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
