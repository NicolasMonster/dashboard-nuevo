import { NextRequest, NextResponse } from 'next/server'
import { getAccountsForUser } from '@/lib/accounts'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const username = request.cookies.get('elevate_user')?.value ?? ''
  const role = request.cookies.get('elevate_role')?.value ?? 'viewer'
  const accounts = getAccountsForUser(username, role)
  return NextResponse.json({ accounts, role })
}
