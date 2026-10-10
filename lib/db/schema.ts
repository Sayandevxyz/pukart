import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core"

const serialId = () => serial("id").primaryKey()
const createdCol = () => timestamp("createdAt").notNull().defaultNow()
const updatedCol = () => timestamp("updatedAt").notNull().defaultNow()
const timestamps = () => ({
  createdAt: createdCol(),
  updatedAt: updatedCol(),
})

const studentProfileCols = () => ({
  department: text("department"),
  course: text("course"),
  year: integer("year"),
  bio: text("bio"),
  phone: text("phone"),
  hostel: text("hostel"),
})

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  isSuspended: boolean("isSuspended").notNull().default(false),
  ...studentProfileCols(),
  ...timestamps(),
})

const userCascade = (name = "userId") =>
  text(name).notNull().references(() => user.id, { onDelete: "cascade" })

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  ...timestamps(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: userCascade(),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: userCascade(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  issuer: text("issuer"),
  ...timestamps(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  ...timestamps(),
})

export const universities = pgTable("universities", {
  id: serialId(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain").notNull().unique(),
  city: text("city").notNull().default("Puducherry"),
  state: text("state").notNull().default("Puducherry"),
  active: boolean("active").notNull().default(true),
  createdAt: createdCol(),
})

export const categories = pgTable("categories", {
  id: serialId(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  description: text("description"),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: createdCol(),
})

export const listings = pgTable(
  "listings",
  {
    id: serialId(),
    userId: userCascade(),
    sellerName: text("sellerName").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    originalPrice: integer("originalPrice"),
    priceUnit: text("priceUnit").default("item"),
    type: text("type").notNull().default("sell"),
    categoryId: integer("categoryId").references(() => categories.id, { onDelete: "set null" }),
    category: text("category").notNull(),
    condition: text("condition").notNull().default("good"),
    imageUrl: text("imageUrl"),
    location: text("location").default("Pondicherry University"),
    phone: text("phone"),
    status: text("status").notNull().default("active"),
    featured: boolean("featured").notNull().default(false),
    viewsCount: integer("viewsCount").notNull().default(0),
    aiFlagged: boolean("aiFlagged").notNull().default(false),
    aiFlagReason: text("aiFlagReason"),
    ...timestamps(),
  },
  (t) => [
    index("listings_status_idx").on(t.status),
    index("listings_user_id_idx").on(t.userId),
    index("listings_category_idx").on(t.category),
    index("listings_price_idx").on(t.price),
    index("listings_created_at_idx").on(t.createdAt),
    index("listings_featured_idx").on(t.featured),
  ]
)

const listingCascade = (name = "listingId") =>
  integer(name).notNull().references(() => listings.id, { onDelete: "cascade" })

const partyCols = () => ({
  listingId: listingCascade(),
  buyerId: userCascade("buyerId"),
  sellerId: userCascade("sellerId"),
})

export const listingImages = pgTable(
  "listing_images",
  {
    id: serialId(),
    listingId: listingCascade(),
    url: text("url").notNull(),
    displayOrder: integer("displayOrder").notNull().default(0),
    isPrimary: boolean("isPrimary").notNull().default(false),
    createdAt: createdCol(),
  },
  (t) => [index("listing_images_listing_id_idx").on(t.listingId)]
)

export const conversations = pgTable(
  "conversations",
  {
    id: serialId(),
    ...partyCols(),
    lastMessage: text("lastMessage"),
    lastMessageAt: timestamp("lastMessageAt").defaultNow(),
    createdAt: createdCol(),
  },
  (t) => [
    unique().on(t.listingId, t.buyerId),
    index("conversations_buyer_idx").on(t.buyerId),
    index("conversations_seller_idx").on(t.sellerId),
    index("conversations_listing_idx").on(t.listingId),
  ]
)

export const messages = pgTable(
  "messages",
  {
    id: serialId(),
    conversationId: integer("conversationId")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: userCascade("senderId"),
    content: text("content").notNull(),
    imageUrl: text("imageUrl"),
    readAt: timestamp("readAt"),
    createdAt: createdCol(),
  },
  (t) => [
    index("messages_conversation_idx").on(t.conversationId),
    index("messages_sender_idx").on(t.senderId),
    index("messages_created_at_idx").on(t.createdAt),
  ]
)

export const offers = pgTable(
  "offers",
  {
    id: serialId(),
    ...partyCols(),
    amount: integer("amount").notNull(),
    counterAmount: integer("counterAmount"),
    status: text("status").notNull().default("pending"),
    message: text("message"),
    ...timestamps(),
  },
  (t) => [
    index("offers_listing_idx").on(t.listingId),
    index("offers_buyer_idx").on(t.buyerId),
    index("offers_seller_idx").on(t.sellerId),
  ]
)

export const transactions = pgTable(
  "transactions",
  {
    id: serialId(),
    ...partyCols(),
    offerId: integer("offerId").references(() => offers.id, { onDelete: "set null" }),
    status: text("status").notNull().default("inquiry"),
    amount: integer("amount").notNull(),
    paymentMethod: text("paymentMethod").notNull().default("meetup_cash"),
    meetupLocation: text("meetupLocation"),
    ...timestamps(),
  },
  (t) => [
    index("transactions_listing_idx").on(t.listingId),
    index("transactions_buyer_idx").on(t.buyerId),
    index("transactions_seller_idx").on(t.sellerId),
    index("transactions_status_idx").on(t.status),
  ]
)

export const reviews = pgTable(
  "reviews",
  {
    id: serialId(),
    transactionId: integer("transactionId")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    listingId: integer("listingId").references(() => listings.id, { onDelete: "set null" }),
    authorId: userCascade("authorId"),
    recipientId: userCascade("recipientId"),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    createdAt: createdCol(),
  },
  (t) => [
    unique().on(t.transactionId, t.authorId),
    index("reviews_recipient_idx").on(t.recipientId),
    index("reviews_author_idx").on(t.authorId),
  ]
)

export const favorites = pgTable(
  "favorites",
  {
    id: serialId(),
    userId: userCascade(),
    listingId: listingCascade(),
    createdAt: createdCol(),
  },
  (t) => [
    unique().on(t.userId, t.listingId),
    index("favorites_user_idx").on(t.userId),
    index("favorites_listing_idx").on(t.listingId),
  ]
)

export const notifications = pgTable(
  "notifications",
  {
    id: serialId(),
    userId: userCascade(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    link: text("link"),
    readAt: timestamp("readAt"),
    createdAt: createdCol(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_read_idx").on(t.readAt),
  ]
)

export const reports = pgTable(
  "reports",
  {
    id: serialId(),
    reporterId: userCascade("reporterId"),
    listingId: integer("listingId").references(() => listings.id, { onDelete: "set null" }),
    reportedUserId: text("reportedUserId").references(() => user.id, { onDelete: "set null" }),
    reason: text("reason").notNull(),
    details: text("details"),
    status: text("status").notNull().default("open"),
    adminNotes: text("adminNotes"),
    ...timestamps(),
  },
  (t) => [
    index("reports_status_idx").on(t.status),
    index("reports_reporter_idx").on(t.reporterId),
  ]
)

export const profiles = pgTable("profiles", {
  userId: text("userId")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  ...studentProfileCols(),
  updatedAt: updatedCol(),
})

export const blockedUsers = pgTable(
  "blocked_users",
  {
    id: serialId(),
    userId: userCascade(),
    blockedUserId: userCascade("blockedUserId"),
    createdAt: createdCol(),
  },
  (t) => [unique().on(t.userId, t.blockedUserId)]
)

export type User = typeof user.$inferSelect
export type University = typeof universities.$inferSelect
export type Category = typeof categories.$inferSelect
export type Listing = typeof listings.$inferSelect
export type ListingImage = typeof listingImages.$inferSelect
export type Conversation = typeof conversations.$inferSelect
export type Message = typeof messages.$inferSelect
export type Offer = typeof offers.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Review = typeof reviews.$inferSelect
export type Favorite = typeof favorites.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type Report = typeof reports.$inferSelect
export type Profile = typeof profiles.$inferSelect
export type BlockedUser = typeof blockedUsers.$inferSelect