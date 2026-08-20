'use client'

import { FileCheck, FileX, Eye, ShieldCheck, FileText, CheckCircle2, XCircle } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { DocumentViewerModal } from '@/components/portal/document-viewer'
import { usePortal } from '@/lib/store'
import type { InternshipDocument } from '@/lib/types'

function DocChip({ ok, label }: { ok: boolean; label: string }) {
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

export default function VerificationsPage() {
  const p = usePortal()
  const pendingStudents = p.students.filter((s) => s.status === 'pending')
  const pendingCompanies = p.companies.filter((c) => c.status === 'pending')

  const [rejectTarget, setRejectTarget] = useState<{ kind: 'student' | 'company'; id: string; name: string } | null>(null)
  const [warningTarget, setWarningTarget] = useState<{ kind: 'student' | 'company'; id: string; name: string; missing: string } | null>(null)
  const [reason, setReason] = useState('')
  const [viewDoc, setViewDoc] = useState<InternshipDocument | null>(null)

  const handleApproveStudent = (s: typeof pendingStudents[0]) => {
    const missing: string[] = []
    if (!s.resumeUploaded) missing.push('Resume')
    if (!s.idDocsUploaded) missing.push('College ID / Identity Document')
    if (missing.length > 0) {
      setWarningTarget({ kind: 'student', id: s.id, name: s.name, missing: missing.join(' and ') })
    } else {
      p.verifyStudent(s.id, true)
    }
  }

  const handleApproveCompany = (c: typeof pendingCompanies[0]) => {
    if (!c.certificateUploaded) {
      setWarningTarget({ kind: 'company', id: c.id, name: c.name, missing: 'Registration / Incorporation Certificate' })
    } else {
      p.verifyCompany(c.id, true)
    }
  }

  const confirmReject = () => {
    if (!rejectTarget) return
    if (!reason.trim()) {
      toast.error('Rejection Reason Required', { description: 'Please provide an explicit explanation for the rejection.' })
      return
    }
    const r = reason.trim()
    if (rejectTarget.kind === 'student') p.verifyStudent(rejectTarget.id, false, r)
    else p.verifyCompany(rejectTarget.id, false, r)
    setRejectTarget(null)
    setReason('')
  }

  const confirmWarningApprove = () => {
    if (!warningTarget) return
    if (warningTarget.kind === 'student') p.verifyStudent(warningTarget.id, true)
    else p.verifyCompany(warningTarget.id, true)
    setWarningTarget(null)
  }

  return (
    <>
      <PageHeader
        title="Verification queues"
        description="Review submitted documents and approve or reject registrations. Applicants are notified immediately."
      />
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students ({pendingStudents.length})</TabsTrigger>
          <TabsTrigger value="companies">Companies ({pendingCompanies.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-4">
          <ul className="flex flex-col gap-4">
            {pendingStudents.map((s) => (
              <li key={s.id} className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-base">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.enrollment} · {s.branch} · CGPA {s.cgpa.toFixed(1)} · {s.email}
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <DocChip ok={s.resumeUploaded} label="Resume" />
                  <DocChip ok={s.idDocsUploaded} label="ID documents" />
                  {s.skills.map((sk) => (
                    <span key={sk} className="rounded-full border bg-muted/30 px-2.5 py-0.5 text-xs text-muted-foreground">
                      {sk}
                    </span>
                  ))}
                </div>

                {/* Inspect Attached Files */}
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-3 border">
                  <p className="text-xs font-semibold text-muted-foreground mr-1">Candidate Documents:</p>
                  {s.resumeUploaded ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1"
                      onClick={() =>
                        setViewDoc({
                          id: `res_${s.id}`,
                          internshipId: 'student_reg',
                          kind: 'resume',
                          fileName: s.resumeName || `${s.name.replace(/\s+/g, '_')}_Resume.pdf`,
                          fileData: s.resumeData,
                          uploadedBy: 'student',
                          uploadedAt: 'Attached at registration',
                          status: 'uploaded',
                        })
                      }
                    >
                      <FileText className="size-3.5" />
                      View Resume PDF
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No resume attached</span>
                  )}

                  {s.idDocsUploaded && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1"
                      onClick={() =>
                        setViewDoc({
                          id: `id_${s.id}`,
                          internshipId: 'student_reg',
                          kind: 'identity_document',
                          fileName: s.idDocsName || `${s.name.replace(/\s+/g, '_')}_ID_Card.pdf`,
                          fileData: s.idDocsData,
                          uploadedBy: 'student',
                          uploadedAt: 'Attached at registration',
                          status: 'uploaded',
                        })
                      }
                    >
                      <ShieldCheck className="size-3.5" />
                      View ID Card
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                  <Button size="sm" onClick={() => handleApproveStudent(s)}>
                    <CheckCircle2 className="mr-1 size-3.5" /> Approve Student
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectTarget({ kind: 'student', id: s.id, name: s.name })}
                  >
                    <XCircle className="mr-1 size-3.5" /> Reject with reason
                  </Button>
                  <div className="ml-auto flex items-center gap-2">
                    <Label htmlFor={`mentor-${s.id}`} className="text-xs text-muted-foreground">
                      Faculty mentor
                    </Label>
                    <Select
                      value={s.facultyId ?? ''}
                      onValueChange={(v) => {
                        if (v) p.assignMentor(s.id, v)
                      }}
                    >
                      <SelectTrigger id={`mentor-${s.id}`} size="sm" className="w-56">
                        <SelectValue placeholder="Assign a mentor" />
                      </SelectTrigger>
                      <SelectContent>
                        {p.faculty.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name} — {f.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </li>
            ))}
            {pendingStudents.length === 0 && (
              <li className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No students awaiting verification. All candidate accounts are processed.
              </li>
            )}
          </ul>
        </TabsContent>
        <TabsContent value="companies" className="mt-4">
          <ul className="flex flex-col gap-4">
            {pendingCompanies.map((c) => (
              <li key={c.id} className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-base">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.industry} · {c.location} · HR: {c.hrName} ({c.hrEmail})
                    </p>
                    {c.addedByStudentId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Suggested by student:{' '}
                        {p.students.find((s) => s.id === c.addedByStudentId)?.name}
                      </p>
                    )}
                  </div>
                  <StatusBadge status="pending" />
                </div>
                <p className="text-sm text-muted-foreground">{c.about}</p>
                <div className="flex flex-wrap gap-2">
                  <DocChip ok={c.certificateUploaded} label="Registration certificate" />
                </div>
                <div className="flex gap-2 border-t pt-4">
                  <Button size="sm" onClick={() => handleApproveCompany(c)}>
                    <CheckCircle2 className="mr-1 size-3.5" /> Approve Company
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectTarget({ kind: 'company', id: c.id, name: c.name })}
                  >
                    <XCircle className="mr-1 size-3.5" /> Reject with reason
                  </Button>
                </div>
              </li>
            ))}
            {pendingCompanies.length === 0 && (
              <li className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No companies awaiting verification. All hiring partners are processed.
              </li>
            )}
          </ul>
        </TabsContent>
      </Tabs>

      {/* Reject Modal */}
      <Dialog open={Boolean(rejectTarget)} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.name}</DialogTitle>
            <DialogDescription>
              Provide a clear reason for rejecting this registration. The applicant will be notified immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Rejection reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Incomplete verification documents or invalid college enrollment number."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!reason.trim()} onClick={confirmReject}>
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missing Doc Approval Warning */}
      <Dialog open={Boolean(warningTarget)} onOpenChange={() => setWarningTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve with missing documents?</DialogTitle>
            <DialogDescription>
              {warningTarget?.name} is missing {warningTarget?.missing}. Do you still want to approve this registration?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmWarningApprove}>Approve anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      {viewDoc && (
        <DocumentViewerModal
          open={Boolean(viewDoc)}
          onOpenChange={(open) => !open && setViewDoc(null)}
          doc={viewDoc}
          student={p.students.find((s) => viewDoc.id.includes(s.id)) || p.students[0]}
        />
      )}
    </>
  )
}
