import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PendingPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border bg-card p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full border border-dashed">
          <Clock className="size-5" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">Verification pending</h1>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Your registration was received. The T&amp;P cell will review your documents and you will
          get an email once your account is approved. You cannot apply or publish drives until then.
        </p>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" render={<Link href="/" />}>
            Back to home
          </Button>
          <Button render={<Link href="/dashboard" />}>
            View demo portal
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Judges: switch to the Admin role and open Verification Queues to approve this account.
        </p>
      </div>
    </main>
  )
}
