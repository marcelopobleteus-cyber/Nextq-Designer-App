'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  PlatformOverviewData,
  PlatformOrganizationItem,
  PlatformUserItem,
  PlatformModuleItem,
  toggleUserPlatformAdmin,
  savePlatformSetting,
  createPlatformOrganization,
  deletePlatformOrganization,
  updatePlatformModule,
  toggleOrganizationSuspension,
  updatePlatformOrganization,
  inviteOrganizationOwner,
} from './actions'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ActiveSessionsPanel from './ActiveSessionsPanel'
import { logout } from '@/app/auth/actions'
import { createClient } from '@/utils/supabase/client'

interface AdminDashboardClientProps {
  initialData: PlatformOverviewData
}

export default function AdminDashboardClient({ initialData }: AdminDashboardClientProps) {
  const supabase = createClient()
  const [data, setData] = useState<PlatformOverviewData>(initialData)
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'modules' | 'users' | 'access' | 'activity' | 'settings'>('overview')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [expandedSignInUserId, setExpandedSignInUserId] = useState<string | null>(null)

  // Create Organization Modal State
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgOwnerEmail, setNewOrgOwnerEmail] = useState('')
  const [newOrgContactEmail, setNewOrgContactEmail] = useState('')
  const [newOrgTempPassword, setNewOrgTempPassword] = useState('')
  const [selectedModulePrices, setSelectedModulePrices] = useState<Record<string, { selected: boolean; priceDollars: number }>>(() => {
    const initial: Record<string, { selected: boolean; priceDollars: number }> = {}
    initialData.modules.forEach(m => {
      initial[m.id] = {
        selected: m.id === 'cctv' || m.id === 'fiber',
        priceDollars: (m.defaultMonthlyPriceCents || 0) / 100,
      }
    })
    return initial
  })
  const [createdCheckoutUrl, setCreatedCheckoutUrl] = useState<string | null>(null)
  const [createdOrgName, setCreatedOrgName] = useState<string | null>(null)

  // Edit Organization Modal State
  const [editingOrg, setEditingOrg] = useState<PlatformOrganizationItem | null>(null)
  const [editOrgName, setEditOrgName] = useState('')
  const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null)
  const [editContactName, setEditContactName] = useState('')
  const [editContactEmail, setEditContactEmail] = useState('')
  const [editContactPhone, setEditContactPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // Module Editing State
  const [editingModule, setEditingModule] = useState<PlatformModuleItem | null>(null)
  const [moduleName, setModuleName] = useState('')
  const [moduleDesc, setModuleDesc] = useState('')
  const [modulePriceDollars, setModulePriceDollars] = useState(0)
  const [moduleStripePriceId, setModuleStripePriceId] = useState('')
  const [moduleIsActive, setModuleIsActive] = useState(true)

  // Organization Action Modals
  const [orgToDelete, setOrgToDelete] = useState<PlatformOrganizationItem | null>(null)
  // Invitar / reenviar la invitacion de owner a una organizacion existente.
  const [invitingOrg, setInvitingOrg] = useState<PlatformOrganizationItem | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'owner' | 'admin' | 'editor' | 'viewer' | 'employee'>('owner')
  const [userToToggleAdmin, setUserToToggleAdmin] = useState<PlatformUserItem | null>(null)

  // Platform Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(initialData.platformSettings.maintenanceMode)
  const [systemAnnouncement, setSystemAnnouncement] = useState(initialData.platformSettings.systemAnnouncement)
  const [allowSignups, setAllowSignups] = useState(initialData.platformSettings.allowSignups)
  const [defaultProjectLimit, setDefaultProjectLimit] = useState(initialData.platformSettings.defaultProjectLimit)

  const handleAdminSignOut = () => {
    startTransition(async () => {
      await logout()
      window.location.href = '/login'
    })
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Handle Module Price Toggle in Creation Modal
  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModulePrices(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        selected: !prev[moduleId]?.selected,
      },
    }))
  }

  const updateModulePriceInModal = (moduleId: string, priceDollars: number) => {
    setSelectedModulePrices(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        priceDollars: Math.max(0, priceDollars),
      },
    }))
  }

  const computedModalMonthlyTotal = Object.entries(selectedModulePrices).reduce((acc, [_, item]) => {
    return item.selected ? acc + (item.priceDollars || 0) : acc
  }, 0)

  // Handle Create Organization Submit
  const handleCreateOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) {
      showToast('Organization name is required', 'error')
      return
    }

    const selectedModules = Object.entries(selectedModulePrices)
      .filter(([_, item]) => item.selected)
      .map(([moduleId, item]) => ({
        moduleId,
        priceCents: Math.round((item.priceDollars || 0) * 100),
      }))

    startTransition(async () => {
      const res = await createPlatformOrganization(newOrgName, newOrgOwnerEmail, selectedModules, {
        contactEmail: newOrgContactEmail,
        tempPassword: newOrgTempPassword,
      })
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        // The workspace can be created while the invite or the Stripe step still fails.
        // Say so, instead of reporting an unqualified success.
        if (res.warnings && res.warnings.length > 0) {
          showToast(`Workspace created, but: ${res.warnings.join(' · ')}`, 'error')
        } else if (res.ownerProvisioned) {
          showToast(
            `Workspace created. ${newOrgOwnerEmail} can sign in now with the temporary password.`,
            'success'
          )
        } else {
          showToast('Client Organization created successfully!', 'success')
        }
        setCreatedOrgName(newOrgName)
        setCreatedCheckoutUrl(res.checkoutUrl || null)
        if (!res.checkoutUrl) {
          setIsCreateOrgOpen(false)
          setNewOrgName('')
          setNewOrgOwnerEmail('')
          setNewOrgContactEmail('')
          setNewOrgTempPassword('')
        }
      }
    })
  }

  // Handle Open Edit Org Modal
  const handleStartEditOrg = (org: PlatformOrganizationItem) => {
    setEditingOrg(org)
    setEditOrgName(org.name)
    setEditLogoUrl(org.logoUrl)
    setEditContactName(org.contactName || '')
    setEditContactEmail(org.contactEmail || '')
    setEditContactPhone(org.contactPhone || '')
    setEditAddress(org.address || '')
    setSelectedLogoFile(null)
    setLogoPreviewUrl(org.logoUrl)
  }

  // Handle File Input Change for Logo
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP).', 'error')
      return
    }

    // 2MB size limit
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo image must be under 2MB.', 'error')
      return
    }

    setSelectedLogoFile(file)
    const preview = URL.createObjectURL(file)
    setLogoPreviewUrl(preview)
  }

  // Handle Save Edit Organization
  const handleSaveEditOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOrg) return

    if (!editOrgName.trim()) {
      showToast('Company name cannot be empty.', 'error')
      return
    }

    setIsUploadingLogo(true)
    let finalLogoUrl = editLogoUrl

    try {
      if (selectedLogoFile) {
        const fileExt = selectedLogoFile.name.split('.').pop() || 'png'
        const filePath = `${editingOrg.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(filePath, selectedLogoFile, {
            cacheControl: '3600',
            upsert: true,
          })

        if (uploadError) {
          showToast(`Failed to upload logo: ${uploadError.message}`, 'error')
          setIsUploadingLogo(false)
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('company-logos')
          .getPublicUrl(filePath)

        finalLogoUrl = publicUrlData.publicUrl
      }

      startTransition(async () => {
        const res = await updatePlatformOrganization(editingOrg.id, {
          name: editOrgName,
          logoUrl: finalLogoUrl,
          contactName: editContactName,
          contactEmail: editContactEmail,
          contactPhone: editContactPhone,
          address: editAddress,
        })

        setIsUploadingLogo(false)

        if (res.error) {
          showToast(res.error, 'error')
        } else {
          showToast('Company details updated successfully!', 'success')
          setData(prev => ({
            ...prev,
            organizations: prev.organizations.map(o =>
              o.id === editingOrg.id
                ? {
                    ...o,
                    name: editOrgName.trim(),
                    logoUrl: finalLogoUrl,
                    contactName: editContactName.trim() || null,
                    contactEmail: editContactEmail.trim() || null,
                    contactPhone: editContactPhone.trim() || null,
                    address: editAddress.trim() || null,
                  }
                : o
            ),
          }))
          setEditingOrg(null)
        }
      })
    } catch (err: any) {
      setIsUploadingLogo(false)
      showToast(err.message || 'Error updating organization', 'error')
    }
  }

  // Handle Edit Module Click
  const handleStartEditModule = (m: PlatformModuleItem) => {
    setEditingModule(m)
    setModuleName(m.name)
    setModuleDesc(m.description || '')
    setModulePriceDollars((m.defaultMonthlyPriceCents || 0) / 100)
    setModuleStripePriceId(m.stripePriceId || '')
    setModuleIsActive(m.isActive)
  }

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingModule) return

    startTransition(async () => {
      const priceCents = Math.round(modulePriceDollars * 100)
      const res = await updatePlatformModule(
        editingModule.id,
        moduleName,
        moduleDesc,
        priceCents,
        moduleStripePriceId,
        moduleIsActive
      )
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast(`Module ${moduleName} updated successfully!`, 'success')
        setData(prev => ({
          ...prev,
          modules: prev.modules.map(m =>
            m.id === editingModule.id
              ? {
                  ...m,
                  name: moduleName,
                  description: moduleDesc,
                  defaultMonthlyPriceCents: priceCents,
                  stripePriceId: moduleStripePriceId || null,
                  isActive: moduleIsActive,
                }
              : m
          ),
        }))
        setEditingModule(null)
      }
    })
  }

  // Handle Toggle Suspension
  const handleToggleSuspension = (org: PlatformOrganizationItem) => {
    const nextStatus = org.status === 'suspended' ? 'active' : 'suspended'
    startTransition(async () => {
      const res = await toggleOrganizationSuspension(org.id, nextStatus)
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast(
          nextStatus === 'suspended'
            ? `Organization ${org.name} has been suspended.`
            : `Organization ${org.name} has been reactivated.`,
          'success'
        )
        setData(prev => ({
          ...prev,
          organizations: prev.organizations.map(o =>
            o.id === org.id ? { ...o, status: nextStatus } : o
          ),
        }))
      }
    })
  }

  const handleSendInvite = () => {
    if (!invitingOrg) return
    const org = invitingOrg
    startTransition(async () => {
      const res = await inviteOrganizationOwner(org.id, inviteEmail, inviteRole)
      if (res.error) {
        showToast(res.error, 'error')
        return
      }
      // Una cuenta que ya existe no es un fallo: la invitacion queda escrita y
      // se aplica al siguiente inicio de sesion. Por eso el aviso es warning.
      showToast(res.warning || `Invitation sent to ${inviteEmail.trim()} for ${org.name}.`, res.warning ? 'error' : 'success')
      setInvitingOrg(null)
      setInviteEmail('')
    })
  }

  // Handle Delete Org
  const handleConfirmDeleteOrg = () => {
    if (!orgToDelete) return
    startTransition(async () => {
      const res = await deletePlatformOrganization(orgToDelete.id)
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast(`Organization ${orgToDelete.name} deleted.`, 'success')
        setData(prev => ({
          ...prev,
          organizations: prev.organizations.filter(o => o.id !== orgToDelete.id),
        }))
        setOrgToDelete(null)
      }
    })
  }

  // Handle Toggle Admin
  const handleConfirmToggleAdmin = () => {
    if (!userToToggleAdmin) return
    const newStatus = !userToToggleAdmin.isPlatformAdmin
    startTransition(async () => {
      const res = await toggleUserPlatformAdmin(userToToggleAdmin.id, newStatus)
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast(
          newStatus
            ? `Granted Platform Superadmin privileges to ${userToToggleAdmin.email}.`
            : `Revoked Platform Superadmin privileges from ${userToToggleAdmin.email}.`,
          'success'
        )
        setData(prev => ({
          ...prev,
          users: prev.users.map(u =>
            u.id === userToToggleAdmin.id ? { ...u, isPlatformAdmin: newStatus } : u
          ),
        }))
        setUserToToggleAdmin(null)
      }
    })
  }

  // Copy helper
  const copyToClipboard = (text: string, label: string = 'Copied') => {
    navigator.clipboard.writeText(text)
    showToast(`${label} copied to clipboard!`, 'info')
  }

  const formatCentsToDollars = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  const getBillingBadge = (billingStatus: string, status: string) => {
    if (status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          Suspended
        </span>
      )
    }

    switch (billingStatus) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active Subscription
          </span>
        )
      case 'trialing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Trialing
          </span>
        )
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Past Due ⚠️
          </span>
        )
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Canceled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
            {billingStatus}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-500/50 text-red-200'
              : toast.type === 'info'
              ? 'bg-indigo-950/95 border-indigo-500/50 text-indigo-200'
              : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                  Platform Admin Console
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Multi-tenant commercial governance, Stripe subscriptions & discipline modules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdminSignOut}
              className="px-3.5 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-red-400 bg-[var(--surface-2)] hover:bg-red-500/10 border border-[var(--border)] hover:border-red-500/30 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🚪</span> Sign Out
            </button>
            <button
              onClick={() => {
                setIsCreateOrgOpen(true)
                setCreatedCheckoutUrl(null)
              }}
              className="px-4 py-2 bg-[var(--accent)] text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span> New Client Company
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 flex space-x-1 border-t border-[var(--border)]/60 overflow-x-auto text-xs font-bold">
          {[
            { id: 'overview', label: 'Overview & Billing' },
            { id: 'organizations', label: `Client Companies (${data.organizations.length})` },
            { id: 'modules', label: `Modules & Pricing (${data.modules.length})` },
            { id: 'users', label: `Global Users (${data.users.length})` },
            { id: 'access', label: 'Sessions & Sign-Ins' },
            { id: 'activity', label: 'Cross-Tenant Audit' },
            { id: 'settings', label: 'Platform Controls' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[var(--accent)] text-[var(--accent-text)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Attention Required Banner (if any past_due accounts) */}
            {data.pastDueOrganizations.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <span>⚠️ Attention Required:</span>
                  <span>{data.pastDueOrganizations.length} account(s) in past-due or suspended state.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {data.pastDueOrganizations.map(org => (
                    <div key={org.id} className="bg-[var(--surface-1)] border border-amber-500/20 rounded-xl p-3.5 space-y-1.5 text-xs">
                      <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
                        <span>{org.name}</span>
                        {getBillingBadge(org.billingStatus, org.status)}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                        MRR: {formatCentsToDollars(org.monthlyTotalCents)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commercial Billing Summary KPIs */}
            <div>
              <h2 className="text-xs font-black uppercase text-[var(--text-tertiary)] tracking-wider mb-3">
                Commercial Revenue & Subscription Metrics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-[var(--surface-1)] border border-emerald-500/30 rounded-2xl p-5 shadow-xs">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Total MRR</div>
                  <div className="text-2xl font-black text-emerald-300 mt-1">
                    {formatCentsToDollars(data.billingMetrics.totalMrrCents)}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-1 font-medium">Active subscriptions</div>
                </div>

                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active Subs</div>
                  <div className="text-2xl font-black text-[var(--text-primary)] mt-1">
                    {data.billingMetrics.activeSubscriptionsCount}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-1 font-medium">Paying monthly</div>
                </div>

                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Trialing</div>
                  <div className="text-2xl font-black text-[var(--text-primary)] mt-1">
                    {data.billingMetrics.trialingCount}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-1 font-medium">In evaluation</div>
                </div>

                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Past Due</div>
                  <div className="text-2xl font-black text-amber-300 mt-1">
                    {data.billingMetrics.pastDueCount}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-1 font-medium">Payment retry phase</div>
                </div>

                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Canceled</div>
                  <div className="text-2xl font-black text-red-300 mt-1">
                    {data.billingMetrics.canceledCount}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-1 font-medium">Churned accounts</div>
                </div>

                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
                  <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Suspended</div>
                  <div className="text-2xl font-black text-purple-300 mt-1">
                    {data.billingMetrics.suspendedCount}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-1 font-medium">Manual admin lock</div>
                </div>
              </div>
            </div>

            {/* Platform Resource Metrics */}
            <div>
              <h2 className="text-xs font-black uppercase text-[var(--text-tertiary)] tracking-wider mb-3">
                Platform Technical Footprint
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
                  <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Client Orgs</div>
                  <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{data.metrics.totalOrganizations}</div>
                </div>
                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
                  <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Total Users</div>
                  <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{data.metrics.totalUsers}</div>
                </div>
                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
                  <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Active Projects</div>
                  <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{data.metrics.activeProjects}</div>
                </div>
                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
                  <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Network Devices</div>
                  <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{data.metrics.totalDevices}</div>
                </div>
                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
                  <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Tasks Logged</div>
                  <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{data.metrics.totalTasks}</div>
                </div>
                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
                  <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">24h Audit Events</div>
                  <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{data.metrics.activityCount24h}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENT COMPANIES */}
        {activeTab === 'organizations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[var(--text-primary)]">Client Companies & Subscriptions</h2>
                <p className="text-xs text-[var(--text-secondary)]">Manage tenant organizations, logos, contact info, purchased modules, and Stripe billing lifecycle.</p>
              </div>
              <button
                onClick={() => {
                  setIsCreateOrgOpen(true)
                  setCreatedCheckoutUrl(null)
                }}
                className="px-4 py-2 bg-[var(--accent)] text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                + New Client Company
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {data.organizations.map(org => (
                <div key={org.id} className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      {/* Logo or Default Icon */}
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="w-12 h-12 rounded-xl object-contain bg-[var(--surface-2)] border border-[var(--border)] p-1 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-[var(--border)] flex items-center justify-center text-lg shrink-0 text-slate-400 font-black">
                          🏢
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-black text-[var(--text-primary)]">{org.name}</h3>
                          {getBillingBadge(org.billingStatus, org.status)}
                        </div>
                        <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-mono flex flex-wrap items-center gap-2">
                          <span>ID: {org.id}</span>
                          <span>•</span>
                          <span>Created: {new Date(org.createdAt).toLocaleDateString()}</span>
                          {org.stripeCustomerId && (
                            <>
                              <span>•</span>
                              <span>Stripe: {org.stripeCustomerId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEditOrg(org)}
                        className="px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:text-[var(--text-primary)] bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSuspension(org)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                          org.status === 'suspended'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                      >
                        {org.status === 'suspended' ? 'Reactivate Access' : 'Suspend Workspace'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInvitingOrg(org)
                          setInviteEmail(org.contactEmail || '')
                          setInviteRole('owner')
                        }}
                        title="Invite or re-send the owner invitation for this company"
                        className="px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span>Invite owner</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrgToDelete(org)}
                        className="px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Business & Contact Information Summary */}
                  {(org.contactName || org.contactEmail || org.contactPhone || org.address) && (
                    <div className="bg-[var(--surface-2)]/60 border border-[var(--border)]/70 rounded-xl px-3.5 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-[var(--text-secondary)]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)]">Contact:</span>
                        <span>{org.contactName || '—'}</span>
                        {org.contactEmail && (
                          <>
                            <span className="text-[var(--text-tertiary)]">•</span>
                            <span className="font-mono text-indigo-300">{org.contactEmail}</span>
                          </>
                        )}
                        {org.contactPhone && (
                          <>
                            <span className="text-[var(--text-tertiary)]">•</span>
                            <span>{org.contactPhone}</span>
                          </>
                        )}
                      </div>
                      {org.address && (
                        <div className="text-[11px] text-[var(--text-tertiary)] truncate max-w-md">
                          📍 {org.address}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Modules Purchased & MRR Breakdown */}
                  <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Purchased Modules ({org.modules.filter(m => m.status === 'active').length})
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {org.modules.length === 0 ? (
                          <span className="text-xs text-[var(--text-tertiary)] italic">No specific modules mapped (All enabled)</span>
                        ) : (
                          org.modules.map(mod => (
                            <span
                              key={mod.id}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                                mod.status === 'active'
                                  ? 'bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-primary)]'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20 line-through'
                              }`}
                            >
                              <span>{mod.moduleName}</span>
                              <span className="font-mono text-[11px] text-[var(--accent-text)]">
                                {formatCentsToDollars(mod.priceCents)}/mo
                              </span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Monthly MRR</div>
                      <div className="text-lg font-black text-emerald-400">
                        {formatCentsToDollars(org.monthlyTotalCents)}
                        <span className="text-xs font-normal text-[var(--text-secondary)]">/mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Members and Owners */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-secondary)] gap-2 pt-1">
                    <div className="flex items-center gap-4">
                      <span>👥 {org.membersCount} member(s)</span>
                      <span>📁 {org.projectsCount} project(s)</span>
                    </div>
                    <div>
                      Owner:{' '}
                      {org.owners.length > 0 ? (
                        <span className="font-semibold text-[var(--text-primary)]">{org.owners.map(o => o.email).join(', ')}</span>
                      ) : (
                        <span className="text-[var(--text-tertiary)] italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MODULES & PRICING */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)]">Discipline Modules Catalog & Pricing</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Define the sellable engineering modules, set default catalog pricing in USD, and map Stripe Price IDs.
              </p>
            </div>

            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-[var(--text-secondary)]">
                <thead className="bg-[var(--surface-2)] text-[var(--text-tertiary)] uppercase text-[10px] tracking-wider border-b border-[var(--border)] font-bold">
                  <tr>
                    <th className="text-left px-5 py-3.5">Discipline Module</th>
                    <th className="text-left px-4 py-3.5">Description</th>
                    <th className="text-left px-4 py-3.5">Default Price / mo</th>
                    <th className="text-left px-4 py-3.5">Stripe Price ID</th>
                    <th className="text-left px-4 py-3.5">Status</th>
                    <th className="text-right px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-medium">
                  {data.modules.map(mod => (
                    <tr key={mod.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-black text-sm text-[var(--text-primary)]">{mod.name}</div>
                        <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase">id: {mod.id}</div>
                      </td>
                      <td className="px-4 py-4 max-w-xs text-xs leading-relaxed">{mod.description || '—'}</td>
                      <td className="px-4 py-4 font-mono font-bold text-[var(--text-primary)] text-sm">
                        {formatCentsToDollars(mod.defaultMonthlyPriceCents)}
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px]">
                        {mod.stripePriceId ? (
                          <span className="text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {mod.stripePriceId}
                          </span>
                        ) : (
                          <span className="text-amber-400/80 italic">Not configured</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {mod.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleStartEditModule(mod)}
                          className="px-3 py-1.5 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--accent-text)] font-bold rounded-xl transition cursor-pointer"
                        >
                          Edit Pricing & Stripe
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)]">Global Users Directory</h2>
              <p className="text-xs text-[var(--text-secondary)]">Manage tenant memberships and grant or revoke Platform Superadmin privileges.</p>
            </div>

            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-[var(--text-secondary)]">
                <thead className="bg-[var(--surface-2)] text-[var(--text-tertiary)] uppercase text-[10px] tracking-wider border-b border-[var(--border)] font-bold">
                  <tr>
                    <th className="text-left px-5 py-3.5">User</th>
                    <th className="text-left px-4 py-3.5">Tenants & Roles</th>
                    <th className="text-left px-4 py-3.5">Platform Role</th>
                    <th className="text-right px-5 py-3.5">Superadmin Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-medium">
                  {data.users.map(u => (
                    <tr key={u.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-sm text-[var(--text-primary)]">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-[var(--text-tertiary)]">{u.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {u.organizations.map((org, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[11px]">
                              <span className="font-bold text-[var(--text-primary)]">{org.name}</span>{' '}
                              <span className="capitalize text-[var(--text-tertiary)]">({org.role})</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {u.isPlatformAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            👑 Superadmin
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">Standard User</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setUserToToggleAdmin(u)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                            u.isPlatformAdmin
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20'
                          }`}
                        >
                          {u.isPlatformAdmin ? 'Revoke Superadmin' : 'Make Superadmin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SIGN-IN LOG */}
        {activeTab === 'access' && (
          <div className="space-y-4">
            <ActiveSessionsPanel onToast={showToast} />

            <div className="pt-4">
              <h2 className="text-base font-black text-[var(--text-primary)]">User Sign-In Log</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Who has logged in, when, and whether they still have a session open. Every login is recorded from
                this point on; entries before the log was enabled show only the most recent sign-in Supabase had kept.
              </p>
            </div>

            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-[var(--text-secondary)]">
                  <thead className="bg-[var(--surface-2)] text-[var(--text-tertiary)] uppercase text-[10px] tracking-wider border-b border-[var(--border)] font-bold">
                    <tr>
                      <th className="text-left px-5 py-3.5">User</th>
                      <th className="text-left px-4 py-3.5">Tenant</th>
                      <th className="text-left px-4 py-3.5">Registered</th>
                      <th className="text-left px-4 py-3.5">Last Sign-In</th>
                      <th className="text-right px-4 py-3.5">Logins</th>
                      <th className="text-left px-4 py-3.5">Session</th>
                      <th className="text-right px-5 py-3.5">History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-medium">
                    {data.signIns.map(s => (
                      <React.Fragment key={s.userId}>
                        <tr className="hover:bg-[var(--surface-hover)] transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-sm text-[var(--text-primary)]">{s.fullName}</div>
                            <div className="font-mono text-[11px] text-[var(--text-tertiary)]">{s.email}</div>
                          </td>
                          <td className="px-4 py-4">
                            {s.organizations.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {s.organizations.map((name, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-bold text-[var(--text-primary)]">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[var(--text-tertiary)]">No tenant</span>
                            )}
                          </td>
                          <td className="px-4 py-4 font-mono text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">
                            {s.registeredAt ? new Date(s.registeredAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-4 font-mono text-[11px] whitespace-nowrap">
                            {s.lastSignInAt ? (
                              <span className="text-[var(--text-primary)] font-bold">{new Date(s.lastSignInAt).toLocaleString()}</span>
                            ) : (
                              <span className="text-[var(--text-tertiary)]">Never signed in</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-[var(--text-primary)] tabular-nums">
                            {s.signInCount}
                          </td>
                          <td className="px-4 py-4">
                            {s.activeSessions > 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Online ({s.activeSessions})
                              </span>
                            ) : (
                              <span className="text-[var(--text-tertiary)]">Signed out</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              disabled={s.history.length === 0}
                              onClick={() => setExpandedSignInUserId(expandedSignInUserId === s.userId ? null : s.userId)}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {expandedSignInUserId === s.userId ? 'Hide' : `View (${s.history.length})`}
                            </button>
                          </td>
                        </tr>
                        {expandedSignInUserId === s.userId && s.history.length > 0 && (
                          <tr className="bg-[var(--surface-2)]/50">
                            <td colSpan={7} className="px-5 py-3">
                              <ul className="space-y-1">
                                {s.history.map((ts, i) => (
                                  <li key={i} className="font-mono text-[11px] text-[var(--text-secondary)]">
                                    {new Date(ts).toLocaleString()}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LOG */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)]">Cross-Tenant Audit Stream</h2>
              <p className="text-xs text-[var(--text-secondary)]">Live immutable record of platform governance, creation, and Stripe billing events.</p>
            </div>

            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs divide-y divide-[var(--border)]">
              {data.recentActivity.map(act => (
                <div key={act.id} className="p-4 hover:bg-[var(--surface-hover)] transition-colors flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[var(--accent-text)] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {act.action}
                      </span>
                      <span className="text-[var(--text-tertiary)] font-bold">•</span>
                      <span className="font-bold text-[var(--text-primary)]">{act.organizationName}</span>
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      By <span className="font-bold text-[var(--text-primary)]">{act.actorEmail}</span> on {act.entityType} ({act.entityId || 'general'})
                    </div>
                    {act.metadata && (
                      <pre className="text-[10px] font-mono bg-[var(--surface-2)] p-2 rounded-lg text-[var(--text-tertiary)] overflow-x-auto max-w-2xl">
                        {JSON.stringify(act.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)] shrink-0 font-mono">
                    {new Date(act.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)]">Global Platform Controls</h2>
              <p className="text-xs text-[var(--text-secondary)]">Maintenance modes, announcement broadcasts, and security guardrails.</p>
            </div>

            {/* Maintenance Mode */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Emergency Maintenance Mode</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Blocks regular tenant logins while allowing Platform Admins to work.</p>
                </div>
                <input
                  type="checkbox"
                  checked={maintenanceMode.enabled}
                  onChange={(e) => {
                    const next = { ...maintenanceMode, enabled: e.target.checked }
                    setMaintenanceMode(next)
                    startTransition(async () => {
                      await savePlatformSetting('maintenance_mode', next)
                      showToast('Maintenance mode setting updated.', 'success')
                    })
                  }}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
              {maintenanceMode.enabled && (
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Maintenance Message</label>
                  <textarea
                    rows={2}
                    value={maintenanceMode.message}
                    onChange={(e) => setMaintenanceMode({ ...maintenanceMode, message: e.target.value })}
                    onBlur={() => {
                      startTransition(async () => {
                        await savePlatformSetting('maintenance_mode', maintenanceMode)
                        showToast('Maintenance message saved.', 'success')
                      })
                    }}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}
            </div>

            {/* Signups Toggle */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-6 flex items-center justify-between shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Allow Public Self-Serve Signups</h3>
                <p className="text-xs text-[var(--text-secondary)]">When disabled, accounts can only be created via Platform Admin invitation.</p>
              </div>
              <input
                type="checkbox"
                checked={allowSignups}
                onChange={(e) => {
                  const val = e.target.checked
                  setAllowSignups(val)
                  startTransition(async () => {
                    await savePlatformSetting('allow_signups', val)
                    showToast('Signups configuration updated.', 'success')
                  })
                }}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

      </main>

      {/* MODAL: CREATE CLIENT COMPANY */}
      {isCreateOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsCreateOrgOpen(false)} />
          <div className="relative bg-[var(--surface-1)] border border-[var(--border-strong)] p-6 md:p-8 rounded-2xl w-full max-w-xl space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-black text-[var(--text-primary)]">Create Client Company</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Provision a new workspace, select purchased engineering modules, and generate a Stripe Checkout subscription link.
              </p>
            </div>

            {createdCheckoutUrl ? (
              <div className="space-y-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-xs">
                <div className="font-bold text-emerald-300 text-sm">
                  🎉 {createdOrgName} Created Successfully!
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Send this Stripe Checkout link to the client's account owner to complete their subscription payment:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdCheckoutUrl}
                    className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 rounded-lg font-mono text-[11px] text-[var(--text-primary)] select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCheckoutUrl, 'Stripe Checkout link')}
                    className="px-3.5 py-2 bg-[var(--accent)] text-white font-bold rounded-lg transition text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    Copy Link
                  </button>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateOrgOpen(false)
                      setCreatedCheckoutUrl(null)
                      setNewOrgName('')
                      setNewOrgOwnerEmail('')
                    }}
                    className="px-4 py-2 bg-[var(--surface-2)] text-[var(--text-primary)] font-bold rounded-lg text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrgSubmit} className="space-y-5">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                      Company / Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Infrastructure Partners"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                      Account Owner Email
                    </label>
                    <input
                      type="email"
                      placeholder="owner@clientcompany.com"
                      value={newOrgOwnerEmail}
                      onChange={(e) => setNewOrgOwnerEmail(e.target.value)}
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-semibold"
                    />
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                      This person signs in and owns the workspace.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                      Billing Contact Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="Same as the owner if left empty"
                      value={newOrgContactEmail}
                      onChange={(e) => setNewOrgContactEmail(e.target.value)}
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                      Temporary Password (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave empty to send an invitation email instead"
                      value={newOrgTempPassword}
                      onChange={(e) => setNewOrgTempPassword(e.target.value)}
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono"
                    />
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                      Creates the owner account right away, so it works without email. At least
                      8 characters. Ask the client to change it after their first sign-in.
                    </p>
                  </div>

                  {/* Modules Multi-select with Custom Prices */}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider">
                        Select Purchased Modules & Custom Monthly Pricing ($/mo)
                      </label>
                      <div className="text-xs font-black text-emerald-400 font-mono">
                        Total: {computedModalMonthlyTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/mo
                      </div>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {data.modules.map(mod => {
                        const isSelected = selectedModulePrices[mod.id]?.selected ?? false
                        const priceDollars = selectedModulePrices[mod.id]?.priceDollars ?? (mod.defaultMonthlyPriceCents / 100)

                        return (
                          <div
                            key={mod.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                              isSelected
                                ? 'bg-indigo-500/10 border-indigo-500/40 text-[var(--text-primary)]'
                                : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] opacity-60'
                            }`}
                          >
                            <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleModuleSelection(mod.id)}
                                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-xs truncate">{mod.name}</div>
                                <div className="text-[10px] text-[var(--text-tertiary)] truncate">{mod.description || mod.id}</div>
                              </div>
                            </label>

                            {isSelected && (
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs font-bold text-[var(--text-tertiary)]">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={priceDollars}
                                  onChange={(e) => updateModulePriceInModal(mod.id, parseFloat(e.target.value) || 0)}
                                  className="w-20 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs font-mono font-bold text-[var(--text-primary)] text-right focus:outline-none focus:border-[var(--accent)]"
                                />
                                <span className="text-[10px] text-[var(--text-tertiary)]">/mo</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOrgOpen(false)}
                    disabled={isPending}
                    className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 bg-[var(--accent)] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-2"
                  >
                    {isPending && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Create & Generate Checkout
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT CLIENT COMPANY */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEditingOrg(null)} />
          <form onSubmit={handleSaveEditOrg} className="relative bg-[var(--surface-1)] border border-[var(--border-strong)] p-6 md:p-8 rounded-2xl w-full max-w-lg space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-[var(--text-primary)]">Edit Client Company</h3>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">ID: {editingOrg.id.substring(0, 8)}...</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Update company name, branding logo, primary contact details, and physical address.
              </p>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Company Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={editOrgName}
                  onChange={(e) => setEditOrgName(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-semibold"
                />
              </div>

              {/* Logo Upload & Preview */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1.5">
                  Company Logo
                </label>
                <div className="flex items-center gap-4 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl">
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt="Logo preview"
                      className="w-14 h-14 rounded-xl object-contain bg-[var(--surface-1)] border border-[var(--border)] p-1 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0 text-slate-500 font-bold">
                      🏢
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleLogoFileChange}
                      className="block w-full text-[11px] text-[var(--text-secondary)] file:mr-2.5 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[var(--accent)] file:text-[var(--text-primary)] hover:file:bg-[var(--accent-hover)] file:cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                      <span>Max size: 2MB (PNG, JPG, WebP, SVG)</span>
                      {logoPreviewUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLogoFile(null)
                            setLogoPreviewUrl(null)
                            setEditLogoUrl(null)
                          }}
                          className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Person & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={editContactName}
                    onChange={(e) => setEditContactName(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                    Contact Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono"
                  />
                </div>
              </div>

              {/* Phone & Address */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 012-3456"
                  value={editContactPhone}
                  onChange={(e) => setEditContactPhone(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                  Physical / Billing Address
                </label>
                <textarea
                  rows={2}
                  placeholder="123 Main St, Suite 400, Atlanta, GA 30301"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEditingOrg(null)}
                disabled={isPending || isUploadingLogo}
                className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || isUploadingLogo}
                className="px-5 py-2 bg-[var(--accent)] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-2"
              >
                {(isPending || isUploadingLogo) && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isUploadingLogo ? 'Uploading Logo...' : isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT MODULE */}
      {editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEditingModule(null)} />
          <form onSubmit={handleSaveModule} className="relative bg-[var(--surface-1)] border border-[var(--border-strong)] p-6 md:p-8 rounded-2xl w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-black text-[var(--text-primary)]">Edit Module: {editingModule.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Configure default catalog monthly pricing and map your Stripe Price ID.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">Module Name</label>
                <input
                  type="text"
                  required
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                  Default Monthly Catalog Price ($ USD / mo)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-tertiary)]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={modulePriceDollars}
                    onChange={(e) => setModulePriceDollars(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] font-mono font-bold"
                  />
                  <span className="text-xs text-[var(--text-tertiary)] font-bold">/mo</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wider mb-1">
                  Stripe Recurring Price ID (e.g. price_1N...)
                </label>
                <input
                  type="text"
                  placeholder="price_..."
                  value={moduleStripePriceId}
                  onChange={(e) => setModuleStripePriceId(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] font-mono font-semibold"
                />
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  Paste the recurring Price ID from your Stripe Dashboard Product Catalog.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="moduleIsActiveCheck"
                  checked={moduleIsActive}
                  onChange={(e) => setModuleIsActive(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="moduleIsActiveCheck" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                  Module is Active in Catalog
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEditingModule(null)}
                className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 bg-[var(--accent)] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                Save Module
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INVITAR / REENVIAR INVITACION DE OWNER */}
      {invitingOrg && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setInvitingOrg(null)}>
          <div
            className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-black text-[var(--text-primary)]">Invite owner</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1 mb-5">
              Sends the invitation for <strong className="text-[var(--text-primary)]">{invitingOrg.name}</strong>. Re-sending is safe:
              the previous pending invitation for the same address is replaced, never duplicated.
            </p>

            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="owner@company.com"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] mb-4"
            />

            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
              <option value="employee">Employee</option>
            </select>

            <p className="text-[10px] text-[var(--text-tertiary)] mt-3 leading-snug">
              The invitation is written first and the email second. That order is what ties the person to this
              company — an account created before the invitation exists lands in a separate workspace.
            </p>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setInvitingOrg(null)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendInvite}
                disabled={isPending || !inviteEmail.trim()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--accent)] text-white cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Sending…' : 'Send invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: DELETE ORG */}
      <ConfirmModal
        isOpen={Boolean(orgToDelete)}
        title={`Delete Organization "${orgToDelete?.name}"?`}
        message="This action will permanently delete the organization, its associated project data, and member associations. This cannot be undone."
        confirmText="Delete Organization"
        cancelText="Cancel"
        variant="danger"
        isLoading={isPending}
        onConfirm={handleConfirmDeleteOrg}
        onCancel={() => setOrgToDelete(null)}
      />

      {/* CONFIRM MODAL: TOGGLE ADMIN */}
      <ConfirmModal
        isOpen={Boolean(userToToggleAdmin)}
        title={userToToggleAdmin?.isPlatformAdmin ? `Revoke Superadmin from ${userToToggleAdmin?.email}?` : `Grant Superadmin to ${userToToggleAdmin?.email}?`}
        message={
          userToToggleAdmin?.isPlatformAdmin
            ? 'This user will lose access to the /admin platform console and cross-tenant management.'
            : 'This user will gain full unrestricted superadmin access to all tenant organizations, billing management, and platform controls.'
        }
        confirmText={userToToggleAdmin?.isPlatformAdmin ? 'Revoke Superadmin' : 'Grant Superadmin'}
        cancelText="Cancel"
        variant={userToToggleAdmin?.isPlatformAdmin ? 'danger' : 'primary'}
        isLoading={isPending}
        onConfirm={handleConfirmToggleAdmin}
        onCancel={() => setUserToToggleAdmin(null)}
      />
    </div>
  )
}
