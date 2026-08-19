'use client'

import Link from 'next/link'
import { use } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, StatCard } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const p = usePortal()
  const company = p.companies.find((c) => c.id === id)

  if (!company) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Company not found.{' '}
        <Link href="/companies" className="font-medium text-foreground underline underline-offset-4">
          Back to companies
        </Link>
      </div>
    )
  }

  const companyDrives = p.drives.filter((d) => d.companyId === company.id)
  const openDrives = companyDrives.filter((d) => d.status === 'open')
  const companyApps = p.applications.filter((a) => companyDrives.some((d) => d.id === a.driveId))
  const interested = companyApps.filter((a) => a.status !== 'rejected')
  const selected = companyApps.filter((a) => a.status === 'selected')
  const history = p.internships.filter((n) => n.companyId === company.id)
  const skills = Array.from(new Set(companyDrives.flatMap((d) => d.skills)))

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/companies" />}>
          <ArrowLeft /> All companies
        </Button>
      </div>
      <PageHeader
        title={company.name}
        description={`${company.industry} · ${company.location} · ${company.website}`}
        actions={<StatusBadge status={company.status} />}
      />

      <section className="rounded-lg border p-5">
        <h2 className="mb-2 text-sm font-semibold">About</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{company.about}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          HR contact: {company.hrName} · {company.hrEmail}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open drives" value={openDrives.length} />
        <StatCard label="Interested students" value={interested.length} sub="active applications" />
        <StatCard label="Selected students" value={selected.length} />
        <StatCard label="Internship history" value={history.length} sub="with this college" />
      </div>

      {skills.length > 0 && (
        <section className="rounded-lg border p-5">
          <h2 className="mb-3 text-sm font-semibold">Skills they hire for</h2>
          <ul className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <li key={s} className="rounded-full border px-3 py-1 text-xs font-medium">
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Internship drives</h2>
        </div>
        <ul className="divide-y">
          {companyDrives.map((d) => (
            <li key={d.id}>
              <Link
                href={`/drives/${d.id}`}
                className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-muted/50 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {d.startDate} → {d.endDate} · ₹{d.stipend.toLocaleString('en-IN')}/mo ·{' '}
                    {d.openings} opening{d.openings === 1 ? '' : 's'}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </Link>
            </li>
          ))}
          {companyDrives.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No drives published yet.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Internship history with the college</h2>
        </div>
        <ul className="divide-y">
          {history.map((n) => {
            const student = p.students.find((s) => s.id === n.studentId)
            return (
              <li key={n.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{student?.name}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {n.role} · {n.startDate} → {n.endDate}
                  </p>
                </div>
                <StatusBadge status={n.status} />
              </li>
            )
          })}
          {history.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No internships with this company yet.
            </li>
          )}
        </ul>
      </section>
    </>
  )
}
