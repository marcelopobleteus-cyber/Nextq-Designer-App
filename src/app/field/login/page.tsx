'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { loginField } from '../../auth/actions'

// Standalone sign-in screen for field employees. Deliberately separate from
// the desktop/admin login page (/login) — different branding, different
// server action, different landing page (/field/dashboard) — so this can
// evolve independently as the employee-facing app.
export default function FieldLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [idleSignOut, setIdleSignOut] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setIdleSignOut(new URLSearchParams(window.location.search).get('reason') === 'idle')
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const res = await loginField(formData)
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 font-sans">
      <div className="w-full max-w-sm bg-[var(--surface-1)] border-2 border-blue-600 rounded-2xl p-7 shadow-sm">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white mb-4 font-black text-2xl tracking-wider shadow-xs">
            NQ
          </div>
          <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded mb-2">
            Employee Field App
          </span>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">Sign in to your shift</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
            Use the username and password from your invite
          </p>
        </div>

        {idleSignOut && !error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3 rounded-lg mb-5">
            Signed out after 5 minutes of inactivity. Sign in again to continue.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-[var(--danger)] text-xs font-semibold p-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="you@example.com"
              className="w-full px-3.5 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-blue-600 transition-all text-sm font-semibold"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full px-3.5 py-3 pr-10 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-blue-600 transition-all text-sm font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-xs text-sm cursor-pointer disabled:opacity-50"
          >
            {isPending ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[11px] text-[var(--text-tertiary)] font-medium mt-6">
          Trouble signing in? Ask your admin to resend your invite.
        </p>
      </div>
    </main>
  )
}
