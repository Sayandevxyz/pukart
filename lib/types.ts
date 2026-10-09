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
  email?: string | null
  image?: string | null
  department?: string | null
  course?: string | null
  year?: number | null
  bio?: string | null
  hostel?: string | null
  phone?: string | null
  role?: 'user' | 'admin' | string
  isPrivate?: boolean
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

export interface ReviewItem {
  id: number
  transactionId?: number
  listingId?: number | null
  authorId?: string
  recipientId?: string
  rating: number
  body?: string
  comment?: string | null
  createdAt: string | Date
  reviewerName?: string
  buyerName?: string
}

export interface UserRatingStats {
  averageRating: number | null
  reviewCount: number
  reviews?: ReviewItem[]
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

export interface ChatMessageItem {
  id: number
  conversationId?: number
  senderId: string
  content: string
  readAt?: string | Date | null
  createdAt: string | Date
}

export interface ReportItem {
  id: number
  reason: string
  details?: string | null
  listingId?: number | null
  reportedUserId?: string | null
  reporterId?: string
  createdAt: string | Date
}

export interface ConversationItem {
  id: number
  listingId: number
  buyerId: string
  sellerId: string
  lastMessageAt?: string | Date | null
  createdAt: string | Date
  listing?: ListingItem
  otherUser?: UserProfile
}

export interface SellerProfileData {
  user: UserProfile & { createdAt?: string | Date | null; role?: string }
  listings: ListingItem[]
  ratingStats: UserRatingStats
  isPrivate?: boolean
}

