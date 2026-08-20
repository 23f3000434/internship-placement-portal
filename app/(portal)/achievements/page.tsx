'use client'

import { useState } from 'react'
import { Eye, FileCheck, FileUp, Link2, ExternalLink } from 'lucide-react'
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
import { DocumentViewerModal, normalizeExternalUrl } from '@/components/portal/document-viewer'
import { usePortal } from '@/lib/store'
import { isoDate } from '@/lib/eligibility'
import { validateUploadedFile } from '@/lib/file-validation'
import type { Achievement, InternshipDocument } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TYPE_LABEL: Record<Achievement['type'], string> = {
  paper: 'Paper presentation',
  conference: 'Conference',
  hackathon: 'Hackathon',
  certification: 'Certification',
}

export default function AchievementsPage() {
  const p = usePortal()
  const currentStudentId = p.authSession?.userId || p.actingStudentId || 's1'
  const me = p.students.find((s) => s.id === currentStudentId) || p.students[0]
  const mine = p.achievements.filter((a) => a.studentId === currentStudentId).slice().reverse()

  const [type, setType] = useState<Achievement['type']>('hackathon')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(isoDate(-14))
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [evidenceName, setEvidenceName] = useState<string | null>(null)
  const [evidenceData, setEvidenceData] = useState<string | undefined>(undefined)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [viewingDoc, setViewingDoc] = useState<InternshipDocument | null>(null)

  const todayStr = isoDate(0)
  const isDateValid = Boolean(date && date <= todayStr)
  const hasEvidence = uploadMode === 'file' ? Boolean(evidenceName) : Boolean(evidenceUrl.trim())
  const valid = title.trim().length > 0 && isDateValid && hasEvidence

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    p.addAchievement({
      type,
      title: title.trim(),
      date,
      evidenceName: uploadMode === 'url' ? 'Google Drive / External Certificate' : (evidenceName || `${type}-certificate.pdf`),
      evidenceUrl: uploadMode === 'url' ? normalizeExternalUrl(evidenceUrl.trim()) : undefined,
      evidenceData: uploadMode === 'file' ? evidenceData : undefined,
    })
    setTitle('')
    setDate(isoDate(-14))
    setEvidenceName(null)
    setEvidenceData(undefined)
    setEvidenceUrl('')
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const validation = await validateUploadedFile(f, ['pdf', 'image'])
      if (!validation.valid) {
        toast.error('Invalid File', { description: validation.error })
        return
      }
      setEvidenceName(f.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        setEvidenceData(event.target?.result as string)
      }
      reader.readAsDataURL(f)
      toast.success('Certificate Attached', { description: f.name })
    }
  }

  const openDocViewer = (a: Achievement) => {
    setViewingDoc({
      id: a.id,
      internshipId: 'ac',
      kind: 'completion_certificate',
      fileName: a.evidenceName,
      fileUrl: a.evidenceUrl,
      fileData: a.evidenceData,
      status: a.status === 'verified' ? 'verified' : 'uploaded',
      uploadedBy: 'student',
      uploadedAt: a.date,
    })
  }

  const verified = mine.filter((a) => a.status === 'verified').length

  return (
    <>
      <PageHeader
        title="Extra achievements"
        description="Paper presentations, conferences, hackathons, and certifications — verified by faculty and added to your profile."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="flex h-fit flex-col gap-4 rounded-lg border p-5 lg:col-span-2 bg-card shadow-xs">
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

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Evidence Certificate</Label>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                    uploadMode === 'file' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                    uploadMode === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  Drive Link
                </button>
              </div>
            </div>

            {uploadMode === 'file' ? (
              <label
                htmlFor="evidence-file"
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors',
                  evidenceName ? 'border-primary bg-primary/5' : 'border-dashed hover:bg-muted/50',
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
                  <FileCheck className="size-4 shrink-0 text-primary" aria-hidden />
                ) : (
                  <FileUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className="flex-1 min-w-0">
                  <span className={cn('block font-medium truncate text-xs', !evidenceName && 'text-muted-foreground')}>
                    {evidenceName || 'Select Certificate (PDF / Image)'}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {evidenceName ? `${evidenceName} · Attached` : 'Click to select file'}
                  </span>
                </span>
                {evidenceName && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEvidenceName(null)
                      setEvidenceData(undefined)
                    }}
                  >
                    Remove
                  </Button>
                )}
              </label>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="pl-8 text-xs"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Paste public Google Drive, Dropbox, or credential verification link.
                </p>
              </div>
            )}
          </div>

          <Button type="submit" disabled={!valid}>
            Submit for verification
          </Button>
          <p className="text-xs text-muted-foreground">
            Your faculty mentor verifies each achievement certificate before it counts toward your profile.
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
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-pretty">{a.title}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {TYPE_LABEL[a.type]} · {a.date} · {a.evidenceName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDocViewer(a)}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Eye className="size-3.5" />
                    <span>View Certificate</span>
                  </Button>
                </div>
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

      {viewingDoc && (
        <DocumentViewerModal
          open={Boolean(viewingDoc)}
          onOpenChange={(open) => !open && setViewingDoc(null)}
          doc={viewingDoc}
          student={me}
        />
      )}
    </>
  )
}
