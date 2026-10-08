/**
 * Core Domain Interfaces & Type Definitions for PUKart Campus Marketplace
 * Pondicherry University Peer-to-Peer Trading & Mobility Platform
 */

export type ListingStatus = 'active' | 'reserved' | 'sold' | 'rented' | 'archived'
export type ListingType = 'sell' | 'rent' | 'buy'
export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair'

export interface UserProfile {
  id: string
  name: string
  email: string
  image?: string | null
  department?: string | null
  course?: string | null
  year?: number | null
  bio?: string | null
  hostel?: string | null
  phone?: string | null
  role?: 'user' | 'admin' | string
}

export interface ListingSeller {
  id?: string
  name?: string | null
  email?: string | null
  department?: string | null
  course?: string | null
  year?: number | null
  bio?: string | null
  image?: string | null
  hostel?: string | null
  phone?: string | null
  isPrivate?: boolean
}

export interface ListingItem {
  id: number
  userId: string
  sellerName: string
  title: string
  description: string
  price: number
  originalPrice?: number | null
  priceUnit?: string | null
  type: ListingType | string
  category: string
  condition?: ListingCondition | string
  imageUrl?: string | null
  images?: string[]
  location?: string | null
  status: ListingStatus | string
  featured?: boolean
  viewsCount?: number
  aiFlagged?: boolean
  aiFlagReason?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
  seller?: ListingSeller | null
}

export interface UserRatingStats {
  averageRating: number | null
  reviewCount: number
  reviews?: Array<{
    id: number
    rating: number
    comment?: string | null
    createdAt: string | Date
    buyerName?: string
  }>
}

export interface TransactionItem {
  id: number
  listingId: number
  buyerId: string
  sellerId: string
  status: 'inquiry' | 'requested' | 'negotiating' | 'accepted' | 'completed' | 'rejected' | 'cancelled' | 'disputed'
  proposedPrice?: number | null
  paymentMethod: string
  meetupLocation?: string | null
  meetupTime?: string | Date | null
  buyerNote?: string | null
  createdAt: string | Date
  listing?: ListingItem
  buyer?: UserProfile
  seller?: UserProfile
}
