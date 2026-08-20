'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Upload, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/portal/page-header'
import { usePortal } from '@/lib/store'
import type { Student } from '@/lib/types'

export default function RegisterStudentPage() {
  const { registerStudent, students } = usePortal()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [enrollment, setEnrollment] = useState('')
  const [branch, setBranch] = useState('Computer Science')
  const [cgpa, setCgpa] = useState('8.0')
  const [backlogs, setBacklogs] = useState('0')
  const [passingYear, setPassingYear] = useState('2026')
  const [skills, setSkills] = useState('')
  const [certifications, setCertifications] = useState('')
  const [phone, setPhone] = useState('')
  const [locationPref, setLocationPref] = useState<Student['locationPreference']>('any')

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [idDocsFile, setIdDocsFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const defaultBranches = [
    'Computer Science',
    'Information Technology',
    'Artificial Intelligence & Data Science',
    'Electronics & Telecommunication',
    'Mechanical Engineering',
    'Civil Engineering',
  ]
  const branches = Array.from(new Set([...defaultBranches, ...students.map((s) => s.branch)]))

  const [submitting, setSubmitting] = useState(false)
  const maxFileSize = 2 * 1024 * 1024

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
      reader.readAsDataURL(file)
    })

  const validateFile = (file: File, kind: 'resume' | 'identity') => {
    const allowed =
      kind === 'resume'
        ? ['application/pdf']
        : ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowed.includes(file.type)) {
      return kind === 'resume'
        ? 'Resume must be a PDF file.'
        : 'Identity document must be a PDF, JPG, or PNG file.'
    }
    if (file.size > maxFileSize) return `${file.name} must be smaller than 2 MB.`
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !enrollment.trim() || !branch.trim() || !phone.trim()) {
      setError('Please complete every required field.')
      return
    }
    if (!/^\+?[0-9][0-9\s-]{7,14}$/.test(phone.trim())) {
      setError('Enter a valid phone number with 8 to 15 digits.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!resumeFile || !idDocsFile) {
      setError('Resume and identity document are required.')
      return
    }
    const fileError = validateFile(resumeFile, 'resume') || validateFile(idDocsFile, 'identity')
    if (fileError) {
      setError(fileError)
      return
    }

    setSubmitting(true)
    try {
      const [resumeData, idDocsData] = await Promise.all([
        readAsDataUrl(resumeFile),
        readAsDataUrl(idDocsFile),
      ])
      await registerStudent({
        name: name.trim(),
        email: email.trim(),
        password,
        enrollment: enrollment.trim(),
        branch,
        cgpa: Number.parseFloat(cgpa),
        backlogs: Number.parseInt(backlogs, 10),
        passingYear: Number.parseInt(passingYear, 10),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        certifications: certifications.split(',').map((s) => s.trim()).filter(Boolean),
        phone: phone.trim(),
        locationPreference: locationPref,
        resumeUploaded: true,
        resumeName: resumeFile.name,
        resumeData,
        idDocsUploaded: true,
        idDocsName: idDocsFile.name,
        idDocsData,
      })
      router.push('/pending')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit registration. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-4 md:p-8">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded bg-foreground text-background text-sm font-bold">
          IT
        </span>
        <span className="text-sm font-semibold">InternTrack</span>
      </Link>
      <PageHeader
        title="Student registration"
        description="Register for the campus internship pool. Your credentials and documents will be verified by the T&P cell."
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          <ShieldAlert className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form className="rounded-lg border bg-card p-6" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="email">College email</FieldLabel>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
            </Field>
            <Field>
              <FieldLabel htmlFor="enrollment">Enrollment number</FieldLabel>
              <Input id="enrollment" required value={enrollment} onChange={(e) => setEnrollment(e.target.value)} placeholder="EN22CS000" />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pass">Account Password</FieldLabel>
              <Input id="pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </Field>
            <Field>
              <FieldLabel htmlFor="confpass">Confirm Password</FieldLabel>
              <Input id="confpass" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="branch">Branch</FieldLabel>
              <Select value={branch} onValueChange={(v) => v && setBranch(v)}>
                <SelectTrigger id="branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {branches.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="cgpa">CGPA (out of 10)</FieldLabel>
              <Input id="cgpa" type="number" step="0.01" min="0" max="10" required value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="backlogs">Active backlogs</FieldLabel>
              <Input
                id="backlogs"
                type="number"
                min="0"
                required
                value={backlogs}
                onChange={(e) => setBacklogs(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="passingYear">Passing year</FieldLabel>
              <Input
                id="passingYear"
                type="number"
                min="2024"
                max="2035"
                required
                value={passingYear}
                onChange={(e) => setPassingYear(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Contact phone</FieldLabel>
              <Input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 90000 00000"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="skills">Technical Skills</FieldLabel>
            <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Python, SQL, Node.js" />
            <FieldDescription>Comma separated. Drives and eligibility checker evaluate these.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="certifications">Certifications</FieldLabel>
            <Input
              id="certifications"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              placeholder="AWS Cloud Practitioner, Google UX Design"
            />
            <FieldDescription>Comma separated. Leave blank if none.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="locpref">Location preference</FieldLabel>
            <Select value={locationPref} onValueChange={(v) => v && setLocationPref(v as typeof locationPref)}>
              <SelectTrigger id="locpref">
                <SelectValue>
                  {(v: string) => (v === 'any' ? 'Anywhere' : v === 'local' ? 'Local only' : 'Outstation')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="local">Local only</SelectItem>
                  <SelectItem value="outstation">Outstation</SelectItem>
                  <SelectItem value="any">Anywhere</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          {/* Document Upload Fields */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
            <div className="rounded-lg border p-4">
              <span className="text-xs font-semibold">Resume Document (PDF)</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Required for drive shortlisting</p>
              <div className="mt-3 flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  <Upload className="mr-1.5 size-3.5" /> Choose PDF
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    required
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      setResumeFile(file)
                      setError(file ? validateFile(file, 'resume') : null)
                    }}
                  />
                </label>
                {resumeFile ? (
                  <span className="flex items-center gap-1 text-xs text-foreground font-medium truncate">
                    <CheckCircle2 className="size-3.5 text-foreground shrink-0" /> {resumeFile.name}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No file selected</span>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <span className="text-xs font-semibold">College ID / Aadhaar Card</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Required for identity verification</p>
              <div className="mt-3 flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  <Upload className="mr-1.5 size-3.5" /> Choose Document
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                    required
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      setIdDocsFile(file)
                      setError(file ? validateFile(file, 'identity') : null)
                    }}
                  />
                </label>
                {idDocsFile ? (
                  <span className="flex items-center gap-1 text-xs text-foreground font-medium truncate">
                    <CheckCircle2 className="size-3.5 text-foreground shrink-0" /> {idDocsFile.name}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No file selected</span>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={submitting}>
            {submitting ? 'Submitting registration…' : 'Submit Registration for T&P Verification'}
          </Button>
        </FieldGroup>
      </form>
    </main>
  )
}
