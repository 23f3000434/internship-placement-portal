'use client'

import { useState } from 'react'
import { FileCheck, FileX, Eye, ExternalLink, ShieldCheck } from 'lucide-react'
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
import { DocumentViewerModal, normalizeExternalUrl } from '@/components/portal/document-viewer'
import { usePortal } from '@/lib/store'
import type { Achievement, DocumentKind, Internship, InternshipDocument, SelfPlacement, Student, WeeklyReport } from '@/lib/types'

export default function FacultyReviewsPage() {
  const p = usePortal()
  const pendingReports = p.weeklyReports.filter((w) => w.status === 'company_approved')
  const pendingSP = p.selfPlacements.filter((sp) => sp.status === 'pending')
  const pendingAch = p.achievements.filter((a) => a.status === 'pending')

  const [rejectSP, setRejectSP] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  // Document Viewer State
  const [viewingDoc, setViewingDoc] = useState<InternshipDocument | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [viewingInternship, setViewingInternship] = useState<Internship | null>(null)

  const openReportDoc = (w: WeeklyReport, student?: Student, internship?: Internship) => {
    setViewingStudent(student || null)
    setViewingInternship(internship || null)
    setViewingDoc({
      id: w.id,
      internshipId: w.internshipId,
      kind: 'completion_certificate',
      fileName: w.evidenceName || `Week-${w.week}-Work-Evidence.pdf`,
      fileUrl: w.evidenceUrl,
      fileData: w.evidenceData,
      status: 'uploaded',
      uploadedBy: 'student',
      uploadedAt: new Date().toISOString().slice(0, 10),
    })
  }

  const openSelfPlacementDoc = (sp: SelfPlacement, student: Student | undefined, kind: DocumentKind) => {
    setViewingStudent(student || null)
    setViewingInternship({
      id: sp.id,
      studentId: sp.studentId,
      companyId: 'self',
      role: sp.role,
      location: sp.location,
      type: 'self',
      startDate: sp.startDate,
      endDate: sp.endDate,
      status: 'active',
      ppoStatus: 'none',
    })

    let fileName = `${kind.replace(/_/g, '-')}.pdf`
    let fileUrl: string | undefined = undefined
    let fileData: string | undefined = undefined

    if (kind === 'offer_letter') {
      fileName = sp.offerLetterName || 'Offer-Letter.pdf'
      fileUrl = sp.offerLetterUrl
      fileData = sp.offerLetterData
    } else if (kind === 'joining_letter') {
      fileName = sp.joiningLetterName || 'Joining-Letter.pdf'
      fileUrl = sp.joiningLetterUrl
      fileData = sp.joiningLetterData
    } else if (kind === 'acceptance') {
      fileName = sp.nocName || 'NOC-Clearance.pdf'
      fileUrl = sp.nocUrl
      fileData = sp.nocData
    } else if (kind === 'completion_certificate') {
      fileName = sp.certificateName || 'Internship-Certificate.pdf'
      fileUrl = sp.certificateUrl
      fileData = sp.certificateData
    }

    setViewingDoc({
      id: `sp-${sp.id}-${kind}`,
      internshipId: sp.id,
      kind,
      fileName,
      fileUrl,
      fileData,
      status: 'uploaded',
      uploadedBy: 'student',
      uploadedAt: sp.startDate,
    })
  }

  const openAchievementDoc = (a: Achievement, student?: Student) => {
    setViewingStudent(student || null)
    setViewingInternship(null)
    setViewingDoc({
      id: a.id,
      internshipId: 'ac',
      kind: 'completion_certificate',
      fileName: a.evidenceName || `${a.type}-certificate.pdf`,
      fileUrl: a.evidenceUrl,
      fileData: a.evidenceData,
      status: a.status === 'verified' ? 'verified' : 'uploaded',
      uploadedBy: 'student',
      uploadedAt: a.date,
    })
  }

  return (
    <>
      <PageHeader
        title="Verifications & reviews"
        description="Review company-verified weekly reports, self-placement requests, and extra achievements with document verification."
      />
      <Tabs defaultValue="reports">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
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
                <li key={w.id} className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        Week {w.week} — {student?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {internship?.role} · {w.hours} hrs logged
                      </p>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Work done</p>
                      <p className="mt-1 text-xs sm:text-sm">{w.workDone}</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Skills learned
                      </p>
                      <p className="mt-1 text-xs sm:text-sm">{w.skillsLearned}</p>
                    </div>
                  </div>

                  {/* Document & Evidence Preview Section */}
                  <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="size-4 text-foreground shrink-0" />
                      <span className="truncate font-medium text-foreground">
                        Evidence: {w.evidenceName || `Week ${w.week} Report Document`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {w.evidenceUrl && (
                        <a
                          href={normalizeExternalUrl(w.evidenceUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium hover:bg-muted"
                        >
                          <ExternalLink className="size-3" />
                          <span>Link ↗</span>
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1"
                        onClick={() => openReportDoc(w, student, internship)}
                      >
                        <Eye className="size-3" />
                        <span>View Evidence</span>
                      </Button>
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
                <li key={sp.id} className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-base">
                        {student?.name} — {sp.role} at {sp.companyName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sp.startDate} → {sp.endDate} · ₹{sp.stipend.toLocaleString('en-IN')}/month · {sp.location}
                      </p>
                    </div>
                    <StatusBadge status="pending" />
                  </div>

                  {/* Interactive Document Chips */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Submitted Verification Documents (Click to View):
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {sp.offerLetterUploaded ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => openSelfPlacementDoc(sp, student, 'offer_letter')}
                        >
                          <Eye className="size-3 text-foreground" />
                          <span>View Offer Letter</span>
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground px-2.5 py-1 text-xs text-muted-foreground">
                          <FileX className="size-3" /> Offer letter (missing)
                        </span>
                      )}

                      {sp.joiningLetterUploaded ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => openSelfPlacementDoc(sp, student, 'joining_letter')}
                        >
                          <Eye className="size-3 text-foreground" />
                          <span>View Joining Letter</span>
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground px-2.5 py-1 text-xs text-muted-foreground">
                          <FileX className="size-3" /> Joining letter (missing)
                        </span>
                      )}

                      {sp.nocUploaded ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => openSelfPlacementDoc(sp, student, 'acceptance')}
                        >
                          <Eye className="size-3 text-foreground" />
                          <span>View NOC</span>
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground px-2.5 py-1 text-xs text-muted-foreground">
                          <FileX className="size-3" /> NOC (optional)
                        </span>
                      )}

                      {sp.certificateUploaded ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => openSelfPlacementDoc(sp, student, 'completion_certificate')}
                        >
                          <Eye className="size-3 text-foreground" />
                          <span>View Certificate</span>
                        </Button>
                      ) : null}
                    </div>
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
                <li key={a.id} className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-base">{a.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Candidate: <span className="font-medium text-foreground">{student?.name}</span> · <span className="capitalize">{a.type}</span> · Achieved on {a.date}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  {/* Document & Evidence Preview Section */}
                  <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="size-4 text-foreground shrink-0" />
                      <span className="truncate font-medium text-foreground">
                        Certificate: {a.evidenceName || `${a.type}-certificate.pdf`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {a.evidenceUrl && (
                        <a
                          href={normalizeExternalUrl(a.evidenceUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium hover:bg-muted"
                        >
                          <ExternalLink className="size-3" />
                          <span>Link ↗</span>
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1"
                        onClick={() => openAchievementDoc(a, student)}
                      >
                        <Eye className="size-3" />
                        <span>View Document</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t pt-3">
                    <Button size="sm" onClick={() => p.reviewAchievement(a.id, true)}>
                      Verify &amp; Approve
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

      {/* Reject Self-Placement Modal */}
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
              placeholder="e.g. Joining letter missing or illegible — please re-submit"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectSP(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                if (rejectSP && reason.trim()) p.reviewSelfPlacement(rejectSP, false, reason.trim())
                setRejectSP(null)
                setReason('')
              }}
            >
              Reject self-placement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Document & Certificate Preview Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          open={Boolean(viewingDoc)}
          onOpenChange={(open) => !open && setViewingDoc(null)}
          doc={viewingDoc}
          student={viewingStudent}
          internship={viewingInternship}
        />
      )}
    </>
  )
}
