'use client'

import { useState } from 'react'
import { Eye, FileCheck, FileUp, Link2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { DocumentViewerModal, normalizeExternalUrl } from '@/components/portal/document-viewer'
import { usePortal } from '@/lib/store'
import { cn } from '@/lib/utils'
import { validateUploadedFile } from '@/lib/file-validation'
import type { InternshipDocument, WeeklyReport } from '@/lib/types'
import { toast } from 'sonner'

export default function ReportsPage() {
  const p = usePortal()
  const currentStudentId = p.authSession?.userId || p.actingStudentId || 's1'
  const myInternships = p.internships.filter((n) => n.studentId === currentStudentId)
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
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [evidenceName, setEvidenceName] = useState<string | null>(null)
  const [evidenceData, setEvidenceData] = useState<string | undefined>(undefined)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [viewingDoc, setViewingDoc] = useState<InternshipDocument | null>(null)

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
      evidenceName: uploadMode === 'url' ? 'Google Drive / Work Evidence' : (evidenceName || `Week-${nextWeek}-Report.pdf`),
      evidenceUrl: uploadMode === 'url' ? normalizeExternalUrl(evidenceUrl.trim()) : undefined,
      evidenceData: uploadMode === 'file' ? evidenceData : undefined,
    })
    setWorkDone('')
    setSkillsLearned('')
    setHours('40')
    setEvidenceName(null)
    setEvidenceData(undefined)
    setEvidenceUrl('')
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const validation = await validateUploadedFile(f, ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
      if (!validation.ok) {
        toast.error('Invalid File Format', { description: validation.reason })
        e.target.value = ''
        setEvidenceName(null)
        return
      }
      setEvidenceName(f.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        setEvidenceData(event.target?.result as string)
      }
      reader.readAsDataURL(f)
      toast.success('Evidence Attached', { description: f.name })
    }
  }

  const openDocViewer = (r: WeeklyReport) => {
    setViewingDoc({
      id: r.id,
      internshipId: r.internshipId,
      kind: 'completion_certificate',
      fileName: r.evidenceName || `Week-${r.week}-Evidence.pdf`,
      fileUrl: r.evidenceUrl,
      fileData: r.evidenceData,
      status: r.status === 'company_approved' || r.status === 'faculty_reviewed' ? 'verified' : 'uploaded',
      uploadedBy: 'student',
      uploadedAt: new Date().toISOString().slice(0, 10),
    })
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Weekly Work Evidence</Label>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                      uploadMode === 'file' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                      uploadMode === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    Drive Link
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <label
                  htmlFor="report-evidence-file"
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors',
                    evidenceName ? 'border-primary bg-primary/5' : 'border-dashed hover:bg-muted/50',
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
                    <FileCheck className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <FileUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className={cn('block font-medium truncate text-xs', !evidenceName && 'text-muted-foreground')}>
                      {evidenceName || 'Attach Evidence (PDF / Image / Doc)'}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {evidenceName ? `${evidenceName} · Attached` : 'Optional — click to select file'}
                    </span>
                  </span>
                  {evidenceName && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEvidenceName(null)
                        setEvidenceData(undefined)
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </label>
              ) : (
                <div className="space-y-1">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="pl-8 text-xs"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Paste Google Drive link with work samples, commit URLs, or demo documents.
                  </p>
                </div>
              )}
            </div>

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
              <li key={r.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Week {r.week}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.workDone}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span>Skills: {r.skillsLearned}</span>
                    <span className="tabular-nums font-medium text-foreground">{r.hours} hrs logged</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {r.evidenceUrl && (
                      <a
                        href={normalizeExternalUrl(r.evidenceUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium hover:bg-muted"
                      >
                        <ExternalLink className="size-3" />
                        <span>Link ↗</span>
                      </a>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => openDocViewer(r)}
                    >
                      <Eye className="size-3" />
                      <span>View Evidence</span>
                    </Button>
                  </div>
                </div>

                <ol className="flex flex-wrap items-center gap-1 text-xs pt-1" aria-label="Report verification progress">
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

      {viewingDoc && (
        <DocumentViewerModal
          open={Boolean(viewingDoc)}
          onOpenChange={(open) => !open && setViewingDoc(null)}
          doc={viewingDoc}
          internship={active}
        />
      )}
    </>
  )
}
