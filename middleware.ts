import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-user-with-client-side-components
  const { data: { session }, error } = await supabase.auth.getSession()

  // If there's an error with the session (like invalid refresh token), clear it
  if (error) {
    console.log('Session error in middleware:', error.message)
    
    // Clear the session cookies
    supabaseResponse.cookies.set('sb-access-token', '', { maxAge: 0 })
    supabaseResponse.cookies.set('sb-refresh-token', '', { maxAge: 0 })
    
    // If user is trying to access protected routes, redirect to login
    const protectedRoutes = ['/dashboard', '/posts', '/media', '/settings', '/strategy', '/calendar']
    const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
    
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If session exists and is valid, continue
  if (session) {
    // Optional: Add user info to headers for API routes
    supabaseResponse.headers.set('x-user-id', session.user.id)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
