'use client'

import { FileText, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { isoDate } from '@/lib/eligibility'
import { usePortal } from '@/lib/store'
import type { Application, Student } from '@/lib/types'

function ProfileDialog({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  if (!student) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{student.name}</DialogTitle>
          <DialogDescription>
            {student.branch} · {student.enrollment}
          </DialogDescription>
        </DialogHeader>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">CGPA</dt>
            <dd className="font-medium tabular-nums">{student.cgpa.toFixed(1)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Location preference</dt>
            <dd className="font-medium capitalize">{student.locationPreference}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
            <dd className="font-medium">{student.email}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Skills</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {student.skills.map((s) => (
                <span key={s} className="rounded-full border px-2.5 py-0.5 text-xs">
                  {s}
                </span>
              ))}
            </dd>
          </div>
        </dl>
        <div className="flex items-center justify-between rounded-md border p-3 text-sm">
          <span className="flex items-center gap-2">
            <FileText className="size-4" aria-hidden />
            {student.resumeUploaded ? 'resume.pdf' : 'No resume uploaded'}
          </span>
          {student.resumeUploaded && (
            <Button variant="outline" size="sm" type="button">
              Open resume
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ApplicantsPage() {
  const p = usePortal()
  const myDrives = p.drives.filter((d) => d.companyId === p.actingCompanyId)
  const myApps = p.applications.filter((a) => myDrives.some((d) => d.id === a.driveId))

  const [query, setQuery] = useState('')
  const [driveFilter, setDriveFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [profile, setProfile] = useState<Student | null>(null)
  const [rejecting, setRejecting] = useState<Application | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [scheduling, setScheduling] = useState<Application | null>(null)
  // Default to a week out so the scheduler is never blocked on an empty date.
  const defaultIvDate = useMemo(() => isoDate(7), [])
  const [ivDate, setIvDate] = useState(defaultIvDate)
  const [ivTime, setIvTime] = useState('11:00')
  const [ivMode, setIvMode] = useState<'online' | 'in_person'>('online')
  const [ivLink, setIvLink] = useState('')
  const [ivPanel, setIvPanel] = useState('')
  const [ivInstructions, setIvInstructions] = useState('')

  const filtered = useMemo(
    () =>
      myApps
        .filter((a) => {
          const s = p.students.find((x) => x.id === a.studentId)
          const matchQuery =
            !query ||
            s?.name.toLowerCase().includes(query.toLowerCase()) ||
            s?.enrollment.toLowerCase().includes(query.toLowerCase())
          const matchDrive = driveFilter === 'all' || a.driveId === driveFilter
          const matchStatus = statusFilter === 'all' || a.status === statusFilter
          return matchQuery && matchDrive && matchStatus
        })
        .slice()
        .reverse(),
    [myApps, p.students, query, driveFilter, statusFilter],
  )

  const confirmReject = () => {
    if (!rejecting) return
    p.setApplicationStatus(rejecting.id, 'rejected', rejectReason.trim() || 'Not a fit for this role.')
    setRejecting(null)
    setRejectReason('')
  }

  const confirmSchedule = () => {
    if (!scheduling || !ivDate) return
    p.scheduleInterview(scheduling.id, {
      date: ivDate,
      time: ivTime,
      mode: ivMode,
      linkOrVenue: ivLink.trim() || (ivMode === 'online' ? 'Link to follow' : 'Venue to follow'),
      panel: ivPanel.trim() || 'HR panel',
      instructions: ivInstructions.trim() || 'Keep your college ID ready.',
    })
    setScheduling(null)
    setIvDate(defaultIvDate)
    setIvLink('')
    setIvPanel('')
    setIvInstructions('')
  }

  return (
    <>
      <PageHeader
        title="Applicants"
        description={`${myApps.length} application${myApps.length === 1 ? '' : 's'} across your drives. Shortlist, schedule interviews, and select.`}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or enrollment…"
            className="pl-9"
            aria-label="Search applicants"
          />
        </div>
        <Select value={driveFilter} onValueChange={(v) => setDriveFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by drive">
            <SelectValue>
              {(v: string) =>
                v === 'all' ? 'All drives' : (myDrives.find((d) => d.id === v)?.title ?? 'All drives')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All drives</SelectItem>
            {myDrives.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-48" aria-label="Filter by status">
            <SelectValue>
              {(v: string) => (v === 'all' ? 'All statuses' : v.replace(/_/g, ' '))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'].map(
              (s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace(/_/g, ' ')}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Drive</TableHead>
              <TableHead className="text-right">CGPA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => {
              const s = p.students.find((x) => x.id === a.studentId)
              const d = p.drives.find((x) => x.id === a.driveId)
              if (!s || !d) return null
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setProfile(s)}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {s.name}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {s.enrollment} · {s.branch}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{d.title}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.cgpa.toFixed(1)}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {(a.status === 'applied' || a.status === 'under_review') && (
                        <>
                          {a.status === 'applied' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => p.setApplicationStatus(a.id, 'under_review')}
                            >
                              Mark reviewing
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => p.setApplicationStatus(a.id, 'shortlisted')}
                          >
                            Shortlist
                          </Button>
                        </>
                      )}
                      {a.status === 'shortlisted' && (
                        <Button size="sm" onClick={() => setScheduling(a)}>
                          Schedule interview
                        </Button>
                      )}
                      {a.status === 'interview_scheduled' && (
                        <Button size="sm" onClick={() => p.setApplicationStatus(a.id, 'selected')}>
                          Select
                        </Button>
                      )}
                      {a.status !== 'rejected' && a.status !== 'selected' && (
                        <Button size="sm" variant="outline" onClick={() => setRejecting(a)}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No applicants match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProfileDialog student={profile} open={!!profile} onOpenChange={(o) => !o && setProfile(null)} />

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              The student will be notified by email with the reason you provide.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Profile did not match the required skill depth."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button onClick={confirmReject}>Reject applicant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!scheduling} onOpenChange={(o) => !o && setScheduling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule interview</DialogTitle>
            <DialogDescription>
              An email notification is sent to the student and the admin automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="iv-date">Date</Label>
              <Input id="iv-date" type="date" value={ivDate} onChange={(e) => setIvDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="iv-time">Time</Label>
              <Input id="iv-time" type="time" value={ivTime} onChange={(e) => setIvTime(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="iv-mode">Mode</Label>
              <Select value={ivMode} onValueChange={(v) => setIvMode(v as typeof ivMode)}>
                <SelectTrigger id="iv-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in_person">In person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="iv-link">{ivMode === 'online' ? 'Meeting link' : 'Venue'}</Label>
              <Input
                id="iv-link"
                value={ivLink}
                onChange={(e) => setIvLink(e.target.value)}
                placeholder={ivMode === 'online' ? 'https://meet.example.com/…' : 'Office address'}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="iv-panel">Panel</Label>
              <Input
                id="iv-panel"
                value={ivPanel}
                onChange={(e) => setIvPanel(e.target.value)}
                placeholder="e.g. Meera Joshi (HR), Dev Lead"
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="iv-instructions">Instructions</Label>
              <Textarea
                id="iv-instructions"
                value={ivInstructions}
                onChange={(e) => setIvInstructions(e.target.value)}
                placeholder="Anything the candidate should prepare."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduling(null)}>
              Cancel
            </Button>
            <Button onClick={confirmSchedule} disabled={!ivDate}>
              Schedule & notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
