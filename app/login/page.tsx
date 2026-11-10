'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('mustafa.tawab.dev@gmail.com')
  const [password, setPassword] = useState('Admin@12')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    if (!response.ok) { setError('Those credentials did not match our records.'); setLoading(false); return }
    window.location.href = '/'
  }

  return <main className="grid min-h-screen place-items-center bg-[#0b0d12] px-4 text-slate-100">
    <div className="w-full max-w-[420px]">
      <div className="mb-8 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-violet-500 shadow-xl shadow-violet-500/25"><Sparkles className="size-5" /></div><div><p className="font-semibold tracking-tight">Farsight Systems</p><p className="text-xs text-slate-500">Founder workspace</p></div></div>
      <div className="rounded-3xl border border-white/[0.08] bg-[#101219] p-8 shadow-2xl shadow-black/20"><div className="mb-8"><div className="mb-4 grid size-11 place-items-center rounded-2xl bg-white/[0.05]"><LockKeyhole className="size-5 text-violet-300" /></div><h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm leading-6 text-slate-500">Sign in to keep your team moving with clarity.</p></div><form onSubmit={submit} className="flex flex-col gap-5"><label className="text-xs font-medium text-slate-400">Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20" required /></label><label className="text-xs font-medium text-slate-400">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20" required /></label>{error && <p className="text-xs text-rose-300">{error}</p>}<button disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 disabled:opacity-60">{loading ? 'Signing in…' : 'Sign in'}<ArrowRight className="size-4" /></button></form><p className="mt-6 text-center text-xs text-slate-600">Accounts are provisioned by your Founder.</p></div>
    </div>
  </main>
}
