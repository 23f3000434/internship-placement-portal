'use client'

import { FileCheck, FileX } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'

function Doc({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? 'inline-flex items-center gap-1 rounded-full border border-foreground px-2.5 py-0.5 text-xs font-medium'
          : 'inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground px-2.5 py-0.5 text-xs text-muted-foreground'
      }
    >
      {ok ? <FileCheck className="size-3" aria-hidden /> : <FileX className="size-3" aria-hidden />}
      {label}
      {!ok && ' (missing)'}
    </span>
  )
}

export default function FacultyReviewsPage() {
  const p = usePortal()
  const pendingReports = p.weeklyReports.filter((w) => w.status === 'company_approved')
  const pendingSP = p.selfPlacements.filter((sp) => sp.status === 'pending')
  const pendingAch = p.achievements.filter((a) => a.status === 'pending')

  const [rejectSP, setRejectSP] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  return (
    <>
      <PageHeader
        title="Verifications & reviews"
        description="Review company-verified weekly reports, self-placement requests, and extra achievements."
      />
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Weekly reports ({pendingReports.length})</TabsTrigger>
          <TabsTrigger value="self">Self-placements ({pendingSP.length})</TabsTrigger>
          <TabsTrigger value="achievements">Achievements ({pendingAch.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4">
          <ul className="flex flex-col gap-4">
            {pendingReports.map((w) => {
              const internship = p.internships.find((n) => n.id === w.internshipId)
              const student = p.students.find((s) => s.id === internship?.studentId)
              return (
                <li key={w.id} className="flex flex-col gap-3 rounded-lg border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        Week {w.week} — {student?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {internship?.role} · {w.hours} hrs logged
                        {w.evidenceName && ` · evidence: ${w.evidenceName}`}
                      </p>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Work done</p>
                      <p>{w.workDone}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Skills learned
                      </p>
                      <p>{w.skillsLearned}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t pt-3">
                    <Button size="sm" onClick={() => p.setReportStatus(w.id, 'faculty_reviewed')}>
                      Mark reviewed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => p.setReportStatus(w.id, 'flagged')}
                    >
                      Flag report
                    </Button>
                  </div>
                </li>
              )
            })}
            {pendingReports.length === 0 && (
              <li className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No company-verified reports waiting for review.
              </li>
            )}
          </ul>
        </TabsContent>

        <TabsContent value="self" className="mt-4">
          <ul className="flex flex-col gap-4">
            {pendingSP.map((sp) => {
              const student = p.students.find((s) => s.id === sp.studentId)
              return (
                <li key={sp.id} className="flex flex-col gap-4 rounded-lg border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {student?.name} — {sp.role} at {sp.companyName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sp.startDate} → {sp.endDate} · ₹{sp.stipend.toLocaleString('en-IN')}/month
                      </p>
                    </div>
                    <StatusBadge status="pending" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Doc ok={sp.offerLetterUploaded} label="Offer letter" />
                    <Doc ok={sp.joiningLetterUploaded} label="Joining letter" />
                    <Doc ok={sp.nocUploaded} label="NOC (optional)" />
                    <Doc ok={sp.certificateUploaded} label="Certificate (on completion)" />
                  </div>
                  <div className="flex gap-2 border-t pt-4">
                    <Button size="sm" onClick={() => p.reviewSelfPlacement(sp.id, true)}>
                      Approve — start tracking
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectSP(sp.id)}>
                      Reject with reason
                    </Button>
                  </div>
                </li>
              )
            })}
            {pendingSP.length === 0 && (
              <li className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No self-placement requests pending.
              </li>
            )}
          </ul>
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <ul className="flex flex-col gap-4">
            {pendingAch.map((a) => {
              const student = p.students.find((s) => s.id === a.studentId)
              return (
                <li key={a.id} className="flex flex-col gap-3 rounded-lg border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {student?.name} · <span className="capitalize">{a.type}</span> · {a.date} ·
                        evidence: {a.evidenceName}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex gap-2 border-t pt-3">
                    <Button size="sm" onClick={() => p.reviewAchievement(a.id, true)}>
                      Verify
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => p.reviewAchievement(a.id, false)}>
                      Reject
                    </Button>
                  </div>
                </li>
              )
            })}
            {pendingAch.length === 0 && (
              <li className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No achievements pending verification.
              </li>
            )}
          </ul>
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectSP} onOpenChange={(o) => !o && setRejectSP(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject self-placement</DialogTitle>
            <DialogDescription>The student is notified by email with this reason.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sp-reason">Reason</Label>
            <Textarea
              id="sp-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Joining letter missing — please re-submit"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectSP(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (rejectSP) p.reviewSelfPlacement(rejectSP, false, reason.trim() || 'Documents incomplete.')
                setRejectSP(null)
                setReason('')
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
