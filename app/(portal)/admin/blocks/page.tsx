'use client'

import { Lock, LockOpen } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'

type Target = { kind: 'student' | 'company'; id: string; name: string; blocked: boolean }

export default function BlocksPage() {
  const p = usePortal()
  const [target, setTarget] = useState<Target | null>(null)
  const [reason, setReason] = useState('')

  const confirm = () => {
    if (!target) return
    p.setBlocked(
      target.kind,
      target.id,
      !target.blocked,
      target.blocked ? undefined : reason.trim() || 'Policy violation under review.',
    )
    setTarget(null)
    setReason('')
  }

  return (
    <>
      <PageHeader
        title="Block management"
        description="Block or unblock students and companies. A reason is required and the user is notified — blocked users see the reason with a contact-admin option."
      />
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Block reason</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.enrollment} · {s.branch}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="max-w-56 text-xs text-muted-foreground">
                      {s.status === 'blocked' ? s.blockReason : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={s.status === 'blocked' ? 'default' : 'outline'}
                        onClick={() =>
                          setTarget({
                            kind: 'student',
                            id: s.id,
                            name: s.name,
                            blocked: s.status === 'blocked',
                          })
                        }
                        disabled={s.status === 'pending' || s.status === 'rejected'}
                      >
                        {s.status === 'blocked' ? (
                          <>
                            <LockOpen data-slot="icon" /> Unblock
                          </>
                        ) : (
                          <>
                            <Lock data-slot="icon" /> Block
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="companies" className="mt-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Block reason</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.industry} · {c.location}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="max-w-56 text-xs text-muted-foreground">
                      {c.status === 'blocked' ? c.blockReason : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={c.status === 'blocked' ? 'default' : 'outline'}
                        onClick={() =>
                          setTarget({
                            kind: 'company',
                            id: c.id,
                            name: c.name,
                            blocked: c.status === 'blocked',
                          })
                        }
                        disabled={c.status === 'pending' || c.status === 'rejected'}
                      >
                        {c.status === 'blocked' ? (
                          <>
                            <LockOpen data-slot="icon" /> Unblock
                          </>
                        ) : (
                          <>
                            <Lock data-slot="icon" /> Block
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {target?.blocked ? `Unblock ${target?.name}?` : `Block ${target?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {target?.blocked
                ? 'The account is restored to approved status and the user is notified by email.'
                : 'The user immediately loses portal access, sees the reason below, and gets a contact-admin option. This action is recorded in the audit log.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!target?.blocked && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="block-reason">Reason (required)</Label>
              <Textarea
                id="block-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. Multiple no-shows for scheduled interviews"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirm} disabled={!target?.blocked && !reason.trim()}>
              {target?.blocked ? 'Unblock' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
