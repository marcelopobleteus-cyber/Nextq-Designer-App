import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/supabase'
import { BYPASS_AUTH } from '@/config/auth'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not remove or alter this getUser call.
  // It is required for verifying user session integrity.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (BYPASS_AUTH) {
    if (path === '/' || path === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/projects'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // The employee mobile app has its own entry point (/mobile, which decides
  // where to send the visitor) and its own login page (/mobile/login) — both
  // must stay reachable while signed out. Every OTHER /mobile/* route (the
  // actual app: dashboard, projects, time, etc.) is still gated, but bounces
  // to /mobile/login instead of the desktop/admin /login.
  const isMobilePublicRoute =
    path === '/mobile' || path === '/mobile/login' || path.startsWith('/mobile/login/')
  const isMobileRoute = path === '/mobile' || path.startsWith('/mobile/')
  const isProtectedMobileRoute = isMobileRoute && !isMobilePublicRoute

  const desktopTenantPrefixes = ['/projects', '/settings', '/dashboard', '/equipment-catalog', '/reports']
  const isDesktopTenantRoute = desktopTenantPrefixes.some((prefix) => path.startsWith(prefix))
  // Used further below for the admin/tenant separation and suspension checks,
  // which should apply across the whole mobile app too (not just its gated part).
  const isTenantAppRoute = isDesktopTenantRoute || isMobileRoute
  const isAdminRoute = path.startsWith('/admin')

  // This runs on EVERY request, so it pays for itself to ask only when an
  // answer is actually used. Previously the middleware always read `profiles`
  // and then, separately, `organization_members` joined to `organizations` —
  // two sequential round-trips on top of getUser(). Both answers depend only on
  // auth.uid(), so they now come back from one `auth_route_context()` call, and
  // only on the paths whose decisions need them: a request that is neither the
  // tenant app, nor /admin, nor the two landing paths that redirect by role,
  // makes no database call at all.
  const needsRouteContext =
    Boolean(user) && (isTenantAppRoute || isAdminRoute || path === '/' || path === '/login')

  let isPlatformAdmin = false
  let workspaceBlocked = false
  if (needsRouteContext) {
    const { data: ctx } = await supabase.rpc('auth_route_context').single()
    isPlatformAdmin = Boolean(ctx?.is_platform_admin)
    workspaceBlocked = Boolean(ctx?.workspace_blocked)
  }

  if (isProtectedMobileRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/mobile/login'
    return NextResponse.redirect(url)
  }

  if ((isDesktopTenantRoute || isAdminRoute) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Signed-out visitors at the root see the public cover page (/welcome);
  // the URL stays "/" so bookmarks and links keep working.
  if (path === '/' && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/welcome'
    return NextResponse.rewrite(url, { request })
  }

  if ((path === '/login' || path === '/') && user) {
    const url = request.nextUrl.clone()
    url.pathname = isPlatformAdmin ? '/admin' : '/projects'
    return NextResponse.redirect(url)
  }

  // Already signed in and landed on the employee login by mistake (e.g. a
  // bookmarked link) -> send them straight into the mobile app.
  if (isMobilePublicRoute && path !== '/mobile' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/mobile/dashboard'
    return NextResponse.redirect(url)
  }

  // Full separation: a platform admin never sees the tenant app; a regular user never sees /admin.
  if (user && isPlatformAdmin && isTenantAppRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }
  if (user && !isPlatformAdmin && isAdminRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/projects'
    return NextResponse.redirect(url)
  }

  // Workspace suspension / cancellation check — only for non-admins on tenant
  // app routes, exactly as before; the answer just arrived with the call above
  // instead of costing its own query.
  if (isTenantAppRoute && user && !isPlatformAdmin && workspaceBlocked && path !== '/inactive-workspace') {
    const url = request.nextUrl.clone()
    url.pathname = '/inactive-workspace'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
