'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { StatusBadge } from '@/components/portal/status-badge'
import { checkEligibility } from '@/lib/eligibility'
import { usePortal } from '@/lib/store'
import type { Student, Drive } from '@/lib/types'
import { cn } from '@/lib/utils'

function computeMatch(student: Student, drive: Drive): number {
  const studentSkills = student.skills.map((s) => s.toLowerCase())
  const required = drive.requiredSkills.map((s) => s.toLowerCase())
  const matched = required.filter((s) => studentSkills.some((sk) => sk.includes(s) || s.includes(sk)))
  let score = 50
  if (required.length > 0) {
    score += Math.round((matched.length / required.length) * 35)
  } else {
    score += 25
  }
  if (student.cgpa >= drive.minCgpa + 0.8) score += 10
  else if (student.cgpa >= drive.minCgpa) score += 5
  if (drive.fieldFilter === 'Any' || drive.fieldFilter === student.branch) score += 5
  return Math.min(Math.max(score, 45), 98)
}

export default function DrivesPage() {
  const p = usePortal()
  const me = p.students.find((s) => s.id === p.actingStudentId)
  const [query, setQuery] = useState('')
  const [field, setField] = useState('all')
  const [mode, setMode] = useState('all')
  const [location, setLocation] = useState('all')
  const [eligibleOnly, setEligibleOnly] = useState(false)

  const fields = useMemo(() => Array.from(new Set(p.drives.map((d) => d.field))), [p.drives])
  const locations = useMemo(() => Array.from(new Set(p.drives.map((d) => d.location))), [p.drives])

  const eligibleCount = useMemo(
    () => (me ? p.drives.filter((d) => checkEligibility(me, d).state === 'eligible').length : 0),
    [p.drives, me],
  )

  const filtered = p.drives.filter((d) => {
    const company = p.companies.find((c) => c.id === d.companyId)
    if (company?.status !== 'approved') return false
    if (eligibleOnly && me) {
      const elig = checkEligibility(me, d)
      if (elig.state !== 'eligible') return false
    }
    if (query && !`${d.title} ${company?.name} ${d.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
      return false
    if (field !== 'all' && d.field !== field) return false
    if (mode !== 'all' && d.workMode !== mode) return false
    if (location !== 'all' && d.location !== location) return false
    return true
  })

  return (
    <>
      <PageHeader
        title="Discover internship drives"
        description="Eligibility is checked automatically against your academic profile for every drive."
        actions={
          me && (
            <Button
              variant={eligibleOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEligibleOnly(!eligibleOnly)}
            >
              {eligibleOnly ? `✓ Eligible Only (${eligibleCount})` : `Show Eligible Only (${eligibleCount} available)`}
            </Button>
          )
        }
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Search drives"
            placeholder="Search by title, company, or skill"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={field} onValueChange={(v) => setField(v as string)}>
            <SelectTrigger aria-label="Filter by field" className="w-36">
              <SelectValue>{(v: string) => (v === 'all' ? 'All fields' : v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All fields</SelectItem>
                {fields.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={(v) => setMode(v as string)}>
            <SelectTrigger aria-label="Filter by work mode" className="w-32">
              <SelectValue>
                {(v: string) => (v === 'all' ? 'All modes' : v === 'onsite' ? 'Onsite' : v === 'remote' ? 'Remote' : 'Hybrid')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All modes</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">Onsite</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={(v) => setLocation(v as string)}>
            <SelectTrigger aria-label="Filter by location" className="w-36">
              <SelectValue>{(v: string) => (v === 'all' ? 'All locations' : v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {filtered.map((d) => {
          const company = p.companies.find((c) => c.id === d.companyId)
          const elig = me ? checkEligibility(me, d) : null
          return (
            <li key={d.id}>
              <Link
                href={`/drives/${d.id}`}
                className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{d.title}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {company?.name} · {d.location} · {d.workMode} · ₹{d.stipend.toLocaleString('en-IN')}/mo ·{' '}
                    {d.durationWeeks} weeks · deadline {d.deadline}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Skills: {d.skills.join(', ')}
                    {!d.anyoneCanApply && d.minCgpa > 0 && ` · Min CGPA ${d.minCgpa.toFixed(1)}`}
                    {d.anyoneCanApply && ' · Open to everyone'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {elig && elig.state === 'eligible' && me && (
                    <span className="rounded-full border border-foreground bg-foreground px-2.5 py-0.5 text-xs font-semibold text-background">
                      {computeMatch(me, d)}% Match
                    </span>
                  )}
                  {elig && (
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-3 py-1 text-xs font-medium',
                        elig.state === 'eligible' && 'border-foreground text-foreground',
                        elig.state === 'not_eligible' && 'border-muted-foreground bg-muted text-muted-foreground',
                        elig.state === 'missing_info' && 'border-dashed border-muted-foreground text-muted-foreground',
                      )}
                    >
                      {elig.state === 'eligible' && 'Eligible'}
                      {elig.state === 'not_eligible' && `Not eligible — ${elig.reason}`}
                      {elig.state === 'missing_info' && `Missing info — ${elig.reason}`}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No drives match your filters.
          </li>
        )}
      </ul>
      <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
        <p className="text-sm text-muted-foreground">
          Interned somewhere the portal doesn&apos;t list? Add the company for admin approval.
        </p>
        <Button variant="outline" render={<Link href="/companies" />}>
          Add a company
        </Button>
      </div>
    </>
  )
}
