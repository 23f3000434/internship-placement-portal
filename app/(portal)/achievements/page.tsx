'use client'

import { useState } from 'react'
import { FileCheck, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/portal/page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { usePortal } from '@/lib/store'
import { isoDate } from '@/lib/eligibility'
import type { Achievement } from '@/lib/types'
import { cn } from '@/lib/utils'

const TYPE_LABEL: Record<Achievement['type'], string> = {
  paper: 'Paper presentation',
  conference: 'Conference',
  hackathon: 'Hackathon',
  certification: 'Certification',
}

export default function AchievementsPage() {
  const p = usePortal()
  const mine = p.achievements.filter((a) => a.studentId === p.actingStudentId).slice().reverse()

  const [type, setType] = useState<Achievement['type']>('hackathon')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(isoDate(-14))
  const [evidenceName, setEvidenceName] = useState<string | null>(null)

  const todayStr = isoDate(0)
  const isDateValid = Boolean(date && date <= todayStr)
  const valid = title.trim().length > 0 && isDateValid && Boolean(evidenceName)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    p.addAchievement({
      type,
      title: title.trim(),
      date,
      evidenceName: evidenceName || `${type}-certificate.pdf`,
    })
    setTitle('')
    setDate(isoDate(-14))
    setEvidenceName(null)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setEvidenceName(f.name)
    }
  }

  const verified = mine.filter((a) => a.status === 'verified').length

  return (
    <>
      <PageHeader
        title="Extra achievements"
        description="Paper presentations, conferences, hackathons, and certifications — verified by faculty and added to your profile."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="flex h-fit flex-col gap-4 rounded-lg border p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Add an achievement</h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ac-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as Achievement['type'])}>
              <SelectTrigger id="ac-type" aria-label="Achievement type">
                <SelectValue>
                  {(v: string) => TYPE_LABEL[v as Achievement['type']] ?? 'Select type'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(Object.keys(TYPE_LABEL) as Achievement['type'][]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ac-title">Title</Label>
            <Input
              id="ac-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Winner — Smart India Hackathon"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ac-date">Date achieved</Label>
            <Input
              id="ac-date"
              type="date"
              max={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            {!isDateValid && (
              <span className="text-[11px] text-destructive">Achievement date cannot be in the future.</span>
            )}
          </div>
          <label
            htmlFor="evidence-file"
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors',
              evidenceName ? 'border-foreground bg-muted/20' : 'border-dashed hover:bg-muted/50',
            )}
          >
            <input
              id="evidence-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="sr-only"
              onChange={handleFile}
            />
            {evidenceName ? (
              <FileCheck className="size-4 shrink-0 text-foreground" aria-hidden />
            ) : (
              <FileUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className="flex-1 min-w-0">
              <span className={cn('block font-medium truncate', !evidenceName && 'text-muted-foreground')}>
                {evidenceName || 'Evidence certificate upload'}
              </span>
              <span className="block text-xs text-muted-foreground">
                {evidenceName ? `${evidenceName} · Ready to submit` : 'Required — click to select PDF / image'}
              </span>
            </span>
            {evidenceName && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setEvidenceName(null)
                }}
              >
                Remove
              </Button>
            )}
          </label>
          <Button type="submit" disabled={!valid}>
            Submit for verification
          </Button>
          <p className="text-xs text-muted-foreground">
            Your faculty mentor verifies each achievement before it counts.
          </p>
        </form>

        <section className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">My achievements</h2>
            <span className="text-xs text-muted-foreground">
              {verified} verified of {mine.length}
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {mine.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-pretty">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABEL[a.type]} · {a.date} · {a.evidenceName}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
            {mine.length === 0 && (
              <li className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No achievements added yet.
              </li>
            )}
          </ul>
        </section>
      </div>
    </>
  )
}
