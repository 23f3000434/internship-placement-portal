'use client'

import Link from 'next/link'
import { CalendarClock, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { statusLabel } from '@/lib/eligibility'
import { usePortal } from '@/lib/store'
import type { Application, ApplicationStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const PIPELINE: ApplicationStatus[] = [
  'applied',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'selected',
]

function Timeline({ app }: { app: Application }) {
  const rejected = app.status === 'rejected'
  const reachedIndex = rejected
    ? PIPELINE.indexOf(app.history[app.history.length - 2]?.status ?? 'applied')
    : PIPELINE.indexOf(app.status)

  return (
    <ol className="flex flex-wrap items-center gap-y-2" aria-label="Application progress">
      {PIPELINE.map((step, i) => {
        const done = i <= reachedIndex
        const at = app.history.find((h) => h.status === step)?.at
        return (
          <li key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full border text-[10px] font-medium',
                  done
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-dashed border-muted-foreground text-muted-foreground',
                  rejected && !done && 'opacity-40',
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  'w-20 text-center text-[10px] leading-tight',
                  done ? 'font-medium' : 'text-muted-foreground',
                )}
              >
                {statusLabel[step]}
                {at && <span className="block tabular-nums text-muted-foreground">{at}</span>}
              </span>
            </div>
            {i < PIPELINE.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'mb-6 h-px w-4 md:w-8',
                  i < reachedIndex ? 'bg-foreground' : 'bg-border',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default function ApplicationsPage() {
  const p = usePortal()
  const me = p.students.find((s) => s.id === p.actingStudentId)
  const myApps = p.applications
    .filter((a) => a.studentId === p.actingStudentId)
    .slice()
    .reverse()

  return (
    <>
      <PageHeader
        title="My applications"
        description={`Tracking ${myApps.length} application${myApps.length === 1 ? '' : 's'} for ${me?.name ?? 'you'}. One application per drive.`}
        actions={
          <Button variant="outline" render={<Link href="/drives" />}>
            Discover drives
          </Button>
        }
      />
      <ul className="flex flex-col gap-4">
        {myApps.map((app) => {
          const drive = p.drives.find((d) => d.id === app.driveId)
          const company = p.companies.find((c) => c.id === drive?.companyId)
          const interview = p.interviews.find((i) => i.applicationId === app.id)
          const internshipStarted = p.internships.some(
            (n) => n.driveId === app.driveId && n.studentId === app.studentId,
          )
          return (
            <li key={app.id} className="flex flex-col gap-4 rounded-lg border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/drives/${app.driveId}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {drive?.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {company?.name} · applied {app.appliedAt}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <Timeline app={app} />

              {app.status === 'rejected' && (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Rejected{app.rejectReason ? ` — reason: ${app.rejectReason}` : '.'}
                </div>
              )}

              {interview && app.status === 'interview_scheduled' && (
                <div className="flex flex-col gap-3 rounded-md border p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CalendarClock className="size-4" aria-hidden />
                    Interview scheduled
                  </div>
                  <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">When</dt>
                      <dd className="font-medium tabular-nums">
                        {interview.date} at {interview.time}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Mode</dt>
                      <dd className="font-medium">
                        {interview.mode === 'online' ? 'Online' : 'In person'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                        {interview.mode === 'online' ? 'Meeting link' : 'Venue'}
                      </dt>
                      <dd className="break-all font-medium">{interview.linkOrVenue}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Panel</dt>
                      <dd>{interview.panel}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                        Instructions
                      </dt>
                      <dd className="text-muted-foreground">{interview.instructions}</dd>
                    </div>
                  </dl>
                  {interview.acknowledged ? (
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <Check className="size-4" aria-hidden /> Acknowledged — the company has been
                      notified.
                    </p>
                  ) : (
                    <div>
                      <Button size="sm" onClick={() => p.acknowledgeInterview(interview.id)}>
                        Acknowledge interview
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {app.status === 'selected' && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-foreground p-4">
                  <div>
                    <p className="text-sm font-semibold">You have been selected</p>
                    <p className="text-sm text-muted-foreground">
                      {internshipStarted
                        ? 'Offer accepted — internship tracking is active.'
                        : 'Accept the offer to begin internship tracking.'}
                    </p>
                  </div>
                  {internshipStarted ? (
                    <Button variant="outline" size="sm" render={<Link href="/reports" />}>
                      Go to weekly reports
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => p.acceptOffer(app.id)}>
                      Accept offer
                    </Button>
                  )}
                </div>
              )}
            </li>
          )
        })}
        {myApps.length === 0 && (
          <li className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No applications yet. Browse open drives to get started.
          </li>
        )}
      </ul>
    </>
  )
}
