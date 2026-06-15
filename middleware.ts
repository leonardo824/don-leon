// middleware.ts
// Protege las rutas del capitán — redirige a login si no hay sesión

import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'don-leon-captain'
const PROTECTED_PATHS = ['/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  if (!isProtected) return NextResponse.next()

  const session = request.cookies.get(SESSION_COOKIE)
  if (session?.value !== 'authenticated') {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
