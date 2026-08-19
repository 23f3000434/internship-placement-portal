import Link from 'next/link'
import { ArrowRight, Building2, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

const roles = [
  {
    icon: GraduationCap,
    title: 'Students',
    body: 'Discover eligible drives, apply once, track every status change, log weekly reports, and register self-placed internships.',
  },
  {
    icon: Building2,
    title: 'Companies',
    body: 'Publish drives with precise filters, manage applicants, schedule interviews, and evaluate interns week by week.',
  },
  {
    icon: Users,
    title: 'Faculty',
    body: 'Verify documents and self-placements, monitor mentee progress, review reports, and flag at-risk students early.',
  },
  {
    icon: ShieldCheck,
    title: 'Admin / T&P',
    body: 'Approve students and companies, moderate the platform, and read placement analytics from one dashboard.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded bg-foreground text-background text-sm font-bold">
              IT
            </span>
            <div>
              <span className="font-semibold tracking-tight">InternTrack</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">· GHRCEM Jalgaon</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" render={<Link href="/verify" />}>
              QR Verifier
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/signin" />}>
              Sign in
            </Button>
            <Button size="sm" render={<Link href="/dashboard" />}>
              Enter demo
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-16 md:py-24">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-3 py-1 text-xs font-medium font-mono text-muted-foreground">
                G H RAISONI COLLEGE OF ENGINEERING &amp; MANAGEMENT
              </span>
              <span className="rounded-full border border-foreground bg-foreground px-3 py-1 text-xs font-medium text-background">
                GHR HACKATHON 2026
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
              Every internship, one ledger. Student to faculty to company to admin.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
              A centralized four-dimensional platform empowering authentic, transparent, and data-driven
              internship management — featuring automated eligibility checking, weekly logbooks, QR verification, and AI matching.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/dashboard" />}>
                Open the portal
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/verify" />}>
                Public QR Verifier
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/register/student" />}>
                Register as student
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/register/company" />}>
                Register as company
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="roles-heading" className="border-b">
          <div className="mx-auto w-full max-w-5xl px-4 py-16">
            <h2 id="roles-heading" className="mb-8 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Four roles, one source of truth
            </h2>
            <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
              {roles.map((r) => (
                <div key={r.title} className="flex flex-col gap-3 bg-background p-6">
                  <r.icon className="size-5" aria-hidden />
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-16">
          <div className="flex flex-col items-start gap-4 rounded-lg border p-8">
            <h2 className="text-xl font-semibold tracking-tight">Judging the hackathon demo?</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              The portal ships with seeded students, companies, live drives, an active internship
              with weekly reports, and pending verification queues. Use the role switcher in the
              sidebar to jump between Student, Company, Faculty, and Admin — every core flow is
              clickable end to end.
            </p>
            <Button render={<Link href="/dashboard" />}>
              Start the walkthrough
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 text-xs text-muted-foreground">
          <span>InternTrack — hackathon build</span>
          <span>Local demo data only</span>
        </div>
      </footer>
    </div>
  )
}
