'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PageHeader, StatCard } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'

export default function AttendancePage() {
  const p = usePortal()
  const myInternships = p.internships.filter((n) => n.studentId === p.actingStudentId)
  const active = myInternships.find((n) => n.status === 'active') ?? myInternships[0]

  if (!active) {
    const intern = p.internships.find((n) => n.status === 'active')
    const internStudent = p.students.find((s) => s.id === intern?.studentId)
    return (
      <>
        <PageHeader
          title="Attendance & milestones"
          description="Track daily attendance and project milestones during an active internship."
        />
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No internship yet. Attendance tracking unlocks once your internship begins.
          </p>
          {internStudent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => p.setActingStudentId(internStudent.id)}
            >
              View as {internStudent.name} — active intern
            </Button>
          )}
        </div>
      </>
    )
  }

  const company = p.companies.find((c) => c.id === active.companyId)
  const att = p.attendance.find((a) => a.internshipId === active.id)
  const milestones = p.milestones.filter((m) => m.internshipId === active.id)
  const pct = att && att.workingDays > 0 ? Math.round((att.present / att.workingDays) * 100) : 0
  const milestonesDone = milestones.filter((m) => m.status === 'completed').length

  return (
    <>
      <PageHeader
        title="Attendance & milestones"
        description={`${active.role} · ${company?.name ?? 'Self-placed'} · ${active.startDate} → ${active.endDate}`}
        actions={<StatusBadge status={active.status} />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Working days" value={att?.workingDays ?? 0} sub="logged so far" />
        <StatCard label="Present" value={att?.present ?? 0} sub={`${att?.absent ?? 0} absent · ${att?.leave ?? 0} leave`} />
        <StatCard label="Attendance" value={`${pct}%`} sub={
            !att || att.workingDays === 0
              ? 'no days logged yet'
              : pct >= 75
                ? 'above 75% requirement'
                : 'below 75% requirement'
          } />
        <StatCard label="Milestones" value={`${milestonesDone}/${milestones.length}`} sub="completed" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="flex h-fit flex-col gap-4 rounded-lg border p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Mark today&apos;s attendance</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Attendance percentage</span>
              <span className="font-medium tabular-nums">{pct}%</span>
            </div>
            <Progress value={pct} aria-label={`Attendance ${pct} percent`} />
          </div>
          {active.status === 'active' ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => p.submitAttendanceDay(active.id, 'present')}>Present</Button>
                <Button variant="outline" onClick={() => p.submitAttendanceDay(active.id, 'absent')}>
                  Absent
                </Button>
                <Button variant="outline" onClick={() => p.submitAttendanceDay(active.id, 'leave')}>
                  Leave
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Each entry is sent to your company supervisor for approval. Attendance below 75%
                gets flagged to faculty.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Internship completed — attendance is closed.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3 lg:col-span-3">
          <h2 className="text-sm font-semibold">Milestones</h2>
          <ul className="flex flex-col gap-3">
            {milestones.map((m) => (
              <li key={m.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.title}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">Due {m.dueDate}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                {(m.companyRemark || m.facultyRemark) && (
                  <dl className="flex flex-col gap-1 border-t pt-2 text-xs">
                    {m.companyRemark && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium">Company:</dt>
                        <dd className="text-muted-foreground">{m.companyRemark}</dd>
                      </div>
                    )}
                    {m.facultyRemark && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium">Faculty:</dt>
                        <dd className="text-muted-foreground">{m.facultyRemark}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </li>
            ))}
            {milestones.length === 0 && (
              <li className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No milestones set yet — your company supervisor will add them.
              </li>
            )}
          </ul>
        </section>
      </div>
    </>
  )
}
