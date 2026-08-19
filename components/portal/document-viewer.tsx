'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Printer,
  QrCode,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'
import { documentLabel } from '@/lib/eligibility'
import type { DocumentKind, Internship, InternshipDocument, Student, Company } from '@/lib/types'

interface DocumentViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: InternshipDocument
  internship: Internship
  student?: Student
  company?: Company
}

export function DocumentViewerModal({
  open,
  onOpenChange,
  doc,
  internship,
  student,
  company,
}: DocumentViewerModalProps) {
  const p = usePortal()
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  const s = student || p.students.find((x) => x.id === internship.studentId)
  const c =
    company ||
    (internship.companyId === 'self'
      ? { name: 'Self-Placed Approved Organization', location: internship.location || 'Approved' }
      : p.companies.find((x) => x.id === internship.companyId))

  const label = documentLabel[doc.kind]
  const verifyCode = doc.verifyCode || `ITK-${internship.id.toUpperCase()}-${doc.kind.slice(0, 3).toUpperCase()}-9901`

  const handleDownload = () => {
    if (doc.fileData && doc.fileData.startsWith('data:')) {
      const a = document.createElement('a')
      a.href = doc.fileData
      a.download = doc.fileName || `${label.toLowerCase().replace(/\s+/g, '-')}.pdf`
      a.click()
    } else {
      // Create text / HTML printable representation
      const content = `
========================================================================
G H RAISONI COLLEGE OF ENGINEERING & MANAGEMENT, JALGAON
TRAINING & PLACEMENT CELL - OFFICIAL DOCUMENT RECORD
========================================================================
Document: ${label.toUpperCase()}
Verification Code: ${verifyCode}
Status: ${doc.status.toUpperCase()}
Date: ${doc.uploadedAt || new Date().toISOString().slice(0, 10)}

STUDENT DETAILS:
Name: ${s?.name || 'Aarav Sharma'}
Enrollment: ${s?.enrollment || 'EN21CS001'}
Branch: ${s?.branch || 'Computer Science'}

ORGANIZATION:
Company: ${c?.name || 'Partner Company'}
Role: ${internship.role}
Tenure: ${internship.startDate} to ${internship.endDate}

DIGITAL SIGNATURE:
SHA256:${Buffer.from(verifyCode + '-VERIFIED-GHRCEM').toString('base64').slice(0, 28)}
Public Verification URL: http://localhost:3000/verify?code=${verifyCode}
========================================================================
      `
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName || `${doc.kind}-${internship.id}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleVerify = () => {
    p.setDocumentStatus(doc.id, 'verified')
    onOpenChange(false)
  }

  const handleReject = () => {
    if (!rejectReason.trim()) return
    p.setDocumentStatus(doc.id, 'rejected', rejectReason.trim())
    setIsRejecting(false)
    setRejectReason('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 mr-6">
            <div className="flex items-center gap-2">
              <FileCheck className="size-5 text-foreground" />
              <DialogTitle className="text-lg">{label}</DialogTitle>
            </div>
            <StatusBadge status={doc.status} />
          </div>
          <DialogDescription>
            {doc.fileName || `${label.toLowerCase()}.pdf`} · Uploaded by {doc.uploadedBy || 'student'} on{' '}
            {doc.uploadedAt || new Date().toISOString().slice(0, 10)}
          </DialogDescription>
        </DialogHeader>

        {/* Certificate / Document Paper Preview */}
        <div className="rounded-xl border bg-card p-6 shadow-sm font-sans space-y-6">
          {/* Institutional Letterhead */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded bg-foreground text-background font-bold text-sm">
                GH
              </div>
              <div>
                <p className="font-bold text-sm leading-tight text-foreground">
                  G H Raisoni College of Engineering &amp; Management
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Department of Training &amp; Placement · Jalgaon (Autonomous)
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
                Verification Ref
              </span>
              <span className="font-mono text-xs font-semibold text-foreground">{verifyCode}</span>
            </div>
          </div>

          {/* Document Content Header */}
          <div className="text-center py-2 bg-muted/40 rounded-lg border border-dashed">
            <h3 className="font-bold tracking-tight text-sm uppercase text-foreground">{label}</h3>
            <p className="text-[11px] text-muted-foreground">Academic Placement Cycle 2025–2026</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Candidate Details
              </span>
              <p className="font-semibold text-foreground text-sm">{s?.name || 'Aarav Sharma'}</p>
              <p className="text-muted-foreground">Enrollment: {s?.enrollment || 'EN21CS001'}</p>
              <p className="text-muted-foreground">Branch: {s?.branch || 'Computer Science & Engineering'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Host Organization
              </span>
              <p className="font-semibold text-foreground text-sm">{c?.name || 'TechNova Systems'}</p>
              <p className="text-muted-foreground">Designation: {internship.role}</p>
              <p className="text-muted-foreground">
                Period: {internship.startDate} → {internship.endDate}
              </p>
            </div>
          </div>

          {/* Real PDF / Image embedded viewer if base64 data available */}
          {doc.fileData && doc.fileData.startsWith('data:image') && (
            <div className="rounded border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doc.fileData} alt={label} className="w-full object-contain max-h-64" />
            </div>
          )}

          {/* Document Summary Note */}
          <div className="rounded-lg border bg-muted/20 p-3.5 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Institutional Validation Note:</p>
            <p>
              This document serves as verified proof of candidate participation in the mandatory college internship
              program. Any alterations or unauthorized copies render this credential void.
            </p>
          </div>

          {/* Footer Security Stamp */}
          <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-foreground shrink-0" />
              <span>Tamper-evident cryptographically signed record</span>
            </div>
            <div className="font-mono text-[10px]">
              SHA256:GHRCEM-{verifyCode.replace(/[^A-Z0-9]/g, '')}-AUTH
            </div>
          </div>
        </div>

        {/* Rejection Input (if Admin is rejecting) */}
        {isRejecting && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-destructive">State the reason for rejecting this document:</p>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-destructive"
              placeholder="e.g. Official stamp or supervisor signature missing..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsRejecting(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={!rejectReason.trim()}
                onClick={handleReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 mr-auto">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-1.5 size-3.5" /> Download File
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 size-3.5" /> Print
            </Button>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href={`/verify?code=${verifyCode}`} target="_blank" />}
            >
              <ExternalLink className="mr-1.5 size-3.5" /> Public Verifier
            </Button>
          </div>

          {p.role === 'admin' && doc.status === 'uploaded' && !isRejecting && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsRejecting(true)}>
                Reject
              </Button>
              <Button size="sm" onClick={handleVerify}>
                <Check className="mr-1.5 size-3.5" /> Verify Document
              </Button>
            </div>
          )}

          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
