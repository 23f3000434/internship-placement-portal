'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
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

export default function CompanyDrivesPage() {
  const p = usePortal()
  const me = p.companies.find((c) => c.id === p.actingCompanyId)
  const myDrives = p.drives.filter((d) => d.companyId === p.actingCompanyId)
  const appsFor = (driveId: string) => p.applications.filter((a) => a.driveId === driveId)

  return (
    <>
      <PageHeader
        title="My drives"
        description={`Internship drives published by ${me?.name ?? 'your company'}.`}
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
          Publishing drives is disabled until your company registration is approved by the admin.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total drives" value={myDrives.length} />
        <StatCard label="Open" value={myDrives.filter((d) => d.status === 'open').length} />
        <StatCard
          label="Total applicants"
          value={myDrives.reduce((n, d) => n + appsFor(d.id).length, 0)}
        />
        <StatCard
          label="Selections"
          value={myDrives.reduce(
            (n, d) => n + appsFor(d.id).filter((a) => a.status === 'selected').length,
            0,
          )}
        />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Drive</TableHead>
              <TableHead>Filters</TableHead>
              <TableHead className="text-right">Stipend</TableHead>
              <TableHead className="text-right">Openings</TableHead>
              <TableHead className="text-right">Applicants</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myDrives.map((d) => {
              const apps = appsFor(d.id)
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    <Link
                      href={`/drives/${d.id}`}
                      className="font-medium underline-offset-4 hover:underline"
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
                      : `CGPA ≥ ${d.minCgpa.toFixed(1)} · ${d.fieldFilter} · ${d.locationFilter}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{d.stipend.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{d.openings}</TableCell>
                  <TableCell className="text-right tabular-nums">{apps.length}</TableCell>
                  <TableCell className="tabular-nums">{d.deadline}</TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                </TableRow>
              )
            })}
            {myDrives.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No drives published yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
