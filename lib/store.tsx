'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
import { supabase } from './supabase'

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
  login: (email: string, pass: string, targetRole?: Role) => { success: boolean; error?: string }
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
  registerStudent: (s: Omit<Student, 'id' | 'status' | 'facultyId'>) => void
  registerCompany: (c: Omit<Company, 'id' | 'status'>) => void
  addFaculty: (f: Omit<Faculty, 'id'>) => void
  verifyStudent: (id: string, approve: boolean, reason?: string) => void
  verifyCompany: (id: string, approve: boolean, reason?: string) => void
  setBlocked: (kind: 'student' | 'company', id: string, blocked: boolean, reason?: string) => void
  createDrive: (d: Omit<Drive, 'id' | 'companyId' | 'status'>) => void
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
  sendMessage: (threadId: string, body: string, attachmentName?: string) => void
  createThread: (subject: string, toRole: Role, body: string) => void
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

  const applyRemoteState = useCallback((s: Record<string, unknown>) => {
    if (s.students) setStudents(s.students as Student[])
    if (s.companies) setCompanies(s.companies as Company[])
    if (s.faculty) setFacultyList(s.faculty as Faculty[])
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
    if (typeof s.uid === 'number') uidCounter = Math.max(uidCounter, s.uid)
  }, [])

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

    // 2. Fetch latest shared state from Supabase Cloud
    const fetchCloud = async () => {
      try {
        const { data, error } = await supabase
          .from('portal_data')
          .select('state')
          .eq('id', 'main_v1')
          .single()

        if (!error && data?.state) {
          applyRemoteState(data.state as Record<string, unknown>)
        }
      } catch {
        // fallback seamlessly to local snapshot
      }
    }
    fetchCloud()

    // 3. Subscribe to Realtime cloud updates across devices
    const channel = supabase
      .channel('portal-sync-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portal_data', filter: 'id=eq.main_v1' },
        (payload) => {
          if (payload.new && (payload.new as { state?: Record<string, unknown> }).state) {
            applyRemoteState((payload.new as { state: Record<string, unknown> }).state)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [applyRemoteState])

  // 4. Save to localStorage + Sync to Supabase Cloud on any change
  useEffect(() => {
    if (!hydrated) return
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

    try {
      const localSnapshot = JSON.stringify({
        authSession,
        role,
        actingStudentId,
        actingCompanyId,
        ...snapshotObj,
      })
      localStorage.setItem(SNAPSHOT_KEY, localSnapshot)
      sessionStorage.setItem(SNAPSHOT_KEY, localSnapshot)
    } catch {
      // local storage unavailable
    }

    // Debounced upload to Supabase cloud
    const timer = setTimeout(async () => {
      try {
        await supabase.from('portal_data').upsert({
          id: 'main_v1',
          state: snapshotObj,
          updated_at: new Date().toISOString(),
        })
      } catch {
        // silent fallback if offline
      }
    }, 500)

    return () => clearTimeout(timer)
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

  const login: PortalState['login'] = (email, pass) => {
    const cleanEmail = email.trim().toLowerCase()
    // 1. Check Admin
    if (cleanEmail === 'admin@college.edu' || cleanEmail === 'tnp@college.edu') {
      if (pass !== 'admin123' && pass !== 'password123' && pass !== 'admin') {
        return { success: false, error: 'Invalid email or password. Please try again.' }
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
      toast.success('Signed in as Admin / T&P Cell')
      return { success: true }
    }

    // 2. Check Faculty
    const fMatch = facultyList.find((f) => f.email.toLowerCase() === cleanEmail)
    if (fMatch) {
      const expectedPass = fMatch.password || 'faculty123'
      if (pass !== expectedPass && pass !== 'faculty123' && pass !== 'password123') {
        return { success: false, error: 'Invalid email or password. Please try again.' }
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
      toast.success(`Signed in as ${fMatch.name}`)
      return { success: true }
    }

    // 3. Check Student
    const sMatch = students.find((s) => s.email.toLowerCase() === cleanEmail)
    if (sMatch) {
      const expectedPass = sMatch.password || 'password123'
      if (pass !== expectedPass && pass !== 'password123') {
        return { success: false, error: 'Invalid email or password. Please try again.' }
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
      toast.success(`Signed in as ${sMatch.name}`)
      return { success: true }
    }

    // 4. Check Company
    const cMatch = companies.find((c) => (c.email?.toLowerCase() === cleanEmail || c.hrEmail.toLowerCase() === cleanEmail))
    if (cMatch) {
      const expectedPass = cMatch.password || 'password123'
      if (pass !== expectedPass && pass !== 'password123') {
        return { success: false, error: 'Invalid email or password. Please try again.' }
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
      toast.success(`Signed in as ${cMatch.name}`)
      return { success: true }
    }

    return { success: false, error: 'No account registered with this email' }
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

  const registerStudent: PortalState['registerStudent'] = (s) => {
    const id = uid('s')
    setStudents((prev) => [...prev, { ...s, id, status: 'pending', facultyId: 'f1' }])
    notify('admin', 'New student registration', `${s.name} submitted documents for verification.`)
    emailToast(s.email, 'Registration received — pending verification')
  }

  const registerCompany: PortalState['registerCompany'] = (c) => {
    const id = uid('c')
    setCompanies((prev) => [...prev, { ...c, id, status: 'pending' }])
    notify('admin', 'New company registration', `${c.name} submitted registration for verification.`)
    emailToast(c.hrEmail, 'Registration received — pending admin approval')
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
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: approve ? 'approved' : 'rejected', blockReason: approve ? undefined : reason }
          : s,
      ),
    )
    const s = students.find((x) => x.id === id)
    if (s) {
      log('Admin (T&P Cell)', approve ? 'Approved student' : 'Rejected student', `${s.name} (${s.enrollment})`, reason)
      notify('student', approve ? 'Account approved' : 'Verification rejected', approve ? 'Your documents were verified. You can now apply to drives.' : `Reason: ${reason}`)
      emailToast(s.email, approve ? 'Your account has been approved' : 'Verification rejected')
    }
  }

  const verifyCompany: PortalState['verifyCompany'] = (id, approve, reason) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: approve ? 'approved' : 'rejected', blockReason: approve ? undefined : reason }
          : c,
      ),
    )
    const c = companies.find((x) => x.id === id)
    if (c) {
      log('Admin (T&P Cell)', approve ? 'Approved company' : 'Rejected company', c.name, reason)
      notify('company', approve ? 'Company approved' : 'Registration rejected', approve ? 'You can now create internship drives.' : `Reason: ${reason}`)
      emailToast(c.hrEmail, approve ? 'Your company has been approved' : 'Registration rejected')
    }
  }

  const setBlocked: PortalState['setBlocked'] = (kind, id, blocked, reason) => {
    if (kind === 'student') {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: blocked ? 'blocked' : 'approved', blockReason: blocked ? reason : undefined } : s,
        ),
      )
      const s = students.find((x) => x.id === id)
      if (s) {
        log('Admin (T&P Cell)', blocked ? 'Blocked student' : 'Unblocked student', s.name, reason)
        emailToast(s.email, blocked ? `Account blocked: ${reason}` : 'Account unblocked')
      }
    } else {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: blocked ? 'blocked' : 'approved', blockReason: blocked ? reason : undefined } : c,
        ),
      )
      const c = companies.find((x) => x.id === id)
      if (c) {
        log('Admin (T&P Cell)', blocked ? 'Blocked company' : 'Unblocked company', c.name, reason)
        emailToast(c.hrEmail, blocked ? `Account blocked: ${reason}` : 'Account unblocked')
      }
    }
  }

  const createDrive: PortalState['createDrive'] = (d) => {
    setDrives((prev) => [{ ...d, id: uid('d'), companyId: actingCompanyId, status: 'open' }, ...prev])
    const c = companies.find((x) => x.id === actingCompanyId)
    notify('admin', 'New drive published', `${c?.name} published "${d.title}".`)
    notify('student', 'New internship drive', `${c?.name} is hiring: ${d.title}.`)
    toast.success('Drive published', { description: 'Students matching the filters have been notified.' })
    log(c?.name ?? 'Company', 'Published drive', d.title)
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
    setApplications((prev) => [...prev, app])
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

    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, status, rejectReason: reason, history: [...a.history, { status, at: today() }] }
          : a,
      ),
    )

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
    setInterviews((prev) => [...prev, { ...details, id: uid('i'), applicationId: appId, acknowledged: false }])
    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, status: 'interview_scheduled', history: [...a.history, { status: 'interview_scheduled', at: today() }] }
          : a,
      ),
    )
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
    setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, acknowledged: true } : i)))
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
    setInternships((prev) => [...prev, internship])
    setAttendance((prev) => [
      ...prev,
      {
        internshipId: internship.id,
        workingDays: 0,
        present: 0,
        absent: 0,
        leave: 0,
        entries: [],
      },
    ])
    setDocuments((prev) => [
      ...prev,
      ...openDocumentLedger(internship.id, ['offer_letter', 'acceptance']),
    ])
    const student = students.find((s) => s.id === app.studentId)
    notify('company', 'Offer accepted', `${student?.name} accepted the offer for ${drive.title}. Tracking begins.`)
    notify('admin', 'Internship started', `${student?.name} — ${drive.title}.`)
    toast.success('Offer accepted', { description: 'Internship tracking has begun.' })
    log(student?.name ?? 'Student', 'Accepted offer', drive.title)
  }

  const submitWeeklyReport: PortalState['submitWeeklyReport'] = (r) => {
    setWeeklyReports((prev) => [...prev, { ...r, id: uid('w'), status: 'submitted' }])
    notify('company', 'Weekly report submitted', `Week ${r.week} report awaiting supervisor verification.`)
    notify('faculty', 'Weekly report submitted', `Week ${r.week} report submitted by your mentee.`)
    toast.success(`Week ${r.week} report submitted`, { description: 'Sent to company supervisor for verification.' })
  }

  const setReportStatus: PortalState['setReportStatus'] = (id, status) => {
    setWeeklyReports((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)))
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
    setAttendance((prev) =>
      prev.map((a) => {
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
      }),
    )
  }

  const setMilestoneStatus: PortalState['setMilestoneStatus'] = (id, status, remark) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status, companyRemark: remark ?? m.companyRemark } : m)),
    )
    toast.success('Milestone updated')
  }

  const submitFeedback: PortalState['submitFeedback'] = (f) => {
    setFeedback((prev) => [...prev, { ...f, id: uid('fb') }])
    notify('faculty', 'Company feedback submitted', `Week ${f.week} intern feedback recorded.`)
    notify('admin', 'Company feedback submitted', `Week ${f.week} intern feedback recorded.`)
    toast.success(`Week ${f.week} feedback submitted`)
  }

  const submitFinalEvaluation: PortalState['submitFinalEvaluation'] = (internshipId, text) => {
    setInternships((prev) =>
      prev.map((n) => (n.id === internshipId ? { ...n, finalEvaluation: text, status: 'completed' } : n)),
    )
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
  ) => {
    setDocuments((prev) => {
      const existing = prev.find((d) => d.internshipId === internshipId && d.kind === kind)
      const next: Partial<InternshipDocument> = {
        fileName,
        fileData: fileData ?? existing?.fileData,
        fileSize: fileSize ?? existing?.fileSize,
        uploadedBy: role === 'company' ? 'company' : 'student',
        uploadedAt: today(),
        status: 'uploaded',
        verifyCode: existing?.verifyCode ?? verifyCode(internshipId, kind),
        rejectReason: undefined,
      }
      if (existing) {
        return prev.map((d) => (d.id === existing.id ? { ...d, ...next } : d))
      }
      return [...prev, { id: uid('doc'), internshipId, kind, ...next } as InternshipDocument]
    })
    notify('admin', 'Document uploaded', `${docLabels[kind]} uploaded and awaiting T&P verification.`)
    toast.success(`${docLabels[kind]} uploaded`, {
      description: 'Document saved and sent to T&P cell for verification.',
    })
  }

  const setDocumentStatus: PortalState['setDocumentStatus'] = (id, status, reason) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, rejectReason: status === 'rejected' ? reason : undefined } : d)),
    )
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
    setInternships((prev) =>
      prev.map((n) =>
        n.id === internshipId
          ? { ...n, ppoStatus: status, ppoPackage: opts?.ppoPackage ?? n.ppoPackage, ppoNote: opts?.note ?? n.ppoNote }
          : n,
      ),
    )
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
    if (new Date(sp.endDate) <= new Date(sp.startDate)) {
      toast.error('Invalid Date Range', { description: 'Internship end date must be after start date.' })
      return
    }
    setSelfPlacements((prev) => [...prev, { ...sp, id: uid('sp'), studentId: actingStudentId, status: 'pending' }])
    notify('faculty', 'Self-placement submitted', `A self-placed internship at ${sp.companyName} awaits verification.`)
    toast.success('Self-placement submitted', { description: 'Sent to faculty for verification.' })
  }

  const reviewSelfPlacement: PortalState['reviewSelfPlacement'] = (id, approve, reason) => {
    setSelfPlacements((prev) =>
      prev.map((sp) => (sp.id === id ? { ...sp, status: approve ? 'approved' : 'rejected', reason } : sp)),
    )
    const sp = selfPlacements.find((x) => x.id === id)
    const student = students.find((s) => s.id === sp?.studentId)
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
      setInternships((prev) => [...prev, internship])
      setAttendance((prev) => [...prev, { internshipId: internship.id, workingDays: 0, present: 0, absent: 0, leave: 0 }])
      // Carry across whichever documents the student already attached to the request.
      const prefilled: DocumentKind[] = []
      if (sp.offerLetterUploaded) prefilled.push('offer_letter')
      if (sp.joiningLetterUploaded) prefilled.push('joining_letter')
      if (sp.certificateUploaded) prefilled.push('completion_certificate')
      setDocuments((prev) => [...prev, ...openDocumentLedger(internship.id, prefilled)])
    }
    notify('student', approve ? 'Self-placement approved' : 'Self-placement rejected', approve ? `Your internship at ${sp?.companyName} is approved. Tracking begins.` : `Reason: ${reason}`)
    if (student) emailToast(student.email, approve ? 'Self-placement approved' : 'Self-placement rejected')
    log('Prof. R. Kulkarni', approve ? 'Approved self-placement' : 'Rejected self-placement', `${student?.name} — ${sp?.companyName}`, reason)
  }

  const addAchievement: PortalState['addAchievement'] = (a) => {
    setAchievements((prev) => [...prev, { ...a, id: uid('ac'), studentId: actingStudentId, status: 'pending' }])
    notify('faculty', 'Achievement submitted', `"${a.title}" awaits verification.`)
    toast.success('Achievement submitted', { description: 'Sent to faculty for verification.' })
  }

  const reviewAchievement: PortalState['reviewAchievement'] = (id, approve) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: approve ? 'verified' : 'rejected' } : a)),
    )
    const a = achievements.find((x) => x.id === id)
    notify('student', approve ? 'Achievement verified' : 'Achievement rejected', a?.title ?? '')
    toast.success(approve ? 'Achievement verified' : 'Achievement rejected')
    log('Prof. R. Kulkarni', approve ? 'Verified achievement' : 'Rejected achievement', a?.title ?? '')
  }

  const addCompanyByStudent: PortalState['addCompanyByStudent'] = (name, industry, website) => {
    setCompanies((prev) => [
      ...prev,
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
        status: 'pending',
        addedByStudentId: actingStudentId,
      },
    ])
    notify('admin', 'New company suggested', `${name} was added by a student and needs approval.`)
    toast.success('Company submitted', { description: 'Sent to admin for approval.' })
  }

  const sendMessage: PortalState['sendMessage'] = (threadId, body, attachmentName) => {
    const currentUserId = authSession?.userId || (role === 'student' ? actingStudentId : role === 'company' ? actingCompanyId : role === 'faculty' ? actingFacultyId : 'admin1')
    const names: Record<Role, string> = {
      student: students.find((s) => s.id === currentUserId)?.name ?? authSession?.name ?? 'Student',
      company: companies.find((c) => c.id === currentUserId)?.name ?? authSession?.name ?? 'Company',
      faculty: facultyList.find((f) => f.id === currentUserId)?.name ?? 'Prof. R. Kulkarni',
      admin: 'T&P Cell',
    }
    setMessages((prev) => [
      ...prev,
      { id: uid('msg'), threadId, fromRole: role, fromUserId: currentUserId, fromName: names[role], body, at: today(), attachmentName },
    ])
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, unreadFor: t.participants.filter((p) => p !== role) }
          : t,
      ),
    )
    toast.success('Message sent', { description: 'Notification delivered to the recipient.' })
  }

  const createThread: PortalState['createThread'] = (subject, toRole, body, targetId) => {
    const currentUserId = authSession?.userId || (role === 'student' ? actingStudentId : role === 'company' ? actingCompanyId : role === 'faculty' ? actingFacultyId : 'admin1')
    const targetRecipientId = targetId || (toRole === 'admin' ? 'admin1' : toRole === 'faculty' ? actingFacultyId : undefined)
    
    let targetName = 'T&P Cell'
    if (toRole === 'faculty') {
      targetName = facultyList.find((f) => f.id === targetRecipientId)?.name ?? 'Faculty Mentor'
    } else if (toRole === 'company') {
      targetName = companies.find((c) => c.id === targetRecipientId)?.name ?? 'Hiring Partner'
    } else if (toRole === 'student') {
      targetName = students.find((s) => s.id === targetRecipientId)?.name ?? 'Student'
    }

    const myName =
      role === 'student'
        ? students.find((s) => s.id === currentUserId)?.name ?? authSession?.name ?? 'Student'
        : role === 'company'
          ? companies.find((c) => c.id === currentUserId)?.name ?? authSession?.name ?? 'Company'
          : role === 'faculty'
            ? facultyList.find((f) => f.id === currentUserId)?.name ?? 'Faculty Mentor'
            : 'T&P Cell'

    const threadId = uid('t')
    const participantIds = [currentUserId]
    if (targetRecipientId) participantIds.push(targetRecipientId)

    setThreads((prev) => [
      {
        id: threadId,
        subject,
        participants: [role, toRole],
        participantIds,
        participantNames: `${myName} ↔ ${targetName}`,
        unreadFor: [toRole],
      },
      ...prev,
    ])
    setMessages((prev) => [
      ...prev,
      { id: uid('msg'), threadId, fromRole: role, fromUserId: currentUserId, fromName: myName, body, at: today() },
    ])
    toast.success('Message sent', { description: `Notification delivered to ${targetName}.` })
  }

  const markThreadRead: PortalState['markThreadRead'] = (threadId) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unreadFor: t.unreadFor.filter((r) => r !== role) } : t)),
    )
  }

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => (n.forRole === role ? { ...n, read: true } : n)))
  }

  const setAtRisk: PortalState['setAtRisk'] = (studentId, flag) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, atRisk: flag } : s)))
    toast.success(flag ? 'Student flagged as at-risk' : 'At-risk flag removed')
  }

  const assignMentor: PortalState['assignMentor'] = (studentId, facultyId) => {
    const student = students.find((s) => s.id === studentId)
    const mentor = faculty.find((f) => f.id === facultyId)
    if (!student || !mentor || student.facultyId === facultyId) return
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, facultyId } : s)),
    )
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
    setStudents((prev) => prev.map((s) => (s.id === actingStudentId ? { ...s, ...patch } : s)))
    const student = students.find((s) => s.id === actingStudentId)
    if (patch.resumeUploaded) {
      notify('admin', 'Resume uploaded', `${student?.name} uploaded a new resume for verification.`)
      toast.success('Resume uploaded', { description: 'Eligibility checks now include your resume.' })
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
