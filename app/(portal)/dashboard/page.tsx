'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeader, StatCard } from '@/components/portal/page-header'
import { AiRecommendationWidget } from '@/components/portal/ai-copilot'
import { StatusBadge } from '@/components/portal/status-badge'
import { checkEligibility, getDriveStatus } from '@/lib/eligibility'
import { usePortal } from '@/lib/store'
import { FileText, CheckCircle2, AlertCircle, ArrowRight, User } from 'lucide-react'

function StudentDashboard() {
  const p = usePortal()
  const currentStudentId = p.authSession?.userId || p.actingStudentId || 's1'
  const me =
    p.students.find((s) => s.id === currentStudentId) ||
    p.students.find((s) => s.email?.trim().toLowerCase() === p.authSession?.email?.trim().toLowerCase()) ||
    p.students.find((s) => s.id === p.actingStudentId) ||
    p.students[0]
  if (!me) return null
  const candidateIds = new Set([currentStudentId, me.id, p.actingStudentId].filter(Boolean))
  const myApps = p.applications.filter((a) => candidateIds.has(a.studentId))
  const myInternships = p.internships.filter((n) => candidateIds.has(n.studentId))
  const active = myInternships.find((n) => n.status === 'active')
  const eligibleCount = p.drives.filter(
    (d) => getDriveStatus(d, p.applications) === 'open' && checkEligibility(me, d).state === 'eligible',
  ).length
  const myInterviews = p.interviews.filter((i) =>
    myApps.some((a) => a.id === i.applicationId && a.status === 'interview_scheduled'),
  )

  if (me.status === 'blocked') {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-8">
        <StatusBadge status="blocked" />
        <h2 className="text-lg font-semibold">Your account is blocked</h2>
        <p className="text-sm text-muted-foreground">Reason: {me.blockReason}</p>
        <Button variant="outline" render={<Link href="/messages" />}>
          Contact admin
        </Button>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${me.name.split(' ')[0]}`}
        description={`${me.branch} · CGPA ${me.cgpa.toFixed(1)} · ${me.enrollment}`}
        actions={<StatusBadge status={me.status} />}
      />
      {me.status === 'pending' && (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Your documents are pending verification. Applying is disabled until the admin approves
          your account.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Eligible drives" value={eligibleCount} sub="open right now" />
        <StatCard label="Applications" value={myApps.length} sub="all statuses" />
        <StatCard label="Interviews" value={myInterviews.length} sub="scheduled" />
        <StatCard label="Active internship" value={active ? 1 : 0} sub={active ? active.role : 'none yet'} />
      </div>

      {/* Placement & Profile Summary Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <User className="size-4 text-foreground" />
                <h2 className="text-sm font-semibold">Placement Profile &amp; Eligibility</h2>
              </div>
              <StatusBadge status={me.status} />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
              <div className="flex items-center gap-2 rounded-lg border p-2.5">
                <FileText className="size-4 text-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium">Resume PDF</p>
                  <p className="text-muted-foreground truncate">{me.resumeUploaded ? 'Verified & On File' : 'Not uploaded'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border p-2.5">
                <CheckCircle2 className="size-4 text-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium">Academic Standing</p>
                  <p className="text-muted-foreground">{me.backlogs === 0 ? 'Clear (0 backlogs)' : `${me.backlogs} backlog(s)`}</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Technical Skills:</span>{' '}
                {me.skills.length > 0 ? me.skills.join(', ') : 'No skills documented yet'}
              </p>
            </div>
          </div>

          <div className="border-t pt-3 mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{me.skills.length} skills listed</span>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" render={<Link href="/profile" />}>
              Edit Profile <ArrowRight className="size-3" />
            </Button>
          </div>
        </section>

        <AiRecommendationWidget student={me} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Recent applications</h2>
            <Button variant="ghost" size="sm" render={<Link href="/applications" />}>
              View all
            </Button>
          </div>
          <ul className="divide-y">
            {myApps.slice(-4).reverse().map((a) => {
              const d = p.drives.find((x) => x.id === a.driveId)
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.companies.find((c) => c.id === d?.companyId)?.name}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              )
            })}
            {myApps.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">No applications yet.</li>
            )}
          </ul>
        </section>
        <section className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Next steps</h2>
          </div>
          <ul className="divide-y text-sm">
            {myInterviews.map((i) => (
              <li key={i.id} className="flex flex-col gap-1 px-4 py-3">
                <span className="font-medium">Interview on {i.date} at {i.time}</span>
                <span className="text-xs text-muted-foreground">
                  {i.acknowledged ? 'Acknowledged' : 'Awaiting your acknowledgement'} — see My Applications
                </span>
              </li>
            ))}
            {active && (
              <li className="flex flex-col gap-1 px-4 py-3">
                <span className="font-medium">Submit this week&apos;s activity report</span>
                <span className="text-xs text-muted-foreground">{active.role} — due every Friday</span>
              </li>
            )}
            {!me.resumeUploaded && (
              <li className="flex flex-col gap-1 px-4 py-3">
                <span className="font-medium">Upload your resume</span>
                <span className="text-xs text-muted-foreground">Required before applying to any drive</span>
              </li>
            )}
            {myInterviews.length === 0 && !active && me.resumeUploaded && (
              <li className="px-4 py-8 text-center text-muted-foreground">
                Browse drives to find your next internship.
              </li>
            )}
          </ul>
        </section>
      </div>
    </>
  )
}

function CompanyDashboard() {
  const p = usePortal()
  const currentCompanyId = p.authSession?.userId || p.actingCompanyId || 'c1'
  const me =
    p.companies.find((c) => c.id === currentCompanyId) ||
    p.companies.find((c) => c.hrEmail?.trim().toLowerCase() === p.authSession?.email?.trim().toLowerCase()) ||
    p.companies.find((c) => c.email?.trim().toLowerCase() === p.authSession?.email?.trim().toLowerCase()) ||
    p.companies.find((c) => c.id === p.actingCompanyId) ||
    p.companies[0]
  if (!me) return null
  const companyIds = new Set([currentCompanyId, me.id, p.actingCompanyId].filter(Boolean))
  const myDrives = p.drives.filter(
    (d) =>
      companyIds.has(d.companyId) ||
      (me && d.companyId === me.id) ||
      (!p.authSession?.userId && (d.companyId === 'c1' || d.companyId === p.actingCompanyId)),
  )
  const driveIds = new Set(myDrives.map((d) => d.id))
  const myApps = p.applications.filter((a) => driveIds.has(a.driveId))
  const interns = p.internships.filter((n) => companyIds.has(n.companyId) && n.status === 'active')

  if (me.status === 'blocked') {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-8">
        <StatusBadge status="blocked" />
        <h2 className="text-lg font-semibold">Your company account is blocked</h2>
        <p className="text-sm text-muted-foreground">Reason: {me.blockReason}</p>
        <Button variant="outline" render={<Link href="/messages" />}>
          Contact admin
        </Button>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title={me.name}
        description={`${me.industry} · ${me.location}`}
        actions={
          <>
            <StatusBadge status={me.status} />
            {me.status === 'approved' && (
              <Button render={<Link href="/company/drives/new" />}>Create drive</Button>
            )}
          </>
        }
      />
      {me.status === 'pending' && (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Registration pending admin approval. You can explore, but publishing drives is disabled.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open drives" value={myDrives.filter((d) => getDriveStatus(d, p.applications) === 'open').length} />
        <StatCard label="Total applicants" value={myApps.length} />
        <StatCard label="Shortlisted" value={myApps.filter((a) => a.status === 'shortlisted').length} />
        <StatCard label="Active interns" value={interns.length} />
      </div>
      <section className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Applicant pipeline</h2>
          <Button variant="ghost" size="sm" render={<Link href="/company/applicants" />}>
            Manage
          </Button>
        </div>
        <ul className="divide-y">
          {myApps.slice(-5).reverse().map((a) => {
            const s = p.students.find((x) => x.id === a.studentId)
            const d = p.drives.find((x) => x.id === a.driveId)
            return (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s?.name}</p>
                  <p className="text-xs text-muted-foreground">{d?.title}</p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            )
          })}
          {myApps.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">No applicants yet.</li>
          )}
        </ul>
      </section>
    </>
  )
}

function FacultyDashboard() {
  const p = usePortal()
  const currentFacultyId = p.authSession?.userId || p.actingFacultyId || 'f1'
  const mentees = p.students.filter((s) => s.facultyId === currentFacultyId || (!p.authSession?.userId && s.facultyId === 'f1'))
  const pendingSP = p.selfPlacements.filter((sp) => sp.status === 'pending')
  const pendingAch = p.achievements.filter((a) => a.status === 'pending')
  const pendingReports = p.weeklyReports.filter((w) => w.status === 'company_approved')
  const atRisk = mentees.filter((s) => s.atRisk)

  return (
    <>
      <PageHeader
        title="Faculty dashboard"
        description="Prof. R. Kulkarni · Computer Science mentor"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned students" value={mentees.length} />
        <StatCard label="Reports to review" value={pendingReports.length} sub="company verified" />
        <StatCard label="Pending verifications" value={pendingSP.length + pendingAch.length} sub="self-placements + achievements" />
        <StatCard label="At-risk students" value={atRisk.length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Verification queue</h2>
            <Button variant="ghost" size="sm" render={<Link href="/faculty/reviews" />}>
              Open
            </Button>
          </div>
          <ul className="divide-y text-sm">
            {pendingSP.map((sp) => (
              <li key={sp.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="min-w-0 truncate">
                  Self-placement — {p.students.find((s) => s.id === sp.studentId)?.name} at {sp.companyName}
                </span>
                <StatusBadge status="pending" />
              </li>
            ))}
            {pendingAch.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="min-w-0 truncate">Achievement — {a.title}</span>
                <StatusBadge status="pending" />
              </li>
            ))}
            {pendingSP.length + pendingAch.length === 0 && (
              <li className="px-4 py-8 text-center text-muted-foreground">Queue is clear.</li>
            )}
          </ul>
        </section>
        <section className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">At-risk students</h2>
            <Button variant="ghost" size="sm" render={<Link href="/faculty/students" />}>
              All students
            </Button>
          </div>
          <ul className="divide-y text-sm">
            {atRisk.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Low attendance / missing reports</p>
                </div>
                <StatusBadge status="flagged" />
              </li>
            ))}
            {atRisk.length === 0 && (
              <li className="px-4 py-8 text-center text-muted-foreground">No students flagged.</li>
            )}
          </ul>
        </section>
      </div>
    </>
  )
}

function AdminDashboard() {
  const p = usePortal()
  const pendingStudents = p.students.filter((s) => s.status === 'pending')
  const pendingCompanies = p.companies.filter((c) => c.status === 'pending')
  const activeInternships = p.internships.filter((n) => n.status === 'active')
  const selections = p.applications.filter((a) => a.status === 'selected')

  return (
    <>
      <PageHeader
        title="Admin / T&P dashboard"
        description="Platform moderation, verification, and placement statistics"
        actions={<Button render={<Link href="/admin/analytics" />}>Full analytics</Button>}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Registered students" value={p.students.length} sub={`${p.students.filter((s) => s.status === 'approved').length} verified`} />
        <StatCard label="Registered companies" value={p.companies.length} sub={`${p.companies.filter((c) => c.status === 'approved').length} verified`} />
        <StatCard label="Active drives" value={p.drives.filter((d) => d.status === 'open').length} sub={`${p.applications.length} applications`} />
        <StatCard label="Active internships" value={activeInternships.length} sub={`${selections.length} selections`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Pending verifications</h2>
            <Button variant="ghost" size="sm" render={<Link href="/admin/verifications" />}>
              Review
            </Button>
          </div>
          <ul className="divide-y text-sm">
            {pendingStudents.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="min-w-0 truncate">Student — {s.name} ({s.enrollment})</span>
                <StatusBadge status="pending" />
              </li>
            ))}
            {pendingCompanies.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="min-w-0 truncate">Company — {c.name}</span>
                <StatusBadge status="pending" />
              </li>
            ))}
            {pendingStudents.length + pendingCompanies.length === 0 && (
              <li className="px-4 py-8 text-center text-muted-foreground">Queue is clear.</li>
            )}
          </ul>
        </section>
        <section className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Recent audit activity</h2>
            <Button variant="ghost" size="sm" render={<Link href="/admin/audit" />}>
              Full log
            </Button>
          </div>
          <ul className="divide-y text-sm">
            {p.audit.slice(0, 5).map((e) => (
              <li key={e.id} className="flex flex-col gap-0.5 px-4 py-3">
                <span className="font-medium">{e.action} — {e.target}</span>
                <span className="text-xs text-muted-foreground">{e.actor} · {e.at}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { role } = usePortal()
  if (role === 'student') return <StudentDashboard />
  if (role === 'company') return <CompanyDashboard />
  if (role === 'faculty') return <FacultyDashboard />
  return <AdminDashboard />
}
