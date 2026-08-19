'use client'

import { useState, useRef } from 'react'
import { Check, QrCode, Upload, Eye, FileCheck, FileText, CheckCircle2, Download, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/portal/status-badge'
import { DocumentViewerModal } from '@/components/portal/document-viewer'
import { usePortal } from '@/lib/store'
import { documentLabel } from '@/lib/eligibility'
import type { DocumentKind, Internship, InternshipDocument, Role } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const DOC_ORDER: DocumentKind[] = [
  'offer_letter',
  'acceptance',
  'joining_letter',
  'completion_certificate',
  'ppo_letter',
]

/** Who is responsible for putting each document on record. */
const UPLOADER: Record<DocumentKind, Role[]> = {
  offer_letter: ['company', 'student'],
  acceptance: ['student'],
  joining_letter: ['company', 'student'],
  completion_certificate: ['company', 'student'],
  ppo_letter: ['company'],
}

function VerifyCodeDialog({ doc }: { doc: InternshipDocument }) {
  const [open, setOpen] = useState(false)
  if (!doc.verifyCode) return null
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Show verification code for ${documentLabel[doc.kind]}`}
      >
        <QrCode className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{documentLabel[doc.kind]} verification</DialogTitle>
            <DialogDescription>
              Anyone can confirm this document is genuine by quoting the code below to the T&amp;P
              cell — no login required.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6">
            <QrCode className="size-16" aria-hidden />
            <code className="text-center font-mono text-sm font-medium tracking-wider">
              {doc.verifyCode}
            </code>
            <p className="text-xs text-muted-foreground text-center">
              {doc.fileName} · uploaded {doc.uploadedAt} by {doc.uploadedBy}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full text-xs"
              render={<a href={`/verify?code=${doc.verifyCode}`} target="_blank" rel="noreferrer" />}
            >
              Open Public Verification Page ↗
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DocumentRow({ doc, internship }: { doc: InternshipDocument; internship: Internship }) {
  const p = usePortal()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [reason, setReason] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const label = documentLabel[doc.kind]
  const canUpload = UPLOADER[doc.kind].includes(p.role)
  const canVerify = p.role === 'admin'
  const pendingUpload = doc.status === 'not_uploaded' || doc.status === 'rejected'

  const defaultName = `${doc.kind.replace(/_/g, '-')}-${internship.id}.pdf`

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFileDataUrl(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleConfirmUpload = () => {
    const finalName = fileName.trim() || defaultName
    p.uploadDocument(
      internship.id,
      doc.kind,
      finalName,
      fileDataUrl || undefined,
      selectedFile?.size,
    )
    setUploadOpen(false)
    setSelectedFile(null)
    setFileDataUrl(null)
  }

  return (
    <>
      <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="truncate text-xs text-muted-foreground">
            {doc.fileName
              ? `${doc.fileName} · ${doc.uploadedBy === 'company' ? 'company' : 'student'} · ${doc.uploadedAt}`
              : `Awaiting upload by ${UPLOADER[doc.kind].join(' / ')}`}
          </p>
          {doc.status === 'rejected' && doc.rejectReason && (
            <p className="text-xs text-destructive mt-0.5">Rejected: {doc.rejectReason}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StatusBadge status={doc.status} />

          {/* View Document Action */}
          {doc.status !== 'not_uploaded' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewOpen(true)}
              className="text-xs"
            >
              <Eye className="mr-1 size-3.5" /> View
            </Button>
          )}

          {doc.status !== 'not_uploaded' && <VerifyCodeDialog doc={doc} />}

          {canUpload && pendingUpload && (
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                setFileName(defaultName)
                setSelectedFile(null)
                setFileDataUrl(null)
                setUploadOpen(true)
              }}
              className="text-xs"
            >
              <Upload className="mr-1 size-3.5" /> Upload
            </Button>
          )}

          {canVerify && doc.status === 'uploaded' && (
            <>
              <Button size="sm" onClick={() => p.setDocumentStatus(doc.id, 'verified')} className="text-xs">
                <Check className="mr-1 size-3.5" /> Verify
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)} className="text-xs">
                Reject
              </Button>
            </>
          )}
        </div>
      </li>

      {/* View Document Modal */}
      <DocumentViewerModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        doc={doc}
        internship={internship}
      />

      {/* Interactive Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload {label}</DialogTitle>
            <DialogDescription>
              Upload your official signed document (PDF, PNG, JPG). It will be recorded in the centralized portal.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* File Drop / Select Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="size-8 text-muted-foreground mb-2" />
              <p className="text-xs font-semibold text-foreground">
                {selectedFile ? selectedFile.name : 'Click to select document file'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selectedFile
                  ? `${Math.round(selectedFile.size / 1024)} KB · Ready to upload`
                  : 'PDF, DOCX, PNG, JPG up to 10 MB'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`file-${doc.id}`}>Document record name</Label>
              <Input
                id={`file-${doc.id}`}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={defaultName}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUpload}>
              Upload and Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {label.toLowerCase()}</DialogTitle>
            <DialogDescription>
              The student is emailed this reason and can re-upload the document.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`reject-${doc.id}`}>Reason</Label>
            <Textarea
              id={`reject-${doc.id}`}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Scan is unreadable / signature missing / wrong company letterhead…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                p.setDocumentStatus(doc.id, 'rejected', reason.trim())
                setRejectOpen(false)
                setReason('')
              }}
            >
              Reject document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Journey({ internship }: { internship: Internship }) {
  const p = usePortal()
  const docs = p.documents.filter((d) => d.internshipId === internship.id)
  const has = (kind: DocumentKind) =>
    docs.some((d) => d.kind === kind && (d.status === 'uploaded' || d.status === 'verified'))
  const student = p.students.find((s) => s.id === internship.studentId)
  const reports = p.weeklyReports.filter((w) => w.internshipId === internship.id)

  const steps = [
    { label: 'Registration', done: Boolean(student) },
    { label: 'Profile verified', done: student?.status === 'approved' },
    {
      label: internship.type === 'self' ? 'Self-placement approved' : 'Applied & selected',
      done: true,
    },
    { label: 'Offer letter', done: has('offer_letter') },
    { label: 'Acceptance', done: has('acceptance') },
    { label: 'Joining letter', done: has('joining_letter') },
    { label: 'Progress tracked', done: reports.length > 0 },
    { label: 'Completion certificate', done: has('completion_certificate') },
    { label: 'PPO', done: internship.ppoStatus === 'offered' || internship.ppoStatus === 'accepted' },
  ]

  return (
    <ol className="flex flex-wrap gap-x-1 gap-y-2">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-1">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs',
              s.done
                ? 'border-foreground bg-foreground text-background font-medium'
                : 'border-dashed border-muted-foreground text-muted-foreground',
            )}
          >
            <span className="tabular-nums">{i + 1}</span>
            {s.label}
          </span>
          {i < steps.length - 1 && <span aria-hidden className="h-px w-2 bg-border" />}
        </li>
      ))}
    </ol>
  )
}

function PpoPanel({ internship }: { internship: Internship }) {
  const p = usePortal()
  const [open, setOpen] = useState(false)
  const [pkg, setPkg] = useState('900000')
  const [note, setNote] = useState('')

  const isCompany = p.role === 'company'
  const isStudent = p.role === 'student'
  const student = p.students.find((s) => s.id === internship.studentId)

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Pre-placement offer (PPO)</h3>
          <p className="text-xs text-muted-foreground">
            {internship.ppoStatus === 'none'
              ? 'No PPO recommendation on record yet.'
              : internship.ppoNote || 'PPO progress recorded against this internship.'}
          </p>
        </div>
        <StatusBadge status={internship.ppoStatus} />
      </div>
      {typeof internship.ppoPackage === 'number' && internship.ppoStatus !== 'none' && (
        <p className="text-sm">
          Package offered:{' '}
          <span className="font-medium tabular-nums">
            ₹{(internship.ppoPackage / 100000).toFixed(1)} LPA
          </span>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {isCompany && internship.ppoStatus === 'none' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              p.setPpoStatus(internship.id, 'recommended', {
                note: `Recommended by supervisor based on internship performance.`,
              })
            }
          >
            Recommend for PPO
          </Button>
        )}
        {isCompany && (internship.ppoStatus === 'recommended' || internship.ppoStatus === 'none') && (
          <Button size="sm" onClick={() => setOpen(true)}>
            Issue pre-placement offer
          </Button>
        )}
        {isStudent && internship.ppoStatus === 'offered' && (
          <>
            <Button size="sm" onClick={() => p.setPpoStatus(internship.id, 'accepted')}>
              Accept offer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => p.setPpoStatus(internship.id, 'declined')}
            >
              Decline
            </Button>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Issue PPO — {student?.name}</DialogTitle>
            <DialogDescription>
              The student and the T&amp;P cell are notified by email when the offer is issued.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`pkg-${internship.id}`}>Annual package (₹)</Label>
              <Input
                id={`pkg-${internship.id}`}
                type="number"
                min={0}
                step={50000}
                value={pkg}
                onChange={(e) => setPkg(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`note-${internship.id}`}>Note</Label>
              <Textarea
                id={`note-${internship.id}`}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Role, joining date and any conditions…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                p.setPpoStatus(internship.id, 'offered', {
                  ppoPackage: Number(pkg) || 0,
                  note: note.trim() || 'Pre-placement offer issued after internship review.',
                })
                setOpen(false)
              }}
            >
              Issue offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function InternshipWorkflowCard({ internship }: { internship: Internship }) {
  const p = usePortal()
  const student = p.students.find((s) => s.id === internship.studentId)
  const company = p.companies.find((c) => c.id === internship.companyId)
  const selfPlacement = p.selfPlacements.find(
    (sp) => sp.studentId === internship.studentId && sp.role === internship.role,
  )
  const docs = p.documents.filter((d) => d.internshipId === internship.id)
  const ordered = DOC_ORDER.map((kind) => docs.find((d) => d.kind === kind)).filter(
    (d): d is InternshipDocument => Boolean(d),
  )
  const verified = ordered.filter((d) => d.status === 'verified').length
  const pending = ordered.filter((d) => d.status === 'uploaded').length

  return (
    <li className="flex flex-col gap-5 rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {student?.name} — {internship.role}
          </p>
          <p className="text-sm text-muted-foreground">
            {company?.name ?? selfPlacement?.companyName ?? 'Self-placed'} ·{' '}
            {internship.type === 'self' ? 'Self-placed' : 'College drive'} · {internship.startDate} →{' '}
            {internship.endDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={internship.status} />
          <StatusBadge status={internship.ppoStatus} />
        </div>
      </div>

      <Journey internship={internship} />

      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Document ledger
          </h3>
          <p className="text-xs text-muted-foreground tabular-nums">
            {verified} verified · {pending} awaiting T&amp;P · {ordered.length - verified - pending}{' '}
            outstanding
          </p>
        </div>
        <ul className="divide-y rounded-md border">
          {ordered.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} internship={internship} />
          ))}
          {ordered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No document slots opened yet.
            </li>
          )}
        </ul>
      </section>

      <PpoPanel internship={internship} />
    </li>
  )
}
