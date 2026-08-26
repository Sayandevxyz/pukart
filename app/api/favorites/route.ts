import { NextResponse } from 'next/server'
import { getMyFavorites } from '@/app/actions/marketplace'

export async function GET() {
  try {
    const listings = await getMyFavorites()
    return NextResponse.json({ listingIds: listings.map((listing) => listing.id) })
  } catch {
    return NextResponse.json({ listingIds: [] })
  }
}
