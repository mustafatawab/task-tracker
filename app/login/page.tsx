'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    if (response.status === 429) { setError('Too many attempts right now. Try again in a few minutes.'); setLoading(false); return }
    if (response.status >= 500) { setError('The sign-in service is out of reach. Try again shortly.'); setLoading(false); return }
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.error ?? 'Those credentials did not match our records.')
      setLoading(false)
      return
    }
    const next = new URLSearchParams(window.location.search).get('next')
    window.location.href = next && next.startsWith('/') ? next : '/'
  }

  return <main className="relative grid min-h-screen place-items-center bg-background px-4 text-foreground">
    <div className="absolute right-6 top-6"><ThemeToggle className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:bg-hover hover:text-foreground" /></div>
    <div className="w-full max-w-[420px]">
      <div className="mb-8 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-violet-500 shadow-xl shadow-violet-500/25"><Sparkles className="size-5" /></div><div><p className="font-semibold tracking-tight">Farsight Systems</p><p className="text-xs text-muted-foreground">Founder workspace</p></div></div>
      <div className="rounded-3xl border border-border bg-surface p-8 shadow-2xl shadow-black/20"><div className="mb-8"><div className="mb-4 grid size-11 place-items-center rounded-2xl bg-hover"><LockKeyhole className="size-5 text-violet-600 dark:text-violet-300" /></div><h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to keep your team moving with clarity.</p></div><form onSubmit={submit} className="flex flex-col gap-5"><label className="text-xs font-medium text-muted-foreground">Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-base text-foreground outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20" required /></label><label className="text-xs font-medium text-muted-foreground">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-2 w-full rounded-xl border border-border bg-field px-3 py-3 text-base text-foreground outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20" required /></label>{error && <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p>}<button disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 disabled:opacity-60">{loading ? 'Signing in…' : 'Sign in'}<ArrowRight className="size-4" /></button></form><p className="mt-6 text-center text-xs text-faint">Accounts are provisioned by your Founder.</p></div>
    </div>
  </main>
}
