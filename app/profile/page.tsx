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
  Check,
} from 'lucide-react'
import { saveProfile, getCurrentUserProfile } from '@/app/actions/marketplace'
import { authClient } from '@/lib/auth-client'
import type { UserSessionData } from '@/lib/hooks/useRequireAuth'
import {
  SCHOOLS_AND_DEPARTMENTS,
  DEGREES_AND_PROGRAMS,
  CAMPUS_HOSTELS,
  MEETUP_LOCATIONS,
  checkProfileCompletion,
} from '@/lib/constants/campus'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useToast } from '@/lib/hooks/useToast'
import { ToastBanner } from '@/components/ui/ToastBanner'

function ProfilePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const [session, setSession] = useState<UserSessionData | null>(null)
  const [department, setDepartment] = useState('')
  const [course, setCourse] = useState('')
  const [year, setYear] = useState('1')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [hostel, setHostel] = useState('')
  const [meetupPreference, setMeetupPreference] = useState('')
  const [saving, setSaving] = useState(false)
  const { toastMessage, showToast } = useToast()
  const [showRedirectBanner, setShowRedirectBanner] = useState(false)

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
      
      const authRes = await authClient.getSession()
      if (authRes?.data?.user) {
        setSession(authRes.data)
      } else {
        router.push('/sign-in')
      }
    }
  }

  useEffect(() => {
    
    if (redirectTo) {
      setShowRedirectBanner(true)
    }

    loadProfile()
  }, [router, redirectTo])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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

      await loadProfile()

      showToast('Profile updated successfully!')

      if (redirectTo) {
        window.setTimeout(() => {
          router.push(redirectTo)
        }, 1000)
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile')
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

      <ToastBanner message={toastMessage} />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        
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
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                {session.user.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-primary">{session.user.name}</h1>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                  <ShieldCheck size={12} /> Verified Account
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

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              
              <SearchableSelect
                label="Department / School"
                icon={Building}
                value={department}
                onChange={setDepartment}
                placeholder="Select your department..."
                groups={departmentGroups}
                required
              />

              <SearchableSelect
                label="Degree / Program"
                icon={GraduationCap}
                value={course}
                onChange={setCourse}
                placeholder="Select your program..."
                groups={degreeGroups}
                required
              />

              <div>
                <label htmlFor="profile-year-select" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Calendar size={13} className="text-accent" />
                  Current Year of Study
                  <span className="text-red-400">*</span>
                </label>
                <select
                  id="profile-year-select"
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

            <div>
              <label htmlFor="profile-phone-input" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <Phone size={13} className="text-accent" />
                Phone Number
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="profile-phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your contact number (visible only to buyers)"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="profile-bio-input" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <UserRound size={13} className="text-accent" />
                Campus Bio
              </label>
              <textarea
                id="profile-bio-input"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief intro about yourself — your interests, what you usually sell/buy, campus active hours, etc."
                className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-accent"
              />
            </div>

            <div role="group" aria-labelledby="profile-meetup-heading">
              <p id="profile-meetup-heading" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                <MapPin size={13} className="text-accent" />
                Preferred Meetup Locations for Delivery
              </p>
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
