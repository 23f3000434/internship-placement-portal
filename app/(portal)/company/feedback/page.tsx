'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'
import type { Internship } from '@/lib/types'

function RatingSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? value)}>
        <SelectTrigger id={id}>
          <SelectValue>{(v: string) => `${v} / 5`}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {[5, 4, 3, 2, 1].map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} / 5
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function InternCard({ internship }: { internship: Internship }) {
  const p = usePortal()
  const student = p.students.find((s) => s.id === internship.studentId)
  const reports = p.weeklyReports
    .filter((w) => w.internshipId === internship.id)
    .sort((a, b) => a.week - b.week)
  const feedbacks = p.feedback
    .filter((f) => f.internshipId === internship.id)
    .sort((a, b) => a.week - b.week)
  const att = p.attendance.find((a) => a.internshipId === internship.id)
  const attPct = att && att.workingDays > 0 ? Math.round((att.present / att.workingDays) * 100) : null

  const [fbOpen, setFbOpen] = useState(false)
  const [fbWeek, setFbWeek] = useState(String((feedbacks[feedbacks.length - 1]?.week ?? 0) + 1))
  const [rAttendance, setRAttendance] = useState('5')
  const [rQuality, setRQuality] = useState('4')
  const [rComms, setRComms] = useState('4')
  const [rTech, setRTech] = useState('4')
  const [fbComments, setFbComments] = useState('')

  const [finalOpen, setFinalOpen] = useState(false)
  const [finalText, setFinalText] = useState('')

  const submitFb = () => {
    p.submitFeedback({
      internshipId: internship.id,
      week: Number(fbWeek) || 1,
      attendance: Number(rAttendance),
      workQuality: Number(rQuality),
      communication: Number(rComms),
      technical: Number(rTech),
      comments: fbComments.trim(),
    })
    setFbOpen(false)
    setFbComments('')
    setFbWeek(String(Number(fbWeek) + 1))
  }

  return (
    <li className="flex flex-col gap-5 rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{student?.name}</p>
          <p className="text-sm text-muted-foreground">
            {internship.role} · {internship.startDate} → {internship.endDate}
            {attPct !== null && ` · attendance ${attPct}%`}
          </p>
        </div>
        <StatusBadge status={internship.status} />
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Weekly reports to verify
        </h3>
        <ul className="divide-y rounded-md border text-sm">
          {reports.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">Week {w.week} — {w.hours} hrs</p>
                <p className="truncate text-xs text-muted-foreground">{w.workDone}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={w.status} />
                {w.status === 'submitted' && (
                  <Button size="sm" onClick={() => p.setReportStatus(w.id, 'company_approved')}>
                    Verify
                  </Button>
                )}
              </div>
            </li>
          ))}
          {reports.length === 0 && (
            <li className="px-4 py-6 text-center text-muted-foreground">No reports submitted yet.</li>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Weekly feedback submitted
        </h3>
        <ul className="divide-y rounded-md border text-sm">
          {feedbacks.map((f) => (
            <li key={f.id} className="flex flex-col gap-1 px-4 py-3">
              <p className="font-medium">
                Week {f.week} · Attendance {f.attendance}/5 · Quality {f.workQuality}/5 · Communication{' '}
                {f.communication}/5 · Technical {f.technical}/5
              </p>
              {f.comments && <p className="text-xs text-muted-foreground">{f.comments}</p>}
            </li>
          ))}
          {feedbacks.length === 0 && (
            <li className="px-4 py-6 text-center text-muted-foreground">No feedback yet.</li>
          )}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button size="sm" onClick={() => setFbOpen(true)} disabled={internship.status !== 'active'}>
          Submit weekly feedback
        </Button>
        {internship.status === 'active' ? (
          <Button size="sm" variant="outline" onClick={() => setFinalOpen(true)}>
            Final evaluation
          </Button>
        ) : (
          internship.finalEvaluation && (
            <p className="text-sm text-muted-foreground">
              Final evaluation: {internship.finalEvaluation}
            </p>
          )
        )}
      </div>

      <Dialog open={fbOpen} onOpenChange={setFbOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weekly feedback — {student?.name}</DialogTitle>
            <DialogDescription>
              Rate the intern for the week. Faculty and admin are notified.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`fb-week-${internship.id}`}>Week number</Label>
              <Select value={fbWeek} onValueChange={(v) => setFbWeek(v ?? fbWeek)}>
                <SelectTrigger id={`fb-week-${internship.id}`}>
                  <SelectValue>{(v: string) => `Week ${v}`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      Week {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <RatingSelect
              id={`fb-att-${internship.id}`}
              label="Attendance"
              value={rAttendance}
              onChange={setRAttendance}
            />
            <RatingSelect
              id={`fb-quality-${internship.id}`}
              label="Work quality"
              value={rQuality}
              onChange={setRQuality}
            />
            <RatingSelect
              id={`fb-comms-${internship.id}`}
              label="Communication"
              value={rComms}
              onChange={setRComms}
            />
            <RatingSelect
              id={`fb-tech-${internship.id}`}
              label="Technical skill"
              value={rTech}
              onChange={setRTech}
            />
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor={`fb-comments-${internship.id}`}>Comments</Label>
              <Textarea
                id={`fb-comments-${internship.id}`}
                value={fbComments}
                onChange={(e) => setFbComments(e.target.value)}
                rows={3}
                placeholder="Highlights, concerns, next steps…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFbOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitFb}>Submit feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finalOpen} onOpenChange={setFinalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Final evaluation — {student?.name}</DialogTitle>
            <DialogDescription>
              Submitting the final evaluation marks this internship as completed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`final-${internship.id}`}>Evaluation summary</Label>
            <Textarea
              id={`final-${internship.id}`}
              value={finalText}
              onChange={(e) => setFinalText(e.target.value)}
              rows={4}
              placeholder="Overall performance, key deliverables, and recommendation…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                p.submitFinalEvaluation(internship.id, finalText.trim())
                setFinalOpen(false)
              }}
              disabled={!finalText.trim()}
            >
              Submit & complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}

export default function CompanyFeedbackPage() {
  const p = usePortal()
  const myInterns = p.internships.filter((n) => n.companyId === p.actingCompanyId)

  return (
    <>
      <PageHeader
        title="Intern feedback"
        description="Verify weekly reports, rate interns weekly, and submit final evaluations at completion."
      />
      <ul className="flex flex-col gap-4">
        {myInterns.map((n) => (
          <InternCard key={n.id} internship={n} />
        ))}
        {myInterns.length === 0 && (
          <li className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No interns yet. When a selected student accepts an offer, they appear here.
          </li>
        )}
      </ul>
    </>
  )
}
