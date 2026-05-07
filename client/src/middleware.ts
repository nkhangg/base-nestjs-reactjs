import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/flashcards',
  '/grammar',
  '/mock-test',
  '/progress',
  '/profile',
  '/settings',
  '/billing',
  '/onboarding',
]

const AUTH_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const authCookie =
    request.cookies.get('session') ?? request.cookies.get('access_token')

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !authCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && authCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
