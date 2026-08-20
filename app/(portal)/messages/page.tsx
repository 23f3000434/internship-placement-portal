'use client'

import { Mail, MailOpen, Paperclip, Plus, Search, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/portal/page-header'
import { usePortal } from '@/lib/store'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

const ROLE_LABEL: Record<Role, string> = {
  student: 'Student',
  company: 'Company',
  faculty: 'Faculty',
  admin: 'Admin / T&P',
}

const RECIPIENTS: Record<Role, Role[]> = {
  student: ['admin', 'faculty', 'company'],
  company: ['admin', 'student'],
  faculty: ['admin', 'student'],
  admin: ['student', 'company', 'faculty'],
}

export default function MessagesPage() {
  const p = usePortal()
  const currentUserId =
    p.authSession?.userId ||
    (p.role === 'student'
      ? p.actingStudentId
      : p.role === 'company'
        ? p.actingCompanyId
        : p.role === 'faculty'
          ? p.actingFacultyId
          : 'admin1')

  const myThreads = useMemo(() => {
    return p.threads.filter((t) => {
      if (p.role === 'admin') return true
      if (t.participantIds && t.participantIds.length > 0) {
        return t.participantIds.includes(currentUserId)
      }
      return t.participants.includes(p.role)
    })
  }, [p.threads, p.role, currentUserId])

  const [tab, setTab] = useState('inbox')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(myThreads[0]?.id ?? null)
  const [reply, setReply] = useState('')
  const [attach, setAttach] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [toRole, setToRole] = useState<Role>(RECIPIENTS[p.role][0])
  const [targetRecipientId, setTargetRecipientId] = useState<string>('')
  const [body, setBody] = useState('')

  const visible = myThreads.filter((t) => {
    const msgs = p.messages.filter((m) => m.threadId === t.id)
    if (tab === 'unread' && !t.unreadFor.includes(p.role)) return false
    if (tab === 'sent' && !msgs.some((m) => m.fromRole === p.role)) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      t.subject.toLowerCase().includes(q) ||
      t.participantNames.toLowerCase().includes(q) ||
      msgs.some((m) => m.body.toLowerCase().includes(q))
    )
  })

  const selected = myThreads.find((t) => t.id === selectedId) ?? visible[0] ?? null
  const thread = selected
    ? p.messages.filter((m) => m.threadId === selected.id).sort((a, b) => a.at.localeCompare(b.at))
    : []
  const unreadCount = myThreads.filter((t) => t.unreadFor.includes(p.role)).length

  const open = (id: string) => {
    setSelectedId(id)
    p.markThreadRead(id)
  }

  return (
    <>
      <PageHeader
        title="Messages"
        description={`Mail centre for ${ROLE_LABEL[p.role]} — threads with admin, faculty, students, and companies. ${unreadCount} unread.`}
        actions={
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Compose
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages"
              aria-label="Search messages"
              className="pl-9"
            />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="inbox" className="flex-1">
                Inbox
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                Unread ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex-1">
                Sent
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <ul className="flex flex-col gap-2" aria-label="Message threads">
            {visible.map((t) => {
              const msgs = p.messages.filter((m) => m.threadId === t.id)
              const last = msgs[msgs.length - 1]
              const unread = t.unreadFor.includes(p.role)
              const active = selected?.id === t.id
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => open(t.id)}
                    aria-current={active}
                    className={cn(
                      'flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors',
                      active ? 'border-foreground bg-muted' : 'bg-card hover:bg-muted',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {unread ? (
                        <Mail className="size-4 shrink-0" aria-hidden />
                      ) : (
                        <MailOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                      <span className={cn('flex-1 truncate text-sm', unread && 'font-semibold')}>
                        {t.subject}
                      </span>
                      {unread && <span className="size-2 shrink-0 rounded-full bg-foreground" />}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {t.participantNames}
                    </span>
                    {last && (
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {last.fromName}: {last.body}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
            {visible.length === 0 && (
              <li className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No threads match this view.
              </li>
            )}
          </ul>
        </div>

        {selected ? (
          <section className="flex min-h-[28rem] flex-col rounded-lg border bg-card">
            <header className="flex flex-col gap-1 border-b p-5">
              <h2 className="text-lg font-semibold tracking-tight text-balance">{selected.subject}</h2>
              <p className="text-sm text-muted-foreground">
                {selected.participantNames} ·{' '}
                {selected.participants.map((r) => ROLE_LABEL[r]).join(' & ')}
              </p>
            </header>
            <ul className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
              {thread.map((m) => {
                const mine = m.fromRole === p.role
                return (
                  <li
                    key={m.id}
                    className={cn('flex max-w-[85%] flex-col gap-1', mine && 'self-end items-end')}
                  >
                    <span className="text-xs text-muted-foreground">
                      {m.fromName} · {m.at}
                      {m.system && ' · system'}
                    </span>
                    <div
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm',
                        mine
                          ? 'bg-foreground text-background border-foreground'
                          : m.system
                            ? 'border-dashed bg-background'
                            : 'bg-background',
                      )}
                    >
                      <p className="text-pretty">{m.body}</p>
                      {m.attachmentName && (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs opacity-80">
                          <Paperclip className="size-3" aria-hidden />
                          {m.attachmentName}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            <form
              className="flex flex-col gap-3 border-t p-5"
              onSubmit={(e) => {
                e.preventDefault()
                if (!reply.trim()) return
                p.sendMessage(selected.id, reply.trim(), attach.trim() || undefined)
                setReply('')
                setAttach('')
              }}
            >
              <Label htmlFor="reply" className="sr-only">
                Reply
              </Label>
              <Textarea
                id="reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Write a reply…"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={attach}
                  onChange={(e) => setAttach(e.target.value)}
                  placeholder="Attachment name (optional)"
                  aria-label="Attachment name"
                  className="h-9 max-w-56"
                />
                <Button type="submit" size="sm" className="ml-auto">
                  <Send className="size-4" aria-hidden />
                  Send reply
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <div className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Select a thread to read it.
          </div>
        )}
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compose message</DialogTitle>
            <DialogDescription>
              An email notification is delivered to the recipient when you send.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="to">Recipient Role</Label>
              <Select
                value={toRole}
                onValueChange={(v) => {
                  const r = v as Role
                  setToRole(r)
                  setTargetRecipientId('')
                }}
              >
                <SelectTrigger id="to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECIPIENTS[p.role].map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {toRole === 'faculty' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="to-faculty">Select Faculty Mentor</Label>
                <Select value={targetRecipientId} onValueChange={setTargetRecipientId}>
                  <SelectTrigger id="to-faculty">
                    <SelectValue placeholder="Choose faculty mentor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {p.faculty.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {toRole === 'company' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="to-company">Select Company Partner</Label>
                <Select value={targetRecipientId} onValueChange={setTargetRecipientId}>
                  <SelectTrigger id="to-company">
                    <SelectValue placeholder="Choose company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {p.companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.industry})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {toRole === 'student' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="to-student">Select Student</Label>
                <Select value={targetRecipientId} onValueChange={setTargetRecipientId}>
                  <SelectTrigger id="to-student">
                    <SelectValue placeholder="Choose student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {p.students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.enrollment} · {s.branch})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Query about drive eligibility"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Write your message…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!subject.trim() || !body.trim()) return
                p.createThread(subject.trim(), toRole, body.trim(), targetRecipientId || undefined)
                setComposeOpen(false)
                setSubject('')
                setBody('')
                setTargetRecipientId('')
              }}
            >
              Send message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
