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

// ---------- Better Auth tables (do not rename columns) ----------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  isSuspended: boolean("isSuspended").notNull().default(false),
  department: text("department"),
  course: text("course"),
  year: integer("year"),
  bio: text("bio"),
  phone: text("phone"),
  hostel: text("hostel"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  issuer: text("issuer"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// ---------- PUKart App Tables ----------

export const universities = pgTable("universities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain").notNull().unique(),
  city: text("city").notNull().default("Puducherry"),
  state: text("state").notNull().default("Puducherry"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  description: text("description"),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const listings = pgTable(
  "listings",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sellerName: text("sellerName").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    originalPrice: integer("originalPrice"),
    priceUnit: text("priceUnit").default("item"),
    type: text("type").notNull().default("sell"), // 'sell' | 'rent' | 'service' | 'accommodation'
    categoryId: integer("categoryId").references(() => categories.id, { onDelete: "set null" }),
    category: text("category").notNull(),
    condition: text("condition").notNull().default("good"), // 'brand_new' | 'like_new' | 'good' | 'fair' | 'poor'
    imageUrl: text("imageUrl"), // Primary thumbnail
    location: text("location").default("Pondicherry University"),
    status: text("status").notNull().default("active"), // 'active' | 'reserved' | 'sold' | 'rented' | 'archived'
    featured: boolean("featured").notNull().default(false),
    viewsCount: integer("viewsCount").notNull().default(0),
    aiFlagged: boolean("aiFlagged").notNull().default(false),
    aiFlagReason: text("aiFlagReason"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
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

export const listingImages = pgTable(
  "listing_images",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    displayOrder: integer("displayOrder").notNull().default(0),
    isPrimary: boolean("isPrimary").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("listing_images_listing_id_idx").on(t.listingId)]
)

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    buyerId: text("buyerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sellerId: text("sellerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastMessage: text("lastMessage"),
    lastMessageAt: timestamp("lastMessageAt").defaultNow(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
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
    id: serial("id").primaryKey(),
    conversationId: integer("conversationId")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("senderId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    imageUrl: text("imageUrl"),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
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
    id: serial("id").primaryKey(),
    listingId: integer("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    buyerId: text("buyerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sellerId: text("sellerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    counterAmount: integer("counterAmount"),
    status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn'
    message: text("message"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
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
    id: serial("id").primaryKey(),
    listingId: integer("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    buyerId: text("buyerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sellerId: text("sellerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    offerId: integer("offerId").references(() => offers.id, { onDelete: "set null" }),
    status: text("status").notNull().default("inquiry"), // 'inquiry' | 'negotiating' | 'requested' | 'accepted' | 'completed' | 'rejected' | 'cancelled' | 'disputed'
    amount: integer("amount").notNull(),
    paymentMethod: text("paymentMethod").notNull().default("meetup_cash"), // 'meetup_cash' | 'upi' | 'razorpay'
    meetupLocation: text("meetupLocation"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
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
    id: serial("id").primaryKey(),
    transactionId: integer("transactionId")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    listingId: integer("listingId").references(() => listings.id, { onDelete: "set null" }),
    authorId: text("authorId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: text("recipientId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1 - 5
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
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
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listingId: integer("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
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
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // 'message' | 'favorite' | 'offer' | 'offer_accepted' | 'offer_rejected' | 'transaction' | 'review' | 'moderation'
    title: text("title").notNull(),
    body: text("body").notNull(),
    link: text("link"),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_read_idx").on(t.readAt),
  ]
)

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    reporterId: text("reporterId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listingId: integer("listingId").references(() => listings.id, { onDelete: "set null" }),
    reportedUserId: text("reportedUserId").references(() => user.id, { onDelete: "set null" }),
    reason: text("reason").notNull(),
    details: text("details"),
    status: text("status").notNull().default("open"), // 'open' | 'reviewing' | 'resolved' | 'dismissed'
    adminNotes: text("adminNotes"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
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
  department: text("department"),
  course: text("course"),
  year: integer("year"),
  bio: text("bio"),
  phone: text("phone"),
  hostel: text("hostel"),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const blockedUsers = pgTable(
  "blocked_users",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedUserId: text("blockedUserId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.blockedUserId)]
)

// ---------- Type Exports ----------

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
