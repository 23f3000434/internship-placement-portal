'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePortal } from '@/lib/store'
import type { Role } from '@/lib/types'

export default function SignInPage() {
  const { setRole } = usePortal()
  const router = useRouter()
  const [selected, setSelected] = useState<Role>('student')

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8">
        <div className="mb-6 flex flex-col gap-1">
          <Link href="/" className="mb-4 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded bg-foreground text-background text-sm font-bold">
              IT
            </span>
            <span className="text-sm font-semibold">InternTrack</span>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Demo mode — pick a role, credentials are not checked.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setRole(selected)
            router.push('/dashboard')
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" placeholder="you@college.edu" />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" placeholder="••••••••" />
            </Field>
            <Field>
              <FieldLabel>Sign in as</FieldLabel>
              <ToggleGroup
                className="w-full"
                value={[selected]}
                onValueChange={(v) => {
                  const next = (v as string[])[0]
                  if (next) setSelected(next as Role)
                }}
              >
                <ToggleGroupItem value="student" className="flex-1 text-xs">
                  Student
                </ToggleGroupItem>
                <ToggleGroupItem value="company" className="flex-1 text-xs">
                  Company
                </ToggleGroupItem>
                <ToggleGroupItem value="faculty" className="flex-1 text-xs">
                  Faculty
                </ToggleGroupItem>
                <ToggleGroupItem value="admin" className="flex-1 text-xs">
                  Admin
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </FieldGroup>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/register/student" className="font-medium text-foreground underline underline-offset-4">
            Student
          </Link>{' '}
          or{' '}
          <Link href="/register/company" className="font-medium text-foreground underline underline-offset-4">
            Company
          </Link>{' '}
          registration
        </p>
      </div>
    </main>
  )
}
