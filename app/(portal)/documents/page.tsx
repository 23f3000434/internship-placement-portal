'use client'

import { useState, useRef } from 'react'
import { PageHeader, StatCard } from '@/components/portal/page-header'
import { InternshipWorkflowCard } from '@/components/portal/internship-workflow'
import { DocumentViewerModal } from '@/components/portal/document-viewer'
import { StatusBadge } from '@/components/portal/status-badge'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePortal } from '@/lib/store'
import { documentLabel } from '@/lib/eligibility'
import type { DocumentKind, InternshipDocument } from '@/lib/types'
import { Upload, Eye, QrCode, FileText, CheckCircle2, ShieldCheck, Plus } from 'lucide-react'
import { toast } from 'sonner'

const DESCRIPTION: Record<string, string> = {
  student:
    'Every document for your internship in one ledger — offer, acceptance, joining, completion and PPO — with live verification status.',
  company:
    'Upload offer, joining and completion documents for your interns, and record pre-placement offers.',
  faculty: 'Monitor the document trail and PPO status for your mentees.',
  admin:
    'Verify or reject uploaded internship documents and track pre-placement offers across the institute.',
}

export default function DocumentsPage() {
  const p = usePortal()

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedKind, setSelectedKind] = useState<DocumentKind>('offer_letter')
  const [customDocTitle, setCustomDocTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null)
  const [viewDoc, setViewDoc] = useState<InternshipDocument | null>(null)
  const [verifyModalDoc, setVerifyModalDoc] = useState<InternshipDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const student = p.students.find((s) => s.id === p.actingStudentId)

  const internships =
    p.role === 'student'
      ? p.internships.filter((n) => n.studentId === p.actingStudentId)
      : p.role === 'company'
        ? p.internships.filter((n) => n.companyId === p.actingCompanyId)
        : p.role === 'faculty'
          ? p.internships.filter((n) => {
              const s = p.students.find((x) => x.id === n.studentId)
              return s?.facultyId === p.actingFacultyId
            })
          : p.internships

  const ids = new Set(internships.map((n) => n.id))
  // Filter docs for current role/student
  const studentDocs = p.role === 'student'
    ? p.documents.filter((d) => ids.has(d.internshipId) || d.internshipId.includes(p.actingStudentId) || d.internshipId === 'general')
    : p.documents.filter((d) => ids.has(d.internshipId))

  const awaiting = studentDocs.filter((d) => d.status === 'uploaded').length
  const verified = studentDocs.filter((d) => d.status === 'verified').length
  const outstanding = studentDocs.filter((d) => d.status === 'not_uploaded').length
  const ppos = internships.filter(
    (n) => n.ppoStatus === 'offered' || n.ppoStatus === 'accepted',
  ).length

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!customDocTitle) {
        setCustomDocTitle(file.name)
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFileDataUrl(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDirectUploadSubmit = () => {
    if (!fileDataUrl && !selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    const internshipId = internships[0]?.id || `intern_${p.actingStudentId}`
    const fileName = customDocTitle.trim() || selectedFile?.name || `${selectedKind}-${Date.now()}.pdf`

    p.uploadDocument(
      internshipId,
      selectedKind,
      fileName,
      fileDataUrl || undefined,
      selectedFile?.size,
    )

    toast.success('Document uploaded successfully', {
      description: `${documentLabel[selectedKind]} recorded in the central verification ledger.`,
    })

    setUploadModalOpen(false)
    setSelectedFile(null)
    setFileDataUrl(null)
    setCustomDocTitle('')
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Documents & PPO Ledger"
          description={DESCRIPTION[p.role]}
        />
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="gap-2 self-start sm:self-auto"
        >
          <Upload className="size-4" />
          Upload Placement Document
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Verified" value={verified} sub="documents on record" />
        <StatCard label="Awaiting T&P" value={awaiting} sub="uploaded, pending verification" />
        <StatCard label="Outstanding" value={outstanding} sub="not uploaded yet" />
        <StatCard label="PPOs" value={ppos} sub="offered or accepted" />
      </div>

      {/* Uploaded Documents List / Records */}
      {studentDocs.filter((d) => d.status !== 'not_uploaded').length > 0 && (
        <section className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recorded Placement Documents</h2>
              <p className="text-xs text-muted-foreground">
                All cryptographically logged internship and placement records with public verification hashes.
              </p>
            </div>
            <span className="text-xs font-mono bg-muted px-2.5 py-1 rounded-md text-muted-foreground">
              {studentDocs.filter((d) => d.status !== 'not_uploaded').length} files
            </span>
          </div>

          <div className="divide-y rounded-lg border">
            {studentDocs
              .filter((d) => d.status !== 'not_uploaded')
              .map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-none mb-1">
                        {documentLabel[doc.kind] || doc.fileName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {doc.fileName} · Uploaded {doc.uploadedAt} by {doc.uploadedBy}
                      </p>
                      {doc.rejectReason && (
                        <p className="text-xs text-destructive mt-1">Rejection reason: {doc.rejectReason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <StatusBadge status={doc.status} />

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewDoc(doc)}
                      className="text-xs"
                    >
                      <Eye className="mr-1 size-3.5" /> View
                    </Button>

                    {doc.verifyCode && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setVerifyModalDoc(doc)}
                        className="text-xs"
                      >
                        <QrCode className="mr-1 size-3.5" /> Verify Code
                      </Button>
                    )}

                    {p.role === 'admin' && doc.status === 'uploaded' && (
                      <Button
                        size="sm"
                        onClick={() => p.setDocumentStatus(doc.id, 'verified')}
                        className="text-xs"
                      >
                        <CheckCircle2 className="mr-1 size-3.5" /> Verify
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Active Workflows */}
      {internships.length > 0 && (
        <ul className="flex flex-col gap-4">
          {internships.map((n) => (
            <InternshipWorkflowCard key={n.id} internship={n} />
          ))}
        </ul>
      )}

      {/* Empty State when no internships yet */}
      {internships.length === 0 && studentDocs.filter((d) => d.status !== 'not_uploaded').length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <Upload className="size-6" />
          </div>
          <h3 className="text-base font-semibold">No Documents Uploaded Yet</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Upload your Offer Letter, Joining Letter, NOC, or Completion Certificate to begin tracking your placement credentials.
          </p>
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="mt-5 gap-2"
          >
            <Plus className="size-4" />
            Upload Your First Document
          </Button>
        </div>
      )}

      {/* Upload Placement Document Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Placement Document</DialogTitle>
            <DialogDescription>
              Upload an official offer letter, joining letter, completion certificate, or NOC to the placement repository.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="docKind">Document Category</Label>
              <Select
                value={selectedKind}
                onValueChange={(v) => v && setSelectedKind(v as DocumentKind)}
              >
                <SelectTrigger id="docKind">
                  <SelectValue>{documentLabel[selectedKind]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="offer_letter">Offer Letter</SelectItem>
                    <SelectItem value="joining_letter">Joining Letter / NOC</SelectItem>
                    <SelectItem value="acceptance">Acceptance Form</SelectItem>
                    <SelectItem value="completion_certificate">Completion Certificate / LOR</SelectItem>
                    <SelectItem value="ppo_letter">Pre-Placement Offer (PPO) Letter</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="docTitle">Document Name / Reference</Label>
              <Input
                id="docTitle"
                value={customDocTitle}
                onChange={(e) => setCustomDocTitle(e.target.value)}
                placeholder="e.g. Google-Offer-Letter-2026.pdf"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Attach File (PDF, PNG, JPG)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="size-8 text-muted-foreground mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  {selectedFile ? selectedFile.name : 'Click to select document file'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB selected`
                    : 'PDF, PNG, or JPG up to 10MB'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDirectUploadSubmit}>
              Upload &amp; Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Code Dialog */}
      {verifyModalDoc && (
        <Dialog open={Boolean(verifyModalDoc)} onOpenChange={() => setVerifyModalDoc(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{documentLabel[verifyModalDoc.kind]} Verification</DialogTitle>
              <DialogDescription>
                Public tamper-evident verification code. Share this code with employers or administrators to prove document validity.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6">
              <QrCode className="size-16" aria-hidden />
              <code className="text-center font-mono text-sm font-semibold tracking-wider bg-muted px-3 py-1 rounded">
                {verifyModalDoc.verifyCode}
              </code>
              <p className="text-xs text-muted-foreground text-center">
                {verifyModalDoc.fileName} · uploaded {verifyModalDoc.uploadedAt}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full text-xs"
                render={<a href={`/verify?code=${verifyModalDoc.verifyCode}`} target="_blank" rel="noreferrer" />}
              >
                Open Public Verification Link ↗
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Document Viewer */}
      {viewDoc && (
        <DocumentViewerModal
          open={Boolean(viewDoc)}
          onOpenChange={(open) => !open && setViewDoc(null)}
          doc={viewDoc}
          internship={internships.find((n) => n.id === viewDoc.internshipId)}
        />
      )}
    </>
  )
}
