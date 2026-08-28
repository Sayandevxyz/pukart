'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, Suspense } from 'react'
import useSWR from 'swr'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import {
  BookOpen,
  Laptop,
  Home,
  Bike,
  Shirt,
  Trophy,
  Utensils,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Sparkles,
  ShoppingBag,
  Clock,
  Filter,
  X,
} from 'lucide-react'
import { toggleFavorite } from '@/app/actions/marketplace'
import { authClient } from '@/lib/auth-client'
import { getTypesForCategory, getConditionsForCategory } from '@/lib/constants/categories'

const fetcher = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) throw new Error('Unable to load marketplace listings')
    return response.json()
  })

const categoriesList = [
  { name: 'Books', icon: BookOpen, tint: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  { name: 'Electronics', icon: Laptop, tint: 'bg-teal-500/15 text-teal-400 border border-teal-500/30' },
  { name: 'Cycles', icon: Bike, tint: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  { name: 'Bikes', icon: Bike, tint: 'bg-emerald-600/15 text-emerald-300 border border-emerald-600/30' },
  { name: 'Scooty', icon: Sparkles, tint: 'bg-lime-500/15 text-lime-400 border border-lime-500/30' },
  { name: 'Hostel', icon: Home, tint: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  { name: 'Fashion', icon: Shirt, tint: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30' },
  { name: 'Sports', icon: Trophy, tint: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  { name: 'Food', icon: Utensils, tint: 'bg-rose-500/15 text-rose-400 border border-rose-500/30' },
  { name: 'Services', icon: BriefcaseBusiness, tint: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' },
]

const banners = [
  {
    eyebrow: 'WELCOME TO PUKART',
    title: 'Good finds are already nearby.',
    copy: 'Buy, sell and rent within the Pondicherry University campus.',
    action: 'Shop now',
    image: '/images/campus-marketplace.png',
  },
  {
    eyebrow: 'SELL SMARTER',
    title: 'Turn unused into useful.',
    copy: 'List your hostel essentials, textbooks and gadgets in minutes.',
    action: 'Sell now',
    image: '/images/student-selling.png',
  },
  {
    eyebrow: 'BACK TO CAMPUS',
    title: 'Deals made for student life.',
    copy: 'Discover affordable products from verified PU students.',
    action: 'Explore deals',
    image: '/images/campus-marketplace.png',
  },
]

function MarketplaceHome() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialQ = searchParams?.get('q') || ''
  const initialCategory = searchParams?.get('category') || 'All'
  const initialAi = searchParams?.get('ai') === 'true'

  const [query, setQuery] = useState(initialQ)
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [activeType, setActiveType] = useState('All')
  const [activeCondition, setActiveCondition] = useState('All')
  const [sort, setSort] = useState('newest')
  const [isAiMode, setIsAiMode] = useState(initialAi)
  const [page, setPage] = useState(1)
  const [banner, setBanner] = useState(0)
  const [notice, setNotice] = useState('')

  const [session, setSession] = useState<any>(null)
  const [saved, setSaved] = useState<number[]>([])

  const availableTypes = useMemo(() => getTypesForCategory(activeCategory), [activeCategory])
  const availableConditions = useMemo(() => getConditionsForCategory(activeCategory), [activeCategory])

  // SWR for server-side listings with search query & filters
  const apiUrl = useMemo(() => {
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (activeCategory && activeCategory !== 'All') p.set('category', activeCategory)
    if (activeType && activeType !== 'All') p.set('type', activeType.toLowerCase())
    if (activeCondition && activeCondition !== 'All') p.set('condition', activeCondition.toLowerCase())
    if (sort) p.set('sort', sort)
    if (isAiMode) p.set('ai', 'true')
    p.set('page', String(page))
    p.set('limit', '24')
    return `/api/listings?${p.toString()}`
  }, [query, activeCategory, activeType, activeCondition, sort, isAiMode, page])

  const { data, error, isLoading, mutate } = useSWR<{ listings: any[]; count: number; hasMore: boolean }>(
    apiUrl,
    fetcher,
    { keepPreviousData: true }
  )

  const { data: favoriteData } = useSWR<{ listingIds: number[] }>('/api/favorites', fetcher)

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res?.data?.user) setSession(res.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (favoriteData?.listingIds) {
      setSaved(favoriteData.listingIds)
    }
  }, [favoriteData])

  function toast(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2500)
  }

  async function handleToggleSaved(id: number) {
    if (!session?.user) {
      toast('Please sign in to save favorites')
      router.push('/sign-in')
      return
    }
    const wasSaved = saved.includes(id)
    setSaved((current) => (wasSaved ? current.filter((item) => item !== id) : [...current, id]))
    try {
      const result = await toggleFavorite(id)
      toast(result.saved ? 'Saved to favorites' : 'Removed from favorites')
    } catch (err: any) {
      setSaved((current) => (wasSaved ? [...current, id] : current.filter((item) => item !== id)))
      toast(err.message || 'Failed to save')
    }
  }

  function handleNavbarSearch(newQuery: string, aiMode = false) {
    setQuery(newQuery)
    setIsAiMode(aiMode)
    setPage(1)
    // When searching, reset category & sub-filters so results aren't wrongly filtered
    if (newQuery) {
      setActiveCategory('All')
      setActiveType('All')
      setActiveCondition('All')
      document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const listings = data?.listings || []

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar initialQuery={query} onSearch={handleNavbarSearch} />

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            role="status"
            className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-2xl"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Pills Strip */}
      <div className="border-b border-border bg-card/60">
        <nav
          className="mx-auto flex max-w-[1440px] items-center gap-1.5 overflow-x-auto px-4 py-2.5 text-xs font-bold sm:px-6 lg:px-8"
          aria-label="Marketplace categories"
        >
          <button
            onClick={() => {
              setActiveCategory('All')
              setPage(1)
              document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 transition ${
              activeCategory === 'All'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All Items
          </button>
          {categoriesList.map(({ name }) => (
            <button
              key={name}
              onClick={() => {
                setActiveCategory(name)
                setPage(1)
                document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 transition ${
                activeCategory === name
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {name}
            </button>
          ))}
          <button
            onClick={() => {
              setActiveType(activeType === 'Rent' ? 'All' : 'Rent')
              setPage(1)
              document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 transition ${
              activeType === 'Rent'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Rentals
          </button>
        </nav>
      </div>

      {/* Hero Banner with Dark Green Emerald Gradient & Campus Trust Badges */}
      <section id="home" className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-6 lg:px-8">
        <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#03150e] via-[#062c1d] to-[#041d13] text-white sm:min-h-[380px] shadow-2xl border border-emerald-800/40">
          {/* Radiant Ambient Light Backgrounds */}
          <div className="absolute -top-24 -left-24 size-96 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 size-72 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex min-h-[320px] max-w-2xl flex-col justify-center px-6 py-10 sm:min-h-[380px] sm:px-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 w-fit backdrop-blur-md shadow-sm">
              <Sparkles size={13} className="text-amber-400 animate-pulse" />
              <span>Pondicherry University Official Campus Marketplace</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance leading-[1.1]">
              Buy, Sell & Rent <br />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
                Right on Campus.
              </span>
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
              Connect directly with verified students and scholars for textbooks, laptops, cycles, bikes, scooties, and hostel essentials.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Browse Campus Deals</span>
                <ChevronRight size={16} />
              </button>
              <Link
                href="/listing/new"
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
              >
                <Plus size={16} />
                <span>Post Free Listing</span>
              </Link>
            </div>

            {/* Campus Trust Points */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300 border-t border-white/10 pt-4">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-400" />
                Verified @pondiuni.ac.in Only
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-amber-400" />
                0% Commission & Free Meetups
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Shop By Category: Modern Interactive Cards */}
      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Explore by Category</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Campus Departments & Gear</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10">
          {categoriesList.map(({ name, icon: Icon, tint }) => {
            const isSelected = activeCategory === name
            return (
              <button
                key={name}
                onClick={() => {
                  const nextCategory = isSelected ? 'All' : name
                  setActiveCategory(nextCategory)
                  setActiveType('All')
                  setActiveCondition('All')
                  setPage(1)
                  document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`group flex flex-col items-center justify-center rounded-2xl p-3.5 text-center transition-all duration-200 border ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.02]'
                    : 'border-border/80 bg-card hover:border-accent hover:shadow-md hover:-translate-y-1'
                }`}
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-xl ${tint} transition-transform group-hover:scale-110 shadow-sm`}
                >
                  <Icon size={22} />
                </span>
                <span className="mt-2.5 truncate text-xs font-bold text-foreground">
                  {name}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Live Campus Deals Section */}
      <section id="deals" className="bg-muted/45 py-8 sm:py-10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">
                {isAiMode ? 'AI Natural Search Results' : 'Curated for campus life'}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">
                {query ? `Search: "${query}"` : activeCategory !== 'All' ? `${activeCategory} Listings` : 'Deals near you'}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {listings.length} verified listings around Pondicherry University
              </p>
            </div>

            {/* Dynamic Server Filter Selectors Tailored Per Category */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activeType}
                onChange={(e) => {
                  setActiveType(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter listing type"
                className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none shadow-sm"
              >
                {availableTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={activeCondition}
                onChange={(e) => {
                  setActiveCondition(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter condition"
                className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none shadow-sm"
              >
                {availableConditions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value)
                  setPage(1)
                }}
                aria-label="Sort listings"
                className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none shadow-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-square animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
              <h3 className="font-bold text-primary">Marketplace listings temporarily unavailable</h3>
              <p className="mt-1 text-xs text-muted-foreground">Please refresh to re-establish campus connection.</p>
              <button
                onClick={() => mutate()}
                className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow"
              >
                Refresh
              </button>
            </div>
          ) : listings.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">
              {listings.map((item: any, index: number) => {
                const hasDiscount = item.originalPrice && item.originalPrice > item.price
                const discount = hasDiscount
                  ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                  : 0

                return (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.2) }}
                    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <Link
                        href={`/listing/${item.id}`}
                        className="relative block aspect-square cursor-pointer overflow-hidden bg-muted"
                      >
                        <Image
                          src={item.imageUrl || '/images/campus-marketplace.png'}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 45vw, 220px"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                        <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground uppercase tracking-wider">
                          {item.type || 'Sell'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleToggleSaved(item.id)
                          }}
                          aria-label="Save to favorites"
                          className="absolute right-2 top-2 rounded-full bg-card/90 p-1.5 text-primary shadow-sm backdrop-blur hover:text-accent transition"
                        >
                          <Heart
                            size={16}
                            fill={saved.includes(item.id) ? 'currentColor' : 'none'}
                            className={saved.includes(item.id) ? 'text-accent' : ''}
                          />
                        </button>
                      </Link>

                      {/* Content */}
                      <div className="p-3">
                        <Link
                          href={`/listing/${item.id}`}
                          className="line-clamp-2 text-xs font-semibold leading-5 text-primary hover:text-accent"
                        >
                          {item.title}
                        </Link>

                        {/* Honest Condition (no fake 5.0 ratings) */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="capitalize font-medium">
                            {item.condition ? item.condition.replace('_', ' ') : 'Condition unspecified'}
                          </span>
                        </div>

                        {/* Real Price */}
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-primary">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-xs text-muted-foreground line-through">
                                ₹{item.originalPrice.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700">
                                {discount}% off
                              </span>
                            </>
                          )}
                        </div>

                        <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                          <MapPin size={11} /> {item.location || 'Pondicherry University'}
                        </p>
                      </div>
                    </div>

                    <div className="px-3 pb-3">
                      <p className="flex items-center gap-1 text-[10px] font-semibold text-accent border-t border-border/70 pt-2">
                        <ShieldCheck size={12} /> Verified PU account
                      </p>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-border bg-background px-6 py-16 text-center">
              <Search className="mx-auto text-muted-foreground size-8" />
              <h3 className="mt-3 font-bold text-primary">No campus products found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Try searching with different keywords or clearing active filters.
              </p>
              <button
                onClick={() => {
                  setQuery('')
                  setActiveCategory('All')
                  setActiveType('All')
                  setActiveCondition('All')
                  setIsAiMode(false)
                }}
                className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {data?.hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-border bg-card px-6 py-3 text-xs font-bold text-primary hover:bg-muted shadow-sm"
              >
                Load More Listings
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Safety & Trust Pillars */}
      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <ShieldCheck />
            </span>
            <div>
              <h3 className="font-bold text-sm text-primary">Verified Students Only</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Every buyer and seller uses a genuine @pondiuni.ac.in credentials.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <MapPin />
            </span>
            <div>
              <h3 className="font-bold text-sm text-primary">Campus Meetup Handoff</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Meet at the Central Library, Gate 1, or Science Complex for secure exchanges.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Sparkles />
            </span>
            <div>
              <h3 className="font-bold text-sm text-primary">Student Budget Deals</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Make custom counter-offers and pass on textbooks and hostel gear affordably.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action Banner */}
      <section className="border-t border-border bg-primary py-10 text-primary-foreground">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Ready to pass it on?</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Your next buyer is on campus.</h2>
            <p className="mt-2 text-xs sm:text-sm text-primary-foreground/75">
              List your unused textbooks, electronics, and hostel essentials in minutes.
            </p>
          </div>
          <Link
            href="/listing/new"
            className="w-fit rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground shadow-lg hover:opacity-95"
          >
            Sell on PUKart <Plus className="ml-1 inline" size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading PUKart...</div>}>
      <MarketplaceHome />
    </Suspense>
  )
}
