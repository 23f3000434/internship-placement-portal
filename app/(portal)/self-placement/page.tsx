'use client'

import { useState } from 'react'
import { Check, Eye, FileCheck, FileUp, Link2, Minus, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { DocumentViewerModal, normalizeExternalUrl } from '@/components/portal/document-viewer'
import { usePortal } from '@/lib/store'
import { cn } from '@/lib/utils'
import { validateUploadedFile } from '@/lib/file-validation'
import type { DocumentKind, InternshipDocument, SelfPlacement } from '@/lib/types'
import { toast } from 'sonner'

export interface DocUploadInfo {
  uploaded: boolean
  name?: string
  data?: string
  url?: string
}

function UploadToggle({
  id,
  label,
  required,
  value,
  onChange,
}: {
  id: string
  label: string
  required?: boolean
  value: DocUploadInfo
  onChange: (info: DocUploadInfo) => void
}) {
  const [mode, setMode] = useState<'file' | 'url'>('file')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const validation = await validateUploadedFile(f, ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
      if (!validation.ok) {
        toast.error('File Upload Blocked', { description: validation.reason })
        e.target.value = ''
        onChange({ uploaded: false })
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        onChange({
          uploaded: true,
          name: f.name,
          data: event.target?.result as string,
        })
      }
      reader.readAsDataURL(f)
      toast.success(`${label} Attached`, { description: f.name })
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 text-left text-sm transition-colors',
        value.uploaded ? 'border-primary bg-primary/5' : 'border-dashed hover:bg-muted/40',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{label} {required && <span className="text-destructive">*</span>}</span>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors',
              mode === 'file' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            File
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors',
              mode === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            Drive Link
          </button>
        </div>
      </div>

      {mode === 'file' ? (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="flex-1 flex items-center gap-2 cursor-pointer min-w-0">
            <input
              id={id}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="sr-only"
              onChange={handleFile}
            />
            {value.uploaded ? (
              <FileCheck className="size-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <FileUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <span className={cn('block font-medium truncate text-xs', !value.uploaded && 'text-muted-foreground')}>
                {value.name || `Upload ${label}`}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {value.uploaded ? `${value.name} · Attached` : required ? 'Required file' : 'Optional file'}
              </span>
            </div>
          </label>
          {value.uploaded && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.preventDefault()
                onChange({ uploaded: false })
              }}
            >
              Remove
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="relative">
            <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={value.url || ''}
              onChange={(e) => {
                const val = e.target.value
                onChange({
                  uploaded: Boolean(val.trim()),
                  name: `Drive: ${label}`,
                  url: normalizeExternalUrl(val.trim()),
                })
              }}
              placeholder="https://drive.google.com/file/..."
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function SelfPlacementPage() {
  const p = usePortal()
  const currentStudentId = p.authSession?.userId || p.actingStudentId || 's1'
  const me = p.students.find((s) => s.id === currentStudentId) || p.students[0]
  const mine = p.selfPlacements.filter((sp) => sp.studentId === currentStudentId).slice().reverse()

  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stipend, setStipend] = useState('')
  const [offerDoc, setOfferDoc] = useState<DocUploadInfo>({ uploaded: false })
  const [joiningDoc, setJoiningDoc] = useState<DocUploadInfo>({ uploaded: false })
  const [certDoc, setCertDoc] = useState<DocUploadInfo>({ uploaded: false })
  const [nocDoc, setNocDoc] = useState<DocUploadInfo>({ uploaded: false })
  const [confirm, setConfirm] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<InternshipDocument | null>(null)

  const dateRangeValid = !startDate || !endDate || new Date(endDate) > new Date(startDate)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    if (me?.status !== 'approved') {
      toast.error('Account Approval Pending', {
        description: 'Your student account is awaiting T&P admin verification. Registration will be enabled once approved.',
      })
      return
    }

    if (!companyName.trim()) {
      toast.error('Company Name Required', { description: 'Please enter the hiring organization name.' })
      return
    }

    if (!role.trim()) {
      toast.error('Role Required', { description: 'Please enter your internship role or title.' })
      return
    }

    if (!location.trim()) {
      toast.error('Location Required', { description: 'Please enter the internship work location or Remote.' })
      return
    }

    if (!startDate || !endDate) {
      toast.error('Timeline Required', { description: 'Please select both start date and end date.' })
      return
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('Invalid Date Range', { description: 'Internship end date must be strictly after the start date.' })
      return
    }

    if (!offerDoc.uploaded && !joiningDoc.uploaded) {
      toast.error('Verification Document Required', {
        description: 'Please provide at least your Offer Letter or Joining Letter (File or Drive Link).',
      })
      return
    }

    if (!confirm) {
      toast.error('Declaration Required', {
        description: 'Please check the confirmation box before submitting.',
      })
      return
    }

    p.submitSelfPlacement({
      companyName: companyName.trim(),
      role: role.trim(),
      location: location.trim(),
      startDate,
      endDate,
      stipend: Number(stipend) || 0,
      offerLetterUploaded: offerDoc.uploaded,
      offerLetterName: offerDoc.name,
      offerLetterData: offerDoc.data,
      offerLetterUrl: offerDoc.url,
      joiningLetterUploaded: joiningDoc.uploaded,
      joiningLetterName: joiningDoc.name,
      joiningLetterData: joiningDoc.data,
      joiningLetterUrl: joiningDoc.url,
      certificateUploaded: certDoc.uploaded,
      certificateName: certDoc.name,
      certificateData: certDoc.data,
      certificateUrl: certDoc.url,
      nocUploaded: nocDoc.uploaded,
      nocName: nocDoc.name,
      nocData: nocDoc.data,
      nocUrl: nocDoc.url,
    })

    setCompanyName('')
    setRole('')
    setLocation('')
    setStartDate('')
    setEndDate('')
    setStipend('')
    setOfferDoc({ uploaded: false })
    setJoiningDoc({ uploaded: false })
    setCertDoc({ uploaded: false })
    setNocDoc({ uploaded: false })
    setConfirm(false)
  }

  const openDocViewer = (sp: SelfPlacement, kind: DocumentKind) => {
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

  return (
    <>
      <PageHeader
        title="Self-placed internship"
        description="Register an off-campus internship found independently. Faculty verifies the offer and joining letters before credits are approved."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="flex flex-col gap-6 rounded-lg border bg-card p-5 lg:col-span-3 shadow-xs">
          <div>
            <h2 className="text-sm font-semibold">Internship details</h2>
            <p className="text-xs text-muted-foreground">All fields except stipend are mandatory.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="sp-company">Company name</Label>
              <Input
                id="sp-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Precision Auto Components"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="sp-role">Role / designation</Label>
              <Input
                id="sp-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. CAD Intern"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="sp-location">Internship location (city)</Label>
              <Input
                id="sp-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Nashik — use Remote if you work from home"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-start">Start date</Label>
              <Input
                id="sp-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-end">End date</Label>
              <Input
                id="sp-end"
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              {!dateRangeValid && (
                <span className="text-[11px] text-destructive font-medium">
                  End date must be after start date.
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="sp-stipend">Stipend (₹/month)</Label>
              <Input
                id="sp-stipend"
                type="number"
                min="0"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Verification Documents</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <UploadToggle id="sp-offer" label="Offer letter" required value={offerDoc} onChange={setOfferDoc} />
              <UploadToggle id="sp-joining" label="Joining letter" value={joiningDoc} onChange={setJoiningDoc} />
              <UploadToggle id="sp-cert" label="Internship certificate" value={certDoc} onChange={setCertDoc} />
              <UploadToggle id="sp-noc" label="NOC from college" value={nocDoc} onChange={setNocDoc} />
            </div>
            <p className="text-xs text-muted-foreground">
              Offer letter or joining letter is required. You can provide a PDF/image or Google Drive link.
            </p>
          </fieldset>
          <div className="flex items-start gap-2">
            <Checkbox
              id="sp-confirm"
              checked={confirm}
              onCheckedChange={(v) => setConfirm(v === true)}
            />
            <Label htmlFor="sp-confirm" className="text-sm font-normal leading-snug text-muted-foreground">
              I confirm the details are accurate and understand that faculty will verify these
              documents before the internship is approved.
            </Label>
          </div>
          <div>
            <Button type="submit" className="w-full sm:w-auto">
              Submit for faculty verification
            </Button>
            {me?.status !== 'approved' && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                Note: Candidate account is currently pending T&amp;P admin approval.
              </p>
            )}
          </div>
        </form>

        <section className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">My submissions</h2>
          <ul className="flex flex-col gap-3">
            {mine.map((sp) => (
              <li key={sp.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{sp.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {sp.role}
                      {sp.location && ` · ${sp.location}`} · {sp.startDate} → {sp.endDate}
                      {sp.stipend > 0 && ` · ₹${sp.stipend.toLocaleString('en-IN')}/mo`}
                    </p>
                  </div>
                  <StatusBadge status={sp.status} />
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs border-t pt-2.5">
                  {sp.offerLetterUploaded && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => openDocViewer(sp, 'offer_letter')}
                    >
                      <Eye className="size-3" />
                      <span>Offer Letter</span>
                    </Button>
                  )}
                  {sp.joiningLetterUploaded && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => openDocViewer(sp, 'joining_letter')}
                    >
                      <Eye className="size-3" />
                      <span>Joining Letter</span>
                    </Button>
                  )}
                  {sp.nocUploaded && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => openDocViewer(sp, 'acceptance')}
                    >
                      <Eye className="size-3" />
                      <span>NOC</span>
                    </Button>
                  )}
                  {sp.certificateUploaded && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => openDocViewer(sp, 'completion_certificate')}
                    >
                      <Eye className="size-3" />
                      <span>Certificate</span>
                    </Button>
                  )}
                </div>
                {sp.status === 'rejected' && sp.reason && (
                  <p className="text-xs text-muted-foreground">Reason: {sp.reason}</p>
                )}
                {sp.status === 'approved' && (
                  <p className="text-xs text-muted-foreground">
                    Approved by faculty — internship tracking is active.
                  </p>
                )}
              </li>
            ))}
            {mine.length === 0 && (
              <li className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No self-placements submitted yet.
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
          student={me}
        />
      )}
    </>
  )
}
