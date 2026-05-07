import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.get('elevate_auth')?.value === 'authenticated'
  const isAdmin = request.cookies.get('elevate_role')?.value === 'admin'
  const { pathname } = request.nextUrl

  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin') && isAuth && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname === '/login' && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
}
