'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

/**
 * Cierre de sesion por inactividad.
 *
 * - A los 4 min sin actividad muestra un aviso con cuenta regresiva.
 * - A los 5 min cierra la sesion (scope 'local': solo este dispositivo; la
 *   sesion se borra tambien del servidor) y manda al login.
 * - La actividad se comparte entre pestanas via localStorage: trabajar en una
 *   pestana mantiene vivas las demas, y el cierre en una cierra todas.
 * - Si el navegador estuvo cerrado/dormido mas de 5 min, al volver se cierra
 *   la sesion de inmediato.
 *
 * La marca de actividad guarda el session_id del JWT. Si el session_id cambio
 * (nuevo login), la marca vieja se ignora, para no expulsar a alguien recien
 * entrado por una marca de una sesion anterior.
 */

const IDLE_LIMIT_MS = 5 * 60 * 1000
const WARNING_MS = 60 * 1000
const CHECK_EVERY_MS = 1000
const WRITE_THROTTLE_MS = 5000
const STORAGE_KEY = 'nextq-last-activity'
const LOGOUT_KEY = 'nextq-idle-logout'

const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/share',
  '/field/login',
  '/inactive-workspace',
]

function isPublicPath(path: string) {
  if (path === '/' || path === '/field') return true
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

function sessionIdFromToken(token: string | undefined): string | null {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return (JSON.parse(json).session_id as string) || null
  } catch {
    return null
  }
}

type Stamp = { t: number; sid: string | null }

function readStamp(): Stamp | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Stamp) : null
  } catch {
    return null
  }
}

function writeStamp(stamp: Stamp) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamp))
  } catch {}
}

export default function IdleLogout() {
  const pathname = usePathname() || '/'
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const lastActivity = useRef<number>(0)
  const lastWrite = useRef<number>(0)
  const loggingOut = useRef(false)

  const active = hasSession && !isPublicPath(pathname)

  // Track the Supabase session in the browser.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session))
      setSessionId(sessionIdFromToken(data.session?.access_token))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session))
      setSessionId(sessionIdFromToken(session?.access_token))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const doLogout = useCallback(async () => {
    if (loggingOut.current) return
    loggingOut.current = true
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(LOGOUT_KEY, String(Date.now()))
    } catch {}
    try {
      await createClient().auth.signOut({ scope: 'local' })
    } catch {}
    const target = pathname.startsWith('/field') ? '/field/login' : '/login'
    window.location.replace(`${target}?reason=idle`)
  }, [pathname])

  const markActivity = useCallback(
    (force = false) => {
      const now = Date.now()
      lastActivity.current = now
      if (secondsLeft !== null) setSecondsLeft(null)
      if (force || now - lastWrite.current > WRITE_THROTTLE_MS) {
        lastWrite.current = now
        writeStamp({ t: now, sid: sessionId })
      }
    },
    [secondsLeft, sessionId],
  )

  // On (re)activation: honour a stamp from this same session (another tab, or
  // before the computer slept); otherwise start fresh.
  useEffect(() => {
    if (!active) return
    const stamp = readStamp()
    if (stamp && stamp.sid && stamp.sid === sessionId) {
      lastActivity.current = stamp.t
      if (Date.now() - stamp.t >= IDLE_LIMIT_MS) {
        doLogout()
        return
      }
    } else {
      lastActivity.current = Date.now()
      writeStamp({ t: lastActivity.current, sid: sessionId })
    }
  }, [active, sessionId, doLogout])

  // Listen for user activity.
  useEffect(() => {
    if (!active) return
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'wheel', 'scroll', 'touchstart', 'pointerdown']
    const handler = () => {
      // While the warning is up, only the explicit button keeps the session.
      if (secondsLeft !== null) return
      markActivity()
    }
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, handler))
  }, [active, markActivity, secondsLeft])

  // Cross-tab sync.
  useEffect(() => {
    if (!active) return
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOGOUT_KEY && e.newValue) {
        doLogout()
      } else if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const stamp = JSON.parse(e.newValue) as Stamp
          if (stamp.t > lastActivity.current) {
            lastActivity.current = stamp.t
            setSecondsLeft(null)
          }
        } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [active, doLogout])

  // The clock.
  useEffect(() => {
    if (!active) return
    const tick = () => {
      const idle = Date.now() - lastActivity.current
      if (idle >= IDLE_LIMIT_MS) {
        doLogout()
      } else if (idle >= IDLE_LIMIT_MS - WARNING_MS) {
        setSecondsLeft(Math.ceil((IDLE_LIMIT_MS - idle) / 1000))
      } else {
        setSecondsLeft((prev) => (prev === null ? prev : null))
      }
    }
    tick()
    const id = window.setInterval(tick, CHECK_EVERY_MS)
    // Timers are throttled in background tabs; re-check as soon as it is visible again.
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active, doLogout])

  if (!active || secondsLeft === null) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-title"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-xl">
        <h2 id="idle-title" className="text-base font-black text-[var(--text-primary)]">
          Are you still there?
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          For security, you will be signed out after 5 minutes of inactivity.
        </p>
        <p className="mt-4 text-center font-mono text-3xl font-bold tabular-nums text-[var(--text-primary)]">
          0:{String(secondsLeft).padStart(2, '0')}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={doLogout}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-bold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            Sign out now
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => markActivity(true)}
            className="flex-1 rounded-xl bg-[#FF6600] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  )
}
