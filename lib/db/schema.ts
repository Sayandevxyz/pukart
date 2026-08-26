import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core"

// ---------- Better Auth tables (do not rename columns) ----------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
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

// ---------- PUKart app tables ----------

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  sellerName: text("sellerName").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  priceUnit: text("priceUnit"),
  type: text("type").notNull(), // 'sell' | 'rent' | 'service' | 'accommodation'
  category: text("category").notNull(),
  imageUrl: text("imageUrl"),
  location: text("location"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listingId").notNull(),
    buyerId: text("buyerId").notNull(),
    sellerId: text("sellerId").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [unique().on(t.listingId, t.buyerId)],
)

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  senderId: text("senderId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export type Listing = typeof listings.$inferSelect
export type Conversation = typeof conversations.$inferSelect
export const profiles = pgTable("profiles", {
  userId: text("userId").primaryKey(),
  department: text("department"),
  course: text("course"),
  year: integer("year"),
  bio: text("bio"),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  listingId: integer("listingId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.listingId)])

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: text("reporterId").notNull(),
  listingId: integer("listingId"),
  reportedUserId: text("reportedUserId"),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  listingId: integer("listingId").notNull(),
  buyerId: text("buyerId").notNull(),
  sellerId: text("sellerId").notNull(),
  status: text("status").notNull().default("inquiry"),
  amount: integer("amount").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  transactionId: integer("transactionId").notNull(),
  authorId: text("authorId").notNull(),
  recipientId: text("recipientId").notNull(),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (t) => [unique().on(t.transactionId, t.authorId)])

export type Profile = typeof profiles.$inferSelect
export type Favorite = typeof favorites.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type Report = typeof reports.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Review = typeof reviews.$inferSelect
export type Message = typeof messages.$inferSelect
