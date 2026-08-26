'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import {
  UserRound,
  ShieldCheck,
  GraduationCap,
  Building,
  Calendar,
  Phone,
  Home,
  Save,
  LogOut,
  MapPin,
  AlertTriangle,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react'
import { saveProfile, getCurrentUserProfile } from '@/app/actions/marketplace'
import { authClient } from '@/lib/auth-client'
import {
  SCHOOLS_AND_DEPARTMENTS,
  ALL_DEPARTMENTS,
  DEGREES_AND_PROGRAMS,
  ALL_PROGRAMS,
  CAMPUS_HOSTELS,
  ALL_HOSTELS,
  MEETUP_LOCATIONS,
  checkProfileCompletion,
} from '@/lib/constants/campus'

// ---------- Searchable Select Component ----------

function SearchableSelect({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  groups,
  flatOptions,
  required,
}: {
  label: string
  icon: React.ElementType
  value: string
  onChange: (val: string) => void
  placeholder: string
  groups?: { label: string; options: string[] }[]
  flatOptions?: string[]
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const allOpts = flatOptions || groups?.flatMap((g) => g.options) || []
  const filtered = search
    ? allOpts.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : allOpts

  // Group filtered options back into categories if using groups
  const filteredGroups = groups
    ? groups
      .map((g) => ({
        ...g,
        options: g.options.filter((o) =>
          o.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((g) => g.options.length > 0)
    : null

  return (
    <div className="relative">
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
        <Icon size={13} className="text-accent" />
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-1.5 flex h-11 w-full items-center justify-between rounded-xl border border-border bg-background px-3 text-xs outline-none transition hover:border-accent focus:border-accent"
      >
        <span className={value ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search size={13} className="text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>

            <div className="max-h-52 overflow-y-auto">
              {filteredGroups
                ? filteredGroups.map((group) => (
                  <div key={group.label}>
                    <div className="sticky top-0 bg-card/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent backdrop-blur-sm">
                      {group.label}
                    </div>
                    {group.options.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => {
                          onChange(opt)
                          setOpen(false)
                          setSearch('')
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-accent/10 ${value === opt
                            ? 'bg-accent/15 font-semibold text-accent'
                            : 'text-foreground'
                          }`}
                      >
                        {value === opt && <Check size={12} />}
                        <span className={value === opt ? '' : 'pl-5'}>{opt}</span>
                      </button>
                    ))}
                  </div>
                ))
                : filtered.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => {
                      onChange(opt)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-accent/10 ${value === opt
                        ? 'bg-accent/15 font-semibold text-accent'
                        : 'text-foreground'
                      }`}
                  >
                    {value === opt && <Check size={12} />}
                    <span className={value === opt ? '' : 'pl-5'}>{opt}</span>
                  </button>
                ))}

              {filtered.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No results found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ---------- Profile Page ----------

function ProfilePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const [session, setSession] = useState<any>(null)
  const [department, setDepartment] = useState('')
  const [course, setCourse] = useState('')
  const [year, setYear] = useState('1')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [hostel, setHostel] = useState('')
  const [meetupPreference, setMeetupPreference] = useState('')
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showRedirectBanner, setShowRedirectBanner] = useState(false)

  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(''), 3000)
  }

  async function loadProfile() {
    try {
      const res = await getCurrentUserProfile()
      if (res?.profile) {
        setSession({ user: res.profile })
        const u = res.profile
        if (u.department) setDepartment(u.department)
        if (u.course) setCourse(u.course)
        if (u.year) setYear(String(u.year))
        if (u.bio) {
          const parts = u.bio.split('\n---meetup---\n')
          setBio(parts[0] || '')
          if (parts[1]) setMeetupPreference(parts[1])
        }
        if (u.phone) setPhone(u.phone)
        if (u.hostel) setHostel(u.hostel)
      }
    } catch {
      // If server action fails, fall back to authClient session
      const authRes = await authClient.getSession()
      if (authRes?.data?.user) {
        setSession(authRes.data)
      } else {
        router.push('/sign-in')
      }
    }
  }

  useEffect(() => {
    // Show banner if redirected from /listing/new
    if (redirectTo) {
      setShowRedirectBanner(true)
    }

    loadProfile()
  }, [router, redirectTo])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate required fields
    const completion = checkProfileCompletion({
      department,
      course,
      year: year ? Number(year) : null,
      hostel,
    })

    if (!completion.isComplete) {
      showToast(`Please fill: ${completion.missingFields.join(', ')}`)
      return
    }

    setSaving(true)
    try {
      // Combine bio and meetup preference for storage
      const combinedBio = meetupPreference
        ? `${bio}\n---meetup---\n${meetupPreference}`
        : bio

      await saveProfile({
        department,
        course,
        year: year ? Number(year) : undefined,
        bio: combinedBio,
        phone,
        hostel,
      })

      // Reload authoritative profile
      await loadProfile()

      showToast('Profile updated successfully!')

      // If redirected from listing page, go back after short delay
      if (redirectTo) {
        window.setTimeout(() => {
          router.push(redirectTo)
        }, 1000)
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="py-20 text-center text-sm animate-pulse">Loading profile...</div>
      </div>
    )
  }

  const completion = checkProfileCompletion({
    department,
    course,
    year: year ? Number(year) : null,
    hostel,
  })

  // Build grouped options for the searchable selects
  const departmentGroups = SCHOOLS_AND_DEPARTMENTS.map((s) => ({
    label: s.school,
    options: s.departments,
  }))

  const degreeGroups = DEGREES_AND_PROGRAMS.map((g) => ({
    label: g.category,
    options: g.programs,
  }))

  const hostelGroups = CAMPUS_HOSTELS.map((g) => ({
    label: g.category,
    options: g.hostels,
  }))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-2xl"
        >
          {toastMessage}
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Redirect Banner */}
        {showRedirectBanner && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-amber-300">
                Complete Your Profile First
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
                To list items on PUKart, please fill in your student profile details below.
                This helps other students verify your identity and arrange safe campus meetups.
              </p>
            </div>
          </div>
        )}

        {/* Profile Completion Indicator */}
        {!completion.isComplete && (
          <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/5 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-accent">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                <UserRound size={12} />
              </div>
              Profile Incomplete
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Missing:{' '}
              {completion.missingFields.map((f, i) => (
                <span key={f}>
                  <span className="font-semibold text-foreground">{f}</span>
                  {i < completion.missingFields.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                {session.user.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-primary">{session.user.name}</h1>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                  <ShieldCheck size={12} /> Verified Pondicherry University Account
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 transition self-start sm:self-center"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Department / School */}
              <SearchableSelect
                label="Department / School"
                icon={Building}
                value={department}
                onChange={setDepartment}
                placeholder="Select your department..."
                groups={departmentGroups}
                required
              />

              {/* Degree / Program */}
              <SearchableSelect
                label="Degree / Program"
                icon={GraduationCap}
                value={course}
                onChange={setCourse}
                placeholder="Select your program..."
                groups={degreeGroups}
                required
              />

              {/* Year of Study */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Calendar size={13} className="text-accent" />
                  Current Year of Study
                  <span className="text-red-400">*</span>
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-accent"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year / Integrated</option>
                  <option value="6">Research Scholar / Faculty</option>
                </select>
              </div>

              {/* Campus Hostel */}
              <SearchableSelect
                label="Campus Hostel"
                icon={Home}
                value={hostel}
                onChange={setHostel}
                placeholder="Select your hostel..."
                groups={hostelGroups}
                required
              />
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <Phone size={13} className="text-accent" />
                Phone Number
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your contact number (visible only to buyers)"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent"
              />
            </div>

            {/* Campus Bio */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <UserRound size={13} className="text-accent" />
                Campus Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief intro about yourself — your interests, what you usually sell/buy, campus active hours, etc."
                className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-accent"
              />
            </div>

            {/* Meetup Preferences */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <MapPin size={13} className="text-accent" />
                Preferred Meetup Locations for Delivery
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {MEETUP_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() =>
                      setMeetupPreference(meetupPreference === loc ? '' : loc)
                    }
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${meetupPreference === loc
                        ? 'border-accent bg-accent/20 text-accent'
                        : 'border-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground'
                      }`}
                  >
                    {meetupPreference === loc && (
                      <Check size={10} className="mr-1 inline" />
                    )}
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-bold text-primary-foreground shadow hover:opacity-90 transition disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="py-20 text-center text-sm animate-pulse">Loading profile...</div>
      </div>
    }>
      <ProfilePageInner />
    </Suspense>
  )
}
