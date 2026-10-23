'use client'

import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import {
  PlatformActiveSessionItem,
  getActiveSessions,
  revokeSession,
  revokeUserSessions,
  revokeAllSessions,
} from './actions'

// A session counts as "active" if its token was used or refreshed recently.
// Supabase refreshes tokens roughly once per JWT lifetime, so older rows are
// usually abandoned tabs or closed browsers that never signed out.
const ACTIVE_WINDOW_MS = 15 * 60 * 1000
const AUTO_REFRESH_MS = 30 * 1000

type Pending =
  | { kind: 'session'; session: PlatformActiveSessionItem }
  | { kind: 'user'; userId: string; email: string; count: number }
  | { kind: 'all'; count: number }
  | null

function describeDevice(ua: string | null): string {
  if (!ua) return 'Unknown'
  if (ua === 'node' || ua.startsWith('node')) return 'Server sign-in'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
  return os ? `${browser} · ${os}` : browser
}

function timeAgo(iso: string | null, now: number): string {
  if (!iso || !now) return '—'
  const diff = now - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  return `${Math.floor(h / 24)} d ago`
}

export default function ActiveSessionsPanel({
  onToast,
}: {
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void
}) {
  const [sessions, setSessions] = useState<PlatformActiveSessionItem[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [isWorking, startWork] = useTransition()
  const [now, setNow] = useState(0)

  const load = useCallback(async () => {
    const res = await getActiveSessions()
    if (res.error) setLoadError(res.error)
    else setLoadError(null)
    setSessions(res.sessions)
    setNow(Date.now())
  }, [])

  useEffect(() => {
    const first = window.setTimeout(load, 0)
    const id = window.setInterval(load, AUTO_REFRESH_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [load])

  const grouped = useMemo(() => {
    const map = new Map<string, { userId: string; email: string; fullName: string; items: PlatformActiveSessionItem[] }>()
    ;(sessions || []).forEach(s => {
      const g = map.get(s.userId) || { userId: s.userId, email: s.email, fullName: s.fullName, items: [] }
      g.items.push(s)
      map.set(s.userId, g)
    })
    return Array.from(map.values())
  }, [sessions])

  const isActive = (s: PlatformActiveSessionItem) =>
    s.lastActiveAt ? now - new Date(s.lastActiveAt).getTime() < ACTIVE_WINDOW_MS : false

  const total = sessions?.length || 0
  const revocableTotal = (sessions || []).filter(s => !s.isCurrent).length
  const activeUsers = grouped.filter(g => g.items.some(isActive)).length

  const confirm = () => {
    const p = pending
    if (!p) return
    startWork(async () => {
      const res =
        p.kind === 'session'
          ? await revokeSession(p.session.sessionId)
          : p.kind === 'user'
            ? await revokeUserSessions(p.userId)
            : await revokeAllSessions()
      setPending(null)
      if (res.error) {
        onToast(`Could not close sessions: ${res.error}`, 'error')
      } else {
        onToast(res.revoked === 1 ? '1 session closed' : `${res.revoked} sessions closed`, 'success')
      }
      await load()
    })
  }

  const btn =
    'px-3 py-1.5 text-xs font-bold rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[var(--text-primary)]">Open Sessions</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Every signed-in device right now. Users are signed out automatically after 5 minutes of inactivity; sessions left
            open in a closed browser stay here until you close them. Closing a session takes effect within the token lifetime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => load()} className={btn}>
            Refresh
          </button>
          <button
            type="button"
            disabled={revocableTotal === 0 || isWorking}
            onClick={() => setPending({ kind: 'all', count: revocableTotal })}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--danger)] text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close all sessions ({revocableTotal})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open sessions', value: total },
          { label: 'Users with sessions', value: grouped.length },
          { label: 'Active last 15 min', value: activeUsers },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-tertiary)]">{k.label}</div>
            <div className="font-mono text-xl font-bold tabular-nums text-[var(--text-primary)]">{sessions ? k.value : '—'}</div>
          </div>
        ))}
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-[var(--danger)] text-xs font-semibold p-3 rounded-lg">
          Could not load sessions: {loadError}
        </div>
      )}

      <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-[var(--text-secondary)]">
            <thead className="bg-[var(--surface-2)] text-[var(--text-tertiary)] uppercase text-[10px] tracking-wider border-b border-[var(--border)] font-bold">
              <tr>
                <th className="text-left px-5 py-3.5">User</th>
                <th className="text-left px-4 py-3.5">Device</th>
                <th className="text-left px-4 py-3.5">Signed in</th>
                <th className="text-left px-4 py-3.5">Last activity</th>
                <th className="text-left px-4 py-3.5">Status</th>
                <th className="text-right px-5 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-medium">
              {sessions === null && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-[var(--text-tertiary)]">Loading…</td>
                </tr>
              )}
              {sessions !== null && grouped.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-[var(--text-tertiary)]">No open sessions.</td>
                </tr>
              )}
              {grouped.map(g => {
                const revocable = g.items.filter(s => !s.isCurrent).length
                return (
                  <React.Fragment key={g.userId}>
                    {g.items.map((s, i) => (
                      <tr key={s.sessionId} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="px-5 py-3 align-top">
                          {i === 0 && (
                            <>
                              <div className="font-bold text-sm text-[var(--text-primary)]">{g.fullName}</div>
                              <div className="font-mono text-[11px] text-[var(--text-tertiary)]">{g.email}</div>
                              {g.items.length > 1 && revocable > 0 && (
                                <button
                                  type="button"
                                  disabled={isWorking}
                                  onClick={() => setPending({ kind: 'user', userId: g.userId, email: g.email, count: revocable })}
                                  className="mt-2 text-[11px] font-bold text-[var(--danger)] hover:underline cursor-pointer disabled:opacity-40"
                                >
                                  Close all {revocable} for this user
                                </button>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[var(--text-primary)] font-bold">{describeDevice(s.userAgent)}</div>
                          {s.ip && <div className="font-mono text-[11px] text-[var(--text-tertiary)]">{s.ip}</div>}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">
                          {new Date(s.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-[var(--text-primary)]">
                          {timeAgo(s.lastActiveAt, now)}
                        </td>
                        <td className="px-4 py-3">
                          {s.isCurrent ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FF6600]/15 text-[#FF6600] border border-[#FF6600]/30">
                              This device
                            </span>
                          ) : isActive(s) ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[var(--surface-2)] text-[var(--text-tertiary)] border border-[var(--border)]">
                              Idle
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            disabled={s.isCurrent || isWorking}
                            title={s.isCurrent ? 'Use Sign Out to end your own session' : undefined}
                            onClick={() => setPending({ kind: 'session', session: s })}
                            className={btn}
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(pending)}
        title={
          pending?.kind === 'all'
            ? `Close ${pending.count} open sessions?`
            : pending?.kind === 'user'
              ? `Close all sessions for ${pending.email}?`
              : `Close this session for ${pending?.kind === 'session' ? pending.session.email : ''}?`
        }
        message={
          pending?.kind === 'all'
            ? 'Everyone, including you on your other devices, will be signed out and must sign in again. This device stays signed in. This also applies to NextQ Fleet, which shares the same accounts.'
            : 'The user will be signed out on that device and must sign in again. This also applies to NextQ Fleet, which shares the same accounts.'
        }
        confirmText="Close sessions"
        cancelText="Cancel"
        variant="danger"
        isLoading={isWorking}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
