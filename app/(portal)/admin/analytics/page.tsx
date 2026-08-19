'use client'

import { Download, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
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
import { PageHeader, StatCard } from '@/components/portal/page-header'
import { usePortal } from '@/lib/store'
import { statusLabel } from '@/lib/eligibility'

const chartConfig = {
  value: { label: 'Count', color: 'var(--foreground)' },
  secondary: { label: 'Secondary', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AnalyticsPage() {
  const p = usePortal()
  const [dept, setDept] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')

  const departments = Array.from(new Set(p.students.map((s) => s.branch)))

  const students = useMemo(
    () => p.students.filter((s) => dept === 'all' || s.branch === dept),
    [p.students, dept],
  )
  const apps = useMemo(
    () =>
      p.applications.filter((a) => {
        const s = p.students.find((x) => x.id === a.studentId)
        const d = p.drives.find((x) => x.id === a.driveId)
        const okDept = dept === 'all' || s?.branch === dept
        const okCompany = companyFilter === 'all' || d?.companyId === companyFilter
        return okDept && okCompany
      }),
    [p.applications, p.students, p.drives, dept, companyFilter],
  )

  const activeInternships = p.internships.filter((n) => n.status === 'active')
  const att = p.attendance
  const attPct =
    att.reduce((n, a) => n + a.workingDays, 0) > 0
      ? Math.round(
          (att.reduce((n, a) => n + a.present, 0) / att.reduce((n, a) => n + a.workingDays, 0)) * 100,
        )
      : 0
  const avgRating =
    p.feedback.length > 0
      ? (
          p.feedback.reduce(
            (n, f) => n + (f.attendance + f.workQuality + f.communication + f.technical) / 4,
            0,
          ) / p.feedback.length
        ).toFixed(1)
      : '—'
  const milestonesDone = p.milestones.filter((m) => m.status === 'completed').length
  const reportCompliance =
    p.weeklyReports.length > 0
      ? Math.round(
          (p.weeklyReports.filter((w) => w.status !== 'submitted').length / p.weeklyReports.length) * 100,
        )
      : 0
  const selfPlaced = p.internships.filter((n) => n.type === 'self').length
  const collegePlaced = p.internships.filter((n) => n.type === 'college').length

  // --- Conversion funnel ---------------------------------------------------
  const selectedCount = apps.filter((a) => a.status === 'selected').length
  const shortlistedCount = apps.filter((a) =>
    ['shortlisted', 'interview_scheduled', 'selected'].includes(a.status),
  ).length
  const completedCount = p.internships.filter((n) => n.status === 'completed').length
  const conversionRate = apps.length > 0 ? Math.round((selectedCount / apps.length) * 100) : 0
  const shortlistToOffer =
    shortlistedCount > 0 ? Math.round((selectedCount / shortlistedCount) * 100) : 0

  // --- PPO ------------------------------------------------------------------
  const ppoCounts = {
    recommended: p.internships.filter((n) => n.ppoStatus === 'recommended').length,
    offered: p.internships.filter((n) => n.ppoStatus === 'offered').length,
    accepted: p.internships.filter((n) => n.ppoStatus === 'accepted').length,
    declined: p.internships.filter((n) => n.ppoStatus === 'declined').length,
  }
  const ppoTotal = ppoCounts.offered + ppoCounts.accepted
  const ppoConversion = completedCount > 0 ? Math.round((ppoTotal / completedCount) * 100) : 0
  const ppoPackages = p.internships
    .map((n) => n.ppoPackage)
    .filter((v): v is number => typeof v === 'number' && v > 0)
  const avgPpoPackage =
    ppoPackages.length > 0 ? ppoPackages.reduce((a, b) => a + b, 0) / ppoPackages.length : 0

  const ppoData = [
    { name: 'Recommended', value: ppoCounts.recommended },
    { name: 'Offered', value: ppoCounts.offered },
    { name: 'Accepted', value: ppoCounts.accepted },
    { name: 'Declined', value: ppoCounts.declined },
  ]

  // --- Stipend spread -------------------------------------------------------
  const stipendDrives = p.drives.filter(
    (d) => companyFilter === 'all' || d.companyId === companyFilter,
  )
  const stipends = stipendDrives.map((d) => d.stipend).filter((s) => s > 0)
  const highestStipend = stipends.length ? Math.max(...stipends) : 0
  const lowestStipend = stipends.length ? Math.min(...stipends) : 0
  const avgStipend = stipends.length ? Math.round(stipends.reduce((a, b) => a + b, 0) / stipends.length) : 0
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

  const stipendByCompany = p.companies
    .map((c) => {
      const ds = stipendDrives.filter((d) => d.companyId === c.id && d.stipend > 0)
      return {
        name: c.name.split(' ')[0],
        value: ds.length ? Math.round(ds.reduce((n, d) => n + d.stipend, 0) / ds.length) : 0,
        secondary: p.internships.filter((n) => n.companyId === c.id).length,
      }
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)

  // --- Which companies hired, and where -------------------------------------
  /**
   * Resolves the city an internship physically sits in: the location recorded on
   * the internship, else its drive's city, else the company's head office.
   */
  const internshipLocation = (n: (typeof p.internships)[number]) =>
    n.location ??
    p.drives.find((d) => d.id === n.driveId)?.location ??
    p.companies.find((c) => c.id === n.companyId)?.location ??
    'Not specified'

  const hiringCompanies = p.companies
    .map((c) => {
      const hires = p.internships.filter((n) => n.companyId === c.id)
      return {
        id: c.id,
        name: c.name,
        location: c.location,
        hires: hires.length,
        active: hires.filter((n) => n.status === 'active').length,
        ppos: hires.filter((n) => n.ppoStatus === 'offered' || n.ppoStatus === 'accepted').length,
      }
    })
    .filter((c) => c.hires > 0)
    .sort((a, b) => b.hires - a.hires || b.ppos - a.ppos)

  const locationCounts = new Map<string, number>()
  for (const n of p.internships) {
    const loc = internshipLocation(n)
    locationCounts.set(loc, (locationCounts.get(loc) ?? 0) + 1)
  }
  const locationRows = [...locationCounts.entries()]
    .map(([location, count]) => ({
      location,
      count,
      pct: p.internships.length ? Math.round((count / p.internships.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // --- Institute-wide skill gap --------------------------------------------
  const approvedStudents = students.filter((s) => s.status === 'approved' || s.status === 'pending')
  const skillDemand = new Map<string, number>()
  for (const d of p.drives) {
    if (d.status !== 'open' || d.anyoneCanApply) continue
    for (const s of d.requiredSkills) skillDemand.set(s, (skillDemand.get(s) ?? 0) + 1)
  }
  const skillGapRows = [...skillDemand.entries()]
    .map(([skill, drives]) => {
      const lack = approvedStudents.filter(
        (s) => !s.skills.some((x) => x.toLowerCase() === skill.toLowerCase()),
      ).length
      return {
        skill,
        drives,
        lack,
        pct: approvedStudents.length ? Math.round((lack / approvedStudents.length) * 100) : 0,
      }
    })
    .sort((a, b) => b.pct - a.pct || b.drives - a.drives)

  // --- Pending verification workload --------------------------------------
  const pendingStudents = p.students.filter((s) => s.status === 'pending').length
  const pendingCompanies = p.companies.filter((c) => c.status === 'pending').length
  const pendingDocs = p.documents.filter((d) => d.status === 'uploaded').length
  const missingDocs = p.documents.filter((d) => d.status === 'not_uploaded').length
  const pendingSelfPlacements = p.selfPlacements.filter((sp) => sp.status === 'pending').length
  const pendingAchievements = p.achievements.filter((a) => a.status === 'pending').length

  const pipelineData = (
    ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'] as const
  ).map((s) => ({
    name: statusLabel[s],
    value: apps.filter((a) => a.status === s).length,
  }))

  const deptData = departments.map((b) => ({
    name: b.split(' ').map((w) => w.slice(0, 4)).join(' '),
    value: p.applications.filter((a) => p.students.find((s) => s.id === a.studentId)?.branch === b).length,
    secondary: p.internships.filter(
      (n) => p.students.find((s) => s.id === n.studentId)?.branch === b,
    ).length,
  }))

  const placementData = [
    { name: 'College-placed', value: collegePlaced },
    { name: 'Self-placed', value: selfPlaced },
  ]

  const exportStudents = () =>
    downloadCsv('students.csv', [
      ['Name', 'Enrollment', 'Branch', 'CGPA', 'Status'],
      ...students.map((s) => [s.name, s.enrollment, s.branch, s.cgpa, s.status]),
    ])

  const exportApplications = () =>
    downloadCsv('applications.csv', [
      ['Student', 'Drive', 'Company', 'Status', 'Applied at'],
      ...apps.map((a) => [
        p.students.find((s) => s.id === a.studentId)?.name ?? '',
        p.drives.find((d) => d.id === a.driveId)?.title ?? '',
        p.companies.find((c) => c.id === p.drives.find((d) => d.id === a.driveId)?.companyId)?.name ?? '',
        statusLabel[a.status],
        a.appliedAt,
      ]),
    ])

  const exportInternships = () =>
    downloadCsv('internships.csv', [
      ['Student', 'Role', 'Type', 'Start', 'End', 'Status'],
      ...p.internships.map((n) => [
        p.students.find((s) => s.id === n.studentId)?.name ?? '',
        n.role,
        n.type,
        n.startDate,
        n.endDate,
        n.status,
      ]),
    ])

  const exportPpo = () =>
    downloadCsv('ppo-and-documents.csv', [
      ['Student', 'Company', 'Role', 'Internship status', 'PPO status', 'Package', 'Documents verified'],
      ...p.internships.map((n) => [
        p.students.find((s) => s.id === n.studentId)?.name ?? '',
        p.companies.find((c) => c.id === n.companyId)?.name ?? 'Self-placed',
        n.role,
        n.status,
        n.ppoStatus,
        n.ppoPackage ?? '',
        `${p.documents.filter((d) => d.internshipId === n.id && d.status === 'verified').length}/${
          p.documents.filter((d) => d.internshipId === n.id).length
        }`,
      ]),
    ])

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) p.importData(content)
    }
    reader.readAsText(file)
  }

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description="Centralized placement analytics, skill metrics, geographic distributions, and database backup."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="default" size="sm" onClick={p.exportData}>
              <Download data-slot="icon" /> Export DB (JSON)
            </Button>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
              <Upload className="mr-1.5 size-3.5" /> Import DB (JSON)
              <input type="file" accept=".json" onChange={handleFileImport} className="sr-only" />
            </label>
            <Button variant="outline" size="sm" onClick={exportStudents}>
              <Download data-slot="icon" /> Students CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportApplications}>
              <Download data-slot="icon" /> Apps CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportInternships}>
              <Download data-slot="icon" /> Internships CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPpo}>
              <Download data-slot="icon" /> PPO CSV
            </Button>
          </div>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={dept} onValueChange={(v) => setDept(v ?? 'all')}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by department">
            <SelectValue>{(v: string) => (v === 'all' ? 'All departments' : v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={(v) => setCompanyFilter(v ?? 'all')}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by company">
            <SelectValue>
              {(v: string) =>
                v === 'all' ? 'All companies' : (p.companies.find((c) => c.id === v)?.name ?? 'All companies')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All companies</SelectItem>
            {p.companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Students"
          value={students.length}
          sub={`${students.filter((s) => s.status === 'approved').length} verified`}
        />
        <StatCard
          label="Companies"
          value={p.companies.length}
          sub={`${p.companies.filter((c) => c.status === 'approved').length} verified`}
        />
        <StatCard label="Applications" value={apps.length} sub={`${p.drives.filter((d) => d.status === 'open').length} open drives`} />
        <StatCard label="Active internships" value={activeInternships.length} sub={`${p.internships.length} total`} />
        <StatCard label="Attendance" value={`${attPct}%`} sub="across active internships" />
        <StatCard label="Avg company rating" value={avgRating} sub="out of 5" />
        <StatCard label="Milestones completed" value={`${milestonesDone}/${p.milestones.length}`} />
        <StatCard label="Report compliance" value={`${reportCompliance}%`} sub="verified weekly reports" />
      </div>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <div>
          <h2 className="text-sm font-semibold">Conversion &amp; PPO outcomes</h2>
          <p className="text-xs text-muted-foreground">
            How many applications turn into offers, and how many internships convert into
            pre-placement offers.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Conversion rate"
            value={`${conversionRate}%`}
            sub={`${selectedCount} selected of ${apps.length} applications`}
          />
          <StatCard
            label="Shortlist → offer"
            value={`${shortlistToOffer}%`}
            sub={`${shortlistedCount} reached shortlist`}
          />
          <StatCard
            label="PPO conversion"
            value={`${ppoConversion}%`}
            sub={`${ppoTotal} PPOs from ${completedCount} completed`}
          />
          <StatCard
            label="Avg PPO package"
            value={avgPpoPackage > 0 ? `₹${(avgPpoPackage / 100000).toFixed(1)} LPA` : '—'}
            sub={`${ppoCounts.accepted} accepted · ${ppoCounts.declined} declined`}
          />
        </div>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={ppoData} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} interval={0} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[2, 2, 0, 0]} maxBarSize={64} />
          </BarChart>
        </ChartContainer>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <div>
          <h2 className="text-sm font-semibold">Stipend spread</h2>
          <p className="text-xs text-muted-foreground">
            Monthly stipends across {stipends.length} paid drive{stipends.length === 1 ? '' : 's'},
            with the average per company.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Highest" value={inr(highestStipend)} sub="per month" />
          <StatCard label="Average" value={inr(avgStipend)} sub="per month" />
          <StatCard label="Lowest" value={inr(lowestStipend)} sub="per month" />
        </div>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <BarChart data={stipendByCompany} margin={{ left: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={52}
              tickFormatter={(v: number) => `${v / 1000}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="value"
              name="Avg stipend"
              fill="var(--color-value)"
              radius={[2, 2, 0, 0]}
              maxBarSize={56}
            />
          </BarChart>
        </ChartContainer>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
          <div>
            <h2 className="text-sm font-semibold">Which companies hired our students</h2>
            <p className="text-xs text-muted-foreground">
              Every recruiter with at least one internship on record, most hires first.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Hires</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">PPOs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hiringCompanies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.location}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.hires}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.active}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.ppos}</TableCell>
                  </TableRow>
                ))}
                {hiringCompanies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No internships on record yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
          <div>
            <h2 className="text-sm font-semibold">Where students are interning</h2>
            <p className="text-xs text-muted-foreground">
              Internship locations across {p.internships.length} placement
              {p.internships.length === 1 ? '' : 's'} — useful for hostel, travel and outstation
              approvals.
            </p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {locationRows.map((r) => (
              <li key={r.location} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm">{r.location}</span>
                <span className="flex h-2 flex-1 overflow-hidden rounded-sm bg-muted">
                  <span aria-hidden className="h-full bg-foreground" style={{ width: `${r.pct}%` }} />
                </span>
                <span className="w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {r.count} · {r.pct}%
                </span>
              </li>
            ))}
            {locationRows.length === 0 && (
              <li className="text-sm text-muted-foreground">No internships on record yet.</li>
            )}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
          <div>
            <h2 className="text-sm font-semibold">Institute-wide skill gap</h2>
            <p className="text-xs text-muted-foreground">
              Share of students missing each skill that open drives ask for — the training the T&amp;P
              cell should run next.
            </p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {skillGapRows.slice(0, 8).map((r) => (
              <li key={r.skill} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm">{r.skill}</span>
                <span className="flex h-2 flex-1 overflow-hidden rounded-sm bg-muted">
                  <span
                    aria-hidden
                    className="h-full bg-foreground"
                    style={{ width: `${r.pct}%` }}
                  />
                </span>
                <span className="w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {r.pct}% lack · {r.drives} drive{r.drives === 1 ? '' : 's'}
                </span>
              </li>
            ))}
            {skillGapRows.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No skill-restricted drives are open right now.
              </li>
            )}
          </ul>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
          <div>
            <h2 className="text-sm font-semibold">Pending verifications &amp; documents</h2>
            <p className="text-xs text-muted-foreground">
              Everything currently waiting on a human decision.
            </p>
          </div>
          <ul className="divide-y text-sm">
            {[
              { label: 'Student registrations', value: pendingStudents },
              { label: 'Company registrations', value: pendingCompanies },
              { label: 'Documents awaiting verification', value: pendingDocs },
              { label: 'Documents not yet uploaded', value: missingDocs },
              { label: 'Self-placement requests', value: pendingSelfPlacements },
              { label: 'Achievement claims', value: pendingAchievements },
            ].map((row) => (
              <li key={row.label} className="flex items-center justify-between py-2.5">
                <span className={row.value > 0 ? '' : 'text-muted-foreground'}>{row.label}</span>
                <span className="font-medium tabular-nums">{row.value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Application pipeline</h2>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={pipelineData} margin={{ left: -20, bottom: 24 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={50}
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </section>
        <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Applications vs internships by department</h2>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={deptData} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" name="Applications" fill="var(--color-value)" radius={[2, 2, 0, 0]} />
              <Bar
                dataKey="secondary"
                name="Internships"
                fill="var(--color-secondary)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </section>
      </div>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold">Self-placed vs college-placed</h2>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={placementData} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} interval={0} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[2, 2, 0, 0]} maxBarSize={72} />
          </BarChart>
        </ChartContainer>
      </section>
    </>
  )
}
