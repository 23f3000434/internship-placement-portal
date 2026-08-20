'use client'

import { useState } from 'react'
import { Plus, GraduationCap, Mail, Phone, Building, UserCheck, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, StatCard } from '@/components/portal/page-header'
import { usePortal } from '@/lib/store'
import type { Faculty } from '@/lib/types'

export default function AdminFacultyPage() {
  const p = usePortal()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('Computer Science')
  const [customDept, setCustomDept] = useState('')
  const [designation, setDesignation] = useState('Associate Professor & Mentor')
  const [password, setPassword] = useState('faculty123')
  const [phone, setPhone] = useState('')

  const existingDepts = Array.from(new Set(p.faculty.map((f) => f.department)))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    const finalDept = department === 'custom' ? customDept.trim() || 'General Engineering' : department

    p.addFaculty({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      department: finalDept,
      designation: designation.trim() || 'Faculty Mentor',
      password: password.trim() || 'faculty123',
      phone: phone.trim() || undefined,
    })

    setName('')
    setEmail('')
    setCustomDept('')
    setPhone('')
    setOpen(false)
  }

  const totalFaculty = p.faculty.length
  const totalMentees = p.students.length

  return (
    <>
      <PageHeader
        title="Faculty Mentors Directory"
        description="Register and manage departmental faculty mentors responsible for student verification and supervision."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" /> Add Faculty Mentor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Register Faculty Mentor</DialogTitle>
                  <DialogDescription>
                    Add a new departmental faculty member to supervise internships and approve weekly logbooks.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="f-name">Full Name with Title</Label>
                    <Input
                      id="f-name"
                      placeholder="e.g. Dr. Arvind Patil"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="f-email">Institutional Email</Label>
                    <Input
                      id="f-email"
                      type="email"
                      placeholder="e.g. arvind.patil@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="f-dept">Department / Engineering Branch</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger id="f-dept">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingDepts.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                        <SelectItem value="Artificial Intelligence & Data Science">AI &amp; Data Science</SelectItem>
                        <SelectItem value="Electronics & Telecommunication">Electronics &amp; Telecom</SelectItem>
                        <SelectItem value="custom">+ Add Custom Department / Field</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {department === 'custom' && (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="f-custom-dept">New Department / Field Name</Label>
                      <Input
                        id="f-custom-dept"
                        placeholder="e.g. Robotics & Automation"
                        value={customDept}
                        onChange={(e) => setCustomDept(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="f-desig">Designation</Label>
                    <Input
                      id="f-desig"
                      placeholder="e.g. Professor &amp; HOD"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="f-phone">Contact Number</Label>
                      <Input
                        id="f-phone"
                        placeholder="+91 98..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="f-pass">Initial Password</Label>
                      <Input
                        id="f-pass"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Register Mentor</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Faculty Mentors" value={totalFaculty} sub="Active departments" />
        <StatCard label="Assigned Mentees" value={totalMentees} sub="Enrolled students" />
        <StatCard
          label="Avg Ratio"
          value={`1:${Math.round(totalMentees / Math.max(1, totalFaculty))}`}
          sub="Mentee to mentor"
        />
        <StatCard
          label="Pending Reviews"
          value={
            p.selfPlacements.filter((s) => s.status === 'submitted').length +
            p.weeklyReports.filter((r) => r.status === 'submitted').length
          }
          sub="Across all faculties"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {p.faculty.map((f) => {
          const mentees = p.students.filter((s) => s.facultyId === f.id)
          const pendingReviews =
            p.weeklyReports.filter((w) => mentees.some((m) => m.id === p.internships.find((n) => n.id === w.internshipId)?.studentId) && w.status === 'submitted').length +
            p.selfPlacements.filter((sp) => mentees.some((m) => m.id === sp.studentId) && sp.status === 'submitted').length

          return (
            <div key={f.id} className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-foreground text-background font-bold text-sm">
                      {f.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base leading-tight">{f.name}</h3>
                      <p className="text-xs text-muted-foreground">{f.designation || 'Faculty Mentor'}</p>
                    </div>
                  </div>
                  <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground bg-muted/40">
                    {f.department}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    <span className="truncate">{f.email}</span>
                  </div>
                  {f.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      <span>{f.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t mt-4 pt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">
                    {mentees.length} assigned {mentees.length === 1 ? 'student' : 'students'}
                  </span>
                  {pendingReviews > 0 && (
                    <span className="rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-semibold">
                      {pendingReviews} pending review{pendingReviews === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">ID: {f.id}</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
