'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import {
  Lock,
  Users,
  Package,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Sparkles,
  Plus,
  Tag,
  Ban,
  RotateCcw,
} from 'lucide-react'
import {
  getAdminDashboardStats,
  getAdminUsers,
  setUserSuspension,
  setUserRole,
  getAdminListings,
  adminModerateListing,
  getAdminReports,
  updateReportStatus,
  getAdminCategories,
  createCategory,
  deleteCategory,
} from '@/app/actions/admin'
import { authClient } from '@/lib/auth-client'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'listings' | 'reports' | 'categories'>('dashboard')
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')

  // Data states
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [listings, setListings] = useState<any[]>([])
  const [listingFilter, setListingFilter] = useState('all')
  const [reports, setReports] = useState<any[]>([])
  const [reportFilter, setReportFilter] = useState('all')
  const [categories, setCategories] = useState<any[]>([])

  // New Category Form
  const [newCatName, setNewCatName] = useState('')
  const [newCatSlug, setNewCatSlug] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('ShoppingBag')

  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(''), 3000)
  }

  async function loadAllAdminData() {
    setLoading(true)
    try {
      const [s, u, l, r, c] = await Promise.all([
        getAdminDashboardStats(),
        getAdminUsers(),
        getAdminListings('all'),
        getAdminReports('all'),
        getAdminCategories(),
      ])
      setStats(s)
      setUsers(u)
      setListings(l)
      setReports(r)
      setCategories(c)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Unauthorized or failed to load admin data')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res?.data?.user) {
        setSession(res.data)
        loadAllAdminData()
      } else {
        router.push('/sign-in')
      }
    }).catch(() => router.push('/sign-in'))
  }, [router])

  async function handleToggleSuspend(userId: string, currentSuspended: boolean) {
    try {
      await setUserSuspension(userId, !currentSuspended)
      showToast(`User ${!currentSuspended ? 'suspended' : 'restored'}`)
      const u = await getAdminUsers(userQuery)
      setUsers(u)
    } catch (err: any) {
      showToast(err.message || 'Action failed')
    }
  }

  async function handleModerateListing(id: number, action: 'hide' | 'delete' | 'feature' | 'unfeature' | 'unflag' | 'activate') {
    try {
      await adminModerateListing(id, action)
      showToast(`Listing updated: ${action}`)
      const l = await getAdminListings(listingFilter)
      setListings(l)
    } catch (err: any) {
      showToast(err.message || 'Action failed')
    }
  }

  async function handleUpdateReport(id: number, status: 'open' | 'reviewing' | 'resolved' | 'dismissed') {
    try {
      await updateReportStatus(id, status)
      showToast(`Report marked as ${status}`)
      const r = await getAdminReports(reportFilter)
      setReports(r)
    } catch (err: any) {
      showToast(err.message || 'Action failed')
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim() || !newCatSlug.trim()) return
    try {
      await createCategory({
        name: newCatName.trim(),
        slug: newCatSlug.trim().toLowerCase(),
        icon: newCatIcon,
      })
      setNewCatName('')
      setNewCatSlug('')
      showToast('Category created!')
      const c = await getAdminCategories()
      setCategories(c)
    } catch (err: any) {
      showToast(err.message || 'Failed to create category')
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await deleteCategory(id)
      showToast('Category deleted')
      const c = await getAdminCategories()
      setCategories(c)
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category')
    }
  }

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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent">
                Super Admin
              </span>
              <span className="text-xs text-muted-foreground">Pondicherry University Governance</span>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-bold text-primary">Admin Control Center</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border pb-3 text-xs sm:text-sm font-semibold">
          {[
            { id: 'dashboard', label: 'Overview Metrics', icon: Layers },
            { id: 'users', label: `Users (${stats?.usersCount || 0})`, icon: Users },
            { id: 'listings', label: `Listings (${stats?.totalListingsCount || 0})`, icon: Package },
            { id: 'reports', label: `Reports (${stats?.openReportsCount || 0} Open)`, icon: AlertTriangle },
            { id: 'categories', label: `Categories (${categories.length})`, icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">Loading administration data...</div>
        ) : (
          <div className="mt-6">
            {/* 1. OVERVIEW DASHBOARD */}
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground font-semibold">Total Verified Users</p>
                    <p className="mt-2 text-2xl font-black text-primary">{stats.usersCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground font-semibold">Active Listings</p>
                    <p className="mt-2 text-2xl font-black text-emerald-600">{stats.activeListingsCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground font-semibold">Total Campus Deals</p>
                    <p className="mt-2 text-2xl font-black text-primary">{stats.transactionsCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground font-semibold">Completed Deals</p>
                    <p className="mt-2 text-2xl font-black text-blue-600">{stats.completedTransactionsCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground font-semibold">Open Reports</p>
                    <p className="mt-2 text-2xl font-black text-destructive">{stats.openReportsCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground font-semibold">AI Flagged Listings</p>
                    <p className="mt-2 text-2xl font-black text-amber-600">{stats.flaggedListingsCount}</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <h3 className="font-bold text-base text-primary">Recent Transactions</h3>
                    <div className="divide-y divide-border text-xs">
                      {stats.recentTransactions?.map((tx: any) => (
                        <div key={tx.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-foreground">Item #{tx.listingId}</span>
                            <span className="text-muted-foreground ml-2">₹{tx.amount}</span>
                          </div>
                          <span className="rounded-md bg-muted px-2 py-0.5 font-bold uppercase text-[10px]">
                            {tx.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <h3 className="font-bold text-base text-primary">Recent Campus Reports</h3>
                    <div className="divide-y divide-border text-xs">
                      {stats.recentReports?.map((rep: any) => (
                        <div key={rep.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-destructive">{rep.reason}</span>
                            <p className="text-[11px] text-muted-foreground">Listing #{rep.listingId || 'N/A'}</p>
                          </div>
                          <span className="rounded-md bg-rose-100 text-rose-800 px-2 py-0.5 font-bold uppercase text-[10px]">
                            {rep.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. USERS MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                      value={userQuery}
                      onChange={async (e) => {
                        setUserQuery(e.target.value)
                        const u = await getAdminUsers(e.target.value)
                        setUsers(u)
                      }}
                      placeholder="Search users by name or @pondiuni.ac.in email..."
                      className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-xs outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/50 font-bold uppercase text-muted-foreground">
                      <tr>
                        <th className="p-3.5">User</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Department</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30">
                          <td className="p-3.5">
                            <p className="font-bold text-primary">{u.name}</p>
                            <p className="text-muted-foreground">{u.email}</p>
                          </td>
                          <td className="p-3.5 font-semibold capitalize">{u.role}</td>
                          <td className="p-3.5 text-muted-foreground">{u.department || 'Not specified'}</td>
                          <td className="p-3.5">
                            {u.isSuspended ? (
                              <span className="rounded-md bg-rose-100 text-rose-800 px-2 py-0.5 font-bold text-[10px]">
                                Suspended
                              </span>
                            ) : (
                              <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold text-[10px]">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleToggleSuspend(u.id, u.isSuspended)}
                              className={`rounded-lg px-2.5 py-1 font-bold ${
                                u.isSuspended
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-destructive text-destructive-foreground'
                              }`}
                            >
                              {u.isSuspended ? 'Restore' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. LISTINGS MODERATION */}
            {activeTab === 'listings' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {['all', 'active', 'reserved', 'sold', 'archived'].map((f) => (
                    <button
                      key={f}
                      onClick={async () => {
                        setListingFilter(f)
                        const l = await getAdminListings(f)
                        setListings(l)
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize ${
                        listingFilter === f ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/50 font-bold uppercase text-muted-foreground">
                      <tr>
                        <th className="p-3.5">Item</th>
                        <th className="p-3.5">Seller</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">AI Flag</th>
                        <th className="p-3.5 text-right">Moderation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {listings.map((l) => (
                        <tr key={l.id} className="hover:bg-muted/30">
                          <td className="p-3.5">
                            <Link href={`/listing/${l.id}`} className="font-bold text-primary hover:underline block max-w-xs truncate">
                              {l.title}
                            </Link>
                            <span className="text-muted-foreground text-[10px]">{l.category}</span>
                          </td>
                          <td className="p-3.5 font-medium">{l.sellerName}</td>
                          <td className="p-3.5 font-bold">₹{l.price.toLocaleString('en-IN')}</td>
                          <td className="p-3.5 font-semibold capitalize">{l.status}</td>
                          <td className="p-3.5">
                            {l.aiFlagged ? (
                              <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 font-bold text-[10px]">
                                Flagged ({l.aiFlagReason || 'Suspicious'})
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">Clean</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            {l.aiFlagged && (
                              <button
                                onClick={() => handleModerateListing(l.id, 'unflag')}
                                className="rounded-lg bg-accent/20 px-2 py-1 font-bold text-accent"
                              >
                                Unflag
                              </button>
                            )}
                            <button
                              onClick={() => handleModerateListing(l.id, l.status === 'archived' ? 'activate' : 'hide')}
                              className="rounded-lg border border-border px-2 py-1 font-semibold"
                            >
                              {l.status === 'archived' ? 'Unhide' : 'Hide'}
                            </button>
                            <button
                              onClick={() => handleModerateListing(l.id, 'delete')}
                              className="rounded-lg bg-destructive px-2 py-1 font-bold text-white"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. REPORTS MODERATION */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/50 font-bold uppercase text-muted-foreground">
                      <tr>
                        <th className="p-3.5">Reason</th>
                        <th className="p-3.5">Listing / User</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-muted-foreground">
                            No open reports. Campus is safe!
                          </td>
                        </tr>
                      ) : (
                        reports.map((rep) => (
                          <tr key={rep.id} className="hover:bg-muted/30">
                            <td className="p-3.5 font-bold text-destructive">{rep.reason}</td>
                            <td className="p-3.5">
                              {rep.listingId && (
                                <Link href={`/listing/${rep.listingId}`} className="text-primary underline">
                                  Listing #{rep.listingId}
                                </Link>
                              )}
                            </td>
                            <td className="p-3.5 font-semibold capitalize">{rep.status}</td>
                            <td className="p-3.5 text-muted-foreground">
                              {new Date(rep.createdAt).toLocaleDateString('en-IN')}
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              <button
                                onClick={() => handleUpdateReport(rep.id, 'resolved')}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 font-bold text-white"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => handleUpdateReport(rep.id, 'dismissed')}
                                className="rounded-lg border border-border px-2.5 py-1"
                              >
                                Dismiss
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. CATEGORIES MANAGEMENT */}
            {activeTab === 'categories' && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 md:col-span-1">
                  <h3 className="font-bold text-base text-primary">Add Campus Category</h3>
                  <form onSubmit={handleCreateCategory} className="space-y-3">
                    <input
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Category Name (e.g. Lab Equipment)"
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent"
                    />
                    <input
                      required
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                      placeholder="Slug (e.g. lab_equipment)"
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow"
                    >
                      Create Category
                    </button>
                  </form>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 md:col-span-2">
                  <h3 className="font-bold text-base text-primary">Current Marketplace Categories</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                        <div>
                          <p className="font-bold text-xs text-primary">{cat.name}</p>
                          <p className="text-[10px] text-muted-foreground">{cat.slug}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
