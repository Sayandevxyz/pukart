'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import {
  Bell,
  BookOpen,
  Bike,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Heart,
  Laptop,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
  X,
  Home,
  Shirt,
  Trophy,
  Utensils,
} from 'lucide-react'

type Listing = {
  id: number
  title: string
  price: number
  originalPrice: number
  category: string
  condition: string
  type: string
  seller: string
  location: string
  image: string
  rating: number
  posted: string
}

const listings: Listing[] = [
  { id: 1, title: 'Casio fx-991ES Plus', price: 650, originalPrice: 1000, category: 'Books & Academic', condition: 'Like new', type: 'Buy', seller: 'Aarav Menon', location: 'Kalapet', image: '/images/listing-laptop.png', rating: 4.8, posted: '12 min ago' },
  { id: 2, title: 'Single-speed city cycle', price: 2800, originalPrice: 4200, category: 'Cycles', condition: 'Good', type: 'Buy', seller: 'Nikhil R', location: 'Hostel Road', image: '/images/listing-cycle.png', rating: 4.7, posted: '35 min ago' },
  { id: 3, title: "The Artist's Way", price: 280, originalPrice: 450, category: 'Books & Academic', condition: 'Good', type: 'Buy', seller: 'Mara Studio', location: 'Auroville', image: '/images/listing-books.png', rating: 4.9, posted: '1 hr ago' },
  { id: 4, title: 'MacBook stand + desk kit', price: 650, originalPrice: 900, category: 'Electronics', condition: 'Like new', type: 'Rent', seller: 'Priya S', location: 'Mahatma Gandhi Road', image: '/images/listing-laptop.png', rating: 4.6, posted: '2 hrs ago' },
  { id: 5, title: 'Hand-painted tote bag', price: 380, originalPrice: 550, category: 'Fashion', condition: 'New', type: 'Buy', seller: 'Ishita K', location: 'Lawspet', image: '/images/listing-books.png', rating: 4.9, posted: '3 hrs ago' },
  { id: 6, title: 'Badminton racquet pair', price: 900, originalPrice: 1400, category: 'Sports', condition: 'Good', type: 'Rent', seller: 'Dev Shah', location: 'Tagore Nagar', image: '/images/listing-cycle.png', rating: 4.5, posted: '5 hrs ago' },
]

const categories = [
  { name: 'Books', icon: BookOpen, tint: 'bg-blue-50 text-blue-700' },
  { name: 'Electronics', icon: Laptop, tint: 'bg-cyan-50 text-cyan-700' },
  { name: 'Hostel', icon: Home, tint: 'bg-amber-50 text-amber-700' },
  { name: 'Cycles', icon: Bike, tint: 'bg-emerald-50 text-emerald-700' },
  { name: 'Fashion', icon: Shirt, tint: 'bg-pink-50 text-pink-700' },
  { name: 'Sports', icon: Trophy, tint: 'bg-orange-50 text-orange-700' },
  { name: 'Food', icon: Utensils, tint: 'bg-rose-50 text-rose-700' },
  { name: 'Services', icon: BriefcaseBusiness, tint: 'bg-violet-50 text-violet-700' },
]

const banners = [
  { eyebrow: 'WELCOME TO PUKART', title: 'Good finds are already nearby.', copy: 'Buy, sell and rent within the Pondicherry University campus.', action: 'Shop now', image: '/images/campus-marketplace.png' },
  { eyebrow: 'SELL SMARTER', title: 'Turn unused into useful.', copy: 'List your hostel essentials, books and gadgets in minutes.', action: 'Sell now', image: '/images/student-selling.png' },
  { eyebrow: 'BACK TO CAMPUS', title: 'Deals made for student life.', copy: 'Discover affordable products from verified PU students.', action: 'Explore deals', image: '/images/campus-marketplace.png' },
]

export default function Page() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeType, setActiveType] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [saved, setSaved] = useState<number[]>([])
  const [selected, setSelected] = useState<Listing | null>(null)
  const [drawer, setDrawer] = useState<'sell' | 'messages' | 'profile' | null>(null)
  const [banner, setBanner] = useState(0)
  const [notice, setNotice] = useState('')

  const filtered = useMemo(() => {
    const value = query.toLowerCase().trim()
    const result = listings.filter((item) => {
      const matchesQuery = !value || `${item.title} ${item.category} ${item.seller} ${item.location}`.toLowerCase().includes(value)
      const matchesCategory = activeCategory === 'All' || item.category.includes(activeCategory)
      const matchesType = activeType === 'All' || item.type === activeType
      return matchesQuery && matchesCategory && matchesType
    })
    if (sort === 'Price low-high') return [...result].sort((a, b) => a.price - b.price)
    if (sort === 'Price high-low') return [...result].sort((a, b) => b.price - a.price)
    return result
  }, [activeCategory, activeType, query, sort])

  function toast(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2400)
  }

  function toggleSaved(id: number) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
    toast(saved.includes(id) ? 'Removed from favorites' : 'Saved to favorites')
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AnimatePresence>{notice && <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} role="status" className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xl">{notice}</motion.div>}</AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#home" className="flex shrink-0 items-center gap-2" aria-label="PUKart home"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><ShoppingBag size={21} /></span><span className="font-serif text-2xl font-semibold tracking-tight text-primary">PU<span className="text-accent">K</span>art</span></a>
          <div className="relative hidden max-w-2xl flex-1 md:block"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search marketplace" placeholder="Search products, books, electronics and more" className="h-11 w-full rounded-xl border border-border bg-muted/50 pl-11 pr-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15" />{query && <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-background"><X size={16} /></button>}</div>
          <div className="ml-auto hidden items-center gap-1 lg:flex"><button onClick={() => setDrawer('profile')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-muted"><UserRound size={18} /> Account</button><button onClick={() => toast(`${saved.length} saved product${saved.length === 1 ? '' : 's'}`)} aria-label="Favorites" className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted"><Heart size={19} fill={saved.length ? 'currentColor' : 'none'} />{saved.length > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{saved.length}</span>}</button><button aria-label="Notifications" className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted"><Bell size={19} /></button><button onClick={() => setDrawer('messages')} aria-label="Messages" className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted"><MessageCircle size={19} /></button><button onClick={() => setDrawer('sell')} className="ml-2 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus size={16} /> Sell an item</button></div>
          <button onClick={() => setDrawer(drawer ? null : 'profile')} className="ml-auto rounded-xl p-2 lg:hidden" aria-label="Open menu"><Menu size={22} /></button>
        </div>
        <div className="border-t border-border"><nav className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-4 py-2.5 text-sm font-semibold sm:px-6 lg:px-8" aria-label="Marketplace categories"><button onClick={() => { setActiveCategory('All'); document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' }) }} className={`whitespace-nowrap rounded-lg px-3 py-1.5 ${activeCategory === 'All' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>All</button>{categories.map(({ name }) => <button key={name} onClick={() => { setActiveCategory(name); document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' }) }} className={`whitespace-nowrap rounded-lg px-3 py-1.5 ${activeCategory === name ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{name}</button>)}<button onClick={() => setActiveType('Rent')} className={`whitespace-nowrap rounded-lg px-3 py-1.5 ${activeType === 'Rent' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Rentals</button></nav></div>
      </header>

      <section id="home" className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-6 lg:px-8"><div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-primary text-primary-foreground sm:min-h-[360px]"><AnimatePresence mode="wait"><motion.div key={banner} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0"><Image src={banners[banner].image} alt="Students exploring the PUKart marketplace" fill className="object-cover opacity-35" priority={banner === 0} /><div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/20" /></motion.div></AnimatePresence><div className="relative flex min-h-[300px] max-w-xl flex-col justify-center px-6 py-10 sm:min-h-[360px] sm:px-12"><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">{banners[banner].eyebrow}</p><h1 className="mt-3 font-serif text-4xl leading-[1.04] tracking-tight sm:text-6xl">{banners[banner].title}</h1><p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/75 sm:text-base">{banners[banner].copy}</p><div className="mt-7 flex flex-wrap gap-3"><button onClick={() => document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground hover:opacity-90">{banners[banner].action} <ChevronRight className="ml-1 inline" size={16} /></button><button onClick={() => setDrawer('sell')} className="rounded-xl border border-primary-foreground/25 px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10">List your item</button></div></div><div className="absolute bottom-5 right-5 flex gap-2 sm:bottom-8 sm:right-10"><button onClick={() => setBanner((banner - 1 + banners.length) % banners.length)} aria-label="Previous banner" className="rounded-full bg-primary-foreground/15 p-2 hover:bg-primary-foreground/25"><ChevronLeft size={18} /></button><button onClick={() => setBanner((banner + 1) % banners.length)} aria-label="Next banner" className="rounded-full bg-primary-foreground/15 p-2 hover:bg-primary-foreground/25"><ChevronRight size={18} /></button></div><div className="absolute bottom-6 left-6 flex gap-1.5 sm:left-12">{banners.map((_, index) => <button key={index} onClick={() => setBanner(index)} aria-label={`Show banner ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === banner ? 'w-8 bg-accent' : 'w-2 bg-primary-foreground/35'}`} />)}</div></div></section>

      <section className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Shop by need</p><h2 className="mt-1 text-xl font-bold text-primary sm:text-2xl">Browse categories</h2></div><button onClick={() => toast('All categories are shown')} className="text-sm font-semibold text-primary hover:text-accent">View all <ChevronRight className="ml-1 inline" size={16} /></button></div><div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8">{categories.map(({ name, icon: Icon, tint }) => <button key={name} onClick={() => { setActiveCategory(name); document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' }) }} className="group flex min-w-0 flex-col items-center gap-2"><span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tint} transition group-hover:-translate-y-1 group-hover:shadow-md sm:h-16 sm:w-16`}><Icon size={25} /></span><span className="truncate text-xs font-semibold text-muted-foreground group-hover:text-foreground sm:text-sm">{name}</span></button>)}</div></section>

      <section id="deals" className="bg-muted/45 py-8 sm:py-10"><div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Curated for campus life</p><h2 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Deals near you</h2><p className="mt-1 text-sm text-muted-foreground">{filtered.length} verified listings around Pondicherry University</p></div><div className="flex gap-2"><select value={activeType} onChange={(event) => setActiveType(event.target.value)} aria-label="Filter listing type" className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none"><option>All</option><option>Buy</option><option>Rent</option></select><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort listings" className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none"><option>Newest</option><option>Price low-high</option><option>Price high-low</option></select></div></div>{filtered.length > 0 ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">{filtered.map((item, index) => <ProductCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={() => toggleSaved(item.id)} onOpen={() => setSelected(item)} index={index} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-border bg-background px-6 py-16 text-center"><Search className="mx-auto text-muted-foreground" size={28} /><h3 className="mt-3 font-bold text-primary">No products found</h3><p className="mt-1 text-sm text-muted-foreground">Try a broader search or another category.</p><button onClick={() => { setQuery(''); setActiveCategory('All'); setActiveType('All') }} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Clear filters</button></div>}</div></section>

      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8"><div className="grid gap-5 md:grid-cols-3"><InfoCard icon={<ShieldCheck />} title="Verified students only" copy="Every account uses a Pondicherry University email." /><InfoCard icon={<MapPin />} title="Meet safely on campus" copy="Find a convenient public spot for your handoff." /><InfoCard icon={<Sparkles />} title="Built for student budgets" copy="Make an offer and find useful things for less." /></div></section>

      <section className="border-t border-border bg-primary py-10 text-primary-foreground"><div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Ready to pass it on?</p><h2 className="mt-2 font-serif text-3xl sm:text-4xl">Your next buyer is here.</h2><p className="mt-2 text-sm text-primary-foreground/65">List your unused things and reach verified students in minutes.</p></div><button onClick={() => setDrawer('sell')} className="w-fit rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground">Sell on PUKart <Plus className="ml-1 inline" size={16} /></button></div></section>
      <footer className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><p className="font-serif text-xl font-semibold text-primary">PU<span className="text-accent">K</span>art</p><div className="flex flex-wrap gap-4"><button onClick={() => toast('Safety tips: meet in public campus spots')} className="hover:text-foreground">Safety</button><button onClick={() => toast('Help center coming soon')} className="hover:text-foreground">Help</button><button onClick={() => toast('Thanks for helping keep PUKart safe')} className="hover:text-foreground">Report a problem</button></div><p className="max-w-sm text-xs leading-5">PUKart is an independent student marketplace and is not officially affiliated with Pondicherry University.</p></footer>

      <AnimatePresence>{selected && <ProductModal item={selected} saved={saved.includes(selected.id)} onSave={() => toggleSaved(selected.id)} onClose={() => setSelected(null)} onMessage={() => { setSelected(null); setDrawer('messages') }} onToast={toast} />}</AnimatePresence>
      <AnimatePresence>{drawer && <Drawer type={drawer} onClose={() => setDrawer(null)} onSell={() => { setDrawer('sell') }} onToast={toast} />}</AnimatePresence>
      <button onClick={() => setDrawer('sell')} className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-accent px-5 py-3.5 text-sm font-bold text-accent-foreground shadow-xl lg:hidden"><Plus size={18} /> Sell</button>
    </main>
  )
}

function ProductCard({ item, saved, onSave, onOpen, index }: { item: Listing; saved: boolean; onSave: () => void; onOpen: () => void; index: number }) {
  const discount = Math.round((1 - item.price / item.originalPrice) * 100)
  return <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .04, .2) }} className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="relative aspect-square cursor-pointer overflow-hidden bg-muted" onClick={onOpen}><Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground">{item.type}</span><button onClick={(event) => { event.stopPropagation(); onSave() }} aria-label={saved ? `Remove ${item.title} from favorites` : `Save ${item.title} to favorites`} className="absolute right-2 top-2 rounded-full bg-card/90 p-2 text-primary shadow-sm backdrop-blur hover:text-accent"><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button></div><div className="p-3"><button onClick={onOpen} className="line-clamp-2 text-left text-sm font-semibold leading-5 text-primary hover:text-accent">{item.title}</button><div className="mt-2 flex items-center gap-1 text-xs"><span className="flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 font-bold text-white">{item.rating} <Star size={10} fill="currentColor" /></span><span className="text-muted-foreground">{item.condition}</span></div><div className="mt-2 flex items-baseline gap-1.5"><span className="text-lg font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</span><span className="text-xs text-muted-foreground line-through">₹{item.originalPrice.toLocaleString('en-IN')}</span><span className="text-[10px] font-bold text-emerald-700">{discount}% off</span></div><p className="mt-2 flex items-center gap-1 truncate text-[11px] text-muted-foreground"><MapPin size={12} /> {item.location} · {item.posted}</p><p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-accent"><ShieldCheck size={13} /> Verified student</p></div></motion.article>
}

function InfoCard({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) { return <div className="flex gap-4 rounded-xl border border-border bg-card p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">{icon}</span><div><h3 className="font-bold text-primary">{title}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{copy}</p></div></div> }

function ProductModal({ item, saved, onSave, onClose, onMessage, onToast }: { item: Listing; saved: boolean; onSave: () => void; onClose: () => void; onMessage: () => void; onToast: (message: string) => void }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end justify-center bg-primary/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Product details" onClick={onClose}><motion.div initial={{ y: 30 }} animate={{ y: 0 }} className="relative grid max-h-[92vh] w-full max-w-4xl overflow-auto rounded-t-3xl bg-card sm:grid-cols-2 sm:rounded-3xl" onClick={(event) => event.stopPropagation()}><button onClick={onClose} aria-label="Close product details" className="absolute right-4 top-4 z-10 rounded-full bg-card/90 p-2 text-primary shadow"><X size={19} /></button><div className="relative min-h-[280px] bg-muted sm:min-h-[560px]"><Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /></div><div className="p-6 sm:p-9"><div className="flex items-center justify-between"><span className="rounded-md bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">{item.type}</span><span className="text-sm text-muted-foreground">{item.posted}</span></div><h2 className="mt-5 font-serif text-3xl leading-tight text-primary sm:text-4xl">{item.title}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">{item.seller} <ShieldCheck size={15} className="text-accent" /> Verified student</p><div className="mt-6 flex items-baseline gap-3"><span className="text-3xl font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</span><span className="text-sm text-muted-foreground line-through">₹{item.originalPrice.toLocaleString('en-IN')}</span></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Condition</p><p className="mt-1 font-semibold">{item.condition}</p></div><div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Pickup</p><p className="mt-1 flex items-center gap-1 font-semibold"><MapPin size={13} /> {item.location}</p></div></div><p className="mt-6 text-sm leading-6 text-muted-foreground">A useful campus find from a verified student. Message the seller to ask questions, make an offer, and arrange a safe public campus handoff.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><button onClick={onMessage} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">Contact seller</button><button onClick={() => onToast('Purchase request ready to send')} className="flex-1 rounded-xl border border-primary px-4 py-3 text-sm font-bold text-primary">Buy / Request</button></div><div className="mt-3 flex gap-3"><button onClick={onSave} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-primary hover:bg-muted"><Heart size={17} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Favorite'}</button><button onClick={() => onToast('Share link copied')} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-primary hover:bg-muted">Share</button></div><div className="mt-6 flex items-start gap-3 rounded-xl bg-accent/10 p-4 text-xs leading-5 text-muted-foreground"><ShieldCheck size={18} className="shrink-0 text-accent" /><span>Meet in a public campus location. Never share OTPs or send money through suspicious external links.</span></div></div></motion.div></motion.div> }

function Drawer({ type, onClose, onSell, onToast }: { type: 'sell' | 'messages' | 'profile'; onClose: () => void; onSell: () => void; onToast: (message: string) => void }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[65] flex justify-end bg-primary/40 backdrop-blur-sm" onClick={onClose}><motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28 }} className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">{type === 'sell' ? 'Start selling' : type === 'messages' ? 'Inbox' : 'Your account'}</p><h2 className="mt-2 font-serif text-3xl text-primary">{type === 'sell' ? 'Sell on PUKart' : type === 'messages' ? 'Messages' : 'Hello, PU student'}</h2></div><button onClick={onClose} aria-label="Close panel" className="rounded-full p-2 hover:bg-muted"><X size={20} /></button></div>{type === 'sell' && <form className="mt-8 flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); onToast('Your draft listing was saved'); onClose() }}><div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="rounded-full bg-primary px-2 py-1 text-primary-foreground">1 Details</span><span>→ 2 Photos</span><span>→ 3 Price</span><span>→ 4 Publish</span></div><input required aria-label="Product title" placeholder="What are you selling?" className="h-12 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-accent" /><textarea required aria-label="Product description" placeholder="Describe condition, pickup and anything buyers should know" className="min-h-32 rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-accent" /><div className="grid grid-cols-2 gap-3"><select aria-label="Category" className="h-12 rounded-xl border border-border bg-background px-3 text-sm"><option>Books</option><option>Electronics</option><option>Hostel</option><option>Cycles</option><option>Fashion</option></select><input required type="number" aria-label="Price" placeholder="Price ₹" className="h-12 rounded-xl border border-border bg-background px-4 text-sm" /></div><div className="rounded-xl border border-dashed border-border p-5 text-center"><Plus className="mx-auto text-accent" /><p className="mt-2 text-sm font-semibold text-primary">Add product photos</p><p className="mt-1 text-xs text-muted-foreground">JPG or PNG, up to 5 images</p></div><button type="button" onClick={() => onToast('AI suggestion: add condition and pickup details')} className="flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 py-3 text-sm font-semibold text-accent"><Sparkles size={16} /> Generate description</button><button type="submit" className="rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground">Save listing draft</button></form>}{type === 'messages' && <div className="mt-8"><div className="rounded-2xl border border-border p-4"><div className="flex items-center justify-between"><p className="font-bold text-primary">Mara Studio</p><span className="rounded-full bg-accent/15 px-2 py-1 text-xs font-bold text-accent">New</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Thanks for your interest. I can answer questions about pickup.</p><button onClick={() => onToast('Conversation opened')} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">Open conversation</button></div><div className="mt-4 flex items-center gap-3 rounded-xl bg-accent/10 p-4 text-sm text-muted-foreground"><MessageCircle size={18} className="text-accent" /> Make an offer, ask a question, or arrange a meetup.</div></div>}{type === 'profile' && <div className="mt-8"><div className="flex items-center gap-4 rounded-2xl bg-muted p-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><UserRound size={24} /></div><div><p className="font-bold text-primary">Verified PU student</p><p className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent"><ShieldCheck size={13} /> @pondiuni.ac.in</p></div></div><div className="mt-6 grid gap-2">{['My profile', 'My listings', 'Favorites', 'Transactions', 'Reviews', 'Settings'].map((item) => <button key={item} onClick={() => onToast(`${item} is ready for your account`)} className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold text-primary hover:bg-muted">{item}<ChevronRight size={16} className="text-muted-foreground" /></button>)}</div><button onClick={onSell} className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">Sell an item</button></div>}</motion.aside></motion.div> }
