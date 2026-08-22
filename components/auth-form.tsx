'use client'

import Image from 'next/image'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const data = new FormData(event.currentTarget)
    const result = mode === 'sign-in'
      ? await signIn.email({ email: String(data.get('email')), password: String(data.get('password')) })
      : await signUp.email({ email: String(data.get('email')), password: String(data.get('password')), name: String(data.get('name')) })
    setLoading(false)
    if (result.error) {
      setError('We could not sign you in with those details.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="w-full max-w-[430px] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_24px_70px_-28px_hsl(var(--primary)/0.45)] sm:rounded-3xl">
      <div className="border-b border-border/70 bg-primary/[0.06] px-4 pb-3 pt-3 sm:px-8 sm:pb-5 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background ring-1 ring-border/80 sm:h-14 sm:w-14 sm:rounded-2xl">
            <Image src="/brain-dump-logo.png" alt="Brain Dump logo" width={520} height={300} priority className="h-auto w-[4.5rem] max-w-none object-contain mix-blend-multiply sm:w-24" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">Brain Dump</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Private by design</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3.5 p-4 sm:gap-5 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{mode === 'sign-in' ? 'Welcome back' : 'Get started'}</p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{mode === 'sign-in' ? 'Your thoughts are waiting.' : 'A clearer mind starts here.'}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">A private space to capture what is on your mind and turn it into focused action.</p>
        </div>
        <div className="flex flex-col gap-3">
          {mode === 'sign-up' && <label className="text-sm font-medium">Name<input name="name" required autoComplete="name" placeholder="Your name" className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 font-normal outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>}
          <label className="text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 font-normal outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>
          <label className="text-sm font-medium">Password<input name="password" type="password" minLength={8} required autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 font-normal outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <button disabled={loading} className="rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-60">{loading ? 'Please wait…' : mode === 'sign-in' ? 'Continue to my space' : 'Create my private space'}</button>
        <p className="text-center text-sm text-muted-foreground">{mode === 'sign-in' ? 'New to Brain Dump?' : 'Already have an account?'} <a href={mode === 'sign-in' ? '/sign-up' : '/sign-in'} className="font-semibold text-primary hover:underline">{mode === 'sign-in' ? 'Create an account' : 'Sign in'}</a></p>
      </div>
    </form>
  )
}
