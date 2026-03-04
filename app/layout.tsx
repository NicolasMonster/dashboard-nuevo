import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meta Ads Dashboard',
  description: 'Dashboard profesional para Meta Ads con análisis IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-surface-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
