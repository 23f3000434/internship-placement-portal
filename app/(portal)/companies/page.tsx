'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'

function AddCompanyDialog() {
  const p = usePortal()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [website, setWebsite] = useState('')
  const valid = name.trim() && industry.trim()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    p.addCompanyByStudent(name.trim(), industry.trim(), website.trim() || '—')
    setName('')
    setIndustry('')
    setWebsite('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus /> Add a company
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add a new company</DialogTitle>
            <DialogDescription>
              Suggest a company that isn&apos;t on the portal yet. It goes to the admin for approval
              before drives or self-placements can reference it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nc-name">Company name</Label>
            <Input id="nc-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nc-industry">Industry</Label>
            <Input
              id="nc-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. FinTech"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nc-website">Website (optional)</Label>
            <Input
              id="nc-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Submit for approval
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function CompaniesPage() {
  const p = usePortal()

  const displayedCompanies =
    p.role === 'company'
      ? p.companies.filter((c) => c.id === p.actingCompanyId)
      : p.role === 'admin'
        ? p.companies
        : p.companies.filter((c) => c.status === 'approved')

  const title =
    p.role === 'company'
      ? 'Company Profile'
      : p.role === 'admin'
        ? 'Companies Directory'
        : 'Partner Companies'

  const description =
    p.role === 'company'
      ? 'Your company details and active placement drives.'
      : p.role === 'admin'
        ? 'All partner companies and industry recruiters registered with the Training & Placement Cell.'
        : 'Verified corporate and startup partners hiring students from GHRCEM.'

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={p.role === 'student' ? <AddCompanyDialog /> : undefined}
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {displayedCompanies.map((c) => {
          const openDrives = p.drives.filter((d) => d.companyId === c.id && d.status === 'open').length
          const selections = p.applications.filter(
            (a) => a.status === 'selected' && p.drives.find((d) => d.id === a.driveId)?.companyId === c.id,
          ).length
          return (
            <li key={c.id}>
              <Link
                href={`/companies/${c.id}`}
                className="flex h-full flex-col gap-3 rounded-lg border bg-card p-5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.industry} · {c.location}
                    </p>
                  </div>
                  {p.role === 'admin' ? (
                    <StatusBadge status={c.status} />
                  ) : (
                    <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                      Partner
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{c.about}</p>
                <p className="mt-auto text-xs text-muted-foreground">
                  {openDrives} open drive{openDrives === 1 ? '' : 's'} · {selections} selection
                  {selections === 1 ? '' : 's'}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
