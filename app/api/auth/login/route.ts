import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/accounts'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    const users = getAllUsers()
    const user = users.find((u) => u.username === username && u.password === password)

    if (!user) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }

    const cookieOpts = {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    }

    const res = NextResponse.json({ ok: true, name: user.name, role: user.role })
    res.cookies.set('elevate_auth', 'authenticated', cookieOpts)
    res.cookies.set('elevate_user', user.username, cookieOpts)
    res.cookies.set('elevate_role', user.role, cookieOpts)
    return res
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
