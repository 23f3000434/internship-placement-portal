import Link from 'next/link'
import { ArrowRight, Building2, GraduationCap, ShieldCheck, Users, QrCode, CheckCircle2, Sparkles, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

const roles = [
  {
    icon: GraduationCap,
    title: 'Students & Candidates',
    body: 'Discover eligible internship drives, apply with one click, track interview status changes, submit weekly logbooks, and request self-placement approvals.',
  },
  {
    icon: Building2,
    title: 'Hiring Partners & Companies',
    body: 'Publish recruitment drives with criteria filters, review verified candidate resumes, schedule interviews, evaluate interns, and issue digital PPOs.',
  },
  {
    icon: Users,
    title: 'Faculty Mentors',
    body: 'Verify student documents and self-placements, track weekly progress and milestone completions, review activity logs, and mentor at-risk candidates.',
  },
  {
    icon: ShieldCheck,
    title: 'Training & Placement Cell (Admin)',
    body: 'Approve students and companies, moderate platform compliance, verify institutional certificates, and generate real-time NBA / NIRF placement analytics.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded bg-foreground text-background text-sm font-bold shadow-2xs">
              IT
            </span>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight leading-none text-sm">InternTrack</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">GHRCEM Jalgaon</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" render={<Link href="/verify" />}>
              <QrCode className="mr-1.5 size-3.5" /> Public Verifier
            </Button>
            <Button size="sm" render={<Link href="/signin" />}>
              <LogIn className="mr-1.5 size-3.5" /> Sign in to Portal
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-16 md:py-24">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-3 py-1 text-xs font-semibold font-mono text-muted-foreground">
                G H RAISONI COLLEGE OF ENGINEERING &amp; MANAGEMENT
              </span>
              <span className="rounded-full border border-foreground bg-foreground px-3 py-1 text-xs font-medium text-background">
                Autonomous Institute · Jalgaon
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
              Every internship, one ledger. Student to faculty to company to T&amp;P.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
              A centralized four-dimensional platform empowering authentic, transparent, and accredited
              internship management — featuring automated eligibility checking, weekly logbooks, cryptographic QR verification, and AI matching.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" render={<Link href="/signin" />}>
                Access Portal
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/verify" />}>
                Verify Document QR
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/register/student" />}>
                Student Registration
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/register/company" />}>
                Company Registration
              </Button>
            </div>
          </div>
        </section>

        {/* 4-Dimensional Framework */}
        <section aria-labelledby="roles-heading" className="border-b">
          <div className="mx-auto w-full max-w-5xl px-4 py-16">
            <h2 id="roles-heading" className="mb-8 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              4-Dimensional Centralized System Architecture
            </h2>
            <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
              {roles.map((r) => (
                <div key={r.title} className="flex flex-col gap-3 bg-background p-6">
                  <r.icon className="size-5 text-foreground" aria-hidden />
                  <h3 className="font-semibold text-base">{r.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Digital Verification & Audit */}
        <section className="mx-auto w-full max-w-5xl px-4 py-16">
          <div className="flex flex-col items-start gap-4 rounded-xl border bg-card p-8 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-6 text-foreground" />
              <h2 className="text-xl font-bold tracking-tight">Institutional Compliance &amp; Tamper-Evident Verification</h2>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              All offer letters, joining reports, completion certificates, and PPOs issued through the GHRCEM Placement Portal
              contain a cryptographic SHA-256 digital stamp and a public QR code. Evaluators and recruiters can verify authenticity instantly from anywhere.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button render={<Link href="/verify" />}>
                Open Public QR Verifier
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button variant="outline" render={<Link href="/signin" />}>
                Sign In
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card/40">
        <div className="mx-auto flex w-full max-w-5xl flex-col sm:flex-row items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground">
          <span>InternTrack — GHRCEM Training &amp; Placement Cell</span>
          <span>Autonomous Institute Affiliated to KBCNMU · Jalgaon, Maharashtra</span>
        </div>
      </footer>
    </div>
  )
}
