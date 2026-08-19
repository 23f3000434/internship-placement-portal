'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { usePortal } from '@/lib/store'

export default function CompanyRegisterPage() {
  const { registerCompany } = usePortal()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    industry: '',
    website: '',
    hrName: '',
    hrEmail: '',
    location: '',
    about: '',
  })
  const [cert, setCert] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-4 py-12">
      <div className="flex flex-col gap-1">
        <Link href="/" className="mb-2 text-sm text-muted-foreground underline underline-offset-4">
          ← Back to home
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Company registration</h1>
        <p className="text-sm text-muted-foreground">
          The admin verifies your registration certificate before you can publish drives.
        </p>
      </div>
      <form
        className="rounded-lg border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault()
          registerCompany({ ...form, certificateUploaded: cert })
          router.push('/pending')
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="cname">Company name</FieldLabel>
            <Input id="cname" required value={form.name} onChange={set('name')} />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="industry">Industry</FieldLabel>
              <Input id="industry" required value={form.industry} onChange={set('industry')} placeholder="Software" />
            </Field>
            <Field>
              <FieldLabel htmlFor="website">Website</FieldLabel>
              <Input id="website" type="url" required value={form.website} onChange={set('website')} placeholder="https://" />
            </Field>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="hrname">HR contact name</FieldLabel>
              <Input id="hrname" required value={form.hrName} onChange={set('hrName')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="hremail">HR contact email</FieldLabel>
              <Input id="hremail" type="email" required value={form.hrEmail} onChange={set('hrEmail')} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input id="location" required value={form.location} onChange={set('location')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="about">About the company</FieldLabel>
            <Textarea id="about" rows={3} value={form.about} onChange={set('about')} />
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="cert" checked={cert} onCheckedChange={(c) => setCert(c === true)} />
            <FieldLabel htmlFor="cert">Registration certificate uploaded (simulated upload)</FieldLabel>
          </Field>
          <Button type="submit">Submit for verification</Button>
        </FieldGroup>
      </form>
    </main>
  )
}
