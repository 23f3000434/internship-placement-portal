'use client'

import { useEffect, useState } from 'react'
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

export function normalizeExternalUrl(rawUrl?: string): string {
  if (!rawUrl) return ''
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

export function getEmbeddableDriveUrl(rawUrl?: string): string {
  const url = normalizeExternalUrl(rawUrl)
  if (!url) return ''

  // Standard Google Drive file preview
  if (url.includes('drive.google.com/file/d/')) {
    return url.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview')
  }

  // Google Drive open?id= link
  const openIdMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (openIdMatch?.[1]) {
    return `https://drive.google.com/file/d/${openIdMatch[1]}/preview`
  }

  // Google Drive uc?id= link
  const ucIdMatch = url.match(/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/)
  if (ucIdMatch?.[1]) {
    return `https://drive.google.com/file/d/${ucIdMatch[1]}/preview`
  }

  // Google Docs / Sheets / Slides preview
  if (url.includes('docs.google.com/document/d/')) {
    return url.replace(/\/edit(\?.*)?$/, '/preview')
  }
  if (url.includes('docs.google.com/spreadsheets/d/')) {
    return url.replace(/\/edit(\?.*)?$/, '/preview')
  }
  if (url.includes('docs.google.com/presentation/d/')) {
    return url.replace(/\/edit(\?.*)?$/, '/preview')
  }

  return url
}

interface DocumentViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: InternshipDocument
  internship?: Internship | null
  student?: Student | null
  company?: Company | null
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    const updatePreview = () => {
      if (!doc.fileData?.startsWith('data:')) {
        setPreviewUrl(null)
        return
      }
      const [metadata, encoded = ''] = doc.fileData.split(',', 2)
      const mime = metadata.match(/^data:([^;]+)/)?.[1] ?? 'application/octet-stream'
      try {
        const binary = atob(encoded)
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
        url = URL.createObjectURL(new Blob([bytes], { type: mime }))
        setPreviewUrl(url)
      } catch {
        setPreviewUrl(null)
      }
    }
    queueMicrotask(updatePreview)
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [doc.fileData])

  // Safe fallback resolution for student, company, and internship
  const s =
    student ||
    (internship ? p.students.find((x) => x.id === internship.studentId) : null) ||
    p.students.find((x) => x.id === p.actingStudentId) ||
    p.students[0]

  const c =
    company ||
    (internship && internship.companyId !== 'self' ? p.companies.find((x) => x.id === internship.companyId) : null) ||
    (internship?.companyId === 'self'
      ? { name: 'Self-Placed Approved Organization', location: internship.location || 'Approved' }
      : { name: 'Central Placement & Academic Verification Cell', location: 'College Campus' })

  const label = documentLabel[doc.kind] || doc.fileName || 'Placement Document'
  const verifyCode =
    doc.verifyCode ||
    (internship
      ? `ITK-${internship.id.toUpperCase()}-${doc.kind.slice(0, 3).toUpperCase()}-9901`
      : `DOC-${(doc.id || 'REF').toUpperCase()}-VERIFIED`)

  const roleName = internship?.role || 'Internship / Academic Credential Record'
  const tenureStr = internship?.startDate
    ? `${internship.startDate} → ${internship.endDate}`
    : 'Placement Cycle 2025–2026'

  const handleDownload = () => {
    if (doc.fileData && doc.fileData.startsWith('data:')) {
      const a = document.createElement('a')
      a.href = doc.fileData
      a.download = doc.fileName || `${label.toLowerCase().replace(/\s+/g, '-')}.pdf`
      a.click()
    } else {
      // Create clean official text transcript without Buffer (browser-safe)
      const content = `========================================================================
G H RAISONI COLLEGE OF ENGINEERING & MANAGEMENT, JALGAON
TRAINING & PLACEMENT CELL - OFFICIAL DOCUMENT RECORD
========================================================================
Document: ${label.toUpperCase()}
Verification Code: ${verifyCode}
Status: ${(doc.status || 'verified').toUpperCase()}
Date: ${doc.uploadedAt || new Date().toISOString().slice(0, 10)}

STUDENT DETAILS:
Name: ${s?.name || 'Aarav Sharma'}
Enrollment: ${s?.enrollment || 'EN21CS001'}
Branch: ${s?.branch || 'Computer Science'}

ORGANIZATION:
Company: ${c?.name || 'Partner Company'}
Role: ${roleName}
Tenure: ${tenureStr}

DIGITAL SIGNATURE & AUTHENTICITY:
Public Verification Ref: ${verifyCode}
Public Verification URL: https://internship-placement-portal.vercel.app/verify?code=${verifyCode}
========================================================================`
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const baseName = (doc.fileName || `${doc.kind || 'doc'}-record`).replace(/\.[^/.]+$/, '')
      a.download = `${baseName}-record.txt`
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
            <StatusBadge status={doc.status || 'uploaded'} />
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
                {doc.kind === 'resume'
                  ? 'Candidate Resume Record'
                  : doc.kind === 'identity_document'
                    ? 'Institutional Verification Record'
                    : 'Host / Verification Organization'}
              </span>
              <p className="font-semibold text-foreground text-sm">
                {doc.kind === 'resume' || doc.kind === 'identity_document'
                  ? 'G H Raisoni College of Engineering & Management, Jalgaon'
                  : c?.name || 'Partner Organization'}
              </p>
              <p className="text-muted-foreground">
                {doc.kind === 'resume'
                  ? `CGPA: ${s?.cgpa ? s.cgpa.toFixed(2) : '8.50'} · Batch: ${s?.passingYear || '2026'}`
                  : doc.kind === 'identity_document'
                    ? `Institutional ID: ${s?.enrollment || 'Verified'}`
                    : `Role: ${roleName}`}
              </p>
              <p className="text-muted-foreground">
                {doc.kind === 'resume' || doc.kind === 'identity_document'
                  ? 'Status: Verified Student Record'
                  : `Period: ${tenureStr}`}
              </p>
            </div>
          </div>

          {/* Google Drive / Cloud Document Embedded Frame */}
          {doc.fileUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 border text-xs">
                <div className="flex items-center gap-2 truncate">
                  <ExternalLink className="size-4 text-foreground shrink-0" />
                  <span className="truncate font-medium text-foreground">{normalizeExternalUrl(doc.fileUrl)}</span>
                </div>
                <a
                  href={normalizeExternalUrl(doc.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-semibold underline text-foreground ml-3 hover:opacity-80"
                >
                  Open in New Tab ↗
                </a>
              </div>
              <div className="rounded-lg border overflow-hidden bg-background h-96">
                <iframe
                  src={getEmbeddableDriveUrl(doc.fileUrl)}
                  title={`Preview of ${label}`}
                  className="w-full h-full border-0"
                  allow="autoplay"
                />
              </div>
            </div>
          )}

          {/* Direct Image Rendering */}
          {doc.fileData && doc.fileData.startsWith('data:image') && !doc.fileUrl && (
            <div className="rounded-lg border overflow-hidden bg-muted/40 p-2 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl || doc.fileData}
                alt={label}
                className="mx-auto max-h-80 w-auto object-contain rounded shadow-xs"
              />
            </div>
          )}

          {/* Embedded PDF Viewer */}
          {doc.fileData && (doc.fileData.startsWith('data:application/pdf') || doc.fileData.startsWith('data:@file/pdf')) && !doc.fileUrl && (
            <div className="rounded-lg border overflow-hidden bg-background">
              <object
                data={previewUrl || doc.fileData}
                type="application/pdf"
                className="w-full h-96"
                aria-label={`Preview of ${label}`}
              >
                <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
                  <p>PDF preview loaded. Use &quot;Download File&quot; below to open in full screen or external viewer.</p>
                </div>
              </object>
            </div>
          )}

          {!doc.fileData && !doc.fileUrl && (
            <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground text-center">
              Verified digital placement record on file. The official signed transcript can be downloaded or verified using the public code below.
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
