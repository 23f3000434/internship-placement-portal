'use client'

import Link from 'next/link'
import { use } from 'react'
import { ArrowLeft, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { checkEligibility } from '@/lib/eligibility'
import { usePortal } from '@/lib/store'
import { cn } from '@/lib/utils'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export default function DriveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const p = usePortal()
  const drive = p.drives.find((d) => d.id === id)
  const me = p.role === 'student' ? p.students.find((s) => s.id === p.actingStudentId) : null

  if (!drive) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Drive not found.{' '}
        <Link href="/drives" className="font-medium text-foreground underline underline-offset-4">
          Back to discovery
        </Link>
      </div>
    )
  }

  const company = p.companies.find((c) => c.id === drive.companyId)
  const backHref = p.role === 'company' ? '/company/drives' : '/drives'
  const backLabel = p.role === 'company' ? 'Back to my drives' : 'Back to drives'
  const elig = me ? checkEligibility(me, drive) : null
  const existingApp = me
    ? p.applications.find((a) => a.driveId === drive.id && a.studentId === me.id)
    : null
  const canApply = elig?.state === 'eligible' && !existingApp && drive.status === 'open'

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" render={<Link href={backHref} />}>
          <ArrowLeft /> {backLabel}
        </Button>
      </div>
      <PageHeader
        title={drive.title}
        description={`${company?.name} · ${drive.field}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={drive.status} />
            {me && (
              <>
                {existingApp ? (
                  <Button variant="outline" render={<Link href="/applications" />}>
                    Applied — view status
                  </Button>
                ) : (
                  <Button disabled={!canApply} onClick={() => p.applyToDrive(drive.id)}>
                    Apply now
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      {elig && (
        <div
          className={cn(
            'flex flex-col gap-1 rounded-lg border p-4',
            elig.state === 'eligible' && 'border-foreground',
            elig.state === 'not_eligible' && 'bg-muted',
            elig.state === 'missing_info' && 'border-dashed',
          )}
          role="status"
        >
          <span className="text-sm font-semibold">
            {elig.state === 'eligible' && 'You are eligible for this drive'}
            {elig.state === 'not_eligible' && 'Not eligible'}
            {elig.state === 'missing_info' && 'Missing information'}
          </span>
          {elig.state === 'eligible' ? (
            <span className="text-sm text-muted-foreground">
              {existingApp
                ? 'You have already applied. Each student can apply once per drive.'
                : 'Your profile meets all the requirements. You can apply once for this drive.'}
            </span>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">
                {elig.reasons.length === 1
                  ? 'Reason:'
                  : `${elig.reasons.length} criteria are not met:`}
              </span>
              <ul className="mt-1 flex flex-col gap-1">
                {elig.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border p-5">
            <h2 className="mb-2 text-sm font-semibold">About the role</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{drive.description}</p>
            <Separator className="my-4" />
            <h3 className="mb-2 text-sm font-semibold">Required skills</h3>
            <ul className="flex flex-wrap gap-2">
              {drive.skills.map((s) => (
                <li key={s} className="rounded-full border px-3 py-1 text-xs font-medium">
                  {s}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border p-5">
            <h2 className="mb-4 text-sm font-semibold">Application timeline</h2>
            <ol className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Applications open', date: drive.openDate },
                { label: 'Deadline', date: drive.deadline },
                { label: 'Internship starts', date: drive.startDate },
                { label: 'Internship ends', date: drive.endDate },
              ].map((step) => (
                <li key={step.label} className="flex flex-col gap-0.5 border-l-2 border-foreground pl-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {step.label}
                  </span>
                  <span className="text-sm font-medium tabular-nums">{step.date}</span>
                </li>
              ))}
            </ol>
          </section>
          {company && (
            <section className="rounded-lg border p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">About {company.name}</h2>
                <Button variant="ghost" size="sm" render={<Link href={`/companies/${company.id}`} />}>
                  Company page
                </Button>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{company.about}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {company.industry} · {company.location} · {company.website}
              </p>
            </section>
          )}
        </div>
        <aside className="flex flex-col gap-4">
          <section className="grid grid-cols-2 gap-4 rounded-lg border p-5">
            <Fact label="Stipend" value={`₹${drive.stipend.toLocaleString('en-IN')}/mo`} />
            <Fact label="Duration" value={`${drive.durationWeeks} weeks`} />
            <Fact label="Openings" value={String(drive.openings)} />
            <Fact label="Work mode" value={drive.workMode} />
            <Fact label="Location" value={drive.location} />
            <Fact label="Field" value={drive.field} />
          </section>
          <section className="rounded-lg border p-5">
            <h2 className="text-sm font-semibold">Eligibility criteria</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {drive.anyoneCanApply
                ? 'This drive is open to everyone — academic filters are waived.'
                : elig
                  ? 'Checked automatically against your profile.'
                  : 'Company-specified criteria for this drive.'}
            </p>

            {elig && elig.criteria.length > 0 ? (
              <ul className="mt-4 flex flex-col divide-y">
                {elig.criteria.map((c) => (
                  <li key={c.label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      className={cn(
                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                        c.pass && 'border-foreground bg-foreground text-background',
                        !c.pass && c.blocking && 'border-foreground',
                        !c.pass && !c.blocking && 'border-dashed',
                      )}
                    >
                      {c.pass ? (
                        <Check className="size-2.5" aria-hidden />
                      ) : (
                        <X className="size-2.5" aria-hidden />
                      )}
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium">{c.label}</span>
                      <span className="text-xs text-muted-foreground">
                        Required: {c.required} · Yours: {c.yours}
                      </span>
                      {!c.pass && (
                        <span className="text-xs font-medium">
                          {c.blocking ? c.reason : `Advisory — ${c.reason}`}
                        </span>
                      )}
                      <span className="sr-only">{c.pass ? 'Criterion met' : 'Criterion not met'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                <li>Minimum CGPA: {drive.minCgpa > 0 ? drive.minCgpa.toFixed(1) : 'None'}</li>
                <li>
                  Active backlogs: {drive.maxBacklogs >= 99 ? 'No limit' : `${drive.maxBacklogs} maximum`}
                </li>
                <li>Department: {drive.fieldFilter}</li>
                <li>
                  Passing year: {drive.passingYears.length ? drive.passingYears.join(' / ') : 'Any'}
                </li>
                <li>
                  Required skills: {drive.requiredSkills.length ? drive.requiredSkills.join(', ') : 'None'}
                </li>
                <li>
                  Certifications:{' '}
                  {drive.requiredCertifications.length
                    ? drive.requiredCertifications.join(', ')
                    : 'None'}
                </li>
              </ul>
            )}

            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Every applicant must also have a verified account with resume and ID documents on file.
            </p>
          </section>
        </aside>
      </div>
    </>
  )
}
