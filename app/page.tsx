'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Heart,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'

const listings = [
  { id: 1, title: 'The quiet art of making', seller: 'Mara Studio', price: 28, category: 'Books', image: '/images/listing-books.png', location: 'Portland, OR', tag: 'Curated' },
  { id: 2, title: 'City cycle, restored', seller: 'Second Spin', price: 420, category: 'Vintage', image: '/images/listing-cycle.png', location: 'Brooklyn, NY', tag: 'One of a kind' },
  { id: 3, title: 'Creative work essentials', seller: 'Nook Supply', price: 85, category: 'Workspace', image: '/images/listing-laptop.png', location: 'Austin, TX', tag: 'Popular' },
]

const categories = ['All items', 'Art & prints', 'Craft supplies', 'Books', 'Vintage', 'Workspace']

export default function Page() {
  const [activeCategory, setActiveCategory] = useState('All items')
  const [query, setQuery] = useState('')
  const [liked, setLiked] = useState<number[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [selectedListing, setSelectedListing] = useState<(typeof listings)[number] | null>(null)
  const [sellOpen, setSellOpen] = useState(false)
  const [sellSubmitted, setSellSubmitted] = useState(false)

  const filtered = useMemo(() => listings.filter((item) => {
    const matchesCategory = activeCategory === 'All items' || item.category === activeCategory
    const matchesQuery = `${item.title} ${item.seller} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  }), [activeCategory, query])

  function toggleLike(id: number) {
    setLiked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-xl">{notice}</div>}
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
          <a href="#top" className="font-serif text-2xl font-semibold tracking-tight text-primary">puk<span className="text-accent">.</span>art</a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#discover" className="text-foreground">Discover</a>
            <a href="#sell" className="hover:text-foreground">Sell an item</a>
            <a href="#about" className="hover:text-foreground">About puk.art</a>
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <button aria-label="Notifications" className="rounded-full p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Bell size={18} /></button>
            <button aria-label="Messages" className="rounded-full p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"><MessageCircle size={18} /></button>
            <button onClick={() => showNotice('Sign in is ready to connect')} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"><UserRound size={16} /> Sign in</button>
            <button onClick={() => { setSellOpen(true); setSellSubmitted(false) }} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus size={16} /> List an item</button>
          </div>
          <button className="rounded-lg p-2 md:hidden" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {menuOpen && <div className="border-t border-border px-5 py-4 md:hidden"><div className="flex flex-col gap-4 text-sm font-medium"><a href="#discover" onClick={() => setMenuOpen(false)}>Discover</a><a href="#sell" onClick={() => setMenuOpen(false)}>Sell an item</a><button className="w-fit rounded-full bg-primary px-4 py-2 text-primary-foreground" onClick={() => { setSellOpen(true); setSellSubmitted(false) }}>List an item</button></div></div>}
      </header>

      <section id="top" className="border-b border-border bg-accent/10">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[1fr_0.8fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent"><Sparkles size={14} /> A marketplace for makers</div>
            <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-primary sm:text-7xl">Find things<br /><em className="text-accent">worth keeping.</em></h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">A thoughtful marketplace for art, objects, and creative tools. Buy from real people. Sell what you no longer need.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#discover" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Explore the marketplace <ArrowRight size={17} /></a>
              <button onClick={() => { setSellOpen(true); setSellSubmitted(false) }} className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-card px-6 py-3.5 text-sm font-semibold text-primary hover:bg-muted">Sell something <Plus size={17} /></button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-3 shadow-sm">
            <Image src="/images/listing-books.png" alt="A curated selection of art and creative books" width={900} height={700} className="h-[300px] w-full rounded-[1.5rem] object-cover sm:h-[380px]" priority />
            <div className="absolute bottom-7 left-7 rounded-2xl bg-card/95 px-4 py-3 shadow-lg"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This week&apos;s edit</p><p className="mt-1 font-serif text-lg text-primary">For a slower kind of day</p></div>
          </div>
        </div>
      </section>

      <section id="discover" className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">The marketplace</p><h2 className="mt-2 font-serif text-4xl tracking-tight text-primary sm:text-5xl">Good finds, close by.</h2></div><button className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent">View all listings <ArrowRight size={16} /></button></div>
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="relative max-w-md flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} /><input aria-label="Search listings" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search art, vintage, books..." className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none ring-accent/30 placeholder:text-muted-foreground focus:ring-4" /></div><div className="flex gap-2 overflow-x-auto pb-1">{categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition ${activeCategory === category ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>{category}</button>)}</div></div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => <article key={item.id} className="group"><button className="block w-full text-left" onClick={() => setSelectedListing(item)} aria-label={`View details for ${item.title}`}><div className="relative overflow-hidden rounded-2xl bg-muted"><Image src={item.image} alt={item.title} width={700} height={520} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold text-primary">{item.tag}</span><span className="absolute bottom-3 left-3 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">View details</span></div><div className="flex items-start justify-between gap-3 pt-4"><div><h3 className="font-serif text-xl text-primary">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.seller} · {item.location}</p></div><p className="text-lg font-semibold text-primary">${item.price}</p></div></button><button aria-label={`Save ${item.title}`} onClick={() => toggleLike(item.id)} className="absolute right-3 top-3 rounded-full bg-card/90 p-2.5 text-primary shadow-sm hover:bg-card"><Heart size={17} fill={liked.includes(item.id) ? 'currentColor' : 'none'} /></button></article>)}</div>
        {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">No listings match that search yet.</div>}
      </section>

      <section id="sell" className="border-y border-border bg-primary text-primary-foreground"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-14 sm:flex-row sm:items-center lg:px-8"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Make space for what&apos;s next</p><h2 className="mt-3 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">Your next person is out there.</h2><p className="mt-4 max-w-lg leading-7 text-primary-foreground/70">List the pieces you&apos;ve outgrown and pass them on to someone who will love them.</p></div><button onClick={() => { setSellOpen(true); setSellSubmitted(false) }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground hover:opacity-90">Start selling <ArrowRight size={17} /></button></div></section>
      {sellOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="sell-title" onClick={() => setSellOpen(false)}><div className="relative w-full max-w-xl rounded-t-[2rem] bg-card p-7 shadow-2xl sm:rounded-[2rem] sm:p-9" onClick={(event) => event.stopPropagation()}><button aria-label="Close sell form" onClick={() => setSellOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-primary hover:bg-muted"><X size={20} /></button>{sellSubmitted ? <div className="py-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent"><ShieldCheck size={26} /></div><h2 id="sell-title" className="mt-5 font-serif text-3xl text-primary">Your listing is in review.</h2><p className="mx-auto mt-3 max-w-sm leading-7 text-muted-foreground">Thanks for helping good things find a new home. We&apos;ll review your listing and let you know when it&apos;s live.</p><button onClick={() => setSellOpen(false)} className="mt-7 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Done</button></div> : <><p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Start selling</p><h2 id="sell-title" className="mt-2 font-serif text-4xl text-primary">Tell us about your item.</h2><p className="mt-3 leading-7 text-muted-foreground">Share the essentials and we&apos;ll help you create a thoughtful listing.</p><form className="mt-7 flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); setSellSubmitted(true) }}><label className="flex flex-col gap-2 text-sm font-semibold text-primary">Title<input required name="title" placeholder="e.g. Hand-thrown ceramic vase" className="h-12 rounded-xl border border-border bg-background px-4 font-normal outline-none focus:ring-4 focus:ring-accent/20" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-2 text-sm font-semibold text-primary">Category<select name="category" className="h-12 rounded-xl border border-border bg-background px-4 font-normal outline-none"><option>Art &amp; prints</option><option>Craft supplies</option><option>Books</option><option>Vintage</option><option>Workspace</option></select></label><label className="flex flex-col gap-2 text-sm font-semibold text-primary">Price<input required min="1" type="number" name="price" placeholder="0" className="h-12 rounded-xl border border-border bg-background px-4 font-normal outline-none focus:ring-4 focus:ring-accent/20" /></label></div><label className="flex flex-col gap-2 text-sm font-semibold text-primary">Description<textarea required name="description" rows={4} placeholder="What makes this worth keeping?" className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:ring-4 focus:ring-accent/20" /></label><button type="submit" className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Submit for review <ArrowRight size={17} /></button></form></>}</div></div>}
      {selectedListing && <div className="fixed inset-0 z-40 flex items-end justify-center bg-primary/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="listing-title" onClick={() => setSelectedListing(null)}><div className="relative grid max-h-[90vh] w-full max-w-3xl overflow-auto rounded-t-[2rem] bg-card shadow-2xl sm:grid-cols-2 sm:rounded-[2rem]" onClick={(event) => event.stopPropagation()}><button aria-label="Close listing details" onClick={() => setSelectedListing(null)} className="absolute right-4 top-4 z-10 rounded-full bg-card/90 p-2 text-primary shadow-sm hover:bg-muted"><X size={20} /></button><Image src={selectedListing.image} alt={selectedListing.title} width={800} height={650} className="h-72 w-full object-cover sm:h-full sm:min-h-[460px]" /><div className="flex flex-col p-7 sm:p-9"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">{selectedListing.tag}</span><span className="text-sm text-muted-foreground">{selectedListing.location}</span></div><h2 id="listing-title" className="mt-7 font-serif text-4xl leading-tight text-primary">{selectedListing.title}</h2><p className="mt-3 text-sm text-muted-foreground">Listed by {selectedListing.seller}</p><p className="mt-7 text-3xl font-semibold text-primary">${selectedListing.price}</p><p className="mt-6 leading-7 text-muted-foreground">A thoughtfully chosen piece with a story to tell. Connect with the maker to ask questions, arrange pickup, or make it yours.</p><div className="mt-auto flex flex-col gap-3 pt-9"><button onClick={() => showNotice('Message sent to the seller')} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90"><MessageCircle size={17} /> Message seller</button><button onClick={() => toggleLike(selectedListing.id)} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3.5 text-sm font-semibold text-primary hover:bg-muted"><Heart size={17} fill={liked.includes(selectedListing.id) ? 'currentColor' : 'none'} /> {liked.includes(selectedListing.id) ? 'Saved to your list' : 'Save this listing'}</button></div></div></div></div>}
      <footer id="about" className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><p className="font-serif text-lg text-primary">puk<span className="text-accent">.</span>art</p><p>Made for the things that make us, by people who make things.</p><div className="flex gap-5"><a href="#top" className="hover:text-foreground">About</a><a href="#top" className="hover:text-foreground">Safety</a><a href="#top" className="hover:text-foreground">Help</a></div></footer>
    </main>
  )
}
