'use client'

import { PageHeader, StatCard } from '@/components/portal/page-header'
import { InternshipWorkflowCard } from '@/components/portal/internship-workflow'
import { usePortal } from '@/lib/store'

const DESCRIPTION: Record<string, string> = {
  student:
    'Every document for your internship in one ledger — offer, acceptance, joining, completion and PPO — with live verification status.',
  company:
    'Upload offer, joining and completion documents for your interns, and record pre-placement offers.',
  faculty: 'Monitor the document trail and PPO status for your mentees.',
  admin:
    'Verify or reject uploaded internship documents and track pre-placement offers across the institute.',
}

export default function DocumentsPage() {
  const p = usePortal()

  const internships =
    p.role === 'student'
      ? p.internships.filter((n) => n.studentId === p.actingStudentId)
      : p.role === 'company'
        ? p.internships.filter((n) => n.companyId === p.actingCompanyId)
        : p.role === 'faculty'
          ? p.internships.filter((n) => {
              const s = p.students.find((x) => x.id === n.studentId)
              return s?.facultyId === p.actingFacultyId
            })
          : p.internships

  const ids = new Set(internships.map((n) => n.id))
  const docs = p.documents.filter((d) => ids.has(d.internshipId))
  const awaiting = docs.filter((d) => d.status === 'uploaded').length
  const verified = docs.filter((d) => d.status === 'verified').length
  const outstanding = docs.filter((d) => d.status === 'not_uploaded').length
  const ppos = internships.filter(
    (n) => n.ppoStatus === 'offered' || n.ppoStatus === 'accepted',
  ).length

  return (
    <>
      <PageHeader
        title="Documents & PPO"
        description={DESCRIPTION[p.role]}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Verified" value={verified} sub="documents on record" />
        <StatCard label="Awaiting T&P" value={awaiting} sub="uploaded, pending verification" />
        <StatCard label="Outstanding" value={outstanding} sub="not uploaded yet" />
        <StatCard label="PPOs" value={ppos} sub="offered or accepted" />
      </div>

      <ul className="flex flex-col gap-4">
        {internships.map((n) => (
          <InternshipWorkflowCard key={n.id} internship={n} />
        ))}
        {internships.length === 0 && (
          <li className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No internships on record yet. The document ledger opens automatically once an offer is
            accepted or a self-placement is approved.
          </li>
        )}
      </ul>
    </>
  )
}
