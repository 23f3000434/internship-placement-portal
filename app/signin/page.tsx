'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyRound, ShieldAlert, Sparkles, UserCheck, ArrowRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { usePortal } from '@/lib/store'
import type { Role } from '@/lib/types'

export default function SignInPage() {
  const { login, quickLogin } = usePortal()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError('Please enter your registered email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    setLoading(true)
    const res = login(email, password)
    setLoading(false)
    if (res.success) {
      router.push('/dashboard')
    } else {
      setError(res.error || 'Invalid credentials. Check your email or password.')
    }
  }

  const handleQuickAccess = (role: Role, personaId?: string) => {
    quickLogin(role, personaId)
    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 md:p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-1">
          <Link href="/" className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded bg-foreground text-background text-sm font-bold">
              IT
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">InternTrack</span>
              <span className="text-[10px] text-muted-foreground">GHRCEM Central Portal</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to your account</h1>
          <p className="text-xs text-muted-foreground">
            Enter your college email and password to access the placement portal.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleCredentialLogin} className="space-y-4">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="email">Registered Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="e.g. priya.patel@college.edu or admin@college.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                autoComplete="email"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                autoComplete="current-password"
                required
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? 'Authenticating...' : 'Sign in with credentials'}
            </Button>
          </FieldGroup>
        </form>

        {/* Quick Access — Pre-registered Institutional Accounts */}
        <div className="mt-6 border-t pt-5">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="size-3.5 text-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Access — Pre-registered Accounts
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickAccess('student', 's2')}
              className="flex flex-col items-start rounded-lg border p-2.5 text-left transition hover:bg-muted"
            >
              <span className="font-semibold text-foreground">🎓 Priya Patel</span>
              <span className="text-[11px] text-muted-foreground">Student (ML / Python)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAccess('student', 's1')}
              className="flex flex-col items-start rounded-lg border p-2.5 text-left transition hover:bg-muted"
            >
              <span className="font-semibold text-foreground">🎓 Aarav Sharma</span>
              <span className="text-[11px] text-muted-foreground">Student (Selected)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAccess('company', 'c1')}
              className="flex flex-col items-start rounded-lg border p-2.5 text-left transition hover:bg-muted"
            >
              <span className="font-semibold text-foreground">🏢 TechNova</span>
              <span className="text-[11px] text-muted-foreground">Recruiter / HR</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAccess('faculty')}
              className="flex flex-col items-start rounded-lg border p-2.5 text-left transition hover:bg-muted"
            >
              <span className="font-semibold text-foreground">👨‍🏫 Prof. Kulkarni</span>
              <span className="text-[11px] text-muted-foreground">Faculty Mentor</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleQuickAccess('admin')}
            className="mt-2 w-full flex items-center justify-between rounded-lg border border-foreground/20 bg-muted/60 p-2.5 text-xs text-left font-medium hover:bg-muted transition"
          >
            <span>🏛️ Sign in as <strong>T&amp;P Cell Admin (Full Access)</strong></span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        {/* Links */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          New user?{' '}
          <Link href="/register/student" className="font-semibold text-foreground underline underline-offset-4">
            Register Student
          </Link>{' '}
          or{' '}
          <Link href="/register/company" className="font-semibold text-foreground underline underline-offset-4">
            Register Company
          </Link>
        </p>
      </div>
    </main>
  )
}
