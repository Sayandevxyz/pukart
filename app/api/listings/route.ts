import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { listings } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const query = params.get('q')?.trim().slice(0, 120)
  const category = params.get('category')?.trim().slice(0, 80)
  const type = params.get('type')?.trim().slice(0, 30)
  const conditions = [eq(listings.status, 'active')]
  if (query) conditions.push(or(ilike(listings.title, `%${query}%`), ilike(listings.description, `%${query}%`)) as never)
  if (category && category !== 'All') conditions.push(eq(listings.category, category))
  if (type && type !== 'All') conditions.push(eq(listings.type, type.toLowerCase()))
  const rows = await db.select().from(listings).where(and(...conditions)).orderBy(desc(listings.createdAt)).limit(100)
  return NextResponse.json({ listings: rows })
}
