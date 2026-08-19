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
import { usePortal } from '@/lib/store'

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
    const r = reason.trim() || 'Documents did not pass verification.'
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
        description="Review submitted documents and approve or reject registrations. Applicants are notified by email."
      />
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students ({pendingStudents.length})</TabsTrigger>
          <TabsTrigger value="companies">Companies ({pendingCompanies.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-4">
          <ul className="flex flex-col gap-4">
            {pendingStudents.map((s) => (
              <li key={s.id} className="flex flex-col gap-4 rounded-lg border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.enrollment} · {s.branch} · CGPA {s.cgpa.toFixed(1)} · {s.email}
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <DocChip ok={s.resumeUploaded} label="Resume" />
                  <DocChip ok={s.idDocsUploaded} label="ID documents" />
                  {s.skills.map((sk) => (
                    <span key={sk} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                      {sk}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                  <Button size="sm" onClick={() => handleApproveStudent(s)}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectTarget({ kind: 'student', id: s.id, name: s.name })}
                  >
                    Reject with reason
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
              <li className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No students awaiting verification.
              </li>
            )}
          </ul>
        </TabsContent>
        <TabsContent value="companies" className="mt-4">
          <ul className="flex flex-col gap-4">
            {pendingCompanies.map((c) => (
              <li key={c.id} className="flex flex-col gap-4 rounded-lg border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.industry} · {c.location} · HR: {c.hrName} ({c.hrEmail})
                    </p>
                    {c.addedByStudentId && (
                      <p className="text-xs text-muted-foreground">
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
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectTarget({ kind: 'company', id: c.id, name: c.name })}
                  >
                    Reject with reason
                  </Button>
                </div>
              </li>
            ))}
            {pendingCompanies.length === 0 && (
              <li className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No companies awaiting verification.
              </li>
            )}
          </ul>
        </TabsContent>
      </Tabs>

      {/* Warning Confirmation Dialog for Missing Documents */}
      <Dialog open={!!warningTarget} onOpenChange={(o) => !o && setWarningTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warning: Mandatory Document Missing</DialogTitle>
            <DialogDescription>
              {warningTarget?.name} has not uploaded: <strong>{warningTarget?.missing}</strong>.
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            According to college placement regulations, students and companies should provide valid credentials. Are you sure you want to override and grant administrative approval?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningTarget(null)}>
              Cancel
            </Button>
            <Button variant="default" onClick={confirmWarningApprove}>
              Override &amp; Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.name}</DialogTitle>
            <DialogDescription>
              The applicant is notified by email with this reason and can re-submit documents.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="verify-reason">Reason</Label>
            <Textarea
              id="verify-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. ID document mismatch — re-upload requested"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
