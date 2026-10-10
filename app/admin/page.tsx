'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Package,
  Layers,
  AlertTriangle,
  Search,
  Trash2,
  Tag,
} from 'lucide-react'
import {
  getAdminDashboardStats,
  getAdminUsers,
  setUserSuspension,
  getAdminListings,
  adminModerateListing,
  getAdminReports,
  updateReportStatus,
  getAdminCategories,
  createCategory,
  deleteCategory,
} from '@/app/actions/admin'

type AdminStats = Awaited<ReturnType<typeof getAdminDashboardStats>>
type AdminUserList = Awaited<ReturnType<typeof getAdminUsers>>
type AdminListingList = Awaited<ReturnType<typeof getAdminListings>>
type AdminReportList = Awaited<ReturnType<typeof getAdminReports>>
type AdminCategoryList = Awaited<ReturnType<typeof getAdminCategories>>

import { useToast } from '@/lib/hooks/useToast'
import { useRequireAuth } from '@/lib/hooks/useRequireAuth'
import { PageShell, PageLoadingState } from '@/components/ui/PageShell'
import { AdminTable } from '@/components/ui/AdminTable'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'listings' | 'reports' | 'categories'>('dashboard')
  const { toastMessage, showToast } = useToast()

  const [dataLoading, setDataLoading] = useState(false)
  const { loading } = useRequireAuth(() => {
    loadAllAdminData()
  })

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUserList>([])
  const [userQuery, setUserQuery] = useState('')
  const [listings, setListings] = useState<AdminListingList>([])
  const [listingFilter, setListingFilter] = useState('all')
  const [reports, setReports] = useState<AdminReportList>([])
  const [reportFilter, _setReportFilter] = useState('all')
  const [categories, setCategories] = useState<AdminCategoryList>([])

  const [newCatName, setNewCatName] = useState('')
  const [newCatSlug, setNewCatSlug] = useState('')
  const [newCatIcon, _setNewCatIcon] = useState('ShoppingBag')

  async function loadAllAdminData() {
    setDataLoading(true)
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
    } catch (err) {
      console.error(err)
      showToast(err instanceof Error ? err.message : 'Unauthorized or failed to load admin data')
      router.push('/')
    } finally {
      setDataLoading(false)
    }
  }

  async function executeAdminAction(
    actionFn: () => Promise<unknown>,
    successMessage: string,
    refreshFn: () => Promise<void>
  ) {
    try {
      await actionFn()
      showToast(successMessage)
      await refreshFn()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed')
    }
  }

  async function handleToggleSuspend(userId: string, currentSuspended: boolean) {
    await executeAdminAction(
      () => setUserSuspension(userId, !currentSuspended),
      `User ${!currentSuspended ? 'suspended' : 'restored'}`,
      async () => setUsers(await getAdminUsers(userQuery))
    )
  }

  async function handleModerateListing(id: number, action: 'hide' | 'delete' | 'feature' | 'unfeature' | 'unflag' | 'activate') {
    await executeAdminAction(
      () => adminModerateListing(id, action),
      `Listing updated: ${action}`,
      async () => setListings(await getAdminListings(listingFilter))
    )
  }

  async function handleUpdateReport(id: number, status: 'open' | 'reviewing' | 'resolved' | 'dismissed') {
    await executeAdminAction(
      () => updateReportStatus(id, status),
      `Report marked as ${status}`,
      async () => setReports(await getAdminReports(reportFilter))
    )
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim() || !newCatSlug.trim()) return
    await executeAdminAction(
      async () => {
        await createCategory({
          name: newCatName.trim(),
          slug: newCatSlug.trim().toLowerCase(),
          icon: newCatIcon,
        })
        setNewCatName('')
        setNewCatSlug('')
      },
      'Category created!',
      async () => setCategories(await getAdminCategories())
    )
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Are you sure you want to delete this category?')) return
    await executeAdminAction(
      () => deleteCategory(id),
      'Category deleted',
      async () => setCategories(await getAdminCategories())
    )
  }

  if (loading || dataLoading || !stats) {
    return <PageLoadingState message="Loading administration portal..." />
  }

  return (
    <PageShell toastMessage={toastMessage} maxWidthClass="max-w-7xl">
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

        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border pb-3 text-xs sm:text-sm font-semibold">
          {([
            { id: 'dashboard', label: 'Overview Metrics', icon: Layers },
            { id: 'users', label: `Users (${stats?.usersCount || 0})`, icon: Users },
            { id: 'listings', label: `Listings (${stats?.totalListingsCount || 0})`, icon: Package },
            { id: 'reports', label: `Reports (${stats?.openReportsCount || 0} Open)`, icon: AlertTriangle },
            { id: 'categories', label: `Categories (${categories.length})`, icon: Tag },
          ] as const).map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
            
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    { label: 'Total Verified Users', count: stats.usersCount, color: 'text-primary' },
                    { label: 'Active Listings', count: stats.activeListingsCount, color: 'text-emerald-600' },
                    { label: 'Total Campus Deals', count: stats.transactionsCount, color: 'text-primary' },
                    { label: 'Completed Deals', count: stats.completedTransactionsCount, color: 'text-blue-600' },
                    { label: 'Open Reports', count: stats.openReportsCount, color: 'text-destructive' },
                    { label: 'AI Flagged Listings', count: stats.flaggedListingsCount, color: 'text-amber-600' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground font-semibold">{s.label}</p>
                      <p className={`mt-2 text-2xl font-black ${s.color}`}>{s.count}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <h3 className="font-bold text-base text-primary">Recent Transactions</h3>
                    <div className="divide-y divide-border text-xs">
                      {stats?.recentTransactions?.map((tx) => (
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
                      {stats?.recentReports?.map((rep) => (
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
                      placeholder="Search users by name or email..."
                      className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-xs outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <AdminTable
                  headers={
                    <>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </>
                  }
                >
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
                </AdminTable>
              </div>
            )}

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

                <AdminTable
                  headers={
                    <>
                      <th className="p-3.5">Item</th>
                      <th className="p-3.5">Seller</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">AI Flag</th>
                      <th className="p-3.5 text-right">Moderation</th>
                    </>
                  }
                >
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
                </AdminTable>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                <AdminTable
                  headers={
                    <>
                      <th className="p-3.5">Reason</th>
                      <th className="p-3.5">Listing / User</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Action</th>
                    </>
                  }
                >
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
                </AdminTable>
              </div>
            )}

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
    </PageShell>
  )
}
