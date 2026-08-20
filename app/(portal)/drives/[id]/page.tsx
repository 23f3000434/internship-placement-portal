'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'
import { ArrowLeft, Check, Edit3, Trash2, Users, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { checkEligibility, getDriveStatus } from '@/lib/eligibility'
import { usePortal } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Drive } from '@/lib/types'
import { toast } from 'sonner'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export default function DriveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const p = usePortal()
  const drive = p.drives.find((d) => d.id === id)
  const currentStudentId = p.authSession?.userId || p.actingStudentId || 's1'
  const currentCompanyId = p.authSession?.userId || p.actingCompanyId || 'c1'
  const me = p.role === 'student' ? p.students.find((s) => s.id === currentStudentId) || p.students[0] : null

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editField, setEditField] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editWorkMode, setEditWorkMode] = useState<Drive['workMode']>('onsite')
  const [editStipend, setEditStipend] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editOpenings, setEditOpenings] = useState('')
  const [editMinCgpa, setEditMinCgpa] = useState('')
  const [editMaxBacklogs, setEditMaxBacklogs] = useState('')
  const [editSkills, setEditSkills] = useState('')
  const [editCerts, setEditCerts] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<Drive['status']>('open')

  // Delete Modal State
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!drive) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Drive not found.{' '}
        <Link href="/drives" className="font-medium text-foreground underline underline-offset-4">
          Back to discovery
        </Link>
      </div>
    )
  }

  const lifecycleStatus = getDriveStatus(drive, p.applications)
  const company = p.companies.find((c) => c.id === drive.companyId)
  const isOwner = (p.role === 'company' && drive.companyId === currentCompanyId) || p.role === 'admin'
  const backHref = p.role === 'company' ? '/company/drives' : '/drives'
  const backLabel = p.role === 'company' ? 'Back to my drives' : 'Back to drives'
  const elig = me ? checkEligibility(me, drive) : null
  const existingApp = me
    ? p.applications.find((a) => a.driveId === drive.id && a.studentId === me.id)
    : null
  const canApply = elig?.state === 'eligible' && !existingApp && lifecycleStatus === 'open'

  const openEditModal = () => {
    setEditTitle(drive.title)
    setEditField(drive.field)
    setEditLocation(drive.location)
    setEditWorkMode(drive.workMode)
    setEditStipend(String(drive.stipend))
    setEditDuration(String(drive.durationWeeks))
    setEditOpenings(String(drive.openings))
    setEditMinCgpa(String(drive.minCgpa))
    setEditMaxBacklogs(String(drive.maxBacklogs))
    setEditSkills(drive.requiredSkills.join(', '))
    setEditCerts(drive.requiredCertifications.join(', '))
    setEditStartDate(drive.startDate)
    setEditEndDate(drive.endDate)
    setEditDeadline(drive.deadline)
    setEditDescription(drive.description)
    setEditStatus(drive.status)
    setEditOpen(true)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) {
      toast.error('Title Required')
      return
    }

    const updatedSkills = editSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const updatedCerts = editCerts
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    p.updateDrive(drive.id, {
      title: editTitle.trim(),
      field: editField.trim(),
      location: editLocation.trim(),
      workMode: editWorkMode,
      stipend: Number(editStipend) || 0,
      durationWeeks: Number(editDuration) || 12,
      openings: Number(editOpenings) || 1,
      minCgpa: Number(editMinCgpa) || 0,
      maxBacklogs: Number(editMaxBacklogs) || 0,
      requiredSkills: updatedSkills,
      requiredCertifications: updatedCerts,
      startDate: editStartDate,
      endDate: editEndDate,
      deadline: editDeadline,
      description: editDescription.trim() || drive.description,
      status: editStatus,
    })

    setEditOpen(false)
  }

  const handleDelete = () => {
    p.deleteDrive(drive.id)
    setDeleteOpen(false)
    router.push(p.role === 'company' ? '/company/drives' : '/drives')
  }

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" render={<Link href={backHref} />}>
          <ArrowLeft /> {backLabel}
        </Button>
      </div>
      <PageHeader
        title={drive.title}
        description={`${company?.name} · ${drive.field}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={lifecycleStatus} />
            {isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={openEditModal} className="gap-1.5 text-xs">
                  <Edit3 className="size-3.5" /> Edit Drive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
                {p.role === 'company' && (
                  <Button size="sm" render={<Link href="/company/applicants" />} className="gap-1.5 text-xs">
                    <Users className="size-3.5" /> Applicants
                  </Button>
                )}
              </>
            )}
            {me && (
              <>
                {existingApp ? (
                  <Button variant="outline" render={<Link href="/applications" />}>
                    Applied — view status
                  </Button>
                ) : (
                  <Button disabled={!canApply} onClick={() => p.applyToDrive(drive.id)}>
                    {lifecycleStatus === 'expired'
                      ? 'Deadline Passed'
                      : lifecycleStatus === 'completed' || lifecycleStatus === 'fulfilled'
                        ? 'Positions Filled'
                        : 'Apply now'}
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      {lifecycleStatus === 'expired' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          <p className="font-semibold">Application Deadline Passed ({drive.deadline})</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
            This internship drive is closed for new applications. Students who already applied can track their interview and selection status in their applications ledger.
          </p>
        </div>
      )}

      {(lifecycleStatus === 'completed' || lifecycleStatus === 'fulfilled') && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <p className="font-semibold">Internship Drive Fulfilled &amp; Completed</p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
            All {drive.openings} available position(s) have been filled for this hiring cycle.
          </p>
        </div>
      )}

      {elig && (
        <div
          className={cn(
            'flex flex-col gap-1 rounded-lg border p-4',
            elig.state === 'eligible' && 'border-foreground',
            elig.state === 'not_eligible' && 'bg-muted',
            elig.state === 'missing_info' && 'border-dashed',
          )}
          role="status"
        >
          <span className="text-sm font-semibold">
            {elig.state === 'eligible' && 'You are eligible for this drive'}
            {elig.state === 'not_eligible' && 'Not eligible'}
            {elig.state === 'missing_info' && 'Missing information'}
          </span>
          {elig.state === 'eligible' ? (
            <span className="text-sm text-muted-foreground">
              {existingApp
                ? 'You have already applied. Each student can apply once per drive.'
                : 'Your profile meets all the requirements. You can apply once for this drive.'}
            </span>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">
                {elig.reasons.length === 1
                  ? 'Reason:'
                  : `${elig.reasons.length} criteria are not met:`}
              </span>
              <ul className="mt-1 flex flex-col gap-1">
                {elig.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border p-5">
            <h2 className="mb-2 text-sm font-semibold">About the role</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{drive.description}</p>
            <Separator className="my-4" />
            <h3 className="mb-2 text-sm font-semibold">Required skills</h3>
            <ul className="flex flex-wrap gap-2">
              {drive.skills.map((s) => (
                <li key={s} className="rounded-full border px-3 py-1 text-xs font-medium">
                  {s}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border p-5">
            <h2 className="mb-4 text-sm font-semibold">Application timeline</h2>
            <ol className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Applications open', date: drive.openDate },
                { label: 'Deadline', date: drive.deadline },
                { label: 'Internship starts', date: drive.startDate },
                { label: 'Internship ends', date: drive.endDate },
              ].map((step) => (
                <li key={step.label} className="flex flex-col gap-0.5 border-l-2 border-foreground pl-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {step.label}
                  </span>
                  <span className="text-sm font-medium tabular-nums">{step.date}</span>
                </li>
              ))}
            </ol>
          </section>
          {company && (
            <section className="rounded-lg border p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">About {company.name}</h2>
                <Button variant="ghost" size="sm" render={<Link href={`/companies/${company.id}`} />}>
                  Company page
                </Button>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{company.about}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {company.industry} · {company.location} · {company.website}
              </p>
            </section>
          )}
        </div>
        <aside className="flex flex-col gap-4">
          <section className="grid grid-cols-2 gap-4 rounded-lg border p-5">
            <Fact label="Stipend" value={`₹${drive.stipend.toLocaleString('en-IN')}/mo`} />
            <Fact label="Duration" value={`${drive.durationWeeks} weeks`} />
            <Fact label="Openings" value={String(drive.openings)} />
            <Fact label="Work mode" value={drive.workMode} />
            <Fact label="Location" value={drive.location} />
            <Fact label="Field" value={drive.field} />
          </section>
          <section className="rounded-lg border p-5">
            <h2 className="text-sm font-semibold">Eligibility criteria</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {drive.anyoneCanApply
                ? 'This drive is open to everyone — academic filters are waived.'
                : elig
                  ? 'Checked automatically against your profile.'
                  : 'Company-specified criteria for this drive.'}
            </p>

            {elig && elig.criteria.length > 0 ? (
              <ul className="mt-4 flex flex-col divide-y">
                {elig.criteria.map((c) => (
                  <li key={c.label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      className={cn(
                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                        c.pass && 'border-foreground bg-foreground text-background',
                        !c.pass && c.blocking && 'border-foreground',
                        !c.pass && !c.blocking && 'border-dashed',
                      )}
                    >
                      {c.pass ? (
                        <Check className="size-2.5" aria-hidden />
                      ) : (
                        <X className="size-2.5" aria-hidden />
                      )}
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium">{c.label}</span>
                      <span className="text-xs text-muted-foreground">
                        Required: {c.required} · Yours: {c.yours}
                      </span>
                      {!c.pass && (
                        <span className="text-xs font-medium">
                          {c.blocking ? c.reason : `Advisory — ${c.reason}`}
                        </span>
                      )}
                      <span className="sr-only">{c.pass ? 'Criterion met' : 'Criterion not met'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                <li>Minimum CGPA: {drive.minCgpa > 0 ? drive.minCgpa.toFixed(1) : 'None'}</li>
                <li>
                  Active backlogs: {drive.maxBacklogs >= 99 ? 'No limit' : `${drive.maxBacklogs} maximum`}
                </li>
                <li>Department: {drive.fieldFilter}</li>
                <li>
                  Passing year: {drive.passingYears.length ? drive.passingYears.join(' / ') : 'Any'}
                </li>
                <li>
                  Required skills: {drive.requiredSkills.length ? drive.requiredSkills.join(', ') : 'None'}
                </li>
                <li>
                  Certifications:{' '}
                  {drive.requiredCertifications.length
                    ? drive.requiredCertifications.join(', ')
                    : 'None'}
                </li>
              </ul>
            )}

            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Every applicant must also have a verified account with resume and ID documents on file.
            </p>
          </section>
        </aside>
      </div>

      {/* Edit Drive Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Internship Drive</DialogTitle>
            <DialogDescription>
              Update role requirements, criteria, timeline, and status for &quot;{drive.title}&quot;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="detail-edit-title">Drive Title</Label>
                <Input
                  id="detail-edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Full Stack Developer Intern"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-field">Field / Domain</Label>
                <Input
                  id="detail-edit-field"
                  value={editField}
                  onChange={(e) => setEditField(e.target.value)}
                  placeholder="e.g. Software Development"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-work-mode">Work Mode</Label>
                <Select
                  value={editWorkMode}
                  onValueChange={(v) => v && setEditWorkMode(v as Drive['workMode'])}
                >
                  <SelectTrigger id="detail-edit-work-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-location">Location (City)</Label>
                <Input
                  id="detail-edit-location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Pune, Maharashtra"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-status">Drive Status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => v && setEditStatus(v as Drive['status'])}
                >
                  <SelectTrigger id="detail-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open (Accepting Applications)</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-stipend">Monthly Stipend (₹)</Label>
                <Input
                  id="detail-edit-stipend"
                  type="number"
                  min="0"
                  value={editStipend}
                  onChange={(e) => setEditStipend(e.target.value)}
                  placeholder="25000"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-duration">Duration (Weeks)</Label>
                <Input
                  id="detail-edit-duration"
                  type="number"
                  min="1"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  placeholder="12"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-openings">Available Openings</Label>
                <Input
                  id="detail-edit-openings"
                  type="number"
                  min="1"
                  value={editOpenings}
                  onChange={(e) => setEditOpenings(e.target.value)}
                  placeholder="3"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-min-cgpa">Minimum CGPA</Label>
                <Input
                  id="detail-edit-min-cgpa"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={editMinCgpa}
                  onChange={(e) => setEditMinCgpa(e.target.value)}
                  placeholder="7.0"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-max-backlogs">Maximum Allowed Backlogs</Label>
                <Input
                  id="detail-edit-max-backlogs"
                  type="number"
                  min="0"
                  max="10"
                  value={editMaxBacklogs}
                  onChange={(e) => setEditMaxBacklogs(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="detail-edit-skills">Required Skills (comma-separated)</Label>
                <Input
                  id="detail-edit-skills"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js, PostgreSQL"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="detail-edit-certs">Required Certifications (comma-separated)</Label>
                <Input
                  id="detail-edit-certs"
                  value={editCerts}
                  onChange={(e) => setEditCerts(e.target.value)}
                  placeholder="AWS Cloud Practitioner, NPTEL DBMS"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-deadline">Application Deadline</Label>
                <Input
                  id="detail-edit-deadline"
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-edit-start">Internship Start Date</Label>
                <Input
                  id="detail-edit-start"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="detail-edit-end">Internship End Date</Label>
                <Input
                  id="detail-edit-end"
                  type="date"
                  min={editStartDate || undefined}
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="detail-edit-desc">Drive Description &amp; Responsibilities</Label>
                <Textarea
                  id="detail-edit-desc"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe key responsibilities, requirements, and candidate qualifications..."
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Drive Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5 text-destructive" />
              Delete Internship Drive
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{drive.title}&quot;? This will remove the drive from student discovery.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Drive details:</p>
            <p className="mt-1">{drive.location} · {drive.durationWeeks} weeks · ₹{drive.stipend.toLocaleString('en-IN')}/mo</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
