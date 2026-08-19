'use client'

import Link from 'next/link'
import { Bell, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/portal/page-header'
import { usePortal } from '@/lib/store'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
  const p = usePortal()
  const [tab, setTab] = useState('all')

  const mine = p.notifications.filter((n) => n.forRole === p.role)
  const unread = mine.filter((n) => !n.read)
  const visible = tab === 'unread' ? unread : mine

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Every approval, interview, report, and block notice raised for your account."
        actions={
          <Button variant="outline" onClick={p.markNotificationsRead} disabled={unread.length === 0}>
            <CheckCheck className="size-4" aria-hidden />
            Mark all read
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({mine.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <ul className="flex flex-col gap-3" aria-label="Notifications">
        {visible.map((n) => (
          <li
            key={n.id}
            className={cn(
              'flex items-start gap-4 rounded-lg border bg-card p-4',
              !n.read && 'border-foreground',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border',
                n.read ? 'text-muted-foreground' : 'border-foreground bg-foreground text-background',
              )}
              aria-hidden
            >
              <Bell className="size-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={cn('text-sm', !n.read && 'font-semibold')}>{n.title}</p>
                <span className="text-xs tabular-nums text-muted-foreground">{n.at}</span>
              </div>
              <p className="text-sm text-pretty text-muted-foreground">{n.body}</p>
              {!n.read && (
                <span className="text-xs font-medium uppercase tracking-wide">Unread</span>
              )}
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {tab === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
            </p>
            <Button variant="outline" size="sm" render={<Link href="/dashboard" />}>
              Back to dashboard
            </Button>
          </li>
        )}
      </ul>
    </>
  )
}
