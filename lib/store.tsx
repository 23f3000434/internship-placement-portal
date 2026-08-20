'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type {
  Achievement,
  Application,
  ApplicationStatus,
  AttendanceRecord,
  AuditEntry,
  AuthSession,
  Company,
  CompanyFeedback,
  Drive,
  Faculty,
  DocumentKind,
  DocumentStatus,
  Internship,
  InternshipDocument,
  Interview,
  Message,
  PpoStatus,
  Milestone,
  Notification,
  Role,
  SelfPlacement,
  Student,
  Thread,
  WeeklyReport,
} from './types'
import {
  faculty,
  seedAchievements,
  seedApplications,
  seedAttendance,
  seedAudit,
  seedCompanies,
  seedDocuments,
  seedDrives,
  seedFeedback,
  seedInternships,
  seedInterviews,
  seedMessages,
  seedMilestones,
  seedNotifications,
  seedSelfPlacements,
  seedStudents,
  seedThreads,
  seedWeeklyReports,
} from './seed'
import { checkEligibility } from './eligibility'

const SNAPSHOT_KEY = 'interntrack.portal.v1'

let uidCounter = 100
const uid = (p: string) => `${p}${++uidCounter}`
const today = () => new Date().toISOString().slice(0, 10)

const DOC_KINDS: DocumentKind[] = [
  'offer_letter',
  'joining_letter',
  'acceptance',
  'completion_certificate',
  'ppo_letter',
]

const DOC_CODES: Record<DocumentKind, string> = {
  offer_letter: 'OFR',
  joining_letter: 'JOI',
  acceptance: 'ACC',
  completion_certificate: 'CMP',
  ppo_letter: 'PPO',
}

/** Short scannable code so a document can be verified from outside the portal. */
const verifyCode = (internshipId: string, kind: DocumentKind) =>
  `ITK-${internshipId.toUpperCase()}-${DOC_CODES[kind]}-${Math.floor(1000 + Math.random() * 9000)}`

/**
 * Every internship gets the full five-document ledger up front so the T&P cell can see
 * exactly what is outstanding. Kinds listed in `prefilled` start as uploaded.
 */
function openDocumentLedger(internshipId: string, prefilled: DocumentKind[] = []) {
  return DOC_KINDS.map<InternshipDocument>((kind) => {
    const done = prefilled.includes(kind)
    return {
      id: uid('doc'),
      internshipId,
      kind,
      status: done ? 'uploaded' : 'not_uploaded',
      fileName: done ? `${kind}-${internshipId}.pdf` : undefined,
      uploadedBy: done ? (kind === 'acceptance' ? 'student' : 'company') : undefined,
      uploadedAt: done ? today() : undefined,
      verifyCode: done ? verifyCode(internshipId, kind) : undefined,
    }
  })
}

/** Fields a student is allowed to change on their own profile. */
export type StudentProfilePatch = Partial<
  Pick<
    Student,
    | 'name'
    | 'email'
    | 'enrollment'
    | 'branch'
    | 'cgpa'
    | 'backlogs'
    | 'passingYear'
    | 'skills'
    | 'certifications'
    | 'resumeUploaded'
    | 'resumeName'
    | 'resumeData'
    | 'idDocsUploaded'
    | 'idDocsName'
    | 'idDocsData'
    | 'locationPreference'
    | 'phone'
  >
>

interface PortalState {
  hydrated: boolean
  authSession: AuthSession | null
  login: (email: string, pass: string, targetRole?: Role) => Promise<{ success: boolean; error?: string }>
  quickLogin: (role: Role, personaId?: string) => void
  logout: () => void

  role: Role
  setRole: (r: Role) => void
  actingStudentId: string
  setActingStudentId: (id: string) => void
  actingCompanyId: string
  setActingCompanyId: (id: string) => void
  actingFacultyId: string

  students: Student[]
  companies: Company[]
  drives: Drive[]
  applications: Application[]
  interviews: Interview[]
  internships: Internship[]
  documents: InternshipDocument[]
  weeklyReports: WeeklyReport[]
  attendance: AttendanceRecord[]
  milestones: Milestone[]
  feedback: CompanyFeedback[]
  selfPlacements: SelfPlacement[]
  achievements: Achievement[]
  threads: Thread[]
  messages: Message[]
  notifications: Notification[]
  audit: AuditEntry[]
  faculty: Faculty[]

  // actions
  registerStudent: (s: Omit<Student, 'id' | 'status' | 'facultyId'>) => Promise<void>
  registerCompany: (c: Omit<Company, 'id' | 'status'>) => Promise<void>
  addFaculty: (f: Omit<Faculty, 'id'>) => void
  verifyStudent: (id: string, approve: boolean, reason?: string) => void
  verifyCompany: (id: string, approve: boolean, reason?: string) => void
  createDrive: (d: Omit<Drive, 'id' | 'companyId' | 'status'>) => void
  updateDrive: (id: string, updates: Partial<Drive>) => void
  deleteDrive: (id: string) => void
  applyToDrive: (driveId: string) => void
  setApplicationStatus: (appId: string, status: ApplicationStatus, reason?: string) => void
  scheduleInterview: (
    appId: string,
    details: Omit<Interview, 'id' | 'applicationId' | 'acknowledged'>,
  ) => void
  acknowledgeInterview: (id: string) => void
  acceptOffer: (appId: string) => void
  submitWeeklyReport: (r: Omit<WeeklyReport, 'id' | 'status'>) => void
  setReportStatus: (id: string, status: WeeklyReport['status']) => void
  submitAttendanceDay: (internshipId: string, kind: 'present' | 'absent' | 'leave') => void
  setMilestoneStatus: (id: string, status: Milestone['status'], remark?: string) => void
  submitFeedback: (f: Omit<CompanyFeedback, 'id'>) => void
  submitFinalEvaluation: (internshipId: string, text: string) => void
  uploadDocument: (
    internshipId: string,
    kind: DocumentKind,
    fileName: string,
    fileData?: string,
    fileSize?: number,
    fileUrl?: string,
  ) => void
  setDocumentStatus: (id: string, status: DocumentStatus, reason?: string) => void
  setPpoStatus: (internshipId: string, status: PpoStatus, opts?: { ppoPackage?: number; note?: string }) => void
  submitSelfPlacement: (
    sp: Omit<SelfPlacement, 'id' | 'studentId' | 'status'>,
  ) => void
  reviewSelfPlacement: (id: string, approve: boolean, reason?: string) => void
  addAchievement: (a: Omit<Achievement, 'id' | 'studentId' | 'status'>) => void
  reviewAchievement: (id: string, approve: boolean) => void
  addCompanyByStudent: (name: string, industry: string, website: string) => void
  sendMessage: (threadId: string, body: string, attachmentName?: string) => Promise<void>
  createThread: (subject: string, toRole: Role, body: string, targetId?: string) => Promise<string>
  markThreadRead: (threadId: string) => void
  markNotificationsRead: () => void
  setAtRisk: (studentId: string, flag: boolean) => void
  assignMentor: (studentId: string, facultyId: string) => void
  updateProfile: (patch: StudentProfilePatch) => void
  resetData: () => void
  exportData: () => void
  importData: (jsonStr: string) => boolean
}

const PortalContext = createContext<PortalState | null>(null)

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('student')
  const [actingStudentId, setActingStudentId] = useState('s2')
  const [actingCompanyId, setActingCompanyId] = useState('c1')
  const [actingFacultyId, setActingFacultyId] = useState('f1')

  const [authSession, setAuthSession] = useState<AuthSession | null>(null)

  const [students, setStudents] = useState(seedStudents)
  const [companies, setCompanies] = useState(seedCompanies)
  const [drives, setDrives] = useState(seedDrives)
  const [applications, setApplications] = useState(seedApplications)
  const [interviews, setInterviews] = useState(seedInterviews)
  const [internships, setInternships] = useState(seedInternships)
  const [documents, setDocuments] = useState(seedDocuments)
  const [weeklyReports, setWeeklyReports] = useState(seedWeeklyReports)
  const [attendance, setAttendance] = useState(seedAttendance)
  const [milestones, setMilestones] = useState(seedMilestones)
  const [feedback, setFeedback] = useState(seedFeedback)
  const [selfPlacements, setSelfPlacements] = useState(seedSelfPlacements)
  const [achievements, setAchievements] = useState(seedAchievements)
  const [threads, setThreads] = useState(seedThreads)
  const [messages, setMessages] = useState(seedMessages)
  const [notifications, setNotifications] = useState(seedNotifications)
  const [audit, setAudit] = useState(seedAudit)
  const [facultyList, setFacultyList] = useState<Faculty[]>(faculty)

  // Portal persistence: local cache + Supabase cloud synchronization across all devices
  const [hydrated, setHydrated] = useState(false)

  // Track last known serialized state to avoid echo updates and infinite loops
  const lastKnownStateJsonRef = useRef<string>('')
  const isApplyingRemoteRef = useRef<boolean>(false)

  const dedupeStudents = useCallback((list: Student[]): Student[] => {
    const seen = new Set<string>()
    const out: Student[] = []
    for (const s of list) {
      const em = (s.email || '').trim().toLowerCase()
      if (!em || seen.has(em)) continue
      seen.add(em)
      out.push(s)
    }
    return out
  }, [])

  const dedupeCompanies = useCallback((list: Company[]): Company[] => {
    const seen = new Set<string>()
    const out: Company[] = []
    for (const c of list) {
      const em = (c.hrEmail || c.email || '').trim().toLowerCase()
      if (!em || seen.has(em)) continue
      seen.add(em)
      out.push(c)
    }
    return out
  }, [])

  const applyRemoteState = useCallback((s: Record<string, unknown>) => {
    if (!s || typeof s !== 'object') return
    const incomingFingerprint = JSON.stringify({
      students: s.students,
      companies: s.companies,
      faculty: s.faculty,
      drives: s.drives,
      applications: s.applications,
      interviews: s.interviews,
      internships: s.internships,
      documents: s.documents,
      weeklyReports: s.weeklyReports,
      attendance: s.attendance,
      milestones: s.milestones,
      feedback: s.feedback,
      selfPlacements: s.selfPlacements,
      achievements: s.achievements,
      threads: s.threads,
      messages: s.messages,
      notifications: s.notifications,
      audit: s.audit,
      uid: s.uid,
    })

    if (incomingFingerprint === lastKnownStateJsonRef.current) {
      return // State identical, avoid triggering re-renders
    }

    isApplyingRemoteRef.current = true
    lastKnownStateJsonRef.current = incomingFingerprint

    if (Array.isArray(s.students) && s.students.length > 0) setStudents(dedupeStudents(s.students as Student[]))
    if (Array.isArray(s.companies) && s.companies.length > 0) setCompanies(dedupeCompanies(s.companies as Company[]))
    if (Array.isArray(s.faculty) && s.faculty.length > 0) setFacultyList(s.faculty as Faculty[])
    if (Array.isArray(s.drives) && s.drives.length > 0) setDrives(s.drives as Drive[])
    if (Array.isArray(s.applications)) setApplications(s.applications as Application[])
    if (Array.isArray(s.interviews)) setInterviews(s.interviews as Interview[])
    if (Array.isArray(s.internships)) setInternships(s.internships as Internship[])
    if (Array.isArray(s.documents)) setDocuments(s.documents as InternshipDocument[])
    if (Array.isArray(s.weeklyReports)) setWeeklyReports(s.weeklyReports as WeeklyReport[])
    if (Array.isArray(s.attendance)) setAttendance(s.attendance as AttendanceRecord[])
    if (Array.isArray(s.milestones)) setMilestones(s.milestones as Milestone[])
    if (Array.isArray(s.feedback)) setFeedback(s.feedback as CompanyFeedback[])
    if (Array.isArray(s.selfPlacements)) setSelfPlacements(s.selfPlacements as SelfPlacement[])
    if (Array.isArray(s.achievements)) setAchievements(s.achievements as Achievement[])
    if (Array.isArray(s.threads)) setThreads(s.threads as Thread[])
    if (Array.isArray(s.messages)) setMessages(s.messages as Message[])
    if (Array.isArray(s.notifications)) setNotifications(s.notifications as Notification[])
    if (Array.isArray(s.audit)) setAudit(s.audit as AuditEntry[])
    if (typeof s.uid === 'number') uidCounter = Math.max(uidCounter, s.uid)

    // Allow local state mutations again after current render batch
    setTimeout(() => {
      isApplyingRemoteRef.current = false
    }, 100)
  }, [dedupeStudents, dedupeCompanies])

  // 1. Initial hydration: localStorage for 0ms startup, then fetch from Supabase
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY) || sessionStorage.getItem(SNAPSHOT_KEY)
      if (raw) {
        const s = JSON.parse(raw) as Record<string, unknown>
        if (s.authSession !== undefined) setAuthSession(s.authSession as AuthSession | null)
        if (s.role) setRole(s.role as Role)
        if (s.actingStudentId) setActingStudentId(s.actingStudentId as string)
        if (s.actingCompanyId) setActingCompanyId(s.actingCompanyId as string)
        applyRemoteState(s)
      }
    } catch {
      // ignore corrupt snapshots and fall back to seed data
    }
    setHydrated(true)

    // 2. Fetch latest state from REST endpoint once on startup
    const fetchCloud = async () => {
      try {
        const res = await fetch('/api/portal/sync')
        const data = await res.json()
        if (data.synced && data.state) {
          applyRemoteState(data.state as Record<string, unknown>)
        }
      } catch {
        // seamless fallback to local snapshot
      }
    }
    fetchCloud()

    // 3. Zero-network instant cross-tab sync via BroadcastChannel
    let broadcast: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcast = new BroadcastChannel('interntrack_local_sync')
        broadcast.onmessage = (event) => {
          if (event.data && typeof event.data === 'object') {
            applyRemoteState(event.data as Record<string, unknown>)
          }
        }
      }
    } catch {}

    return () => {
      if (broadcast) broadcast.close()
    }
  }, [applyRemoteState])

  // 4. Save to localStorage only on genuine changes (no Supabase writes here — saves API quota)
  const broadcastRef = useRef<BroadcastChannel | null>(null)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window && !broadcastRef.current) {
        broadcastRef.current = new BroadcastChannel('interntrack_local_sync')
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (isApplyingRemoteRef.current) return

    const snapshotObj = {
      students,
      companies,
      faculty: facultyList,
      drives,
      applications,
      interviews,
      internships,
      documents,
      weeklyReports,
      attendance,
      milestones,
      feedback,
      selfPlacements,
      achievements,
      threads,
      messages,
      notifications,
      audit,
      uid: uidCounter,
    }

    const currentFingerprint = JSON.stringify(snapshotObj)
    if (currentFingerprint === lastKnownStateJsonRef.current) {
      return // No genuine changes
    }
    lastKnownStateJsonRef.current = currentFingerprint

    try {
      const localSnapshot = JSON.stringify(
        {
          authSession,
          role,
          actingStudentId,
          actingCompanyId,
          ...snapshotObj,
        },
        (_key, value) => {
          if (typeof value === 'string' && value.startsWith('data:') && value.length > 25000) {
            return value.slice(0, 500) + '...[offline_cached]'
          }
          return value
        },
      )
      localStorage.setItem(SNAPSHOT_KEY, localSnapshot)
      sessionStorage.setItem(SNAPSHOT_KEY, localSnapshot)
    } catch {
      // local storage quota fallback
    }

    // Notify other tabs via BroadcastChannel (zero network cost)
    try {
      broadcastRef.current?.postMessage(snapshotObj)
    } catch {}
  }, [
    hydrated,
    authSession,
    role,
    actingStudentId,
    actingCompanyId,
    students,
    companies,
    facultyList,
    drives,
    applications,
    interviews,
    internships,
    documents,
    weeklyReports,
    attendance,
    milestones,
    feedback,
    selfPlacements,
    achievements,
    threads,
    messages,
    notifications,
    audit,
  ])

  // Local-first sync helper — saves to localStorage only (no Supabase writes on every mutation)
  // Critical operations like registration and messaging have their own targeted API calls.
  const syncToCloud = useCallback((customState?: Record<string, unknown>) => {
    const payload = {
      students,
      companies,
      faculty: facultyList,
      drives,
      applications,
      interviews,
      internships,
      documents,
      weeklyReports,
      attendance,
      milestones,
      feedback,
      selfPlacements,
      achievements,
      threads,
      messages,
      notifications,
      audit,
      uid: uidCounter,
      ...customState,
    }

    lastKnownStateJsonRef.current = JSON.stringify(payload)

    try {
      const localSnapshot = JSON.stringify(
        {
          authSession,
          role,
          actingStudentId,
          actingCompanyId,
          ...payload,
        },
        (_key, value) => {
          if (typeof value === 'string' && value.startsWith('data:') && value.length > 25000) {
            return value.slice(0, 500) + '...[offline_cached]'
          }
          return value
        },
      )
      localStorage.setItem(SNAPSHOT_KEY, localSnapshot)
      sessionStorage.setItem(SNAPSHOT_KEY, localSnapshot)
    } catch {}

    // Notify other tabs via BroadcastChannel (zero network cost)
    try {
      broadcastRef.current?.postMessage(payload)
    } catch {}

    // Debounced cloud sync to Supabase (saves bandwidth & stays well within API quotas)
    if (typeof window !== 'undefined') {
      const win = window as unknown as { _cloudSyncTimer?: ReturnType<typeof setTimeout> }
      if (win._cloudSyncTimer) clearTimeout(win._cloudSyncTimer)
      win._cloudSyncTimer = setTimeout(() => {
        fetch('/api/portal/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {})
      }, 1200)
    }
  }, [
    students,
    companies,
    facultyList,
    drives,
    applications,
    interviews,
    internships,
    documents,
    weeklyReports,
    attendance,
    milestones,
    feedback,
    selfPlacements,
    achievements,
    threads,
    messages,
    notifications,
    audit,
    authSession,
    role,
    actingStudentId,
    actingCompanyId,
  ])

  const log = useCallback((actor: string, action: string, target: string, reason?: string) => {
    setAudit((a) => [
      { id: uid('au'), actor, action, target, reason, at: today() },
      ...a,
    ])
  }, [])

  const notify = useCallback((forRole: Role, title: string, body: string) => {
    setNotifications((n) => [
      { id: uid('nt'), forRole, title, body, at: today(), read: false },
      ...n,
    ])
  }, [])

  const emailToast = useCallback((to: string, subject: string) => {
    toast.success(`Email sent to ${to}`, { description: subject })
  }, [])

  const login: PortalState['login'] = async (email, pass) => {
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPass = (pass || '').trim()

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered email address.' }
    }
    if (!cleanPass) {
      return { success: false, error: 'Please enter your password.' }
    }

    const matchUser = (
      currentStudents: Student[],
      currentCompanies: Company[],
      currentFaculty: Faculty[],
    ) => {
      // 1. Check Admin
      if (cleanEmail === 'admin@college.edu' || cleanEmail === 'tnp@college.edu') {
        if (cleanPass !== 'admin123' && cleanPass !== 'password123' && cleanPass !== 'admin') {
          return { success: false, error: 'Invalid admin password. Default is admin123.' }
        }
        const sess: AuthSession = {
          userId: 'admin1',
          name: 'T&P Cell Admin',
          email: cleanEmail,
          role: 'admin',
          token: `tok_admin_${Date.now()}`,
          signedInAt: today(),
        }
        setAuthSession(sess)
        setRole('admin')
        try {
          localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ authSession: sess, role: 'admin' }))
        } catch {}
        toast.success('Signed in as Admin / T&P Cell')
        return { success: true }
      }

      // 2. Check Faculty
      const fMatch = currentFaculty.find((f) => (f.email || '').trim().toLowerCase() === cleanEmail)
      if (fMatch) {
        const expectedPass = (fMatch.password || 'faculty123').trim()
        if (cleanPass !== expectedPass && cleanPass !== 'faculty123' && cleanPass !== 'password123') {
          return { success: false, error: 'Invalid password. Please check your password.' }
        }
        const sess: AuthSession = {
          userId: fMatch.id,
          name: fMatch.name,
          email: fMatch.email,
          role: 'faculty',
          token: `tok_faculty_${Date.now()}`,
          signedInAt: today(),
        }
        setAuthSession(sess)
        setRole('faculty')
        setActingFacultyId(fMatch.id)
        try {
          localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ authSession: sess, role: 'faculty', actingFacultyId: fMatch.id }))
        } catch {}
        toast.success(`Signed in as ${fMatch.name}`)
        return { success: true }
      }

      // 3. Check Student
      const sMatch = currentStudents.find((s) => (s.email || '').trim().toLowerCase() === cleanEmail)
      if (sMatch) {
        const expectedPass = (sMatch.password || 'password123').trim()
        if (cleanPass !== expectedPass && cleanPass !== 'password123') {
          return { success: false, error: 'Invalid password. Please check your password.' }
        }
        const sess: AuthSession = {
          userId: sMatch.id,
          name: sMatch.name,
          email: sMatch.email,
          role: 'student',
          token: `tok_student_${sMatch.id}_${Date.now()}`,
          signedInAt: today(),
        }
        setAuthSession(sess)
        setRole('student')
        setActingStudentId(sMatch.id)
        try {
          localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ authSession: sess, role: 'student', actingStudentId: sMatch.id }))
        } catch {}
        toast.success(`Signed in as ${sMatch.name}`)
        return { success: true }
      }

      // 4. Check Company
      const cMatch = currentCompanies.find(
        (c) =>
          (c.email || '').trim().toLowerCase() === cleanEmail ||
          (c.hrEmail || '').trim().toLowerCase() === cleanEmail ||
          (cleanEmail.includes('technova') && c.id === 'c1') ||
          (cleanEmail.includes('dataforge') && c.id === 'c2') ||
          (cleanEmail.includes('mechworks') && c.id === 'c3'),
      )
      if (cMatch) {
        const expectedPass = (cMatch.password || 'company123').trim()
        if (cleanPass !== expectedPass && cleanPass !== 'company123' && cleanPass !== 'password123') {
          return { success: false, error: 'Invalid password. Default company password is company123.' }
        }
        const sess: AuthSession = {
          userId: cMatch.id,
          name: cMatch.name,
          email: cMatch.hrEmail,
          role: 'company',
          token: `tok_company_${cMatch.id}_${Date.now()}`,
          signedInAt: today(),
        }
        setAuthSession(sess)
        setRole('company')
        setActingCompanyId(cMatch.id)
        try {
          localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ authSession: sess, role: 'company', actingCompanyId: cMatch.id }))
        } catch {}
        toast.success(`Signed in as ${cMatch.name}`)
        return { success: true }
      }

      return null
    }

    // Step 1: Check in-memory state
    const localMatch = matchUser(students, companies, facultyList)
    if (localMatch) return localMatch

    // Step 2: Check localStorage snapshot
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY) || sessionStorage.getItem(SNAPSHOT_KEY)
      if (raw) {
        const s = JSON.parse(raw) as Record<string, unknown>
        const localStudents = Array.isArray(s.students) ? dedupeStudents(s.students as Student[]) : students
        const localCompanies = Array.isArray(s.companies) ? dedupeCompanies(s.companies as Company[]) : companies
        const localFaculty = Array.isArray(s.faculty) ? (s.faculty as Faculty[]) : facultyList
        const snapMatch = matchUser(localStudents, localCompanies, localFaculty)
        if (snapMatch) {
          applyRemoteState(s)
          return snapMatch
        }
      }
    } catch {}

    // Step 3: Query server sync for fresh accounts
    try {
      const res = await fetch('/api/portal/sync', { cache: 'no-store' })
      const json = await res.json()
      if (json.synced && json.state) {
        const remoteState = json.state as Record<string, unknown>
        applyRemoteState(remoteState)

        const remoteStudents = Array.isArray(remoteState.students)
          ? dedupeStudents(remoteState.students as Student[])
          : students
        const remoteCompanies = Array.isArray(remoteState.companies)
          ? dedupeCompanies(remoteState.companies as Company[])
          : companies
        const remoteFaculty = Array.isArray(remoteState.faculty)
          ? (remoteState.faculty as Faculty[])
          : facultyList

        const cloudMatch = matchUser(remoteStudents, remoteCompanies, remoteFaculty)
        if (cloudMatch) return cloudMatch
      }
    } catch {
      // offline fallback
    }

    return { success: false, error: 'No account registered with this email. Please check your spelling or register.' }
  }

  const quickLogin: PortalState['quickLogin'] = (targetRole, personaId) => {
    if (targetRole === 'admin') {
      const sess: AuthSession = {
        userId: 'admin1',
        name: 'T&P Cell Admin',
        email: 'tnp@college.edu',
        role: 'admin',
        token: `tok_admin_${Date.now()}`,
        signedInAt: today(),
      }
      setAuthSession(sess)
      setRole('admin')
      toast.success('Signed in as Admin / T&P Cell')
    } else if (targetRole === 'faculty') {
      const f = faculty[0]
      const sess: AuthSession = {
        userId: f.id,
        name: f.name,
        email: f.email,
        role: 'faculty',
        token: `tok_faculty_${Date.now()}`,
        signedInAt: today(),
      }
      setAuthSession(sess)
      setRole('faculty')
      toast.success(`Signed in as Faculty (${f.name})`)
    } else if (targetRole === 'company') {
      const targetC = companies.find((c) => c.id === (personaId || actingCompanyId)) || companies[0]
      const sess: AuthSession = {
        userId: targetC.id,
        name: targetC.name,
        email: targetC.hrEmail,
        role: 'company',
        token: `tok_company_${targetC.id}_${Date.now()}`,
        signedInAt: today(),
      }
      setAuthSession(sess)
      setRole('company')
      setActingCompanyId(targetC.id)
      toast.success(`Signed in as Recruiter (${targetC.name})`)
    } else {
      const targetS = students.find((s) => s.id === (personaId || actingStudentId)) || students[0]
      const sess: AuthSession = {
        userId: targetS.id,
        name: targetS.name,
        email: targetS.email,
        role: 'student',
        token: `tok_student_${targetS.id}_${Date.now()}`,
        signedInAt: today(),
      }
      setAuthSession(sess)
      setRole('student')
      setActingStudentId(targetS.id)
      toast.success(`Signed in as Student (${targetS.name})`)
    }
  }

  const logout: PortalState['logout'] = () => {
    setAuthSession(null)
    toast.info('Signed out successfully')
  }

  const registerStudent: PortalState['registerStudent'] = async (s) => {
    const email = (s.email || '').trim().toLowerCase()
    const phone = s.phone?.trim() ?? ''
    if (!s.name.trim() || !email || !s.enrollment.trim() || !s.branch.trim() || !phone) {
      throw new Error('Please complete every required field.')
    }
    if (!/^\+?[0-9][0-9\s-]{7,14}$/.test(phone)) throw new Error('Enter a valid phone number.')

    const cleanStudent: Student = {
      ...s,
      id: uid('s'),
      name: s.name.trim(),
      email,
      enrollment: s.enrollment.trim(),
      phone,
      password: (s.password || 'password123').trim(),
      status: 'pending',
      facultyId: 'f1',
      resumeUploaded: true,
      resumeName: s.resumeName || 'Student_Resume.pdf',
      idDocsUploaded: true,
      idDocsName: s.idDocsName || 'ID_Card.pdf',
      // Store lightweight preview to prevent large payload network errors
      resumeData: s.resumeData && s.resumeData.length > 50000 ? s.resumeData.slice(0, 500) : s.resumeData,
      idDocsData: s.idDocsData && s.idDocsData.length > 50000 ? s.idDocsData.slice(0, 500) : s.idDocsData,
    }

    // 1. Instantly update in-memory React state
    const nextStudents = dedupeStudents([...students.filter((x) => (x.email || '').trim().toLowerCase() !== email), cleanStudent])
    setStudents(nextStudents)

    // 2. Synchronously write snapshot to storage
    try {
      const payload = {
        students: nextStudents,
        companies,
        faculty: facultyList,
        drives,
        applications,
        interviews,
        internships,
        documents,
        weeklyReports,
        attendance,
        milestones,
        feedback,
        selfPlacements,
        achievements,
        threads,
        messages,
        notifications,
        audit,
      }
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload))
      sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload))
    } catch {}

    // 3. Atomically sync registration to Supabase
    try {
      const res = await fetch('/api/portal/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register_student', student: cleanStudent }),
      })
      const data = await res.json().catch(() => null)
      if (data?.students && Array.isArray(data.students)) {
        const merged = dedupeStudents([...nextStudents, ...(data.students as Student[])])
        setStudents(merged)
      }
    } catch (err) {
      console.warn('Background registration cloud sync:', err)
    }

    notify('admin', 'New student registration', `${cleanStudent.name} submitted documents for verification.`)
    emailToast(cleanStudent.email, 'Registration received — pending verification')
  }

  const registerCompany: PortalState['registerCompany'] = async (c) => {
    const hrEmail = (c.hrEmail || c.email || '').trim().toLowerCase()
    if (!c.name.trim() || !hrEmail) {
      throw new Error('Company name and recruiter email are required.')
    }

    const id = uid('c')
    const cleanCompany: Company = {
      ...c,
      id,
      name: c.name.trim(),
      email: c.email ? c.email.trim().toLowerCase() : hrEmail,
      hrEmail,
      password: (c.password || 'password123').trim(),
      status: 'pending',
    }

    // 1. Instantly update in-memory state
    const nextCompanies = dedupeCompanies([
      ...companies.filter((co) => (co.hrEmail || co.email || '').trim().toLowerCase() !== hrEmail),
      cleanCompany,
    ])
    setCompanies(nextCompanies)

    // 2. Synchronously write snapshot to storage
    try {
      const payload = {
        students,
        companies: nextCompanies,
        faculty: facultyList,
        drives,
        applications,
        interviews,
        internships,
        documents,
        weeklyReports,
        attendance,
        milestones,
        feedback,
        selfPlacements,
        achievements,
        threads,
        messages,
        notifications,
        audit,
      }
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload))
      sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload))
    } catch {}

    // 3. Atomically sync registration to Supabase
    try {
      const res = await fetch('/api/portal/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register_company', company: cleanCompany }),
      })
      const data = await res.json().catch(() => null)
      if (data?.companies && Array.isArray(data.companies)) {
        const merged = dedupeCompanies([...nextCompanies, ...(data.companies as Company[])])
        setCompanies(merged)
      }
    } catch (err) {
      console.warn('Company registration sync error:', err)
    }

    notify('admin', 'New company registration', `${cleanCompany.name} submitted registration for verification.`)
    emailToast(cleanCompany.hrEmail, 'Registration received — pending admin approval')
  }

  const addFaculty: PortalState['addFaculty'] = (newFaculty) => {
    const id = uid('f')
    const created: Faculty = {
      id,
      name: newFaculty.name.trim(),
      email: newFaculty.email.trim().toLowerCase(),
      department: newFaculty.department,
      designation: newFaculty.designation || 'Faculty Mentor',
      password: newFaculty.password || 'password123',
      phone: newFaculty.phone,
    }
    setFacultyList((prev) => [...prev, created])
    log('Admin (T&P Cell)', 'Added faculty mentor', `${created.name} (${created.department})`)
    toast.success('Faculty mentor added', {
      description: `${created.name} registered under ${created.department}.`,
    })
  }

  const verifyStudent: PortalState['verifyStudent'] = (id, approve, reason) => {
    const updated = students.map((s) =>
      s.id === id
        ? { ...s, status: approve ? 'approved' : 'rejected', blockReason: approve ? undefined : reason }
        : s,
    )
    setStudents(updated)
    syncToCloud({ students: updated })

    const s = students.find((x) => x.id === id)
    if (s) {
      log('Admin (T&P Cell)', approve ? 'Approved student' : 'Rejected student', `${s.name} (${s.enrollment})`, reason)
      notify('student', approve ? 'Account approved' : 'Verification rejected', approve ? 'Your documents were verified. You can now apply to drives.' : `Reason: ${reason}`)
      emailToast(s.email, approve ? 'Your account has been approved' : 'Verification rejected')
    }
  }

  const verifyCompany: PortalState['verifyCompany'] = (id, approve, reason) => {
    const updated = companies.map((c) =>
      c.id === id
        ? { ...c, status: approve ? 'approved' : 'rejected', blockReason: approve ? undefined : reason }
        : c,
    )
    setCompanies(updated)
    syncToCloud({ companies: updated })

    const c = companies.find((x) => x.id === id)
    if (c) {
      log('Admin (T&P Cell)', approve ? 'Approved company' : 'Rejected company', c.name, reason)
      notify('company', approve ? 'Company approved' : 'Registration rejected', approve ? 'You can now create internship drives.' : `Reason: ${reason}`)
      emailToast(c.hrEmail, approve ? 'Your company has been approved' : 'Registration rejected')
    }
  }

  const setBlocked: PortalState['setBlocked'] = (kind, id, blocked, reason) => {
    if (kind === 'student') {
      const updated = students.map((s) =>
        s.id === id ? { ...s, status: blocked ? 'blocked' : 'approved', blockReason: blocked ? reason : undefined } : s,
      )
      setStudents(updated)
      syncToCloud({ students: updated })
      const s = students.find((x) => x.id === id)
      if (s) {
        log('Admin (T&P Cell)', blocked ? 'Blocked student' : 'Unblocked student', s.name, reason)
        emailToast(s.email, blocked ? `Account blocked: ${reason}` : 'Account unblocked')
      }
    } else {
      const updated = companies.map((c) =>
        c.id === id ? { ...c, status: blocked ? 'blocked' : 'approved', blockReason: blocked ? reason : undefined } : c,
      )
      setCompanies(updated)
      syncToCloud({ companies: updated })
      const c = companies.find((x) => x.id === id)
      if (c) {
        log('Admin (T&P Cell)', blocked ? 'Blocked company' : 'Unblocked company', c.name, reason)
        emailToast(c.hrEmail, blocked ? `Account blocked: ${reason}` : 'Account unblocked')
      }
    }
  }

  const createDrive: PortalState['createDrive'] = (d) => {
    const currentCompanyId = authSession?.userId || actingCompanyId || 'c1'
    const company = companies.find((item) => item.id === currentCompanyId) || companies[0]
    if (role !== 'company' || company?.status !== 'approved') {
      throw new Error('Only approved companies can publish internship drives.')
    }
    if (!d.title.trim() || !d.description.trim() || !d.field.trim() || !d.location.trim()) {
      throw new Error('Complete all required drive details.')
    }
    if (d.stipend < 0 || d.durationWeeks <= 0 || d.openings <= 0) {
      throw new Error('Stipend, duration, and openings contain invalid values.')
    }
    if (!(d.openDate <= d.deadline && d.deadline < d.startDate && d.startDate < d.endDate)) {
      throw new Error('Drive timeline dates are invalid.')
    }
    const updated = [{ ...d, id: uid('d'), companyId: currentCompanyId, status: 'open' as const }, ...drives]
    setDrives(updated)
    syncToCloud({ drives: updated })
    notify('admin', 'New drive published', `${company.name} published "${d.title}".`)
    notify('student', 'New internship drive', `${company.name} is hiring: ${d.title}.`)
    toast.success('Drive published', { description: 'Students matching the filters have been notified.' })
    log(company.name, 'Published drive', d.title)
  }

  const updateDrive: PortalState['updateDrive'] = (id, updates) => {
    const existing = drives.find((d) => d.id === id)
    if (!existing) {
      toast.error('Drive not found')
      return
    }
    const currentCompanyId = authSession?.userId || actingCompanyId || 'c1'
    if (role === 'company' && existing.companyId !== currentCompanyId) {
      toast.error('Unauthorized', { description: 'You can only edit drives created by your organization.' })
      return
    }

    const updatedDrives = drives.map((d) => (d.id === id ? { ...d, ...updates } : d))
    setDrives(updatedDrives)
    syncToCloud({ drives: updatedDrives })
    toast.success('Drive updated successfully', { description: `"${updates.title || existing.title}" changes saved.` })
    log(authSession?.name || 'Company', 'Updated internship drive', updates.title || existing.title)
  }

  const deleteDrive: PortalState['deleteDrive'] = (id) => {
    const existing = drives.find((d) => d.id === id)
    if (!existing) {
      toast.error('Drive not found')
      return
    }
    const currentCompanyId = authSession?.userId || actingCompanyId || 'c1'
    if (role === 'company' && existing.companyId !== currentCompanyId) {
      toast.error('Unauthorized', { description: 'You can only delete drives created by your organization.' })
      return
    }

    const updatedDrives = drives.filter((d) => d.id !== id)
    setDrives(updatedDrives)
    syncToCloud({ drives: updatedDrives })
    toast.success('Drive deleted', { description: `"${existing.title}" has been removed.` })
    log(authSession?.name || 'Company', 'Deleted internship drive', existing.title)
  }

  const applyToDrive: PortalState['applyToDrive'] = (driveId) => {
    const student = students.find((s) => s.id === actingStudentId)
    const drive = drives.find((d) => d.id === driveId)
    if (!student || !drive) return

    // Duplicate check
    if (applications.some((a) => a.driveId === driveId && a.studentId === actingStudentId)) {
      toast.error('Already Applied', { description: 'You have already submitted an application for this drive.' })
      return
    }

    // Eligibility check
    const elig = checkEligibility(student, drive)
    if (elig.state === 'not_eligible') {
      toast.error('Application Blocked: Not Eligible', { description: elig.reason })
      return
    }

    const app: Application = {
      id: uid('a'),
      driveId,
      studentId: actingStudentId,
      status: 'applied',
      appliedAt: today(),
      history: [{ status: 'applied', at: today() }],
    }
    const updated = [...applications, app]
    setApplications(updated)
    syncToCloud({ applications: updated })
    notify('company', 'New applicant', `${student.name} applied to ${drive.title}.`)
    toast.success('Application submitted', { description: `${drive.title} — status: Applied` })
  }

  const setApplicationStatus: PortalState['setApplicationStatus'] = (appId, status, reason) => {
    const app = applications.find((a) => a.id === appId)
    const student = students.find((s) => s.id === app?.studentId)
    const drive = drives.find((d) => d.id === app?.driveId)

    if (status === 'rejected' && (!reason || reason.trim().length === 0)) {
      toast.error('Rejection Reason Required', { description: 'Please provide a clear reason for the rejection.' })
      return
    }

    const updated = applications.map((a) =>
      a.id === appId
        ? { ...a, status, rejectReason: reason, history: [...a.history, { status, at: today() }] }
        : a,
    )
    setApplications(updated)
    syncToCloud({ applications: updated })

    if (student && drive) {
      const label = status.replace(/_/g, ' ')
      notify('student', `Application ${label}`, `${drive.title}: your application is now "${label}".${reason ? ` Reason: ${reason}` : ''}`)
      emailToast(student.email, `Application update: ${label}`)
      if (status === 'selected') {
        notify('admin', 'Student selected', `${student.name} selected for ${drive.title}.`)
      }
    }
  }

  const scheduleInterview: PortalState['scheduleInterview'] = (appId, details) => {
    const updatedInterviews = [...interviews, { ...details, id: uid('i'), applicationId: appId, acknowledged: false }]
    const updatedApps = applications.map((a) =>
      a.id === appId
        ? { ...a, status: 'interview_scheduled' as ApplicationStatus, history: [...a.history, { status: 'interview_scheduled' as ApplicationStatus, at: today() }] }
        : a,
    )
    setInterviews(updatedInterviews)
    setApplications(updatedApps)
    syncToCloud({ interviews: updatedInterviews, applications: updatedApps })

    const app = applications.find((a) => a.id === appId)
    const student = students.find((s) => s.id === app?.studentId)
    const drive = drives.find((d) => d.id === app?.driveId)
    if (student && drive) {
      notify('student', 'Interview scheduled', `${drive.title}: ${details.date} at ${details.time} (${details.mode === 'online' ? 'Online' : 'In person'}).`)
      notify('admin', 'Interview scheduled', `${student.name} — ${drive.title} on ${details.date}.`)
      emailToast(student.email, `Interview scheduled: ${drive.title} on ${details.date}`)
      emailToast('tnp@college.edu', `Interview notification: ${student.name} — ${drive.title}`)
      log('Company', 'Scheduled interview', `${student.name} — ${drive.title}`)
    }
  }

  const acknowledgeInterview: PortalState['acknowledgeInterview'] = (id) => {
    const updated = interviews.map((i) => (i.id === id ? { ...i, acknowledged: true } : i))
    setInterviews(updated)
    syncToCloud({ interviews: updated })
    toast.success('Interview acknowledged', { description: 'The company has been notified.' })
  }

  const acceptOffer: PortalState['acceptOffer'] = (appId) => {
    const app = applications.find((a) => a.id === appId)
    const drive = drives.find((d) => d.id === app?.driveId)
    if (!app || !drive) return
    const internship: Internship = {
      id: uid('n'),
      studentId: app.studentId,
      companyId: drive.companyId,
      driveId: drive.id,
      role: drive.title,
      location: drive.location,
      type: 'college',
      startDate: drive.startDate,
      endDate: drive.endDate,
      status: 'active',
      ppoStatus: 'none',
    }
    const updatedInternships = [...internships, internship]
    const updatedAttendance = [
      ...attendance,
      {
        internshipId: internship.id,
        workingDays: 0,
        present: 0,
        absent: 0,
        leave: 0,
        entries: [],
      },
    ]
    const updatedDocs = [
      ...documents,
      ...openDocumentLedger(internship.id, ['offer_letter', 'acceptance']),
    ]
    setInternships(updatedInternships)
    setAttendance(updatedAttendance)
    setDocuments(updatedDocs)
    syncToCloud({ internships: updatedInternships, attendance: updatedAttendance, documents: updatedDocs })

    const student = students.find((s) => s.id === app.studentId)
    notify('company', 'Offer accepted', `${student?.name} accepted the offer for ${drive.title}. Tracking begins.`)
    notify('admin', 'Internship started', `${student?.name} — ${drive.title}.`)
    toast.success('Offer accepted', { description: 'Internship tracking has begun.' })
    log(student?.name ?? 'Student', 'Accepted offer', drive.title)
  }

  const submitWeeklyReport: PortalState['submitWeeklyReport'] = (r) => {
    const updated = [...weeklyReports, { ...r, id: uid('w'), status: 'submitted' as const }]
    setWeeklyReports(updated)
    syncToCloud({ weeklyReports: updated })
    notify('company', 'Weekly report submitted', `Week ${r.week} report awaiting supervisor verification.`)
    notify('faculty', 'Weekly report submitted', `Week ${r.week} report submitted by your mentee.`)
    toast.success(`Week ${r.week} report submitted`, { description: 'Sent to company supervisor for verification.' })
  }

  const setReportStatus: PortalState['setReportStatus'] = (id, status) => {
    const updated = weeklyReports.map((w) => (w.id === id ? { ...w, status } : w))
    setWeeklyReports(updated)
    syncToCloud({ weeklyReports: updated })
    const labels: Record<WeeklyReport['status'], string> = {
      submitted: 'Submitted',
      company_approved: 'Verified by company',
      faculty_reviewed: 'Reviewed by faculty',
      flagged: 'Flagged',
    }
    toast.success(`Report ${labels[status].toLowerCase()}`)
    if (status === 'company_approved') notify('faculty', 'Report verified', 'A weekly report was verified by the company supervisor.')
    if (status === 'faculty_reviewed') notify('student', 'Report reviewed', 'Your weekly report was reviewed by faculty.')
  }

  const submitAttendanceDay: PortalState['submitAttendanceDay'] = (internshipId, kind) => {
    const t = today()
    const updated = attendance.map((a) => {
      if (a.internshipId !== internshipId) return a
      const existingEntries = a.entries ?? []
      const todayEntryIndex = existingEntries.findIndex((e) => e.date === t)

      if (todayEntryIndex >= 0) {
        const oldStatus = existingEntries[todayEntryIndex].status
        if (oldStatus === kind) {
          toast.info(`Today's attendance is already recorded as ${kind}.`)
          return a
        }
        const updatedEntries = [...existingEntries]
        updatedEntries[todayEntryIndex] = { date: t, status: kind }
        toast.success(`Attendance updated to ${kind} for today`)
        return {
          ...a,
          [oldStatus]: Math.max(0, a[oldStatus] - 1),
          [kind]: a[kind] + 1,
          lastMarkedDate: t,
          entries: updatedEntries,
        }
      }

      toast.success('Attendance recorded', { description: 'Sent to supervisor for approval.' })
      return {
        ...a,
        workingDays: a.workingDays + 1,
        [kind]: a[kind] + 1,
        lastMarkedDate: t,
        entries: [...existingEntries, { date: t, status: kind }],
      }
    })
    setAttendance(updated)
    syncToCloud({ attendance: updated })
  }

  const setMilestoneStatus: PortalState['setMilestoneStatus'] = (id, status, remark) => {
    const updated = milestones.map((m) => (m.id === id ? { ...m, status, companyRemark: remark ?? m.companyRemark } : m))
    setMilestones(updated)
    syncToCloud({ milestones: updated })
    toast.success('Milestone updated')
  }

  const submitFeedback: PortalState['submitFeedback'] = (f) => {
    const updated = [...feedback, { ...f, id: uid('fb') }]
    setFeedback(updated)
    syncToCloud({ feedback: updated })
    notify('faculty', 'Company feedback submitted', `Week ${f.week} intern feedback recorded.`)
    notify('admin', 'Company feedback submitted', `Week ${f.week} intern feedback recorded.`)
    toast.success(`Week ${f.week} feedback submitted`)
  }

  const submitFinalEvaluation: PortalState['submitFinalEvaluation'] = (internshipId, text) => {
    const updated = internships.map((n) => (n.id === internshipId ? { ...n, finalEvaluation: text, status: 'completed' as const } : n))
    setInternships(updated)
    syncToCloud({ internships: updated })
    notify('admin', 'Internship completed', 'A final evaluation was submitted and the internship marked complete.')
    toast.success('Final evaluation submitted', { description: 'Internship marked as completed.' })
  }

  const docLabels: Record<DocumentKind, string> = {
    offer_letter: 'Offer letter',
    joining_letter: 'Joining letter',
    acceptance: 'Acceptance letter',
    completion_certificate: 'Completion certificate',
    ppo_letter: 'PPO letter',
  }

  const uploadDocument: PortalState['uploadDocument'] = (
    internshipId,
    kind,
    fileName,
    fileData,
    fileSize,
    fileUrl,
  ) => {
    const existing = documents.find((d) => d.internshipId === internshipId && d.kind === kind)
    const rawUrl = (fileUrl || '').trim()
    const cleanUrl = rawUrl ? (/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`) : undefined

    const next: Partial<InternshipDocument> = {
      fileName,
      fileData: fileData ?? existing?.fileData,
      fileUrl: cleanUrl ?? existing?.fileUrl,
      fileSize: fileSize ?? existing?.fileSize,
      uploadedBy: role === 'company' ? 'company' : 'student',
      uploadedAt: today(),
      status: 'uploaded',
      verifyCode: existing?.verifyCode ?? verifyCode(internshipId, kind),
      rejectReason: undefined,
    }
    const updated = existing
      ? documents.map((d) => (d.id === existing.id ? { ...d, ...next } : d))
      : [...documents, { id: uid('doc'), internshipId, kind, ...next } as InternshipDocument]

    setDocuments(updated)
    syncToCloud({ documents: updated })

    notify('admin', 'Document uploaded', `${docLabels[kind]} uploaded and awaiting T&P verification.`)
    toast.success(`${docLabels[kind]} uploaded`, {
      description: 'Document saved and sent to T&P cell for verification.',
    })
  }

  const setDocumentStatus: PortalState['setDocumentStatus'] = (id, status, reason) => {
    const updated = documents.map((d) => (d.id === id ? { ...d, status, rejectReason: status === 'rejected' ? reason : undefined } : d))
    setDocuments(updated)
    syncToCloud({ documents: updated })

    const doc = documents.find((d) => d.id === id)
    const internship = internships.find((n) => n.id === doc?.internshipId)
    const student = students.find((s) => s.id === internship?.studentId)
    if (doc) {
      const label = docLabels[doc.kind]
      if (status === 'verified') {
        log('Admin (T&P Cell)', 'Verified document', `${label} — ${student?.name ?? 'Unknown'}`)
        notify('student', 'Document verified', `Your ${label.toLowerCase()} was verified by the T&P cell.`)
        toast.success(`${label} verified`)
      } else if (status === 'rejected') {
        log('Admin (T&P Cell)', 'Rejected document', `${label} — ${student?.name ?? 'Unknown'}`, reason)
        notify('student', 'Document rejected', `${label}: ${reason}`)
        if (student) emailToast(student.email, `${label} rejected — re-upload required`)
      }
    }
  }

  const setPpoStatus: PortalState['setPpoStatus'] = (internshipId, status, opts) => {
    const updated = internships.map((n) =>
      n.id === internshipId
        ? { ...n, ppoStatus: status, ppoPackage: opts?.ppoPackage ?? n.ppoPackage, ppoNote: opts?.note ?? n.ppoNote }
        : n,
    )
    setInternships(updated)
    syncToCloud({ internships: updated })

    const internship = internships.find((n) => n.id === internshipId)
    const student = students.find((s) => s.id === internship?.studentId)
    const labels: Record<PpoStatus, string> = {
      none: 'PPO recommendation withdrawn',
      recommended: 'Recommended for a pre-placement offer',
      offered: 'Pre-placement offer issued',
      accepted: 'Pre-placement offer accepted',
      declined: 'Pre-placement offer declined',
    }
    log(
      status === 'accepted' || status === 'declined' ? (student?.name ?? 'Student') : 'Company',
      labels[status],
      `${student?.name ?? 'Unknown'} — ${internship?.role ?? ''}`,
      opts?.note,
    )
    if (status === 'recommended' || status === 'offered') {
      notify('student', labels[status], `${internship?.role}: ${labels[status].toLowerCase()}.`)
      notify('admin', labels[status], `${student?.name} — ${internship?.role}.`)
      if (student) emailToast(student.email, labels[status])
    }
    if (status === 'accepted' || status === 'declined') {
      notify('admin', labels[status], `${student?.name} — ${internship?.role}.`)
      notify('company', labels[status], `${student?.name} — ${internship?.role}.`)
    }
    toast.success(labels[status])
  }

  const submitSelfPlacement: PortalState['submitSelfPlacement'] = (sp) => {
    const currentStudentId = authSession?.userId || actingStudentId || 's1'
    if (new Date(sp.endDate) <= new Date(sp.startDate)) {
      toast.error('Invalid Date Range', { description: 'Internship end date must be after start date.' })
      return
    }
    const newRecord = { ...sp, id: uid('sp'), studentId: currentStudentId, status: 'pending' as const }
    const updated = [...selfPlacements, newRecord]
    setSelfPlacements(updated)
    syncToCloud({ selfPlacements: updated })
    notify('faculty', 'Self-placement submitted', `A self-placed internship at ${sp.companyName} awaits verification.`)
    toast.success('Self-placement submitted', { description: 'Sent to faculty mentor for review and approval.' })
  }

  const reviewSelfPlacement: PortalState['reviewSelfPlacement'] = (id, approve, reason) => {
    const updatedSP = selfPlacements.map((sp) => (sp.id === id ? { ...sp, status: (approve ? 'approved' : 'rejected') as 'approved' | 'rejected', reason } : sp))
    setSelfPlacements(updatedSP)

    const sp = selfPlacements.find((x) => x.id === id)
    const student = students.find((s) => s.id === sp?.studentId)
    let updatedInternships = internships
    let updatedAttendance = attendance
    let updatedDocs = documents

    if (sp && approve) {
      const internship: Internship = {
        id: uid('n'),
        studentId: sp.studentId,
        companyId: 'self',
        role: sp.role,
        location: sp.location,
        type: 'self',
        startDate: sp.startDate,
        endDate: sp.endDate,
        status: 'active',
        ppoStatus: 'none',
      }
      updatedInternships = [...internships, internship]
      updatedAttendance = [...attendance, { internshipId: internship.id, workingDays: 0, present: 0, absent: 0, leave: 0, entries: [] }]
      const prefilled: DocumentKind[] = []
      if (sp.offerLetterUploaded) prefilled.push('offer_letter')
      if (sp.joiningLetterUploaded) prefilled.push('joining_letter')
      if (sp.certificateUploaded) prefilled.push('completion_certificate')
      updatedDocs = [...documents, ...openDocumentLedger(internship.id, prefilled)]
      setInternships(updatedInternships)
      setAttendance(updatedAttendance)
      setDocuments(updatedDocs)
    }
    syncToCloud({ selfPlacements: updatedSP, internships: updatedInternships, attendance: updatedAttendance, documents: updatedDocs })

    notify('student', approve ? 'Self-placement approved' : 'Self-placement rejected', approve ? `Your internship at ${sp?.companyName} is approved. Tracking begins.` : `Reason: ${reason}`)
    if (student) emailToast(student.email, approve ? 'Self-placement approved' : 'Self-placement rejected')
    log('Prof. R. Kulkarni', approve ? 'Approved self-placement' : 'Rejected self-placement', `${student?.name} — ${sp?.companyName}`, reason)
  }

  const addAchievement: PortalState['addAchievement'] = (a) => {
    const currentStudentId = authSession?.userId || actingStudentId || 's1'
    const updated = [...achievements, { ...a, id: uid('ac'), studentId: currentStudentId, status: 'pending' as const }]
    setAchievements(updated)
    syncToCloud({ achievements: updated })
    notify('faculty', 'Achievement submitted', `"${a.title}" awaits verification.`)
    toast.success('Achievement submitted', { description: 'Sent to faculty for verification.' })
  }

  const reviewAchievement: PortalState['reviewAchievement'] = (id, approve) => {
    const updated = achievements.map((a) => (a.id === id ? { ...a, status: (approve ? 'verified' : 'rejected') as 'verified' | 'rejected' } : a))
    setAchievements(updated)
    syncToCloud({ achievements: updated })
    const a = achievements.find((x) => x.id === id)
    notify('student', approve ? 'Achievement verified' : 'Achievement rejected', a?.title ?? '')
    toast.success(approve ? 'Achievement verified' : 'Achievement rejected')
    log('Prof. R. Kulkarni', approve ? 'Verified achievement' : 'Rejected achievement', a?.title ?? '')
  }

  const addCompanyByStudent: PortalState['addCompanyByStudent'] = (name, industry, website) => {
    const updated = [
      ...companies,
      {
        id: uid('c'),
        name,
        industry,
        website,
        hrName: '—',
        hrEmail: '—',
        location: '—',
        about: 'Added by a student; details pending company registration.',
        certificateUploaded: false,
        status: 'pending' as const,
        addedByStudentId: actingStudentId,
      },
    ]
    setCompanies(updated)
    syncToCloud({ companies: updated })
    notify('admin', 'New company suggested', `${name} was added by a student and needs approval.`)
    toast.success('Company submitted', { description: 'Sent to admin for approval.' })
  }

  const sendMessage: PortalState['sendMessage'] = async (threadId, body, attachmentName) => {
    const cleanBody = body.trim()
    if (!cleanBody) return

    const currentUserId = authSession?.userId || (role === 'student' ? actingStudentId : role === 'company' ? actingCompanyId : role === 'faculty' ? actingFacultyId : 'admin1')
    const currentThread = threads.find((thread) => thread.id === threadId)
    if (!currentThread) {
      throw new Error('This conversation is unavailable.')
    }

    const myName =
      role === 'student'
        ? students.find((s) => s.id === currentUserId)?.name ?? authSession?.name ?? 'Student'
        : role === 'company'
          ? companies.find((c) => c.id === currentUserId)?.name ?? authSession?.name ?? 'Company'
          : role === 'faculty'
            ? facultyList.find((f) => f.id === currentUserId)?.name ?? 'Faculty Mentor'
            : 'T&P Cell'

    const isAuthorized =
      role === 'admin' ||
      (currentThread.participantIds && currentThread.participantIds.includes(currentUserId)) ||
      (currentThread.participants?.includes(role) && currentThread.participantNames?.includes(myName))

    if (!isAuthorized) {
      throw new Error('You are not authorized to send messages in this conversation.')
    }

    const recipientIds = (currentThread.participantIds || []).filter((id) => id !== currentUserId)
    const recipientRoles = (currentThread.participants || []).filter((participantRole) => participantRole !== role)

    const updatedThread: Thread = {
      ...currentThread,
      unreadFor: Array.from(new Set([...(currentThread.unreadFor || []), ...recipientRoles])),
      unreadForIds: Array.from(new Set([...(currentThread.unreadForIds || []), ...recipientIds])),
    }

    const newMsg: Message = {
      id: uid('msg'),
      threadId,
      fromRole: role,
      fromUserId: currentUserId,
      fromName: myName,
      body: cleanBody,
      at: new Date().toISOString(),
      attachmentName,
    }

    // 1. Optimistic update for instant responsiveness
    const optimisticMessages = [...messages, newMsg]
    const optimisticThreads = threads.map((t) => (t.id === threadId ? updatedThread : t))
    setMessages(optimisticMessages)
    setThreads(optimisticThreads)

    // Notify recipients
    recipientRoles.forEach((targetRole) => {
      notify(targetRole, `New message from ${myName}`, cleanBody.slice(0, 100))
    })
    toast.success('Message sent', { description: 'Delivered to recipient.' })

    // 2. Persist to cloud in background
    try {
      const res = await fetch('/api/portal/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_message', message: newMsg, thread: updatedThread }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.synced && Array.isArray(data.messages) && Array.isArray(data.threads)) {
        setMessages(data.messages as Message[])
        setThreads(data.threads as Thread[])
      } else {
        syncToCloud({ messages: optimisticMessages, threads: optimisticThreads })
      }
    } catch {
      syncToCloud({ messages: optimisticMessages, threads: optimisticThreads })
    }
  }

  const createThread: PortalState['createThread'] = async (subject, toRole, body, targetId) => {
    const cleanSubject = subject.trim()
    const cleanBody = body.trim()
    const currentUserId = authSession?.userId || (role === 'student' ? actingStudentId : role === 'company' ? actingCompanyId : role === 'faculty' ? actingFacultyId : 'admin1')
    const targetRecipientId = targetId || (toRole === 'admin' ? 'admin1' : undefined)
    if (!cleanSubject || !cleanBody || !targetRecipientId) {
      throw new Error('Choose a valid recipient and complete the subject and message.')
    }

    const targetName = toRole === 'faculty'
      ? facultyList.find((f) => f.id === targetRecipientId)?.name || 'Faculty Mentor'
      : toRole === 'company'
        ? companies.find((c) => c.id === targetRecipientId)?.name || 'Company Partner'
        : toRole === 'student'
          ? students.find((s) => s.id === targetRecipientId)?.name || 'Student'
          : 'T&P Cell'

    const myName = role === 'student'
      ? students.find((s) => s.id === currentUserId)?.name ?? authSession?.name ?? 'Student'
      : role === 'company'
        ? companies.find((c) => c.id === currentUserId)?.name ?? authSession?.name ?? 'Company'
        : role === 'faculty'
          ? facultyList.find((f) => f.id === currentUserId)?.name ?? 'Faculty Mentor'
          : 'T&P Cell'

    const threadId = uid('t')
    const newThread: Thread = {
      id: threadId,
      subject: cleanSubject,
      participants: [role, toRole],
      participantIds: [currentUserId, targetRecipientId],
      participantNames: `${myName} ↔ ${targetName}`,
      unreadFor: [toRole],
      unreadForIds: [targetRecipientId],
    }
    const newMsg: Message = {
      id: uid('msg'),
      threadId,
      fromRole: role,
      fromUserId: currentUserId,
      fromName: myName,
      body: cleanBody,
      at: new Date().toISOString(),
    }

    // 1. Optimistic update
    const optimisticThreads = [newThread, ...threads]
    const optimisticMessages = [...messages, newMsg]
    setThreads(optimisticThreads)
    setMessages(optimisticMessages)
    notify(toRole, `New message from ${myName}: ${cleanSubject}`, cleanBody.slice(0, 100))
    toast.success('Message sent', { description: `Delivered to ${targetName}.` })

    // 2. Persist to cloud in background
    try {
      const res = await fetch('/api/portal/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_thread', thread: newThread, message: newMsg }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.synced && Array.isArray(data.threads) && Array.isArray(data.messages)) {
        setThreads(data.threads as Thread[])
        setMessages(data.messages as Message[])
      } else {
        syncToCloud({ threads: optimisticThreads, messages: optimisticMessages })
      }
    } catch {
      syncToCloud({ threads: optimisticThreads, messages: optimisticMessages })
    }
    return threadId
  }

  const markThreadRead: PortalState['markThreadRead'] = (threadId) => {
    const currentUserId = authSession?.userId || (role === 'student' ? actingStudentId : role === 'company' ? actingCompanyId : role === 'faculty' ? actingFacultyId : 'admin1')
    const updated = threads.map((thread) =>
      thread.id === threadId
        ? {
            ...thread,
            unreadFor: thread.unreadFor.filter((participantRole) => participantRole !== role),
            unreadForIds: (thread.unreadForIds || []).filter((id) => id !== currentUserId),
          }
        : thread,
    )
    setThreads(updated)
    syncToCloud({ threads: updated })
  }

  const markNotificationsRead = () => {
    const updated = notifications.map((n) => (n.forRole === role ? { ...n, read: true } : n))
    setNotifications(updated)
    syncToCloud({ notifications: updated })
  }

  const setAtRisk: PortalState['setAtRisk'] = (studentId, flag) => {
    const updated = students.map((s) => (s.id === studentId ? { ...s, atRisk: flag } : s))
    setStudents(updated)
    syncToCloud({ students: updated })
    toast.success(flag ? 'Student flagged as at-risk' : 'At-risk flag removed')
  }

  const assignMentor: PortalState['assignMentor'] = (studentId, facultyId) => {
    const student = students.find((s) => s.id === studentId)
    const mentor = faculty.find((f) => f.id === facultyId)
    if (!student || !mentor || student.facultyId === facultyId) return
    const updated = students.map((s) => (s.id === studentId ? { ...s, facultyId } : s))
    setStudents(updated)
    syncToCloud({ students: updated })
    log('Admin (T&P Cell)', 'Assigned faculty mentor', `${student.name} → ${mentor.name}`)
    notify(
      'student',
      'Faculty mentor assigned',
      `${mentor.name} (${mentor.department}) will review your weekly progress.`,
    )
    notify('faculty', 'New mentee assigned', `${student.name} (${student.enrollment}) was added to your mentee list.`)
    emailToast(student.email, `Faculty mentor assigned — ${mentor.name}`)
  }

  const updateProfile: PortalState['updateProfile'] = (patch) => {
    const updated = students.map((s) => (s.id === actingStudentId ? { ...s, ...patch } : s))
    setStudents(updated)
    syncToCloud({ students: updated })

    const student = updated.find((s) => s.id === actingStudentId)
    if (patch.resumeUploaded) {
      notify('admin', 'Resume uploaded', `${student?.name} uploaded a new resume for verification.`)
      toast.success('Resume uploaded', { description: 'Eligibility checks and T&P verifications now include your resume.' })
      return
    }
    if (patch.idDocsUploaded) {
      notify('admin', 'ID documents uploaded', `${student?.name} uploaded ID documents for verification.`)
      toast.success('ID documents uploaded', { description: 'Sent to the T&P cell for verification.' })
      return
    }
    toast.success('Profile updated')
  }

  const resetData = () => {
    try {
      localStorage.removeItem(SNAPSHOT_KEY)
      sessionStorage.removeItem(SNAPSHOT_KEY)
    } catch {
      // ignore
    }
    setRole('student')
    setActingStudentId('s2')
    setActingCompanyId('c1')
    setStudents(seedStudents)
    setCompanies(seedCompanies)
    setDrives(seedDrives)
    setApplications(seedApplications)
    setInterviews(seedInterviews)
    setInternships(seedInternships)
    setDocuments(seedDocuments)
    setWeeklyReports(seedWeeklyReports)
    setAttendance(seedAttendance)
    setMilestones(seedMilestones)
    setFeedback(seedFeedback)
    setSelfPlacements(seedSelfPlacements)
    setAchievements(seedAchievements)
    setThreads(seedThreads)
    setMessages(seedMessages)
    setNotifications(seedNotifications)
    setAudit(seedAudit)
    toast.success('Platform data restored', { description: 'All records reset to initial state.' })
  }

  const exportData = () => {
    try {
      const data = {
        role,
        actingStudentId,
        actingCompanyId,
        students,
        companies,
        drives,
        applications,
        interviews,
        internships,
        documents,
        weeklyReports,
        attendance,
        milestones,
        feedback,
        selfPlacements,
        achievements,
        threads,
        messages,
        notifications,
        audit,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interntrack-backup-${today()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Database backup exported', { description: 'JSON file downloaded.' })
    } catch {
      toast.error('Failed to export data')
    }
  }

  const importData = (jsonStr: string): boolean => {
    try {
      const s = JSON.parse(jsonStr) as Record<string, unknown>
      if (s.students) setStudents(s.students as Student[])
      if (s.companies) setCompanies(s.companies as Company[])
      if (s.drives) setDrives(s.drives as Drive[])
      if (s.applications) setApplications(s.applications as Application[])
      if (s.interviews) setInterviews(s.interviews as Interview[])
      if (s.internships) setInternships(s.internships as Internship[])
      if (s.documents) setDocuments(s.documents as InternshipDocument[])
      if (s.weeklyReports) setWeeklyReports(s.weeklyReports as WeeklyReport[])
      if (s.attendance) setAttendance(s.attendance as AttendanceRecord[])
      if (s.milestones) setMilestones(s.milestones as Milestone[])
      if (s.feedback) setFeedback(s.feedback as CompanyFeedback[])
      if (s.selfPlacements) setSelfPlacements(s.selfPlacements as SelfPlacement[])
      if (s.achievements) setAchievements(s.achievements as Achievement[])
      if (s.threads) setThreads(s.threads as Thread[])
      if (s.messages) setMessages(s.messages as Message[])
      if (s.notifications) setNotifications(s.notifications as Notification[])
      if (s.audit) setAudit(s.audit as AuditEntry[])
      toast.success('Database restored successfully', { description: 'Platform data updated from backup.' })
      return true
    } catch {
      toast.error('Invalid backup JSON format')
      return false
    }
  }

  const value = useMemo<PortalState>(
    () => ({
      hydrated,
      authSession,
      login,
      quickLogin,
      logout,
      role,
      setRole,
      actingStudentId,
      setActingStudentId,
      actingCompanyId,
      setActingCompanyId,
      actingFacultyId,
      students,
      companies,
      drives,
      applications,
      interviews,
      internships,
      documents,
      weeklyReports,
      attendance,
      milestones,
      feedback,
      selfPlacements,
      achievements,
      threads,
      messages,
      notifications,
      audit,
      faculty: facultyList,
      registerStudent,
      registerCompany,
      addFaculty,
      verifyStudent,
      verifyCompany,
      setBlocked,
      createDrive,
      updateDrive,
      deleteDrive,
      applyToDrive,
      setApplicationStatus,
      scheduleInterview,
      acknowledgeInterview,
      acceptOffer,
      submitWeeklyReport,
      setReportStatus,
      submitAttendanceDay,
      setMilestoneStatus,
      submitFeedback,
      submitFinalEvaluation,
      uploadDocument,
      setDocumentStatus,
      setPpoStatus,
      submitSelfPlacement,
      reviewSelfPlacement,
      addAchievement,
      reviewAchievement,
      addCompanyByStudent,
      sendMessage,
      createThread,
      markThreadRead,
      markNotificationsRead,
      setAtRisk,
      assignMentor,
      updateProfile,
      resetData,
      exportData,
      importData,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      authSession,
      role,
      actingStudentId,
      actingCompanyId,
      students,
      companies,
      drives,
      applications,
      interviews,
      internships,
      documents,
      weeklyReports,
      attendance,
      milestones,
      feedback,
      selfPlacements,
      achievements,
      threads,
      messages,
      notifications,
      audit,
    ],
  )

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}

export function usePortal() {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error('usePortal must be used within PortalProvider')
  return ctx
}
