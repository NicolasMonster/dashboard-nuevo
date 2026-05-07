'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Building2, Copy, Check, Plus, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import GoldenText from '@/components/GoldenText'

interface UserRow { username: string; name: string; role: string; accounts: string[] }
interface AccountRow { id: string; name: string }

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Nuevo usuario
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'viewer'>('viewer')
  const [newAccounts, setNewAccounts] = useState<string[]>([])
  const [showPass, setShowPass] = useState(false)
  const [generatedJson, setGeneratedJson] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(async (res) => {
        if (res.status === 403) { router.push('/dashboard'); return }
        const data = await res.json()
        setUsers(data.users ?? [])
        setAccounts(data.accounts ?? [])
      })
      .catch(() => setError('No se pudo cargar la información'))
      .finally(() => setLoading(false))
  }, [router])

  function generateConfig() {
    if (!newUsername || !newPassword || !newName) return
    const newUser = {
      username: newUsername,
      password: newPassword,
      name: newName,
      role: newRole,
      accounts: newRole === 'admin' ? [] : newAccounts,
    }
    const allUsers = [...users.map(u => ({ ...u, password: '••••••' })), newUser]
    setGeneratedJson(JSON.stringify(allUsers, null, 2))
  }

  function copyJson() {
    navigator.clipboard.writeText(generatedJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleAccount(id: string) {
    setNewAccounts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  if (loading) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 rounded-lg bg-surface-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <GoldenText text="ELEVATE GROUP" className="text-sm font-bold tracking-widest" />
            <p className="text-xs text-slate-500 mt-0.5">Panel de Administración</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-xl p-4">{error}</p>}

        {/* Cuentas configuradas */}
        <section className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Building2 className="w-4 h-4 text-brand-400" />
            Cuentas Meta configuradas
          </h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay cuentas configuradas en <code className="text-brand-400">ACCOUNTS_CONFIG</code>.
            </p>
          ) : (
            <div className="space-y-2">
              {accounts.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{a.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{a.id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 border-t border-slate-800 pt-3">
            Para agregar cuentas, actualizá la variable de entorno <code className="text-brand-400">ACCOUNTS_CONFIG</code> en Vercel con el formato:<br />
            <code className="text-xs text-slate-400 block mt-1">{'[{"id":"act_xxx","name":"Nombre","token":"TOKEN"}]'}</code>
          </p>
        </section>

        {/* Usuarios actuales */}
        <section className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Users className="w-4 h-4 text-brand-400" />
            Usuarios actuales
          </h2>
          {users.length === 0 ? (
            <p className="text-sm text-slate-500">No hay usuarios configurados.</p>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.username} className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{u.name} <span className="text-xs text-slate-500">@{u.username}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {u.role === 'admin' ? 'Admin — todas las cuentas' : `Viewer — ${u.accounts.length === 0 ? 'todas las cuentas' : u.accounts.join(', ')}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-brand-600/20 text-brand-400' : 'bg-slate-700 text-slate-400'}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Crear nuevo usuario */}
        <section className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Plus className="w-4 h-4 text-brand-400" />
            Crear nuevo usuario
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-slate-500 uppercase tracking-widest mb-1.5">Nombre completo</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Juan Pérez"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 uppercase tracking-widest mb-1.5">Usuario</label>
              <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Ej: juanperez"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 uppercase tracking-widest mb-1.5">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Contraseña segura"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500" />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 uppercase tracking-widest mb-1.5">Rol</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as 'admin' | 'viewer')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-500">
                <option value="viewer">Viewer (solo ver)</option>
                <option value="admin">Admin (acceso total)</option>
              </select>
            </div>
          </div>

          {newRole === 'viewer' && accounts.length > 0 && (
            <div>
              <label className="block text-[11px] text-slate-500 uppercase tracking-widest mb-2">Cuentas con acceso</label>
              <div className="space-y-2">
                {accounts.map(a => (
                  <label key={a.id} className="flex items-center gap-3 bg-slate-900 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-slate-800 transition-colors">
                    <input type="checkbox" checked={newAccounts.includes(a.id)} onChange={() => toggleAccount(a.id)}
                      className="rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500" />
                    <span className="text-sm text-slate-200">{a.name}</span>
                    <span className="text-xs text-slate-500 font-mono ml-auto">{a.id}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button onClick={generateConfig} disabled={!newUsername || !newPassword || !newName}
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 text-sm font-bold rounded-xl transition-colors disabled:opacity-30">
            Generar configuración
          </button>
        </section>

        {/* JSON generado */}
        {generatedJson && (
          <section className="bg-[#0f172a] border border-brand-600/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-400">JSON para USERS_CONFIG</h2>
              <button onClick={copyJson} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="text-xs text-slate-300 bg-slate-900 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all">
              {generatedJson}
            </pre>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-1">
              <p className="text-xs text-amber-400 font-semibold">Cómo aplicar:</p>
              <ol className="text-xs text-amber-400/80 space-y-1 list-decimal list-inside">
                <li>Copiá el JSON de arriba</li>
                <li>Andá a Vercel → Settings → Environment Variables</li>
                <li>Actualizá (o creá) la variable <code className="text-amber-300">USERS_CONFIG</code> con el valor copiado</li>
                <li>Redesplegá el proyecto</li>
              </ol>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
