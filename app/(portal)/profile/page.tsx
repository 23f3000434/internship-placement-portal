'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, FileText, IdCard, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, StatCard } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { AiResumeScoreCard } from '@/components/portal/ai-copilot'
import { usePortal } from '@/lib/store'
import { checkEligibility, skillGap } from '@/lib/eligibility'
import type { Student } from '@/lib/types'

const LOCATION_LABEL: Record<Student['locationPreference'], string> = {
  local: 'Local only',
  outstation: 'Outstation',
  any: 'Anywhere',
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  )
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground"
          aria-label={`Remove ${children}`}
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

export default function ProfilePage() {
  const p = usePortal()
  const student = p.students.find((s) => s.id === p.actingStudentId)
  const [skillDraft, setSkillDraft] = useState('')
  const [certDraft, setCertDraft] = useState('')

  if (!student) {
    return (
      <>
        <PageHeader title="Student profile" />
        <p className="text-sm text-muted-foreground">No student selected.</p>
      </>
    )
  }

  const myApps = p.applications.filter((a) => a.studentId === student.id)
  const myInternships = p.internships.filter((n) => n.studentId === student.id)
  const mySelf = p.selfPlacements.filter((sp) => sp.studentId === student.id)
  const myAchievements = p.achievements.filter((a) => a.studentId === student.id)
  const mentor = p.faculty.find((f) => f.id === student.facultyId)

  const openDrives = p.drives.filter((d) => d.status === 'open')
  const eligibleCount = openDrives.filter(
    (d) => checkEligibility(student, d).state === 'eligible',
  ).length
  const gaps = skillGap(student, p.drives)

  // Profile completeness drives the eligibility engine, so show exactly what is missing.
  const checklist = [
    { label: 'Resume uploaded', done: student.resumeUploaded },
    { label: 'ID documents uploaded', done: student.idDocsUploaded },
    { label: 'At least three skills listed', done: student.skills.length >= 3 },
    { label: 'Certification on record', done: student.certifications.length > 0 },
    { label: 'Contact number added', done: Boolean(student.phone) },
    { label: 'Profile verified by T&P', done: student.status === 'approved' },
  ]
  const completeness = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)

  const addSkill = () => {
    const v = skillDraft.trim()
    if (!v || student.skills.some((s) => s.toLowerCase() === v.toLowerCase())) return
    p.updateProfile({ skills: [...student.skills, v] })
    setSkillDraft('')
  }

  const addCert = () => {
    const v = certDraft.trim()
    if (!v || student.certifications.some((c) => c.toLowerCase() === v.toLowerCase())) return
    p.updateProfile({ certifications: [...student.certifications, v] })
    setCertDraft('')
  }

  return (
    <>
      <PageHeader
        title={student.name}
        description={`${student.enrollment} · ${student.branch} · Batch of ${student.passingYear}`}
        actions={
          <div className="flex items-center gap-2">
            {student.atRisk && <StatusBadge status="flagged" />}
            <StatusBadge status={student.status} />
          </div>
        }
      />

      {student.status === 'blocked' && student.blockReason && (
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium">Account blocked</p>
          <p className="text-sm text-muted-foreground">{student.blockReason}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="CGPA" value={student.cgpa.toFixed(2)} sub="out of 10" />
        <StatCard
          label="Active backlogs"
          value={student.backlogs}
          sub={student.backlogs === 0 ? 'clear academic record' : 'limits some drives'}
        />
        <StatCard label="Eligible drives" value={eligibleCount} sub={`of ${openDrives.length} open`} />
        <StatCard label="Applications" value={myApps.length} sub={`${myInternships.length} internship(s)`} />
      </div>

      <AiResumeScoreCard student={student} />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="flex flex-col gap-4 rounded-lg border p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Academic &amp; contact details</h2>
          <dl className="flex flex-col">
            <Detail label="College email" value={student.email} />
            <Detail label="Enrollment number" value={student.enrollment} />
            <Detail label="Branch" value={student.branch} />
            <Detail label="Passing year" value={student.passingYear} />
            <Detail label="CGPA" value={student.cgpa.toFixed(2)} />
            <Detail label="Active backlogs" value={student.backlogs} />
            <Detail label="Faculty mentor" value={mentor?.name ?? 'Not assigned'} />
          </dl>
          <div className="flex flex-col gap-2 border-t pt-4">
            <Label htmlFor="phone">Contact number</Label>
            <Input
              id="phone"
              value={student.phone ?? ''}
              placeholder="+91 90000 00000"
              onChange={(e) => p.updateProfile({ phone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="locpref">Location preference</Label>
            <Select
              value={student.locationPreference}
              onValueChange={(v) =>
                v && p.updateProfile({ locationPreference: v as Student['locationPreference'] })
              }
            >
              <SelectTrigger id="locpref">
                <SelectValue>
                  {(value: string) => LOCATION_LABEL[value as Student['locationPreference']]}
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
          </div>
        </section>

        <div className="flex flex-col gap-6 lg:col-span-3">
          <section className="flex flex-col gap-4 rounded-lg border p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold">Profile completeness</h2>
              <span className="text-sm font-medium tabular-nums">{completeness}%</span>
            </div>
            <Progress value={completeness} aria-label={`Profile ${completeness} percent complete`} />
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden
                    className={
                      c.done
                        ? 'flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background'
                        : 'flex size-4 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground'
                    }
                  >
                    {c.done && <Check className="size-2.5" strokeWidth={3} />}
                  </span>
                  <span className={c.done ? '' : 'text-muted-foreground'}>{c.label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-4 rounded-lg border p-5">
            <h2 className="text-sm font-semibold">Documents on file</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start justify-between gap-3 rounded-lg border p-4">
                <div className="flex min-w-0 gap-3">
                  <FileText className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Resume</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.resumeUploaded
                        ? `resume-${student.enrollment.toLowerCase()}.pdf`
                        : 'Not uploaded — applications are blocked'}
                    </p>
                  </div>
                </div>
                {student.resumeUploaded ? (
                  <StatusBadge status="uploaded" />
                ) : (
                  <Button size="sm" onClick={() => p.updateProfile({ resumeUploaded: true })}>
                    Upload
                  </Button>
                )}
              </div>
              <div className="flex items-start justify-between gap-3 rounded-lg border p-4">
                <div className="flex min-w-0 gap-3">
                  <IdCard className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">ID documents</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.idDocsUploaded
                        ? `id-proof-${student.enrollment.toLowerCase()}.pdf`
                        : 'Not uploaded — verification is on hold'}
                    </p>
                  </div>
                </div>
                {student.idDocsUploaded ? (
                  <StatusBadge status="uploaded" />
                ) : (
                  <Button size="sm" onClick={() => p.updateProfile({ idDocsUploaded: true })}>
                    Upload
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Uploads are simulated for the demo. Each upload notifies the T&amp;P cell for
              verification.
            </p>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-lg border p-5">
          <h2 className="text-sm font-semibold">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {student.skills.map((s) => (
              <Chip
                key={s}
                onRemove={() => p.updateProfile({ skills: student.skills.filter((x) => x !== s) })}
              >
                {s}
              </Chip>
            ))}
            {student.skills.length === 0 && (
              <p className="text-sm text-muted-foreground">No skills listed yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  addSkill()
                }
              }}
              placeholder="Add a skill, e.g. Docker"
              aria-label="Add a skill"
            />
            <Button variant="outline" onClick={addSkill}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>

          <h2 className="mt-2 text-sm font-semibold">Certifications</h2>
          <div className="flex flex-wrap gap-2">
            {student.certifications.map((c) => (
              <Chip
                key={c}
                onRemove={() =>
                  p.updateProfile({ certifications: student.certifications.filter((x) => x !== c) })
                }
              >
                {c}
              </Chip>
            ))}
            {student.certifications.length === 0 && (
              <p className="text-sm text-muted-foreground">No certifications on record.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={certDraft}
              onChange={(e) => setCertDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  addCert()
                }
              }}
              placeholder="Add a certification"
              aria-label="Add a certification"
            />
            <Button variant="outline" onClick={addCert}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </section>

        <section className="flex h-fit flex-col gap-4 rounded-lg border p-5">
          <div>
            <h2 className="text-sm font-semibold">Skill gap analysis</h2>
            <p className="text-xs text-muted-foreground">
              Skills demanded by open drives you cannot yet clear, ranked by demand.
            </p>
          </div>
          {gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No gaps — your skills cover every open drive&apos;s requirements.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {gaps.slice(0, 6).map((g) => (
                <li key={g.skill} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm">{g.skill}</span>
                  <span className="flex h-2 flex-1 overflow-hidden rounded-sm bg-muted">
                    <span
                      aria-hidden
                      className="h-full bg-foreground"
                      style={{ width: `${(g.drives / gaps[0].drives) * 100}%` }}
                    />
                  </span>
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {g.drives} drive{g.drives === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" className="w-fit" render={<Link href="/drives" />}>
            Browse open drives
          </Button>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Internship history</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>PPO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myInternships.map((n) => {
                const company = p.companies.find((c) => c.id === n.companyId)
                const self = mySelf.find((sp) => sp.role === n.role)
                return (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.role}</TableCell>
                    <TableCell>{company?.name ?? self?.companyName ?? 'Self-placed'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {n.type === 'self' ? 'Self-placed' : 'College drive'}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {n.startDate} → {n.endDate}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={n.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={n.ppoStatus} />
                    </TableCell>
                  </TableRow>
                )
              })}
              {myInternships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No internships yet. Apply to an eligible drive or register a self-placement.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {myInternships.some((n) => n.finalEvaluation) && (
          <div className="flex flex-col gap-3">
            {myInternships
              .filter((n) => n.finalEvaluation)
              .map((n) => (
                <div key={n.id} className="rounded-lg border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Final evaluation — {n.role}
                  </p>
                  <p className="mt-1 text-sm text-pretty">{n.finalEvaluation}</p>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Verified achievements</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {myAchievements.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-pretty">{a.title}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {a.type} · {a.date}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </li>
          ))}
          {myAchievements.length === 0 && (
            <li className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground sm:col-span-2">
              No achievements submitted yet.
            </li>
          )}
        </ul>
      </section>
    </>
  )
}
