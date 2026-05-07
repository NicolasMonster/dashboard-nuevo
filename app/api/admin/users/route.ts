import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, getAllAccounts } from '@/lib/accounts'

export const dynamic = 'force-dynamic'

function isAdmin(request: NextRequest) {
  return request.cookies.get('elevate_role')?.value === 'admin'
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  const users = getAllUsers().map(({ password: _p, ...rest }) => rest) // no exponer passwords
  const accounts = getAllAccounts().map(({ token: _t, ...rest }) => rest) // no exponer tokens
  return NextResponse.json({ users, accounts })
}
