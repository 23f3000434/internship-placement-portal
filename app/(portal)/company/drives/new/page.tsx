'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/portal/page-header'
import { usePortal } from '@/lib/store'

const daysFromNow = (d: number) => {
  const dt = new Date()
  dt.setDate(dt.getDate() + d)
  return dt.toISOString().slice(0, 10)
}

export default function NewDrivePage() {
  const p = usePortal()
  const router = useRouter()
  const currentCompanyId = p.authSession?.userId || p.actingCompanyId || 'c1'
  const me = p.companies.find((c) => c.id === currentCompanyId) || p.companies[0]

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState('')
  const [field, setField] = useState('Software')
  const [location, setLocation] = useState(me?.location ?? '')
  const [workMode, setWorkMode] = useState<'remote' | 'hybrid' | 'onsite'>('onsite')
  const [stipend, setStipend] = useState('15000')
  const [durationWeeks, setDurationWeeks] = useState('12')
  const [openings, setOpenings] = useState('2')
  const [minCgpa, setMinCgpa] = useState('7.0')
  const [maxBacklogs, setMaxBacklogs] = useState('0')
  const [passingYears, setPassingYears] = useState('2026')
  const [requiredSkills, setRequiredSkills] = useState('')
  const [requiredCertifications, setRequiredCertifications] = useState('')
  const [locationFilter, setLocationFilter] = useState<'local' | 'outstation' | 'any'>('any')
  const [fieldFilter, setFieldFilter] = useState('Computer Science')
  const [anyoneCanApply, setAnyoneCanApply] = useState(false)
  const [openDate, setOpenDate] = useState(daysFromNow(0))
  const [deadline, setDeadline] = useState(daysFromNow(14))
  const [startDate, setStartDate] = useState(daysFromNow(30))
  const [endDate, setEndDate] = useState(daysFromNow(114))
  const [error, setError] = useState<string | null>(null)

  const canSubmit = Boolean(
    title.trim() &&
      description.trim() &&
      field.trim() &&
      location.trim() &&
      Number(stipend) >= 0 &&
      Number(durationWeeks) > 0 &&
      Number(openings) > 0 &&
      me?.status === 'approved',
  )

  const csv = (v: string) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!canSubmit) {
      setError('Complete all required role details with valid positive values.')
      return
    }
    if (!(openDate <= deadline && deadline < startDate && startDate < endDate)) {
      setError('Dates must follow this order: applications open, deadline, internship start, internship end.')
      return
    }
    const jdSkills = csv(skills)
    try {
      p.createDrive({
      title: title.trim(),
      description: description.trim(),
      skills: jdSkills,
      field,
      location,
      workMode,
      stipend: Number(stipend) || 0,
      durationWeeks: Number(durationWeeks) || 0,
      openings: Number(openings) || 1,
      minCgpa: anyoneCanApply ? 0 : Number(minCgpa) || 0,
      maxBacklogs: anyoneCanApply ? 99 : Number(maxBacklogs) || 0,
      passingYears: anyoneCanApply
        ? []
        : csv(passingYears)
            .map(Number)
            .filter((n) => Number.isFinite(n) && n > 0),
      // Mandatory skills default to the JD skill list when the company leaves the gate blank.
      requiredSkills: anyoneCanApply
        ? []
        : csv(requiredSkills).length
          ? csv(requiredSkills)
          : jdSkills,
      requiredCertifications: anyoneCanApply ? [] : csv(requiredCertifications),
      locationFilter: anyoneCanApply ? 'any' : locationFilter,
      fieldFilter: anyoneCanApply ? 'Any' : fieldFilter,
      anyoneCanApply,
      openDate,
      deadline,
      startDate,
      endDate,
      })
      router.push('/company/drives')
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Drive could not be published.')
    }
  }

  return (
    <>
      <PageHeader
        title="Create internship drive"
        description="Publish a JD with eligibility filters and an application timeline. Matching students are notified automatically."
      />
      {me?.status !== 'approved' && (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Your company is not approved yet — publishing is disabled.
        </div>
      )}
      <form onSubmit={submit} className="flex max-w-3xl flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide">Role details</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Frontend Engineering Intern"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description (JD)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Responsibilities, team, mentorship, and expectations…"
              rows={4}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="skills">Required skills (comma separated)</Label>
              <Input
                id="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, TypeScript, CSS"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="field">Field</Label>
              <Input id="field" value={field} onChange={(e) => setField(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="workMode">Work mode</Label>
              <Select value={workMode} onValueChange={(v) => setWorkMode(v as typeof workMode)}>
                <SelectTrigger id="workMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stipend">Stipend (₹ / month)</Label>
              <Input
                id="stipend"
                type="number"
                min={0}
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="openings">Openings</Label>
              <Input
                id="openings"
                type="number"
                min={1}
                value={openings}
                onChange={(e) => setOpenings(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide">
            Eligibility filters
          </h2>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="anyone" className="font-medium">
                Anyone can apply
              </Label>
              <p className="text-xs text-muted-foreground">
                Waives every academic, skill, and certification filter below.
              </p>
            </div>
            <Switch id="anyone" checked={anyoneCanApply} onCheckedChange={setAnyoneCanApply} />
          </div>
          {!anyoneCanApply && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="minCgpa">Minimum CGPA</Label>
                <Input
                  id="minCgpa"
                  type="number"
                  step="0.1"
                  min={0}
                  max={10}
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="maxBacklogs">Max active backlogs</Label>
                <Input
                  id="maxBacklogs"
                  type="number"
                  min={0}
                  value={maxBacklogs}
                  onChange={(e) => setMaxBacklogs(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="passingYears">Passing year(s)</Label>
                <Input
                  id="passingYears"
                  value={passingYears}
                  onChange={(e) => setPassingYears(e.target.value)}
                  placeholder="2026, 2027"
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="requiredSkills">Mandatory skills</Label>
                <Input
                  id="requiredSkills"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="Leave blank to gate on the JD skills above"
                />
                <p className="text-xs text-muted-foreground">
                  Applicants missing any of these are shown &quot;Required skill missing&quot;.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="requiredCertifications">Required certifications</Label>
                <Input
                  id="requiredCertifications"
                  value={requiredCertifications}
                  onChange={(e) => setRequiredCertifications(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fieldFilter">Branch filter</Label>
                <Select value={fieldFilter} onValueChange={(v) => setFieldFilter(v ?? 'Any')}>
                  <SelectTrigger id="fieldFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Any', 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical'].map(
                      (b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="locationFilter">Location filter</Label>
                <Select
                  value={locationFilter}
                  onValueChange={(v) => setLocationFilter(v as typeof locationFilter)}
                >
                  <SelectTrigger id="locationFilter">
                    <SelectValue>
                      {(v: string) =>
                        v === 'any' ? 'Any' : v === 'local' ? 'Local only' : 'Outstation only'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="local">Local only</SelectItem>
                    <SelectItem value="outstation">Outstation only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide">
            Application timeline
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="openDate">Applications open</Label>
              <Input
                id="openDate"
                type="date"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="deadline">Application deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">Internship starts</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">Internship ends</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </section>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={!canSubmit}>
            Publish drive
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  )
}
