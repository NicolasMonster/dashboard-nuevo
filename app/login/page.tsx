'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import GoldenText from '@/components/GoldenText'
import { subDays, format } from 'date-fns'

const DASHBOARD_CACHE_KEY = 'ecomboost_dashboard_v1'
const FILTER_CACHE_KEY = 'ecomboost_filter_v1'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [prefetching, setPrefetching] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al iniciar sesión')
        setLoading(false)
        return
      }

      // Login OK → pre-cargar datos mientras mostramos pantalla de carga
      setLoading(false)
      setPrefetching(true)

      try {
        // Determinar rango por defecto (últimos 30 días)
        const savedFilter = localStorage.getItem(FILTER_CACHE_KEY)
        let startDate: string
        let endDate: string
        let accountId: string | undefined

        if (savedFilter) {
          const f = JSON.parse(savedFilter)
          startDate = f.startDate
          endDate = f.endDate
          accountId = f.accountId
        } else {
          const today = new Date()
          startDate = format(subDays(today, 29), 'yyyy-MM-dd')
          endDate = format(today, 'yyyy-MM-dd')
        }

        // Obtener cuentas del usuario
        const accountsRes = await fetch('/api/accounts')
        let firstAccountId = accountId
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json()
          if (!firstAccountId && accountsData.accounts?.length > 0) {
            firstAccountId = accountsData.accounts[0].id
          }
        }

        // Pre-cargar datos de campaña
        const params = new URLSearchParams({ startDate, endDate })
        if (firstAccountId) params.set('accountId', firstAccountId)
        const dataRes = await fetch(`/api/campaigns?${params}`)

        if (dataRes.ok) {
          const data = await dataRes.json()
          localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
            data,
            startDate,
            endDate,
            accountId: firstAccountId ?? '',
            ts: Date.now(),
          }))
        }
      } catch {
        // Si falla la pre-carga, igual redirigimos
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
      setLoading(false)
    }
  }

  // Pantalla de pre-carga
  if (prefetching) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-6">
        <GoldenText text="ELEVATE GROUP" className="text-2xl font-black tracking-[0.2em]" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-slate-200 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Preparando tu dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <GoldenText
            text="ELEVATE GROUP"
            className="text-3xl font-black tracking-[0.2em] uppercase"
          />
          <p className="text-xs text-slate-600 mt-3 uppercase tracking-widest">
            Meta Ads Dashboard
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#0f172a] border border-slate-800 rounded-2xl p-7 space-y-5 shadow-2xl"
        >
          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-widest mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
              placeholder="Ingresá tu usuario"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 uppercase tracking-widest mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pr-11 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />
                }
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-900 text-sm font-bold rounded-xl transition-colors disabled:opacity-40 tracking-wide"
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
