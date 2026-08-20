'use client'

import Link from 'next/link'
import { CalendarClock, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, StatCard } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'

export default function CompanyInterviewsPage() {
  const p = usePortal()
  const currentCompanyId = p.authSession?.userId || p.actingCompanyId || 'c1'
  const myDrives = p.drives.filter((d) => d.companyId === currentCompanyId || (!p.authSession?.userId && d.companyId === 'c1'))
  const myApps = p.applications.filter((a) => myDrives.some((d) => d.id === a.driveId))
  const myInterviews = p.interviews
    .filter((i) => myApps.some((a) => a.id === i.applicationId))
    .slice()
    .reverse()
  const pendingAck = myInterviews.filter((i) => !i.acknowledged).length

  return (
    <>
      <PageHeader
        title="Interviews"
        description="Every scheduled interview across your drives. Students and the admin are notified automatically when you schedule."
        actions={
          <Button variant="outline" render={<Link href="/company/applicants" />}>
            Schedule from applicants
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Scheduled" value={myInterviews.length} />
        <StatCard label="Acknowledged" value={myInterviews.length - pendingAck} />
        <StatCard label="Awaiting acknowledgement" value={pendingAck} />
        <StatCard
          label="Shortlisted (no interview yet)"
          value={myApps.filter((a) => a.status === 'shortlisted').length}
        />
      </div>
      <ul className="flex flex-col gap-4">
        {myInterviews.map((iv) => {
          const app = p.applications.find((a) => a.id === iv.applicationId)
          const student = p.students.find((s) => s.id === app?.studentId)
          const drive = p.drives.find((d) => d.id === app?.driveId)
          return (
            <li key={iv.id} className="flex flex-col gap-4 rounded-lg border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    <CalendarClock className="size-4" aria-hidden />
                    {student?.name} — {drive?.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {iv.date} at {iv.time} · {iv.mode === 'online' ? 'Online' : 'In person'}
                  </p>
                </div>
                {app && <StatusBadge status={app.status} />}
              </div>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {iv.mode === 'online' ? 'Meeting link' : 'Venue'}
                  </dt>
                  <dd className="break-all font-medium">{iv.linkOrVenue}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Panel</dt>
                  <dd>{iv.panel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Instructions</dt>
                  <dd className="text-muted-foreground">{iv.instructions}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <p className="flex items-center gap-1.5 text-sm">
                  {iv.acknowledged ? (
                    <>
                      <Check className="size-4" aria-hidden /> Acknowledged by student
                    </>
                  ) : (
                    <span className="text-muted-foreground">Awaiting student acknowledgement</span>
                  )}
                </p>
                {app?.status === 'interview_scheduled' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => p.setApplicationStatus(app.id, 'selected')}>
                      Mark selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        p.setApplicationStatus(app.id, 'rejected', 'Did not clear the interview round.')
                      }
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </li>
          )
        })}
        {myInterviews.length === 0 && (
          <li className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No interviews scheduled yet. Shortlist applicants first, then schedule from the Applicants page.
          </li>
        )}
      </ul>
    </>
  )
}
