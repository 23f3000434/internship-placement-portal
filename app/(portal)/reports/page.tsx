'use client'

import { useState } from 'react'
import { FileCheck, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'
import { cn } from '@/lib/utils'
import { validateUploadedFile } from '@/lib/file-validation'
import { toast } from 'sonner'

export default function ReportsPage() {
  const p = usePortal()
  const myInternships = p.internships.filter((n) => n.studentId === p.actingStudentId)
  const active = myInternships.find((n) => n.status === 'active') ?? myInternships[0]
  const reports = active
    ? p.weeklyReports.filter((w) => w.internshipId === active.id).sort((a, b) => b.week - a.week)
    : []
  const nextWeek = reports.length > 0 ? Math.max(...reports.map((r) => r.week)) + 1 : 1
  const startDateObj = active ? new Date(active.startDate) : new Date()
  const nowObj = new Date()
  const msDiff = Math.max(0, nowObj.getTime() - startDateObj.getTime())
  const elapsedWeeks = Math.max(1, Math.ceil(msDiff / (7 * 24 * 60 * 60 * 1000)))
  const maxSubmittableWeek = Math.max(elapsedWeeks, 4) // Allow up to current elapsed week
  const canSubmit = nextWeek <= maxSubmittableWeek

  const [workDone, setWorkDone] = useState('')
  const [skillsLearned, setSkillsLearned] = useState('')
  const [hours, setHours] = useState('40')
  const [evidenceName, setEvidenceName] = useState<string | null>(null)

  const valid = workDone.trim().length > 0 && skillsLearned.trim().length > 0 && Number(hours) > 0 && canSubmit

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || !active || !canSubmit) return
    p.submitWeeklyReport({
      internshipId: active.id,
      week: nextWeek,
      workDone: workDone.trim(),
      skillsLearned: skillsLearned.trim(),
      hours: Number(hours),
      evidenceName: evidenceName || undefined,
    })
    setWorkDone('')
    setSkillsLearned('')
    setHours('40')
    setEvidenceName(null)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const check = await validateUploadedFile(f, ['pdf', 'image'])
      if (!check.valid) {
        toast.error('File Upload Blocked', { description: check.error || 'Invalid file format or signature.' })
        e.target.value = ''
        setEvidenceName(null)
        return
      }
      setEvidenceName(f.name)
    }
  }

  if (!active) {
    const intern = p.internships.find((n) => n.status === 'active')
    const internStudent = p.students.find((s) => s.id === intern?.studentId)
    return (
      <>
        <PageHeader
          title="Weekly reports"
          description="Submit weekly activity reports during an active internship."
        />
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No internship yet. Reports unlock once you accept an offer or a self-placement is
            approved.
          </p>
          {internStudent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => p.setActingStudentId(internStudent.id)}
            >
              View as {internStudent.name} — active intern
            </Button>
          )}
        </div>
      </>
    )
  }

  const company = p.companies.find((c) => c.id === active.companyId)

  return (
    <>
      <PageHeader
        title="Weekly reports"
        description={`${active.role} · ${company?.name ?? 'Self-placed'} · ${active.startDate} → ${active.endDate}`}
        actions={<StatusBadge status={active.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        {active.status === 'active' ? (
          <form onSubmit={submit} className="flex h-fit flex-col gap-4 rounded-lg border p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Week {nextWeek} report</h2>
              <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                Due Friday
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wr-work">Work done this week</Label>
              <Textarea
                id="wr-work"
                value={workDone}
                onChange={(e) => setWorkDone(e.target.value)}
                placeholder="Tasks completed, features shipped, problems solved…"
                rows={4}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wr-skills">Skills learned</Label>
              <Input
                id="wr-skills"
                value={skillsLearned}
                onChange={(e) => setSkillsLearned(e.target.value)}
                placeholder="e.g. Cache invalidation, code review"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wr-hours">Hours worked</Label>
              <Input
                id="wr-hours"
                type="number"
                min="1"
                max="80"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="40"
                required
              />
            </div>
            <label
              htmlFor="report-evidence-file"
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors',
                evidenceName ? 'border-foreground bg-muted/20' : 'border-dashed hover:bg-muted/50',
              )}
            >
              <input
                id="report-evidence-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="sr-only"
                onChange={handleFile}
              />
              {evidenceName ? (
                <FileCheck className="size-4 shrink-0 text-foreground" aria-hidden />
              ) : (
                <FileUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="flex-1 min-w-0">
                <span className={cn('block font-medium truncate', !evidenceName && 'text-muted-foreground')}>
                  {evidenceName || 'Weekly work evidence (PDF / screenshot)'}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {evidenceName ? `${evidenceName} · Attached` : 'Optional — click to select file'}
                </span>
              </span>
              {evidenceName && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setEvidenceName(null)
                  }}
                >
                  Remove
                </Button>
              )}
            </label>
            <Button type="submit" disabled={!valid}>
              Submit week {nextWeek} report
            </Button>
            <p className="text-xs text-muted-foreground">
              Your company supervisor verifies the report first, then faculty reviews it.
            </p>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground lg:col-span-2">
            This internship is completed — no further reports are due.
          </div>
        )}

        <section className="flex flex-col gap-3 lg:col-span-3">
          <h2 className="text-sm font-semibold">Submitted reports</h2>
          <ul className="flex flex-col gap-3">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">Week {r.week}</p>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm text-muted-foreground">{r.workDone}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Skills: {r.skillsLearned}</span>
                  <span className="tabular-nums">{r.hours} hrs</span>
                  {r.evidenceName && <span>Evidence: {r.evidenceName}</span>}
                </div>
                <ol className="flex flex-wrap items-center gap-1 text-xs" aria-label="Report verification progress">
                  {(['submitted', 'company_approved', 'faculty_reviewed'] as const).map((step, i) => {
                    const order = ['submitted', 'company_approved', 'faculty_reviewed']
                    const reached =
                      r.status === 'flagged' ? i === 0 : order.indexOf(r.status) >= i
                    return (
                      <li key={step} className="flex items-center gap-1">
                        {i > 0 && <span aria-hidden className="text-muted-foreground">→</span>}
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5',
                            reached
                              ? 'border-foreground font-medium'
                              : 'border-dashed text-muted-foreground',
                          )}
                        >
                          {step === 'submitted' && 'Submitted'}
                          {step === 'company_approved' && 'Company verified'}
                          {step === 'faculty_reviewed' && 'Faculty reviewed'}
                        </span>
                      </li>
                    )
                  })}
                  {r.status === 'flagged' && (
                    <li className="ml-1">
                      <StatusBadge status="flagged" />
                    </li>
                  )}
                </ol>
              </li>
            ))}
            {reports.length === 0 && (
              <li className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No reports submitted yet — week 1 is due this Friday.
              </li>
            )}
          </ul>
        </section>
      </div>
    </>
  )
}
