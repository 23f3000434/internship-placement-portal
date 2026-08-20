'use client'

import { useState } from 'react'
import { Check, FileCheck, FileUp, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'
import { cn } from '@/lib/utils'
import { validateUploadedFile } from '@/lib/file-validation'
import { toast } from 'sonner'

function UploadToggle({
  id,
  label,
  required,
  checked,
  onChange,
}: {
  id: string
  label: string
  required?: boolean
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const check = await validateUploadedFile(f, ['pdf', 'image'])
      if (!check.valid) {
        toast.error('File Upload Blocked', { description: check.error || 'Invalid file format or signature.' })
        e.target.value = ''
        setFileName(null)
        onChange(false)
        return
      }
      setFileName(f.name)
      onChange(true)
    }
  }

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors',
        checked ? 'border-foreground bg-muted/20' : 'border-dashed hover:bg-muted/50',
      )}
    >
      <input
        id={id}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        className="sr-only"
        onChange={handleFile}
      />
      {checked ? (
        <FileCheck className="size-4 shrink-0 text-foreground" aria-hidden />
      ) : (
        <FileUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span className="flex-1 min-w-0">
        <span className={cn('block font-medium truncate', !checked && 'text-muted-foreground')}>
          {fileName || label}
        </span>
        <span className="block text-xs text-muted-foreground">
          {checked
            ? fileName
              ? `${fileName} · Attached`
              : 'Document verified & attached'
            : required
              ? 'Required — click to select file'
              : 'Optional — click to select file'}
        </span>
      </span>
      {checked && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setFileName(null)
            onChange(false)
          }}
        >
          Remove
        </Button>
      )}
    </label>
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
  const [offerLetter, setOfferLetter] = useState(false)
  const [joiningLetter, setJoiningLetter] = useState(false)
  const [certificate, setCertificate] = useState(false)
  const [noc, setNoc] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const dateRangeValid = !startDate || !endDate || new Date(endDate) > new Date(startDate)

  const valid =
    companyName.trim() &&
    role.trim() &&
    location.trim() &&
    startDate &&
    endDate &&
    dateRangeValid &&
    offerLetter &&
    joiningLetter &&
    confirm

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || !dateRangeValid) return
    p.submitSelfPlacement({
      companyName: companyName.trim(),
      role: role.trim(),
      location: location.trim(),
      startDate,
      endDate,
      stipend: Number(stipend) || 0,
      offerLetterUploaded: offerLetter,
      joiningLetterUploaded: joiningLetter,
      certificateUploaded: certificate,
      nocUploaded: noc,
    })
    setCompanyName('')
    setRole('')
    setLocation('')
    setStartDate('')
    setEndDate('')
    setStipend('')
    setOfferLetter(false)
    setJoiningLetter(false)
    setCertificate(false)
    setNoc(false)
    setConfirm(false)
  }

  return (
    <>
      <PageHeader
        title="Self-placed internship"
        description="Register an off-campus internship found independently. Faculty verifies the offer and joining letters before credits are approved."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="flex flex-col gap-6 rounded-lg border bg-card p-5 lg:col-span-3">
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
            <div className="flex flex-col gap-1.5">
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
            <legend className="mb-1 text-sm font-medium">Documents</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <UploadToggle id="sp-offer" label="Offer letter" required checked={offerLetter} onChange={setOfferLetter} />
              <UploadToggle id="sp-joining" label="Joining letter" required checked={joiningLetter} onChange={setJoiningLetter} />
              <UploadToggle id="sp-cert" label="Internship certificate" checked={certificate} onChange={setCertificate} />
              <UploadToggle id="sp-noc" label="NOC from college" checked={noc} onChange={setNoc} />
            </div>
            <p className="text-xs text-muted-foreground">
              The certificate can be uploaded later, after the internship completes. NOC is optional.
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
            <Button type="submit" disabled={!valid || me?.status !== 'approved'}>
              Submit for faculty verification
            </Button>
            {me?.status !== 'approved' && (
              <p className="mt-2 text-xs text-muted-foreground">
                Your account must be verified before submitting a self-placement.
              </p>
            )}
          </div>
        </form>

        <section className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">My submissions</h2>
          <ul className="flex flex-col gap-3">
            {mine.map((sp) => (
              <li key={sp.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
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
                <ul className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    ['Offer letter', sp.offerLetterUploaded],
                    ['Joining letter', sp.joiningLetterUploaded],
                    ['Certificate', sp.certificateUploaded],
                    ['NOC', sp.nocUploaded],
                  ].map(([label, uploaded]) => (
                    <li
                      key={label as string}
                      className={cn(
                        'flex items-center gap-1 rounded-full border px-2 py-0.5',
                        uploaded
                          ? 'border-foreground font-medium'
                          : 'border-dashed text-muted-foreground',
                      )}
                    >
                      {uploaded ? (
                        <Check className="size-3" aria-hidden />
                      ) : (
                        <Minus className="size-3" aria-hidden />
                      )}
                      {label as string}
                      <span className="sr-only">{uploaded ? 'uploaded' : 'not uploaded'}</span>
                    </li>
                  ))}
                </ul>
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
    </>
  )
}
