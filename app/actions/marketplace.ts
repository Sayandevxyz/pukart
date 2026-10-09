'use server'

import * as domain from './marketplace/index'

export async function currentUser() {
  return domain.currentUser()
}

export async function toggleFavorite(listingId: number) {
  return domain.toggleFavorite(listingId)
}

export async function getMyFavorites() {
  return domain.getMyFavorites()
}

export async function saveProfile(input: Parameters<typeof domain.saveProfile>[0]) {
  return domain.saveProfile(input)
}

export async function getCurrentUserProfile() {
  return domain.getCurrentUserProfile()
}

export async function getSellerProfile(userId: string) {
  return domain.getSellerProfile(userId)
}

export async function requestTransaction(
  listingId: number,
  paymentMethod = 'meetup_cash',
  meetupLocation = 'Pondicherry University Campus'
) {
  return domain.requestTransaction(listingId, paymentMethod, meetupLocation)
}

export async function getMyTransactions() {
  return domain.getMyTransactions()
}

export async function updateTransactionStatus(
  id: number,
  newStatus: Parameters<typeof domain.updateTransactionStatus>[1]
) {
  return domain.updateTransactionStatus(id, newStatus)
}

export async function startConversation(listingId: number, initialMessage?: string) {
  return domain.startConversation(listingId, initialMessage)
}

export async function getMyConversations() {
  return domain.getMyConversations()
}

export async function getConversationById(conversationId: number) {
  return domain.getConversationById(conversationId)
}

export async function sendMessage(conversationId: number, content: string, imageUrl?: string) {
  return domain.sendMessage(conversationId, content, imageUrl)
}

export async function blockUser(targetUserId: string) {
  return domain.blockUser(targetUserId)
}

export async function makeOffer(listingId: number, amount: number, message?: string) {
  return domain.makeOffer(listingId, amount, message)
}

export async function respondToOffer(
  offerId: number,
  action: Parameters<typeof domain.respondToOffer>[1],
  counterAmount?: number
) {
  return domain.respondToOffer(offerId, action, counterAmount)
}

export async function leaveReview(input: Parameters<typeof domain.leaveReview>[0]) {
  return domain.leaveReview(input)
}

export async function getUserRatingStats(userId: string) {
  return domain.getUserRatingStats(userId)
}

export async function reportListing(listingId: number, reason: string, details?: string) {
  return domain.reportListing(listingId, reason, details)
}

export async function reportUser(reportedUserId: string, reason: string, details?: string) {
  return domain.reportUser(reportedUserId, reason, details)
}

export async function getNotifications() {
  return domain.getNotifications()
}

export async function markNotificationRead(id: number) {
  return domain.markNotificationRead(id)
}

export async function markAllNotificationsRead() {
  return domain.markAllNotificationsRead()
}
