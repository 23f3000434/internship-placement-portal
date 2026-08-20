import Link from 'next/link'
import { Clock, ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PendingPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4 bg-background">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border bg-card p-8 md:p-10 text-center shadow-xs">
        <span className="flex size-14 items-center justify-center rounded-full border border-foreground/20 bg-muted">
          <Clock className="size-6 text-foreground" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Registration Under Review</h1>
        <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
          Your institutional registration and credentials have been submitted to the GHRCEM Training &amp; Placement Cell.
          Our administrators verify all credentials before activating placement drive access.
        </p>
        <div className="rounded-lg border bg-muted/30 p-3 text-left text-xs text-muted-foreground w-full space-y-1">
          <p className="font-semibold text-foreground">Next steps:</p>
          <p>• Department mentor reviews enrollment / incorporation documents.</p>
          <p>• T&amp;P Administrator activates your verified profile.</p>
          <p>• You will receive access confirmation at your registered email address.</p>
        </div>
        <div className="mt-2 flex w-full flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1" render={<Link href="/" />}>
            Back to Home
          </Button>
          <Button className="flex-1" render={<Link href="/signin" />}>
            Sign in to Portal <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
      </div>
    </main>
  )
}
