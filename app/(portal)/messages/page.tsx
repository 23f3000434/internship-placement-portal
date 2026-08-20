'use client'

import { Mail, MailOpen, Paperclip, Plus, Search, Send, User, Building, GraduationCap, Shield } from 'lucide-react'
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

function formatMessageTimestamp(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return dateStr
  }
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
    return p.threads.filter((thread) => {
      // 1. Check if direct participant by User ID
      if (thread.participantIds && thread.participantIds.length > 0) {
        if (thread.participantIds.includes(currentUserId)) return true
        // If current user is admin and thread involves admin
        if (p.role === 'admin' && (thread.participants?.includes('admin') || thread.participantIds.includes('admin1'))) {
          return true
        }
        return false
      }
      // 2. Fallback for legacy seeded threads without participantIds
      if (p.role === 'admin') return true
      if (thread.participants?.includes(p.role)) {
        const myName = p.students.find((s) => s.id === currentUserId)?.name
        if (myName && thread.participantNames?.includes(myName)) return true
        const myComp = p.companies.find((c) => c.id === currentUserId)?.name
        if (myComp && thread.participantNames?.includes(myComp)) return true
        const myFac = p.faculty.find((f) => f.id === currentUserId)?.name
        if (myFac && thread.participantNames?.includes(myFac)) return true
      }
      return false
    })
  }, [p.threads, p.role, p.students, p.companies, p.faculty, currentUserId])

  const isUnread = (thread: (typeof p.threads)[number]) => {
    if (thread.unreadForIds && thread.unreadForIds.length > 0) {
      return thread.unreadForIds.includes(currentUserId)
    }
    return thread.unreadFor?.includes(p.role) ?? false
  }

  const [tab, setTab] = useState('inbox')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [attach, setAttach] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [toRole, setToRole] = useState<Role>(RECIPIENTS[p.role][0])
  const [targetRecipientId, setTargetRecipientId] = useState<string>('')
  const [body, setBody] = useState('')
  const [messageError, setMessageError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const visible = myThreads.filter((t) => {
    const msgs = p.messages.filter((m) => m.threadId === t.id)
    if (tab === 'unread' && !isUnread(t)) return false
    if (tab === 'sent' && !msgs.some((m) => m.fromRole === p.role || m.fromUserId === currentUserId)) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      t.subject.toLowerCase().includes(q) ||
      t.participantNames.toLowerCase().includes(q) ||
      msgs.some((m) => m.body.toLowerCase().includes(q))
    )
  })

  const selected = (selectedId ? myThreads.find((t) => t.id === selectedId) : null) ?? visible[0] ?? null
  const thread = selected
    ? p.messages.filter((m) => m.threadId === selected.id).sort((a, b) => a.at.localeCompare(b.at))
    : []
  const unreadCount = myThreads.filter(isUnread).length

  const open = (id: string) => {
    setSelectedId(id)
    p.markThreadRead(id)
  }

  return (
    <>
      <PageHeader
        title="Messages & Support"
        description={`Direct messaging center for ${ROLE_LABEL[p.role]} — communication with T&P admin, faculty mentors, students, and companies. ${unreadCount} unread.`}
        actions={
          <Button onClick={() => setComposeOpen(true)} className="gap-2">
            <Plus className="size-4" aria-hidden />
            Compose Message
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
              placeholder="Search conversations…"
              className="pl-9 text-xs"
            />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inbox" className="text-xs">Inbox</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="sent" className="text-xs">Sent</TabsTrigger>
            </TabsList>
          </Tabs>

          <ul className="flex flex-col gap-1.5 overflow-y-auto max-h-[36rem] pr-1">
            {visible.map((t) => {
              const msgs = p.messages.filter((m) => m.threadId === t.id).sort((a, b) => a.at.localeCompare(b.at))
              const last = msgs[msgs.length - 1]
              const threadIsUnread = isUnread(t)
              const isSelected = t.id === selected?.id
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => open(t.id)}
                    className={cn(
                      'flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors',
                      isSelected ? 'border-foreground bg-muted/60' : 'hover:bg-muted/30',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('truncate text-xs font-semibold', threadIsUnread && 'text-foreground font-bold')}>
                        {t.participantNames}
                      </span>
                      {last && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatMessageTimestamp(last.at)}
                        </span>
                      )}
                    </div>
                    <p className={cn('truncate text-xs', threadIsUnread ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                      {t.subject}
                    </p>
                    {last && (
                      <p className="line-clamp-1 text-[11px] text-muted-foreground opacity-80">
                        {last.body}
                      </p>
                    )}
                  </button>
                </li>
              )
            })}
            {visible.length === 0 && (
              <li className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">
                No messages found.
              </li>
            )}
          </ul>
        </div>

        {selected ? (
          <section className="flex min-h-[32rem] flex-col rounded-xl border bg-card shadow-xs">
            <header className="flex flex-col gap-1 border-b p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{selected.subject}</h2>
                <span className="text-xs text-muted-foreground font-mono">{thread.length} messages</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Participants: {selected.participantNames}
              </p>
            </header>

            <ul className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 max-h-[26rem]">
              {thread.map((m) => {
                const mine = m.fromRole === p.role || m.fromUserId === currentUserId
                return (
                  <li
                    key={m.id}
                    className={cn('flex flex-col gap-1 max-w-[85%]', mine ? 'ml-auto items-end' : 'mr-auto items-start')}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{m.fromName}</span>
                      <span>·</span>
                      <span>{ROLE_LABEL[m.fromRole]}</span>
                      <span>·</span>
                      <span>{formatMessageTimestamp(m.at)}</span>
                    </div>
                    <div
                      className={cn(
                        'rounded-xl px-4 py-2.5 text-xs',
                        mine
                          ? 'bg-foreground text-background font-medium'
                          : 'bg-muted text-foreground',
                      )}
                    >
                      <p className="text-pretty whitespace-pre-wrap">{m.body}</p>
                      {m.attachmentName && (
                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] opacity-80 border-t border-current/20 pt-1.5 w-full">
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
              className="flex flex-col gap-3 border-t p-4"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!reply.trim() || sending) return
                setSending(true)
                setMessageError(null)
                try {
                  await p.sendMessage(selected.id, reply.trim(), attach.trim() || undefined)
                  setReply('')
                  setAttach('')
                } catch (sendError) {
                  setMessageError(sendError instanceof Error ? sendError.message : 'Message could not be delivered.')
                } finally {
                  setSending(false)
                }
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
                className="text-xs"
              />
              {messageError && <p role="alert" className="text-xs text-destructive">{messageError}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={attach}
                  onChange={(e) => setAttach(e.target.value)}
                  placeholder="Attachment filename (optional)"
                  aria-label="Attachment name"
                  className="h-8 max-w-56 text-xs"
                />
                <Button type="submit" size="sm" className="ml-auto gap-1.5 text-xs" disabled={sending || !reply.trim()}>
                  <Send className="size-3.5" aria-hidden />
                  {sending ? 'Sending…' : 'Send reply'}
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <div className="flex min-h-[32rem] flex-col items-center justify-center rounded-xl border border-dashed text-center p-8">
            <Mail className="size-10 text-muted-foreground mb-2" />
            <p className="text-sm font-semibold">No Conversation Selected</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Select a conversation from the left or compose a new message to start chatting.
            </p>
            <Button onClick={() => setComposeOpen(true)} size="sm" className="mt-4 gap-1.5 text-xs">
              <Plus className="size-3.5" /> Compose New Message
            </Button>
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose message</DialogTitle>
            <DialogDescription>
              Direct real-time message delivered to the selected recipient.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-1">
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

            {toRole === 'admin' && (
              <div className="rounded-lg bg-muted/40 p-3 border text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Recipient: Central Training &amp; Placement Cell (T&P Admin)</p>
                <p className="mt-0.5">Your inquiry will be logged directly in the placement office dashboard.</p>
              </div>
            )}

            {toRole === 'faculty' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="to-faculty">Select Faculty Mentor</Label>
                <Select value={targetRecipientId} onValueChange={(value) => setTargetRecipientId(value ?? '')}>
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
                <Select value={targetRecipientId} onValueChange={(value) => setTargetRecipientId(value ?? '')}>
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
                <Label htmlFor="to-student">Select Student Candidate</Label>
                <Select value={targetRecipientId} onValueChange={(value) => setTargetRecipientId(value ?? '')}>
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
                placeholder="e.g. Query regarding campus drive or document verification"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="body">Message Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Write your message…"
              />
            </div>
          </div>
          {messageError && <p role="alert" className="text-xs text-destructive">{messageError}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={sending || !subject.trim() || !body.trim() || (toRole !== 'admin' && !targetRecipientId)}
              onClick={async () => {
                if (sending) return
                const resolvedTargetId = targetRecipientId || (toRole === 'admin' ? 'admin1' : undefined)
                setSending(true)
                setMessageError(null)
                try {
                  const newThreadId = await p.createThread(subject.trim(), toRole, body.trim(), resolvedTargetId)
                  setSelectedId(newThreadId)
                  setComposeOpen(false)
                  setSubject('')
                  setBody('')
                  setTargetRecipientId('')
                } catch (sendError) {
                  setMessageError(sendError instanceof Error ? sendError.message : 'Message could not be delivered.')
                } finally {
                  setSending(false)
                }
              }}
            >
              {sending ? 'Sending…' : 'Send message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
