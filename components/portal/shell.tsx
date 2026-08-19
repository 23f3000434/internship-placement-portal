'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Award,
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Lock,
  Mail,
  Menu,
  ScrollText,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { usePortal } from '@/lib/store'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

const NAV: Record<Role, NavItem[]> = {
  student: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/profile', label: 'My Profile', icon: UserRound },
    { href: '/drives', label: 'Discover Drives', icon: Search },
    { href: '/applications', label: 'My Applications', icon: ClipboardList },
    { href: '/self-placement', label: 'Self-Placement', icon: Briefcase },
    { href: '/reports', label: 'Weekly Reports', icon: FileText },
    { href: '/attendance', label: 'Attendance & Milestones', icon: ListChecks },
    { href: '/documents', label: 'Documents & PPO', icon: FolderOpen },
    { href: '/achievements', label: 'Achievements', icon: Award },
    { href: '/companies', label: 'Companies', icon: Building2 },
  ],
  company: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/company/drives', label: 'My Drives', icon: Briefcase },
    { href: '/company/applicants', label: 'Applicants', icon: Users },
    { href: '/company/interviews', label: 'Interviews', icon: CalendarClock },
    { href: '/company/feedback', label: 'Intern Feedback', icon: ClipboardCheck },
    { href: '/documents', label: 'Documents & PPO', icon: FolderOpen },
    { href: '/companies', label: 'Companies', icon: Building2 },
  ],
  faculty: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/faculty/students', label: 'My Students', icon: GraduationCap },
    { href: '/faculty/reviews', label: 'Verifications & Reviews', icon: UserCheck },
    { href: '/documents', label: 'Documents & PPO', icon: FolderOpen },
    { href: '/companies', label: 'Companies', icon: Building2 },
  ],
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/verifications', label: 'Verification Queues', icon: ShieldCheck },
    { href: '/documents', label: 'Documents & PPO', icon: FolderOpen },
    { href: '/admin/blocks', label: 'Block Management', icon: Lock },
    { href: '/admin/analytics', label: 'Reports & Analytics', icon: ClipboardCheck },
    { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
    { href: '/companies', label: 'Companies', icon: Building2 },
  ],
}

const ROLE_LABEL: Record<Role, string> = {
  student: 'Student',
  company: 'Company',
  faculty: 'Faculty',
  admin: 'Admin / T&P',
}

/**
 * Route-level access control. Navigation is already filtered per role, but the
 * URLs must be protected too — otherwise a student could type /admin/analytics
 * and read every peer's CGPA, stipend and PPO package. Longest prefix wins.
 */
const ROUTE_ACCESS: { prefix: string; roles: Role[] }[] = [
  // Shared surfaces
  { prefix: '/dashboard', roles: ['student', 'company', 'faculty', 'admin'] },
  { prefix: '/messages', roles: ['student', 'company', 'faculty', 'admin'] },
  { prefix: '/notifications', roles: ['student', 'company', 'faculty', 'admin'] },
  { prefix: '/companies', roles: ['student', 'company', 'faculty', 'admin'] },
  { prefix: '/documents', roles: ['student', 'company', 'faculty', 'admin'] },
  // Student-owned records
  { prefix: '/profile', roles: ['student'] },
  { prefix: '/drives', roles: ['student'] },
  { prefix: '/applications', roles: ['student'] },
  { prefix: '/self-placement', roles: ['student'] },
  { prefix: '/reports', roles: ['student'] },
  { prefix: '/attendance', roles: ['student'] },
  { prefix: '/achievements', roles: ['student'] },
  // Recruiter-only
  { prefix: '/company', roles: ['company'] },
  // Faculty mentor-only
  { prefix: '/faculty', roles: ['faculty'] },
  // T&P / admin-only
  { prefix: '/admin', roles: ['admin'] },
]

/** The roles permitted to view `pathname`, resolved by longest matching prefix. */
function allowedRoles(pathname: string): Role[] {
  let match: { prefix: string; roles: Role[] } | undefined
  for (const rule of ROUTE_ACCESS) {
    const hit = pathname === rule.prefix || pathname.startsWith(rule.prefix + '/')
    if (hit && (!match || rule.prefix.length > match.prefix.length)) match = rule
  }
  return match?.roles ?? ['student', 'company', 'faculty', 'admin']
}

function AccessDenied({ pathname, role }: { pathname: string; role: Role }) {
  const permitted = allowedRoles(pathname)
  return (
    <section
      role="alert"
      className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-8"
    >
      <span className="flex size-10 items-center justify-center rounded-full border">
        <Lock className="size-4" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Access denied</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          You are signed in as <strong className="font-medium">{ROLE_LABEL[role]}</strong>, and{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{pathname}</code> is restricted to{' '}
          {permitted.map((r) => ROLE_LABEL[r]).join(', ')}. This page holds personal and internship
          data that your role is not authorised to view.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" render={<Link href="/dashboard" />}>
          Go to my dashboard
        </Button>
        <Button size="sm" variant="outline" render={<Link href="/messages" />}>
          Request access from admin
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Switch roles with the demo switcher in the sidebar to view this page as{' '}
        {ROLE_LABEL[permitted[0]]}.
      </p>
    </section>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { role, threads, notifications } = usePortal()
  const pathname = usePathname()
  const unreadThreads = threads.filter((t) => t.unreadFor.includes(role)).length
  const unreadNotifs = notifications.filter((n) => n.forRole === role && !n.read).length

  const items = [
    ...NAV[role],
    { href: '/messages', label: 'Messages', icon: Mail },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
        const badge =
          item.href === '/messages' ? unreadThreads : item.href === '/notifications' ? unreadNotifs : 0
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {badge > 0 && (
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-xs font-medium tabular-nums',
                  active ? 'bg-background text-foreground' : 'bg-foreground text-background',
                )}
              >
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function RoleSwitcher() {
  const { role, setRole, actingStudentId, setActingStudentId, actingCompanyId, setActingCompanyId, students, companies } = usePortal()
  const router = useRouter()

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Demo role switcher
      </span>
      <div className="grid grid-cols-2 gap-1 rounded-md border p-1" role="group" aria-label="Switch role">
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRole(r)
              router.push('/dashboard')
            }}
            className={cn(
              'rounded px-2 py-1.5 text-xs font-medium transition-colors',
              role === r ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
            )}
            aria-pressed={role === r}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>
      {role === 'student' && (
        <Select
          value={actingStudentId}
          onValueChange={(v) => setActingStudentId(v ?? actingStudentId)}
        >
          <SelectTrigger aria-label="Acting student" className="h-8 text-xs">
            <SelectValue>
              {(value: string) => {
                const s = students.find((x) => x.id === value)
                return s ? `${s.name} — ${s.status}` : 'Select student'
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.name} — {s.status}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
      {role === 'company' && (
        <Select
          value={actingCompanyId}
          onValueChange={(v) => setActingCompanyId(v ?? actingCompanyId)}
        >
          <SelectTrigger aria-label="Acting company" className="h-8 text-xs">
            <SelectValue>
              {(value: string) => {
                const c = companies.find((x) => x.id === value)
                return c ? `${c.name} — ${c.status}` : 'Select company'
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name} — {c.status}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

function DemoFooter() {
  const { resetDemo } = usePortal()
  return (
    <div className="flex flex-col items-start gap-1 px-2">
      <p className="text-xs text-muted-foreground">Hackathon demo — local data only</p>
      <button
        type="button"
        onClick={resetDemo}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Reset demo data
      </button>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2 px-2">
        <span className="flex size-7 items-center justify-center rounded bg-foreground text-background text-sm font-bold">
          IT
        </span>
        <span className="text-sm font-semibold tracking-tight">InternTrack</span>
      </Link>
      <RoleSwitcher />
      <div className="flex-1 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <DemoFooter />
    </div>
  )
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { role, notifications, students, companies, actingStudentId, actingCompanyId } = usePortal()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const unread = notifications.filter((n) => n.forRole === role && !n.read).length
  const permitted = allowedRoles(pathname).includes(role)

  const personaName =
    role === 'student'
      ? students.find((s) => s.id === actingStudentId)?.name
      : role === 'company'
        ? companies.find((c) => c.id === actingCompanyId)?.name
        : role === 'faculty'
          ? 'Prof. R. Kulkarni'
          : 'T&P Cell Admin'

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:block">
        <div className="sticky top-0 h-svh">
          <SidebarContent />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background px-4 md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm font-medium">{personaName}</span>
            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
              {ROLE_LABEL[role]}
            </span>
          </div>
          <Button variant="outline" size="icon" aria-label={`Notifications, ${unread} unread`} className="relative"
            render={<Link href="/notifications" />}
          >
            <Bell />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                {unread}
              </span>
            )}
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {permitted ? children : <AccessDenied pathname={pathname} role={role} />}
          </div>
        </main>
      </div>
    </div>
  )
}
