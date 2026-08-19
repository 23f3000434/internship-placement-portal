'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { usePortal } from '@/lib/store'

const branches = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil']

export default function StudentRegisterPage() {
  const { registerStudent } = usePortal()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [enrollment, setEnrollment] = useState('')
  const [branch, setBranch] = useState('Computer Science')
  const [cgpa, setCgpa] = useState('')
  const [backlogs, setBacklogs] = useState('0')
  const [passingYear, setPassingYear] = useState('2026')
  const [skills, setSkills] = useState('')
  const [certifications, setCertifications] = useState('')
  const [phone, setPhone] = useState('')
  const [locationPref, setLocationPref] = useState<'local' | 'outstation' | 'any'>('any')
  const [resume, setResume] = useState(false)
  const [idDocs, setIdDocs] = useState(false)

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-4 py-12">
      <div className="flex flex-col gap-1">
        <Link href="/" className="mb-2 text-sm text-muted-foreground underline underline-offset-4">
          ← Back to home
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Student registration</h1>
        <p className="text-sm text-muted-foreground">
          Your account stays pending until the T&amp;P cell verifies your documents.
        </p>
      </div>
      <form
        className="rounded-lg border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault()
          registerStudent({
            name,
            email,
            enrollment,
            branch,
            cgpa: Number.parseFloat(cgpa) || 0,
            backlogs: Number.parseInt(backlogs, 10) || 0,
            passingYear: Number.parseInt(passingYear, 10) || new Date().getFullYear(),
            skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
            certifications: certifications.split(',').map((s) => s.trim()).filter(Boolean),
            phone: phone.trim() || undefined,
            locationPreference: locationPref,
            resumeUploaded: resume,
            idDocsUploaded: idDocs,
          })
          router.push('/pending')
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
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
              <FieldLabel htmlFor="branch">Branch</FieldLabel>
              <Select value={branch} onValueChange={(v) => setBranch(v as string)}>
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
              <FieldLabel htmlFor="cgpa">CGPA</FieldLabel>
              <Input id="cgpa" type="number" step="0.1" min="0" max="10" required value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
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
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 90000 00000"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="skills">Skills</FieldLabel>
            <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Python, SQL" />
            <FieldDescription>Comma separated. Drives match against these.</FieldDescription>
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
            <Select value={locationPref} onValueChange={(v) => setLocationPref(v as typeof locationPref)}>
              <SelectTrigger id="locpref">
                <SelectValue>
                  {(v: string) => (v === 'any' ? 'Anywhere' : v === 'local' ? 'Local' : 'Outstation')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="outstation">Outstation</SelectItem>
                  <SelectItem value="any">Anywhere</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="resume" checked={resume} onCheckedChange={(c) => setResume(c === true)} />
            <FieldLabel htmlFor="resume">Resume uploaded (simulated PDF upload)</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="iddocs" checked={idDocs} onCheckedChange={(c) => setIdDocs(c === true)} />
            <FieldLabel htmlFor="iddocs">ID documents uploaded (simulated upload)</FieldLabel>
          </Field>
          <Button type="submit">Submit for verification</Button>
        </FieldGroup>
      </form>
    </main>
  )
}
