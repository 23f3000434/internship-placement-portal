'use client'

import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/portal/page-header'
import { usePortal } from '@/lib/store'

export default function AuditPage() {
  const p = usePortal()
  const [query, setQuery] = useState('')

  const entries = useMemo(
    () =>
      p.audit
        .filter(
          (e) =>
            !query ||
            [e.actor, e.action, e.target, e.reason ?? '']
              .join(' ')
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) => b.at.localeCompare(a.at)),
    [p.audit, query],
  )

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every approval, rejection, block, and status override across the platform, most recent first."
      />
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search actor, action, or target…"
          className="pl-9"
          aria-label="Search audit log"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {e.at}
                </TableCell>
                <TableCell className="whitespace-nowrap">{e.actor}</TableCell>
                <TableCell className="font-medium">{e.action}</TableCell>
                <TableCell>{e.target}</TableCell>
                <TableCell className="max-w-72 text-muted-foreground">{e.reason ?? '—'}</TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No entries match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
