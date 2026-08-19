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
  LogOut,
  LogIn,
  KeyRound,
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
  ],
  faculty: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/faculty/students', label: 'My Students', icon: GraduationCap },
    { href: '/faculty/reviews', label: 'Verifications & Reviews', icon: UserCheck },
    { href: '/documents', label: 'Documents & PPO', icon: FolderOpen },
    { href: '/companies', label: 'Partner Companies', icon: Building2 },
  ],
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/verifications', label: 'Verification Queues', icon: ShieldCheck },
    { href: '/documents', label: 'Documents & PPO', icon: FolderOpen },
    { href: '/admin/blocks', label: 'Block Management', icon: Lock },
    { href: '/admin/analytics', label: 'Reports & Analytics', icon: ClipboardCheck },
    { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
    { href: '/companies', label: 'Companies Directory', icon: Building2 },
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
  { prefix: '/documents', roles: ['student', 'company', 'faculty', 'admin'] },
  { prefix: '/companies', roles: ['student', 'faculty', 'admin'] },
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
        <h1 className="text-lg font-semibold">Access restricted</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          You are signed in as <strong className="font-medium">{ROLE_LABEL[role]}</strong>, and{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{pathname}</code> is restricted to{' '}
          {permitted.map((r) => ROLE_LABEL[r]).join(', ')}. This section holds records that your role is not authorized to access.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" render={<Link href="/dashboard" />}>
          Go to my dashboard
        </Button>
        <Button size="sm" variant="outline" render={<Link href="/messages" />}>
          Contact Placement Cell
        </Button>
      </div>
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

function AuthRequired() {
  return (
    <section role="alert" className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-8">
      <span className="flex size-10 items-center justify-center rounded-full border">
        <Lock className="size-4" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Authentication Required</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          You must be signed in to access this portal page. Please sign in with your college credentials to proceed.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" render={<Link href="/signin" />}>
          <LogIn className="mr-1.5 size-3.5" /> Sign in to portal
        </Button>
        <Button size="sm" variant="outline" render={<Link href="/register/student" />}>
          Register as Student
        </Button>
        <Button size="sm" variant="outline" render={<Link href="/register/company" />}>
          Register as Company
        </Button>
      </div>
    </section>
  )
}

function UserProfileCard() {
  const { role, authSession, students, companies, actingStudentId, actingCompanyId } = usePortal()

  const s = students.find((x) => x.id === (authSession?.userId || actingStudentId))
  const c = companies.find((x) => x.id === (authSession?.userId || actingCompanyId))

  const name =
    role === 'student'
      ? s?.name || authSession?.name || 'Aarav Sharma'
      : role === 'company'
        ? c?.name || authSession?.name || 'TechNova Systems'
        : role === 'faculty'
          ? 'Prof. R. Kulkarni'
          : 'T&P Cell Admin'

  const subtitle =
    role === 'student'
      ? `${s?.enrollment || 'EN21CS001'} · ${s?.branch || 'Computer Science'}`
      : role === 'company'
        ? `${c?.location || 'Corporate'} · ${c?.industry || 'Enterprise'}`
        : role === 'faculty'
          ? 'Faculty Mentor'
          : 'Central Placement Office'

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-2xs">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-bold text-xs">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground">{name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <span className="shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
        {ROLE_LABEL[role]}
      </span>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = usePortal()
  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2 px-1">
        <span className="flex size-7 items-center justify-center rounded bg-foreground text-background text-sm font-bold">
          IT
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight leading-none">InternTrack</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">GHRCEM Central Portal</span>
        </div>
      </Link>

      <UserProfileCard />

      <div className="flex-1 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="border-t pt-3 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="mr-2 size-3.5" /> Sign out
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          GHRCEM Placement Cell · 2026
        </p>
      </div>
    </div>
  )
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { role, authSession, logout, notifications, students, companies, actingStudentId, actingCompanyId } = usePortal()
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
          {authSession ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-xs text-muted-foreground hover:text-foreground hidden sm:flex"
            >
              <LogOut className="mr-1.5 size-3.5" /> Sign out
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/signin" />}
              className="text-xs hidden sm:flex"
            >
              <LogIn className="mr-1.5 size-3.5" /> Sign in
            </Button>
          )}
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
            {!authSession ? (
              <AuthRequired />
            ) : permitted ? (
              children
            ) : (
              <AccessDenied pathname={pathname} role={role} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
