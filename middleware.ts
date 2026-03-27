import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const authRoutes = ['/auth', '/verify-email', '/forgot-password', '/reset-password']
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r))

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(c =>
      res.cookies.set(c.name, c.value)
    )
    return res
  }

  if (!isAuthRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(c =>
      res.cookies.set(c.name, c.value)
    )
    return res
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|api/|_not-found).*)'],
}
