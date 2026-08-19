'use client'

import { Flag, FlagOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

export default function FacultyStudentsPage() {
  const p = usePortal()
  const mentees = p.students.filter((s) => s.facultyId === p.actingFacultyId)
  const interning = mentees.filter((s) =>
    p.internships.some((n) => n.studentId === s.id && n.status === 'active'),
  )

  return (
    <>
      <PageHeader
        title="My students"
        description="Assigned mentees, their internship progress, attendance, and risk flags."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned students" value={mentees.length} />
        <StatCard label="Active internships" value={interning.length} />
        <StatCard
          label="Pending reports"
          value={p.weeklyReports.filter((w) => w.status === 'company_approved').length}
          sub="awaiting faculty review"
        />
        <StatCard label="At-risk" value={mentees.filter((s) => s.atRisk).length} />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Internship</TableHead>
              <TableHead className="text-right">Attendance</TableHead>
              <TableHead className="text-right">Reports</TableHead>
              <TableHead className="text-right">Risk flag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mentees.map((s) => {
              const internship = p.internships.find((n) => n.studentId === s.id)
              const att = internship
                ? p.attendance.find((a) => a.internshipId === internship.id)
                : undefined
              const attPct =
                att && att.workingDays > 0 ? Math.round((att.present / att.workingDays) * 100) : null
              const reports = internship
                ? p.weeklyReports.filter((w) => w.internshipId === internship.id)
                : []
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.enrollment} · {s.branch} · CGPA {s.cgpa.toFixed(1)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {internship ? (
                      <>
                        <p className="font-medium">{internship.role}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {internship.type}-placed · {internship.status}
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {attPct !== null ? `${attPct}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {internship ? `${reports.filter((w) => w.status !== 'submitted').length}/${reports.length}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={s.atRisk ? 'default' : 'outline'}
                      onClick={() => p.setAtRisk(s.id, !s.atRisk)}
                    >
                      {s.atRisk ? (
                        <>
                          <FlagOff data-slot="icon" /> Unflag
                        </>
                      ) : (
                        <>
                          <Flag data-slot="icon" /> Flag at-risk
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
