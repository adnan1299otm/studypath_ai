import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth') || 
                      request.nextUrl.pathname.startsWith('/verify-email') || 
                      request.nextUrl.pathname.startsWith('/forgot-password') || 
                      request.nextUrl.pathname.startsWith('/reset-password');
                      
  const isProtected = request.nextUrl.pathname.startsWith('/upload') ||
                      request.nextUrl.pathname.startsWith('/process') ||
                      request.nextUrl.pathname.startsWith('/topics') ||
                      request.nextUrl.pathname.startsWith('/configure') ||
                      request.nextUrl.pathname.startsWith('/roadmap') ||
                      request.nextUrl.pathname.startsWith('/timer') ||
                      request.nextUrl.pathname.startsWith('/complete') ||
                      request.nextUrl.pathname.startsWith('/rank') ||
                      request.nextUrl.pathname.startsWith('/ai') ||
                      request.nextUrl.pathname.startsWith('/hadith') ||
                      request.nextUrl.pathname.startsWith('/profile') ||
                      request.nextUrl.pathname.startsWith('/pricing') ||
                      request.nextUrl.pathname.startsWith('/mcq') ||
                      request.nextUrl.pathname.startsWith('/settings');

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
