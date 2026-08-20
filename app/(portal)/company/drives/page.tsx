'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Edit3, Eye, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader, StatCard } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'
import { getDriveStatus } from '@/lib/eligibility'
import type { Drive } from '@/lib/types'
import { toast } from 'sonner'

export default function CompanyDrivesPage() {
  const p = usePortal()
  const currentCompanyId = p.authSession?.userId || p.actingCompanyId || 'c1'
  const me =
    p.companies.find((c) => c.id === currentCompanyId) ||
    p.companies.find((c) => c.hrEmail?.trim().toLowerCase() === p.authSession?.email?.trim().toLowerCase()) ||
    p.companies.find((c) => c.email?.trim().toLowerCase() === p.authSession?.email?.trim().toLowerCase()) ||
    p.companies.find((c) => c.id === p.actingCompanyId) ||
    p.companies[0]
  const companyIds = new Set([currentCompanyId, me?.id, p.actingCompanyId].filter(Boolean))
  const myDrives = p.drives.filter(
    (d) =>
      companyIds.has(d.companyId) ||
      (me && d.companyId === me.id) ||
      (!p.authSession?.userId && (d.companyId === 'c1' || d.companyId === p.actingCompanyId)) ||
      p.role === 'admin',
  )
  const appsFor = (driveId: string) => p.applications.filter((a) => a.driveId === driveId)
  const [tab, setTab] = useState('all')

  const drivesWithStatus = myDrives.map((d) => ({
    ...d,
    lifecycleStatus: getDriveStatus(d, p.applications),
  }))

  const openDrives = drivesWithStatus.filter((d) => d.lifecycleStatus === 'open')
  const expiredDrives = drivesWithStatus.filter((d) => d.lifecycleStatus === 'expired')
  const completedDrives = drivesWithStatus.filter((d) => d.lifecycleStatus === 'completed' || d.lifecycleStatus === 'fulfilled')
  const closedDrives = drivesWithStatus.filter((d) => d.lifecycleStatus === 'closed')

  const visibleDrives = drivesWithStatus.filter((d) => {
    if (tab === 'open') return d.lifecycleStatus === 'open'
    if (tab === 'expired') return d.lifecycleStatus === 'expired'
    if (tab === 'completed') return d.lifecycleStatus === 'completed' || d.lifecycleStatus === 'fulfilled'
    if (tab === 'closed') return d.lifecycleStatus === 'closed'
    return true
  })

  // Edit Modal State
  const [editingDrive, setEditingDrive] = useState<Drive | null>(null)
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
  const [deletingDrive, setDeletingDrive] = useState<Drive | null>(null)

  const openEditModal = (d: Drive) => {
    setEditingDrive(d)
    setEditTitle(d.title)
    setEditField(d.field)
    setEditLocation(d.location)
    setEditWorkMode(d.workMode)
    setEditStipend(String(d.stipend))
    setEditDuration(String(d.durationWeeks))
    setEditOpenings(String(d.openings))
    setEditMinCgpa(String(d.minCgpa))
    setEditMaxBacklogs(String(d.maxBacklogs))
    setEditSkills(d.requiredSkills.join(', '))
    setEditCerts(d.requiredCertifications.join(', '))
    setEditStartDate(d.startDate)
    setEditEndDate(d.endDate)
    setEditDeadline(d.deadline)
    setEditDescription(d.description)
    setEditStatus(d.status)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDrive) return

    if (!editTitle.trim()) {
      toast.error('Title Required', { description: 'Please provide a title for the drive.' })
      return
    }

    if (!editField.trim() || !editLocation.trim()) {
      toast.error('Field & Location Required')
      return
    }

    if (new Date(editDeadline) > new Date(editStartDate)) {
      toast.error('Invalid Timeline', { description: 'Application deadline must be on or before start date.' })
      return
    }

    if (new Date(editEndDate) <= new Date(editStartDate)) {
      toast.error('Invalid Timeline', { description: 'Internship end date must be after start date.' })
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

    p.updateDrive(editingDrive.id, {
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
      description: editDescription.trim() || editingDrive.description,
      status: editStatus,
    })

    setEditingDrive(null)
  }

  const handleConfirmDelete = () => {
    if (!deletingDrive) return
    p.deleteDrive(deletingDrive.id)
    setDeletingDrive(null)
  }

  return (
    <>
      <PageHeader
        title="My drives"
        description={`Internship drives published and managed by ${me?.name ?? 'your company'}.`}
        actions={
          me?.status === 'approved' ? (
            <Button render={<Link href="/company/drives/new" />}>
              <Plus data-slot="icon" /> Create drive
            </Button>
          ) : (
            <StatusBadge status={me?.status ?? 'pending'} />
          )
        }
      />
      {me?.status !== 'approved' && (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Publishing and managing drives is disabled until your company registration is approved by the admin.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active / Open" value={openDrives.length} sub="accepting applications" />
        <StatCard label="Expired drives" value={expiredDrives.length} sub="deadline passed" />
        <StatCard label="Completed / Fulfilled" value={completedDrives.length} sub="positions filled" />
        <StatCard
          label="Total applicants"
          value={myDrives.reduce((n, d) => n + appsFor(d.id).length, 0)}
          sub={`${myDrives.length} total drives`}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
          <TabsTrigger value="all">All Drives ({myDrives.length})</TabsTrigger>
          <TabsTrigger value="open">Active / Open ({openDrives.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredDrives.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedDrives.length})</TabsTrigger>
        </TabsList>

        <div className="overflow-x-auto rounded-lg border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drive</TableHead>
                <TableHead>Filters &amp; Criteria</TableHead>
                <TableHead className="text-right">Stipend</TableHead>
                <TableHead className="text-right">Openings</TableHead>
                <TableHead className="text-right">Applicants</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleDrives.map((d) => {
                const apps = appsFor(d.id)
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link
                        href={`/drives/${d.id}`}
                        className="font-medium underline-offset-4 hover:underline text-sm"
                      >
                        {d.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {d.location} · {d.workMode} · {d.durationWeeks} wks
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.anyoneCanApply
                        ? 'Anyone can apply'
                        : `CGPA ≥ ${d.minCgpa.toFixed(1)} · ${d.fieldFilter || d.field} · ${d.locationFilter || d.location}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs font-medium">
                      ₹{d.stipend.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{d.openings}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs font-semibold">{apps.length}</TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">{d.deadline}</TableCell>
                    <TableCell>
                      <StatusBadge status={d.lifecycleStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          render={<Link href={`/drives/${d.id}`} />}
                        >
                          <Eye className="size-3.5" />
                          <span className="sr-only sm:not-sr-only sm:ml-1">View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs gap-1"
                          onClick={() => openEditModal(d)}
                        >
                          <Edit3 className="size-3.5" />
                          <span className="sr-only sm:not-sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeletingDrive(d)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {visibleDrives.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-sm">
                    {tab === 'expired'
                      ? 'No expired drives found.'
                      : tab === 'completed'
                        ? 'No completed or fulfilled drives yet.'
                        : tab === 'open'
                          ? 'No active/open drives at the moment.'
                          : 'No drives published yet. Click "Create drive" to hire interns.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>

      {/* Edit Drive Dialog */}
      <Dialog open={Boolean(editingDrive)} onOpenChange={(open) => !open && setEditingDrive(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Internship Drive</DialogTitle>
            <DialogDescription>
              Update role requirements, criteria, timeline, and status for &quot;{editingDrive?.title}&quot;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-title">Drive Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Full Stack Developer Intern"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-field">Field / Domain</Label>
                <Input
                  id="edit-field"
                  value={editField}
                  onChange={(e) => setEditField(e.target.value)}
                  placeholder="e.g. Software Development"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-work-mode">Work Mode</Label>
                <Select
                  value={editWorkMode}
                  onValueChange={(v) => v && setEditWorkMode(v as Drive['workMode'])}
                >
                  <SelectTrigger id="edit-work-mode">
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
                <Label htmlFor="edit-location">Location (City)</Label>
                <Input
                  id="edit-location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Pune, Maharashtra"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-status">Drive Status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => v && setEditStatus(v as Drive['status'])}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open (Accepting Applications)</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-stipend">Monthly Stipend (₹)</Label>
                <Input
                  id="edit-stipend"
                  type="number"
                  min="0"
                  value={editStipend}
                  onChange={(e) => setEditStipend(e.target.value)}
                  placeholder="25000"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-duration">Duration (Weeks)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="1"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  placeholder="12"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-openings">Available Openings</Label>
                <Input
                  id="edit-openings"
                  type="number"
                  min="1"
                  value={editOpenings}
                  onChange={(e) => setEditOpenings(e.target.value)}
                  placeholder="3"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-min-cgpa">Minimum CGPA</Label>
                <Input
                  id="edit-min-cgpa"
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
                <Label htmlFor="edit-max-backlogs">Maximum Allowed Backlogs</Label>
                <Input
                  id="edit-max-backlogs"
                  type="number"
                  min="0"
                  max="10"
                  value={editMaxBacklogs}
                  onChange={(e) => setEditMaxBacklogs(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-skills">Required Skills (comma-separated)</Label>
                <Input
                  id="edit-skills"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js, PostgreSQL"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-certs">Required Certifications (comma-separated)</Label>
                <Input
                  id="edit-certs"
                  value={editCerts}
                  onChange={(e) => setEditCerts(e.target.value)}
                  placeholder="AWS Cloud Practitioner, NPTEL DBMS"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-deadline">Application Deadline</Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-start">Internship Start Date</Label>
                <Input
                  id="edit-start"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-end">Internship End Date</Label>
                <Input
                  id="edit-end"
                  type="date"
                  min={editStartDate || undefined}
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-desc">Drive Description &amp; Responsibilities</Label>
                <Textarea
                  id="edit-desc"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe key responsibilities, requirements, and candidate qualifications..."
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingDrive(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Drive Confirmation Dialog */}
      <Dialog open={Boolean(deletingDrive)} onOpenChange={(open) => !open && setDeletingDrive(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5 text-destructive" />
              Delete Internship Drive
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingDrive?.title}&quot;? This will remove the drive from student discovery.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Drive details:</p>
            <p className="mt-1">{deletingDrive?.location} · {deletingDrive?.durationWeeks} weeks · ₹{deletingDrive?.stipend.toLocaleString('en-IN')}/mo</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingDrive(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
