'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Upload, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    password: '',
    confirmPassword: '',
  })
  const [certFileName, setCertFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await registerCompany({
        name: form.name,
        industry: form.industry,
        website: form.website,
        hrName: form.hrName,
        hrEmail: form.hrEmail,
        location: form.location,
        about: form.about,
        password: form.password,
        certificateUploaded: Boolean(certFileName),
      })
      router.push('/pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit company registration. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-4 py-12">
      <div className="flex flex-col gap-1">
        <Link href="/" className="mb-2 text-sm text-muted-foreground underline underline-offset-4">
          ← Back to home
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Company registration</h1>
        <p className="text-sm text-muted-foreground">
          Register your organization for campus recruitment. The T&amp;P admin verifies your registration certificate before you can publish drives.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          <ShieldAlert className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form className="rounded-lg border bg-card p-6" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="cname">Company name</FieldLabel>
            <Input id="cname" required value={form.name} onChange={set('name')} placeholder="e.g. TechNova Solutions" />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="industry">Industry / Sector</FieldLabel>
              <Input id="industry" required value={form.industry} onChange={set('industry')} placeholder="Software, FinTech, Robotics" />
            </Field>
            <Field>
              <FieldLabel htmlFor="website">Official website</FieldLabel>
              <Input id="website" type="url" required value={form.website} onChange={set('website')} placeholder="https://technova.example.com" />
            </Field>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="hrname">Recruiter / HR contact name</FieldLabel>
              <Input id="hrname" required value={form.hrName} onChange={set('hrName')} placeholder="Meera Joshi" />
            </Field>
            <Field>
              <FieldLabel htmlFor="hremail">Corporate HR email</FieldLabel>
              <Input id="hremail" type="email" required value={form.hrEmail} onChange={set('hrEmail')} placeholder="hr@technova.example.com" />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pass">Account password</FieldLabel>
              <Input id="pass" type="password" required value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
            </Field>
            <Field>
              <FieldLabel htmlFor="confpass">Confirm password</FieldLabel>
              <Input id="confpass" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="location">Headquarters / Office location</FieldLabel>
            <Input id="location" required value={form.location} onChange={set('location')} placeholder="Pune / Bengaluru / Remote" />
          </Field>
          <Field>
            <FieldLabel htmlFor="about">About the organization</FieldLabel>
            <Textarea id="about" rows={3} value={form.about} onChange={set('about')} placeholder="Brief overview of the company, core products, and internship programs." />
          </Field>

          {/* Certificate Uploader */}
          <div className="rounded-lg border p-4">
            <span className="text-xs font-semibold">Certificate of Incorporation / GST Document (PDF)</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Required by college placement cell for company authentication</p>
            <div className="mt-3 flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                <Upload className="mr-1.5 size-3.5" /> Choose Certificate PDF
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setCertFileName(f.name)
                  }}
                />
              </label>
              {certFileName ? (
                <span className="flex items-center gap-1 text-xs text-foreground font-medium truncate">
                  <CheckCircle2 className="size-3.5 text-foreground shrink-0" /> {certFileName}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No document selected</span>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full mt-2">
            Submit Company Registration for Verification
          </Button>
        </FieldGroup>
      </form>
    </main>
  )
}
