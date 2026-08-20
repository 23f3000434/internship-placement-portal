'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'
import { Check, FileText, Plus, X, Upload, Eye, Edit3, UserCheck, ShieldCheck, Phone, Mail, GraduationCap, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, StatCard } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { DocumentViewerModal } from '@/components/portal/document-viewer'
import { usePortal } from '@/lib/store'
import { checkEligibility, skillGap } from '@/lib/eligibility'
import type { Student } from '@/lib/types'
import { toast } from 'sonner'

const LOCATION_LABEL: Record<Student['locationPreference'], string> = {
  local: 'Local only',
  outstation: 'Outstation',
  any: 'Anywhere',
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  )
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2.5 py-1 text-xs font-medium">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground ml-1"
          aria-label={`Remove ${children}`}
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

export default function ProfilePage() {
  const p = usePortal()

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [skillDraft, setSkillDraft] = useState('')
  const [certDraft, setCertDraft] = useState('')
  const [resumeModalOpen, setResumeModalOpen] = useState(false)

  // Edit form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [enrollment, setEnrollment] = useState('')
  const [branch, setBranch] = useState('')
  const [cgpa, setCgpa] = useState('')
  const [backlogs, setBacklogs] = useState('')
  const [passingYear, setPassingYear] = useState('')
  const [phone, setPhone] = useState('')
  const [locationPref, setLocationPref] = useState<Student['locationPreference']>('any')

  const resumeInputRef = useRef<HTMLInputElement>(null)
  const idDocsInputRef = useRef<HTMLInputElement>(null)

  const student = p.students.find((s) => s.id === p.actingStudentId) || p.students[0]

  const openEditModal = () => {
    if (!student) return
    setName(student.name)
    setEmail(student.email)
    setEnrollment(student.enrollment)
    setBranch(student.branch)
    setCgpa(String(student.cgpa))
    setBacklogs(String(student.backlogs))
    setPassingYear(String(student.passingYear))
    setPhone(student.phone || '')
    setLocationPref(student.locationPreference)
    setEditModalOpen(true)
  }

  const handleSaveProfile = () => {
    p.updateProfile({
      name: name.trim() || student.name,
      email: email.trim().toLowerCase() || student.email,
      enrollment: enrollment.trim().toUpperCase() || student.enrollment,
      branch: branch.trim() || student.branch,
      cgpa: Number.parseFloat(cgpa) || student.cgpa,
      backlogs: Number.parseInt(backlogs, 10) || 0,
      passingYear: Number.parseInt(passingYear, 10) || student.passingYear,
      phone: phone.trim() || undefined,
      locationPreference: locationPref,
    })
    setEditModalOpen(false)
    toast.success('Profile updated successfully', { description: 'All changes synced to the central database.' })
  }

  const handleAddSkill = () => {
    const s = skillDraft.trim()
    if (s && !student.skills.includes(s)) {
      p.updateProfile({ skills: [...student.skills, s] })
      setSkillDraft('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    p.updateProfile({ skills: student.skills.filter((x) => x !== skill) })
  }

  const handleAddCert = () => {
    const c = certDraft.trim()
    if (c && !student.certifications.includes(c)) {
      p.updateProfile({ certifications: [...student.certifications, c] })
      setCertDraft('')
    }
  }

  const handleRemoveCert = (cert: string) => {
    p.updateProfile({ certifications: student.certifications.filter((x) => x !== cert) })
  }

  const myApps = p.applications.filter((a) => a.studentId === student.id)
  const myInternships = p.internships.filter((n) => n.studentId === student.id)
  const mentor = p.faculty.find((f) => f.id === student.facultyId)

  const openDrives = p.drives.filter((d) => d.status === 'open')
  const eligibleCount = openDrives.filter(
    (d) => checkEligibility(student, d).state === 'eligible',
  ).length
  const gaps = skillGap(student, p.drives)

  const hasPhone = Boolean(student.phone && student.phone.trim().length > 0)
  const checklist = [
    { label: 'College email registered', done: true },
    { label: 'Branch & Enrollment verified', done: Boolean(student.enrollment) },
    { label: 'CGPA & Backlog status', done: true },
    { label: 'Resume PDF uploaded', done: student.resumeUploaded },
    { label: 'ID verification documents', done: student.idDocsUploaded },
    { label: 'Contact number recorded', done: hasPhone },
    { label: 'Technical skills (3+ listed)', done: student.skills.length >= 3 },
  ]
  const completeness = Math.round(
    (checklist.filter((c) => c.done).length / checklist.length) * 100,
  )

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={student.name}
          description={`Student Profile · ${student.enrollment} · ${student.branch}`}
        />
        <Button onClick={openEditModal} variant="outline" className="gap-2 self-start sm:self-auto">
          <Edit3 className="size-4" />
          Edit Profile Details
        </Button>
      </div>

      {student.status === 'blocked' && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">Account blocked by Placement Cell</p>
          <p className="text-xs text-destructive/80 mt-1">{student.blockReason}</p>
        </div>
      )}

      {/* Profile Overview Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="CGPA" value={student.cgpa.toFixed(2)} sub="Academic Performance" />
        <StatCard
          label="Active Backlogs"
          value={student.backlogs}
          sub={student.backlogs === 0 ? 'Clear academic standing' : 'Restricts some drives'}
        />
        <StatCard label="Eligible Drives" value={eligibleCount} sub={`of ${openDrives.length} active campus drives`} />
        <StatCard label="Applications" value={myApps.length} sub={`${myInternships.length} active internship(s)`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Academic & Contact Info */}
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 lg:col-span-2 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-semibold">Academic &amp; Contact Information</h2>
            <StatusBadge status={student.status} />
          </div>

          <dl className="flex flex-col text-sm">
            <Detail label="Full Name" value={student.name} />
            <Detail label="College Email" value={student.email} />
            <Detail label="Enrollment Number" value={student.enrollment} />
            <Detail label="Department / Branch" value={student.branch} />
            <Detail label="Passing Year" value={student.passingYear} />
            <Detail label="CGPA" value={student.cgpa.toFixed(2)} />
            <Detail label="Active Backlogs" value={student.backlogs} />
            <Detail label="Contact Phone" value={student.phone || 'Not provided'} />
            <Detail label="Location Preference" value={LOCATION_LABEL[student.locationPreference]} />
            <Detail label="Assigned Mentor" value={mentor?.name ?? 'Prof. R. Kulkarni'} />
          </dl>

          <Button onClick={openEditModal} variant="outline" size="sm" className="mt-2 w-full text-xs">
            <Edit3 className="mr-1.5 size-3.5" /> Edit Information
          </Button>
        </section>

        {/* Right Column: Profile Completeness & Documents */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Completeness Card */}
          <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Profile Completion Status</h2>
              <span className="text-sm font-bold font-mono">{completeness}%</span>
            </div>
            <Progress value={completeness} aria-label={`Profile ${completeness}% complete`} />
            <ul className="grid gap-2 sm:grid-cols-2 text-xs">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={
                      c.done
                        ? 'flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background'
                        : 'flex size-4 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground'
                    }
                  >
                    {c.done && <Check className="size-2.5" strokeWidth={3} />}
                  </span>
                  <span className={c.done ? 'font-medium' : 'text-muted-foreground'}>{c.label}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Documents on File */}
          <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs">
            <h2 className="text-sm font-semibold">Verified Documents on Record</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Resume Card */}
              <div className="flex flex-col justify-between gap-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 gap-2.5">
                    <FileText className="mt-0.5 size-4 shrink-0 text-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Verified Resume</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.resumeUploaded
                          ? student.resumeName || `resume-${student.enrollment.toLowerCase()}.pdf`
                          : 'Not uploaded — required for drives'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={student.resumeUploaded ? 'uploaded' : 'not_uploaded'} />
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = () => {
                          p.updateProfile({
                            resumeUploaded: true,
                            resumeName: file.name,
                            resumeData: typeof reader.result === 'string' ? reader.result : undefined,
                          })
                          toast.success('Resume uploaded successfully', { description: file.name })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant={student.resumeUploaded ? 'outline' : 'default'}
                    onClick={() => resumeInputRef.current?.click()}
                    className="text-xs flex-1"
                  >
                    <Upload className="mr-1 size-3.5" />
                    {student.resumeUploaded ? 'Replace' : 'Upload'}
                  </Button>
                  {student.resumeUploaded && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setResumeModalOpen(true)}
                      className="text-xs"
                    >
                      <Eye className="mr-1 size-3.5" /> View
                    </Button>
                  )}
                </div>
              </div>

              {/* ID Card */}
              <div className="flex flex-col justify-between gap-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 gap-2.5">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">College ID / Verification</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.idDocsUploaded
                          ? student.idDocsName || 'college-id.pdf'
                          : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={student.idDocsUploaded ? 'uploaded' : 'not_uploaded'} />
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <input
                    ref={idDocsInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = () => {
                          p.updateProfile({
                            idDocsUploaded: true,
                            idDocsName: file.name,
                            idDocsData: typeof reader.result === 'string' ? reader.result : undefined,
                          })
                          toast.success('College ID uploaded successfully')
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant={student.idDocsUploaded ? 'outline' : 'default'}
                    onClick={() => idDocsInputRef.current?.click()}
                    className="text-xs flex-1"
                  >
                    <Upload className="mr-1 size-3.5" />
                    {student.idDocsUploaded ? 'Replace' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Technical Skills & Certifications */}
          <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-xs">
            {/* Skills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Technical &amp; Core Skills</h2>
                <span className="text-xs text-muted-foreground font-mono">{student.skills.length} skills</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {student.skills.map((s) => (
                  <Chip key={s} onRemove={() => handleRemoveSkill(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  placeholder="e.g. Next.js, Python, Docker"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="text-xs"
                />
                <Button size="sm" onClick={handleAddSkill} variant="outline" className="text-xs">
                  <Plus className="size-3.5 mr-1" /> Add Skill
                </Button>
              </div>
            </div>

            {/* Certifications */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Industry Certifications &amp; Badges</h2>
                <span className="text-xs text-muted-foreground font-mono">{student.certifications.length} verified</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {student.certifications.map((c) => (
                  <Chip key={c} onRemove={() => handleRemoveCert(c)}>
                    {c}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={certDraft}
                  onChange={(e) => setCertDraft(e.target.value)}
                  placeholder="e.g. AWS Certified Developer, NPTEL DBMS"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCert())}
                  className="text-xs"
                />
                <Button size="sm" onClick={handleAddCert} variant="outline" className="text-xs">
                  <Plus className="size-3.5 mr-1" /> Add Cert
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Edit Profile Details Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile Information</DialogTitle>
            <DialogDescription>
              Update your registered academic records, personal information, and recruitment preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-email">College Email</Label>
              <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-enrollment">Enrollment Number</Label>
              <Input id="edit-enrollment" value={enrollment} onChange={(e) => setEnrollment(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="edit-branch">Department / Branch</Label>
              <Input id="edit-branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-cgpa">Current CGPA (out of 10)</Label>
              <Input id="edit-cgpa" type="number" step="0.01" min="0" max="10" value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-backlogs">Active Backlogs</Label>
              <Input id="edit-backlogs" type="number" min="0" max="20" value={backlogs} onChange={(e) => setBacklogs(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-year">Passing Year</Label>
              <Input id="edit-year" type="number" value={passingYear} onChange={(e) => setPassingYear(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-phone">Contact Phone</Label>
              <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="edit-loc">Location Preference</Label>
              <Select
                value={locationPref}
                onValueChange={(v) => v && setLocationPref(v as Student['locationPreference'])}
              >
                <SelectTrigger id="edit-loc">
                  <SelectValue>{LOCATION_LABEL[locationPref]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="local">Local only</SelectItem>
                    <SelectItem value="outstation">Outstation</SelectItem>
                    <SelectItem value="any">Anywhere</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>
              Save Profile Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Viewer Modal */}
      {student.resumeUploaded && (
        <DocumentViewerModal
          open={resumeModalOpen}
          onOpenChange={setResumeModalOpen}
          doc={{
            id: 'resume_doc',
            internshipId: 'profile',
            kind: 'offer_letter',
            fileName: student.resumeName || `${student.name.replace(/\s+/g, '_')}_Resume.pdf`,
            fileData: student.resumeData,
            uploadedBy: 'student',
            uploadedAt: 'Current',
            status: 'verified',
          }}
        />
      )}
    </>
  )
}
