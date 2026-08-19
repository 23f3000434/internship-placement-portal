import { cn } from '@/lib/utils'
import { statusLabel } from '@/lib/eligibility'

// Monochrome status system: solid = positive/final, outline = in-progress,
// dashed = pending, strikethrough-style muted = blocked/rejected.
const styleFor = (status: string) => {
  switch (status) {
    case 'approved':
    case 'selected':
    case 'verified':
    case 'completed':
    case 'faculty_reviewed':
    case 'open':
    case 'active':
    case 'accepted':
      return 'bg-foreground text-background border-foreground'
    case 'uploaded':
    case 'recommended':
    case 'offered':
      return 'bg-background text-foreground border-foreground'
    case 'not_uploaded':
    case 'none':
      return 'bg-background text-muted-foreground border-dashed border-muted-foreground'
    case 'declined':
      return 'bg-muted text-muted-foreground border-muted-foreground line-through decoration-1'
    case 'shortlisted':
    case 'interview_scheduled':
    case 'under_review':
    case 'company_approved':
    case 'in_progress':
      return 'bg-background text-foreground border-foreground'
    case 'pending':
    case 'applied':
    case 'submitted':
      return 'bg-background text-muted-foreground border-dashed border-muted-foreground'
    case 'rejected':
    case 'blocked':
    case 'flagged':
    case 'closed':
      return 'bg-muted text-muted-foreground border-muted-foreground line-through decoration-1'
    default:
      return 'bg-background text-foreground border-border'
  }
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styleFor(status),
        className,
      )}
    >
      {statusLabel[status] ?? status}
    </span>
  )
}
