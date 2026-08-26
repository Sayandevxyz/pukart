import { Pool } from 'pg'
import fs from 'node:fs'
import path from 'node:path'

// Helper to load env files when running outside Next.js runtime
function loadEnv() {
  const envFiles = ['.env.local', '.env']
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const [key, ...values] = trimmed.split('=')
        const val = values.join('=').trim()
        if (key && val && !process.env[key.trim()]) {
          process.env[key.trim()] = val.replace(/^["'](.*)["']$/, '$1')
        }
      }
    }
  }
}

loadEnv()

export async function runMigrations() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('[db] Error: DATABASE_URL is not set in environment or .env.local')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  })

  const client = await pool.connect()
  try {
    console.log('[db] Starting database migration & schema sync on Neon Postgres...')

    // 1. Better Auth tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" text PRIMARY KEY,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "image" text,
        "role" text NOT NULL DEFAULT 'user',
        "isSuspended" boolean NOT NULL DEFAULT false,
        "department" text,
        "course" text,
        "year" integer,
        "bio" text,
        "phone" text,
        "hostel" text,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "session" (
        "id" text PRIMARY KEY,
        "expiresAt" timestamp NOT NULL,
        "token" text NOT NULL UNIQUE,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW(),
        "ipAddress" text,
        "userAgent" text,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "account" (
        "id" text PRIMARY KEY,
        "accountId" text NOT NULL,
        "providerId" text NOT NULL,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken" text,
        "refreshToken" text,
        "idToken" text,
        "accessTokenExpiresAt" timestamp,
        "refreshTokenExpiresAt" timestamp,
        "scope" text,
        "password" text,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "verification" (
        "id" text PRIMARY KEY,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );
    `)

    // 2. Universities & Categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS "universities" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "domain" text NOT NULL UNIQUE,
        "city" text NOT NULL DEFAULT 'Puducherry',
        "state" text NOT NULL DEFAULT 'Puducherry',
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "categories" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL UNIQUE,
        "slug" text NOT NULL UNIQUE,
        "icon" text,
        "description" text,
        "order" integer NOT NULL DEFAULT 0,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT NOW()
      );
    `)

    // 3. Listings & Listing Images
    await client.query(`
      CREATE TABLE IF NOT EXISTS "listings" (
        "id" serial PRIMARY KEY,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "sellerName" text NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "price" integer NOT NULL,
        "originalPrice" integer,
        "priceUnit" text DEFAULT 'item',
        "type" text NOT NULL DEFAULT 'sell',
        "categoryId" integer REFERENCES "categories"("id") ON DELETE SET NULL,
        "category" text NOT NULL,
        "condition" text NOT NULL DEFAULT 'good',
        "imageUrl" text,
        "location" text DEFAULT 'Pondicherry University',
        "status" text NOT NULL DEFAULT 'active',
        "featured" boolean NOT NULL DEFAULT false,
        "viewsCount" integer NOT NULL DEFAULT 0,
        "aiFlagged" boolean NOT NULL DEFAULT false,
        "aiFlagReason" text,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "listing_images" (
        "id" serial PRIMARY KEY,
        "listingId" integer NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
        "url" text NOT NULL,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isPrimary" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT NOW()
      );
    `)

    // 4. Safe Alterations if columns were added later
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'user';
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isSuspended" boolean NOT NULL DEFAULT false;
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "department" text;
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "course" text;
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "year" integer;
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bio" text;
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" text;
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "hostel" text;

        ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "phone" text;
        ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "hostel" text;
        ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "department" text;
        ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "course" text;
        ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "year" integer;
        ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "bio" text;

        ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" text;
        ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "idToken" text;
        ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text;
        ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "password" text;

        ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "originalPrice" integer;
        ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "condition" text NOT NULL DEFAULT 'good';
        ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "categoryId" integer REFERENCES "categories"("id") ON DELETE SET NULL;
        ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;
        ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "viewsCount" integer NOT NULL DEFAULT 0;
        ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "aiFlagged" boolean NOT NULL DEFAULT false;
        ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "aiFlagReason" text;
        ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT NOW();

        ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "lastMessage" text;
        ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "lastMessageAt" timestamp DEFAULT NOW();

        ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "imageUrl" text;
        ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "readAt" timestamp;

        ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "offerId" integer;
        ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "paymentMethod" text NOT NULL DEFAULT 'meetup_cash';
        ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "meetupLocation" text;

        ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reportedUserId" text;
        ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "details" text;
        ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "adminNotes" text;

        ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "listingId" integer REFERENCES "listings"("id") ON DELETE SET NULL;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `)

    // 5. Conversations & Messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" serial PRIMARY KEY,
        "listingId" integer NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
        "buyerId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "sellerId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "lastMessage" text,
        "lastMessageAt" timestamp DEFAULT NOW(),
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        CONSTRAINT "conversations_listing_buyer_unique" UNIQUE ("listingId", "buyerId")
      );

      CREATE TABLE IF NOT EXISTS "messages" (
        "id" serial PRIMARY KEY,
        "conversationId" integer NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
        "senderId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "content" text NOT NULL,
        "imageUrl" text,
        "readAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT NOW()
      );
    `)

    // 6. Offers & Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS "offers" (
        "id" serial PRIMARY KEY,
        "listingId" integer NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
        "buyerId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "sellerId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "amount" integer NOT NULL,
        "counterAmount" integer,
        "status" text NOT NULL DEFAULT 'pending',
        "message" text,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" serial PRIMARY KEY,
        "listingId" integer NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
        "buyerId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "sellerId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "offerId" integer REFERENCES "offers"("id") ON DELETE SET NULL,
        "status" text NOT NULL DEFAULT 'inquiry',
        "amount" integer NOT NULL,
        "paymentMethod" text NOT NULL DEFAULT 'meetup_cash',
        "meetupLocation" text,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );
    `)

    // 7. Reviews, Favorites, Notifications, Reports, Profiles, Blocked Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" serial PRIMARY KEY,
        "transactionId" integer NOT NULL REFERENCES "transactions"("id") ON DELETE CASCADE,
        "listingId" integer REFERENCES "listings"("id") ON DELETE SET NULL,
        "authorId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "recipientId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "rating" integer NOT NULL,
        "body" text NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        CONSTRAINT "reviews_transaction_author_unique" UNIQUE ("transactionId", "authorId")
      );

      CREATE TABLE IF NOT EXISTS "favorites" (
        "id" serial PRIMARY KEY,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "listingId" integer NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        CONSTRAINT "favorites_user_listing_unique" UNIQUE ("userId", "listingId")
      );

      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" serial PRIMARY KEY,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "kind" text NOT NULL,
        "title" text NOT NULL,
        "body" text NOT NULL,
        "link" text,
        "readAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "reports" (
        "id" serial PRIMARY KEY,
        "reporterId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "listingId" integer REFERENCES "listings"("id") ON DELETE SET NULL,
        "reportedUserId" text REFERENCES "user"("id") ON DELETE SET NULL,
        "reason" text NOT NULL,
        "details" text,
        "status" text NOT NULL DEFAULT 'open',
        "adminNotes" text,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "profiles" (
        "userId" text PRIMARY KEY REFERENCES "user"("id") ON DELETE CASCADE,
        "department" text,
        "course" text,
        "year" integer,
        "bio" text,
        "phone" text,
        "hostel" text,
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "blocked_users" (
        "id" serial PRIMARY KEY,
        "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "blockedUserId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        CONSTRAINT "blocked_users_unique" UNIQUE ("userId", "blockedUserId")
      );
    `)

    // 8. Performance Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "listings_status_idx" ON "listings" ("status");
      CREATE INDEX IF NOT EXISTS "listings_user_id_idx" ON "listings" ("userId");
      CREATE INDEX IF NOT EXISTS "listings_category_idx" ON "listings" ("category");
      CREATE INDEX IF NOT EXISTS "listings_price_idx" ON "listings" ("price");
      CREATE INDEX IF NOT EXISTS "listings_created_at_idx" ON "listings" ("createdAt");
      CREATE INDEX IF NOT EXISTS "listings_featured_idx" ON "listings" ("featured");
      CREATE INDEX IF NOT EXISTS "listing_images_listing_id_idx" ON "listing_images" ("listingId");
      CREATE INDEX IF NOT EXISTS "conversations_buyer_idx" ON "conversations" ("buyerId");
      CREATE INDEX IF NOT EXISTS "conversations_seller_idx" ON "conversations" ("sellerId");
      CREATE INDEX IF NOT EXISTS "messages_conversation_idx" ON "messages" ("conversationId");
      CREATE INDEX IF NOT EXISTS "transactions_buyer_idx" ON "transactions" ("buyerId");
      CREATE INDEX IF NOT EXISTS "transactions_seller_idx" ON "transactions" ("sellerId");
      CREATE INDEX IF NOT EXISTS "favorites_user_idx" ON "favorites" ("userId");
      CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" ("userId");
      CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports" ("status");
    `)

    // 8.5 Ensure all columns exist on pre-existing tables
    await client.query(`
      -- User table columns
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "department" text;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "course" text;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "year" integer;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bio" text;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" text;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "hostel" text;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isSuspended" boolean NOT NULL DEFAULT false;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT NOW();

      -- Account table columns
      ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" text;
      ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT NOW();

      -- Listings table columns
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "sellerName" text NOT NULL DEFAULT 'PU Student';
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "originalPrice" integer;
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "priceUnit" text NOT NULL DEFAULT 'INR';
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'sell';
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "condition" text NOT NULL DEFAULT 'good';
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "imageUrl" text;
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "location" text NOT NULL DEFAULT 'Pondicherry University';
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active';
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "viewsCount" integer NOT NULL DEFAULT 0;
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "aiFlagged" boolean NOT NULL DEFAULT false;
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "aiFlagReason" text;
      ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT NOW();

      -- Offers table columns
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "counterAmount" integer;
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'pending';
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "message" text;
      ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT NOW();

      -- Transactions table columns
      ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "offerId" integer;
      ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'inquiry';
      ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "amount" integer NOT NULL DEFAULT 0;
      ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "paymentMethod" text NOT NULL DEFAULT 'meetup_cash';
      ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "meetupLocation" text;
      ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT NOW();

      -- Reviews table columns
      ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "listingId" integer;
      ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "rating" integer NOT NULL DEFAULT 5;
      ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "body" text NOT NULL DEFAULT '';

      -- Profiles table columns
      ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "department" text;
      ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "course" text;
      ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "year" integer;
      ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "bio" text;
      ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "phone" text;
      ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "hostel" text;
      ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT NOW();

      -- Reports table columns
      ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reportedUserId" text;
      ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "details" text;
      ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'open';
      ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "adminNotes" text;
      ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT NOW();
    `);

    // 9. Seed default universities & categories
    await client.query(`
      INSERT INTO "universities" ("name", "slug", "domain", "city", "state", "active")
      VALUES ('Pondicherry University', 'pondiuni', 'pondiuni.ac.in', 'Puducherry', 'Puducherry', true)
      ON CONFLICT ("domain") DO NOTHING;

      INSERT INTO "categories" ("name", "slug", "icon", "description", "order") VALUES
      ('Books', 'books', 'BookOpen', 'Textbooks, reference guides, lecture notes and fiction', 1),
      ('Electronics', 'electronics', 'Laptop', 'Laptops, chargers, calculators, earphones, keyboards', 2),
      ('Hostel', 'hostel', 'Home', 'Mattresses, kettles, study lamps, hangers, buckets, coolers', 3),
      ('Cycles', 'cycles', 'Bike', 'Bicycles, campus locks, pumps and cycling accessories', 4),
      ('Bikes', 'bikes', 'Bike', 'Motorcycles, campus bikes, helmets and two-wheeler accessories', 5),
      ('Scooty', 'scooty', 'Zap', 'Scooters, Activa, electric scooties and daily campus commuters', 6),
      ('Fashion', 'fashion', 'Shirt', 'Lab coats, ethnic wear, jackets, bags and accessories', 7),
      ('Sports', 'sports', 'Trophy', 'Badminton racquets, footballs, gym gear, sports kits', 8),
      ('Food', 'food', 'Utensils', 'Hostel cooking essentials, snacks, dining accessories', 9),
      ('Services', 'services', 'BriefcaseBusiness', 'Tutoring, project assistance, design, photography', 10)
      ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "icon" = EXCLUDED."icon", "order" = EXCLUDED."order";
    `)

    console.log('[db] Database migration and schema synchronization completed successfully!')
  } catch (error) {
    console.error('[db] Migration error:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations()
  .then(() => {
    console.log('[db] Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('[db] Failed:', err)
    process.exit(1)
  })
