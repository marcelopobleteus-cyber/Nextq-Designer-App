'use client'

import React, { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { updateProjectDisciplines } from '@/app/projects/actions'
import { DISCIPLINES, getSectionMeta, type ProjectSection } from '@/lib/disciplines'
import NextQMark from '@/components/brand/NextQMark'

interface ProjectSidebarProps {
  projectId: string
  projectName: string
  disciplines: string[]
  projectSection?: ProjectSection
}

function disciplineIcon(id: string): React.ReactNode {
  switch (id) {
    case 'cctv':
      return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
    case 'fiber':
      return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
    case 'conduit':
      return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h6a4 4 0 0 1 4 4v4a4 4 0 0 0 4 4h2"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="18" r="2"/></svg>
    case 'networking':
      return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M12 8v8"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/></svg>
    case 'wireless':
      return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
    case 'power':
      return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    case 'lighting':
      return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.6.55 1 1.36 1 2.5h6c0-1.14.4-1.95 1-2.5A6 6 0 0 0 12 2z"/></svg>
    case 'traffic_signal':
      return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="1" width="6" height="16" rx="3"/><circle cx="12" cy="5" r="1.2" fill="currentColor"/><circle cx="12" cy="9" r="1.2" fill="currentColor"/><circle cx="12" cy="13" r="1.2" fill="currentColor"/><path d="M12 17v6"/></svg>
    default:
      // Tower construction/maintenance items share one icon — distinct route/label is enough.
      return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 10l8 4 8-4-8-8z"/><path d="M4 14l8 4 8-4"/><path d="M12 18v4"/></svg>
  }
}

// ALL_DISCIPLINES used to be its own hand-maintained array here, duplicated
// against 3 other files. Now it's derived from the single shared catalog in
// src/lib/disciplines.ts (only the id/title/href/ready/group fields this
// component needs).
const ALL_DISCIPLINES: { id: string; name: string; href: string; icon: React.ReactNode; ready: boolean; group?: 'construction' | 'maintenance' }[] =
  DISCIPLINES.map(d => ({
    id: d.id,
    name: d.ready ? d.title : `${d.title} (Under construction)`,
    href: d.href,
    icon: disciplineIcon(d.id),
    ready: d.ready,
    group: d.group,
  }))

// Routes that need every pixel of horizontal space for the map/canvas —
// the sidebar collapses to icons here even if the user pinned it open
// elsewhere in the project.
const CANVAS_ROUTE_PATTERN = /\/(maps|cameras|fiber|network|wireless|power)(\/|$)/

const EXPANDED_WIDTH = 222
const COLLAPSED_WIDTH = 56

export default function ProjectSidebar({ projectId, projectName, disciplines, projectSection }: ProjectSidebarProps) {
  const pathname = usePathname()
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [activeDisciplines, setActiveDisciplines] = useState<string[]>(disciplines)
  const [isPending, startTransition] = useTransition()

  // Pinned = user manually chose to keep the full sidebar open. Defaults to
  // collapsed (icons only) so the map/diagrams get the space by default;
  // hovering the collapsed rail still peeks the full labels temporarily.
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    try {
      setPinned(localStorage.getItem('projectiq_sidebar_pinned') === 'true')
    } catch {}
  }, [])

  const togglePinned = () => {
    setPinned((prev) => {
      const next = !prev
      try {
        localStorage.setItem('projectiq_sidebar_pinned', String(next))
      } catch {}
      return next
    })
  }

  const isCanvasRoute = CANVAS_ROUTE_PATTERN.test(pathname || '')
  const isPinnedEffective = pinned && !isCanvasRoute
  const isOverlayOpen = hovered && !isPinnedEffective

  const toggleDiscipline = (discId: string) => {
    const next = activeDisciplines.includes(discId)
      ? activeDisciplines.filter(id => id !== discId)
      : [...activeDisciplines, discId]

    if (next.length === 0) return

    setActiveDisciplines(next)
    startTransition(async () => {
      const res = await updateProjectDisciplines(projectId, next)
      if (res?.error) setActiveDisciplines(activeDisciplines)
    })
    setShowAddMenu(false)
  }

  const getDisciplineBadge = () => {
    if (activeDisciplines.length === 1) {
      const disc = ALL_DISCIPLINES.find(d => d.id === activeDisciplines[0])
      return { title: disc?.name || 'Specialized Project' }
    }
    const sectionTitle = projectSection ? getSectionMeta(projectSection).title : null
    return { title: sectionTitle || `Multi-Discipline (${activeDisciplines.length} modules)` }
  }

  const badge = getDisciplineBadge()

  // Not-ready modules still get a real link to their "Under construction"
  // stub page — visible AND clickable, per Marcelo's ask that the full
  // scope of the product line be obvious even before a module is built.
  const toNavItem = (d: (typeof ALL_DISCIPLINES)[number]) => ({
    id: d.id,
    label: d.name,
    href: `/projects/${projectId}/${d.href}`,
    active: pathname === `/projects/${projectId}/${d.href}`,
    disabled: false,
    icon: d.icon,
  })

  const activeItems = ALL_DISCIPLINES.filter(d => activeDisciplines.includes(d.id))
  const designItems = activeItems.filter(d => !d.group).map(toNavItem)
  const constructionItems = activeItems.filter(d => d.group === 'construction').map(toNavItem)
  const maintenanceItems = activeItems.filter(d => d.group === 'maintenance').map(toNavItem)

  const categories = [
    {
      label: 'MAIN VIEW',
      items: [
        {
          id: 'overview',
          label: 'Project Dashboard',
          href: `/projects/${projectId}/overview`,
          active: pathname === `/projects/${projectId}/overview` || pathname === `/projects/${projectId}`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
          ),
        },
        {
          id: 'maps',
          label: 'Interactive GIS Map',
          href: `/projects/${projectId}/maps`,
          active: pathname === `/projects/${projectId}/maps`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
          ),
        },
        {
          id: 'topology',
          label: 'Matrix & Topology',
          href: `/projects/${projectId}/locations`,
          active: pathname === `/projects/${projectId}/locations`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/><path d="M12 6v12"/><path d="M6 12h12"/></svg>
          ),
        },
      ]
    },
    ...(designItems.length > 0 ? [{
      label: 'PROJECT MODULES',
      items: designItems
    }] : []),
    ...(constructionItems.length > 0 ? [{
      label: 'CONSTRUCTION',
      items: constructionItems
    }] : []),
    ...(maintenanceItems.length > 0 ? [{
      label: 'MAINTENANCE',
      items: maintenanceItems
    }] : []),
    {
      label: 'OPERATIONS & DELIVERABLES',
      items: [
        {
          id: 'bom',
          label: 'Bill of Materials (BOM)',
          href: `/projects/${projectId}/bom`,
          active: pathname === `/projects/${projectId}/bom`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          ),
        },
        {
          id: 'photos',
          label: 'Field Photos',
          href: `/projects/${projectId}/photos`,
          active: pathname === `/projects/${projectId}/photos`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          ),
        },
        {
          id: 'tasks',
          label: 'Work Orders',
          href: `/projects/${projectId}/tasks`,
          active: pathname === `/projects/${projectId}/tasks`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          ),
        },
        {
          id: 'financial',
          label: 'Financial',
          href: `/projects/${projectId}/financial`,
          active: pathname === `/projects/${projectId}/financial`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          ),
        },
        {
          id: 'reports-proj',
          label: 'Reports & PDF Export',
          href: `/projects/${projectId}/reports`,
          active: pathname === `/projects/${projectId}/reports`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          ),
        },
      ]
    },
    {
      label: 'SUPPORT',
      items: [
        {
          id: 'help',
          label: 'Help Center',
          href: `/projects/${projectId}/help`,
          active: pathname === `/projects/${projectId}/help`,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          ),
        },
      ]
    }
  ]

  // Rendered twice: once for the collapsed icon rail (expanded=false) and
  // once for the pinned/hovered full view (expanded=true) — same data, two looks.
  function renderContent(expanded: boolean) {
    return (
      <>
        {/* Brand logo identity header */}
        <div className={`border-b border-[var(--border)] bg-[var(--surface-1)] shrink-0 flex flex-col gap-1.5 ${expanded ? 'p-3.5' : 'p-2 items-center'}`}>
          {expanded ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[var(--text-primary)] tracking-wider" title="NextQ Designer Suite">NextQ Suite</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[var(--accent-text)] font-mono font-bold bg-[var(--accent-soft)] px-1.5 py-0.5 rounded border border-[var(--accent-border)]">v2.0</span>
                  <button
                    type="button"
                    onClick={togglePinned}
                    title={pinned ? 'Unpin sidebar (auto-collapse)' : 'Pin sidebar open'}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                      pinned ? 'text-[var(--accent-text)] bg-[var(--accent-soft)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                  </button>
                </div>
              </div>

              {/* Specialty Discipline Indicator Badge */}
              <div className="flex items-center justify-between gap-1 px-2 py-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[10.5px] text-[var(--text-secondary)] font-medium truncate">
                <span className="truncate">{badge.title}</span>
                {isPending && <span className="w-2.5 h-2.5 rounded-full border border-[var(--accent)] border-t-transparent animate-spin shrink-0" />}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={togglePinned}
              title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px] tracking-wider transition-colors cursor-pointer ${
                pinned ? 'text-[var(--accent-text)] bg-[var(--accent-soft)]' : 'text-[var(--text-primary)] bg-[var(--surface-2)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <NextQMark size={18} />
            </button>
          )}
        </div>

        {/* Action Buttons: Add Module / Disciplines */}
        <div className={`shrink-0 relative border-b border-[var(--border)] bg-[var(--surface-1)] ${expanded ? 'p-3 space-y-1.5' : 'p-2 flex justify-center'}`}>
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            title="Add Module / Discipline"
            className={
              expanded
                ? 'w-full py-1.5 px-3 bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs'
                : 'w-9 h-9 bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] rounded-lg transition flex items-center justify-center cursor-pointer shadow-xs'
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {expanded && 'Add Module / Discipline'}
          </button>

          {/* Dropdown menu for adding/removing modules */}
          {showAddMenu && (
            <div className={`absolute top-full mt-1 bg-[var(--surface-1)] border border-[var(--border-strong)] rounded-xl shadow-lg p-2 z-50 space-y-1 ${expanded ? 'left-3 right-3' : 'left-2 w-56'}`}>
              <div className="text-[9.5px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider px-2 py-1 border-b border-[var(--border)]">
                Enable Modules in this Project
              </div>
              {ALL_DISCIPLINES.map(d => {
                const active = activeDisciplines.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDiscipline(d.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                      active
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}>{d.icon}</span>
                      <span>{d.name}</span>
                    </span>
                    {active && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] shrink-0"><path d="M4 12.5 9.5 18 20 6.5"/></svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className={`flex-1 overflow-y-auto scrollbar-thin ${expanded ? 'p-2 space-y-4' : 'p-2 space-y-3 flex flex-col items-center'}`}>
          {categories.map((cat, idx) => (
            <div key={idx} className={expanded ? 'space-y-1 w-full' : 'space-y-1 w-full flex flex-col items-center'}>
              {expanded && (
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block px-2.5 mb-1">
                  {cat.label}
                </span>
              )}
              {!expanded && idx > 0 && <div className="w-6 h-px bg-[var(--border)] my-1" />}
              <div className={expanded ? 'space-y-0.5' : 'space-y-1 flex flex-col items-center'}>
                {cat.items.map((sec: any) => (
                  sec.disabled ? (
                    <div
                      key={sec.id}
                      title={`${sec.label} — module in development`}
                      className={
                        expanded
                          ? 'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11.5px] text-[var(--text-tertiary)] cursor-not-allowed opacity-50'
                          : 'w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] cursor-not-allowed opacity-50'
                      }
                    >
                      <span>{sec.icon}</span>
                      {expanded && <span className="truncate">{sec.label}</span>}
                    </div>
                  ) : (
                    <Link
                      key={sec.id}
                      href={sec.href}
                      title={sec.label}
                      className={
                        expanded
                          ? `w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11.5px] transition-all border-l-2 ${
                              sec.active
                                ? 'bg-[var(--surface-2)] border-l-[var(--accent)] text-[var(--text-primary)] font-semibold'
                                : 'bg-transparent border-l-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                            }`
                          : `w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                              sec.active
                                ? 'bg-[var(--surface-2)] text-[var(--accent-text)] font-semibold'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                            }`
                      }
                    >
                      <span className={sec.active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}>
                        {sec.icon}
                      </span>
                      {expanded && <span className="truncate">{sec.label}</span>}
                    </Link>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative shrink-0 h-full font-sans select-none"
      style={{ width: isPinnedEffective ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
    >
      {/* Base rail — always occupies real layout width (icons only unless pinned open) */}
      <aside className="w-full h-full bg-[var(--bg)] border-r border-[var(--border)] flex flex-col overflow-hidden relative z-10">
        {renderContent(isPinnedEffective)}
      </aside>

      {/* Hover peek — floats the full labeled sidebar over the content without
          shifting layout, and folds back automatically when the mouse leaves */}
      {isOverlayOpen && (
        <aside
          className="absolute top-0 left-0 h-full bg-[var(--bg)] border-r border-[var(--border)] flex flex-col overflow-hidden shadow-2xl z-40 transition-all duration-150"
          style={{ width: EXPANDED_WIDTH }}
        >
          {renderContent(true)}
        </aside>
      )}
    </div>
  )
}
