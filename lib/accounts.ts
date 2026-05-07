export interface AccountConfig {
  id: string
  name: string
  token: string
}

export interface UserConfig {
  username: string
  password: string
  name: string
  role: 'admin' | 'viewer'
  accounts: string[] // empty = acceso a todas las cuentas
}

export function getAllAccounts(): AccountConfig[] {
  try {
    const config = process.env.ACCOUNTS_CONFIG
    if (config) return JSON.parse(config)
  } catch {}
  // Fallback legacy: una sola cuenta desde env vars
  const id = process.env.META_AD_ACCOUNT_ID ?? ''
  const token = process.env.META_ACCESS_TOKEN ?? ''
  if (!id || !token) return []
  return [{ id, name: 'Cuenta Principal', token }]
}

export function getAllUsers(): UserConfig[] {
  try {
    const config = process.env.USERS_CONFIG
    if (config) return JSON.parse(config)
  } catch {}
  // Fallback legacy
  return [{
    username: 'ELEVATE369',
    password: 'fullabundanciabro',
    name: 'Admin',
    role: 'admin',
    accounts: [],
  }]
}

/** Devuelve token y accountId para un accountId dado (o el primero disponible). */
export function resolveAccountConfig(accountId?: string | null): { token: string; accountId: string } {
  const accounts = getAllAccounts()
  if (accountId) {
    const match = accounts.find(
      (a) => a.id === accountId || a.id === `act_${accountId}` || a.id.replace('act_', '') === accountId.replace('act_', '')
    )
    if (match) return { token: match.token, accountId: match.id.replace('act_', '') }
  }
  if (accounts.length > 0) {
    return { token: accounts[0].token, accountId: accounts[0].id.replace('act_', '') }
  }
  return { token: process.env.META_ACCESS_TOKEN ?? '', accountId: (process.env.META_AD_ACCOUNT_ID ?? '').replace('act_', '') }
}

/** Cuentas a las que tiene acceso un usuario específico (sin exponer tokens). */
export function getAccountsForUser(username: string, role: string): { id: string; name: string }[] {
  const all = getAllAccounts().map(({ id, name }) => ({ id, name }))
  if (role === 'admin') return all
  const users = getAllUsers()
  const user = users.find((u) => u.username === username)
  if (!user || user.accounts.length === 0) return all
  return all.filter((a) => user.accounts.includes(a.id) || user.accounts.includes(a.id.replace('act_', '')))
}
