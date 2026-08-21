export type Role = 'student' | 'company' | 'faculty' | 'admin'

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'blocked'

export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected'

export interface AuthSession {
  userId: string
  name: string
  email: string
  role: Role
  token: string
  signedInAt: string
}

export interface Student {
  id: string
  name: string
  email: string
  password?: string
  enrollment: string
  branch: string
  cgpa: number
  backlogs: number
  passingYear: number
  skills: string[]
  certifications: string[]
  locationPreference: 'local' | 'outstation' | 'any'
  resumeUploaded: boolean
  resumeName?: string
  resumeData?: string
  idDocsUploaded: boolean
  idDocsName?: string
  idDocsData?: string
  status: VerificationStatus
  blockReason?: string
  facultyId: string
  atRisk?: boolean
  phone?: string
}

export interface Faculty {
  id: string
  name: string
  email: string
  password?: string
  department: string
  designation?: string
  phone?: string
}

export interface Company {
  id: string
  name: string
  email?: string
  password?: string
  industry: string
  website: string
  hrName: string
  hrEmail: string
  location: string
  about: string
  certificateUploaded: boolean
  certificateName?: string
  certificateData?: string
  status: VerificationStatus
  blockReason?: string
  addedByStudentId?: string
}

export interface Drive {
  id: string
  companyId: string
  title: string
  description: string
  skills: string[]
  field: string
  location: string
  workMode: 'remote' | 'hybrid' | 'onsite'
  stipend: number
  durationWeeks: number
  openings: number
  minCgpa: number
  maxBacklogs: number
  passingYears: number[]
  requiredSkills: string[]
  requiredCertifications: string[]
  locationFilter: 'local' | 'outstation' | 'any'
  fieldFilter: string
  anyoneCanApply: boolean
  openDate: string
  deadline: string
  startDate: string
  endDate: string
  status: 'open' | 'closed'
}

export interface Application {
  id: string
  driveId: string
  studentId: string
  status: ApplicationStatus
  appliedAt: string
  rejectReason?: string
  history: { status: ApplicationStatus; at: string }[]
}

export interface Interview {
  id: string
  applicationId: string
  date: string
  time: string
  mode: 'online' | 'in_person'
  linkOrVenue: string
  panel: string
  instructions: string
  acknowledged: boolean
}

export interface WeeklyReport {
  id: string
  internshipId: string
  week: number
  workDone: string
  skillsLearned: string
  hours: number
  evidenceName?: string
  evidenceUrl?: string
  evidenceData?: string
  status: 'submitted' | 'company_approved' | 'faculty_reviewed' | 'flagged'
}

export interface AttendanceDayEntry {
  date: string
  status: 'present' | 'absent' | 'leave'
}

export interface AttendanceRecord {
  internshipId: string
  workingDays: number
  present: number
  absent: number
  leave: number
  lastMarkedDate?: string
  entries?: AttendanceDayEntry[]
}

export interface Milestone {
  id: string
  internshipId: string
  title: string
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed'
  companyRemark?: string
  facultyRemark?: string
}

export interface CompanyFeedback {
  id: string
  internshipId: string
  week: number
  attendance: number
  workQuality: number
  communication: number
  technical: number
  comments: string
}

export type DocumentKind =
  | 'offer_letter'
  | 'joining_letter'
  | 'acceptance'
  | 'completion_certificate'
  | 'ppo_letter'
  | 'resume'
  | 'identity_document'

export type DocumentStatus = 'not_uploaded' | 'uploaded' | 'verified' | 'rejected'

export interface InternshipDocument {
  id: string
  internshipId: string
  studentId?: string
  studentName?: string
  kind: DocumentKind
  fileName?: string
  fileData?: string
  fileUrl?: string
  fileSize?: number
  uploadedBy?: 'student' | 'company'
  uploadedAt?: string
  status: DocumentStatus
  /** Short code embedded in the QR badge so a document can be verified from outside the portal. */
  verifyCode?: string
  rejectReason?: string
}

export type PpoStatus = 'none' | 'recommended' | 'offered' | 'accepted' | 'declined'

export interface Internship {
  id: string
  studentId: string
  companyId: string
  driveId?: string
  role: string
  /**
   * Where the internship is physically served. Stored on the internship because
   * past drives get closed and self-placements have no drive at all — analytics
   * must still be able to report a location.
   */
  location?: string
  type: 'college' | 'self'
  startDate: string
  endDate: string
  status: 'active' | 'completed'
  finalEvaluation?: string
  ppoStatus: PpoStatus
  ppoPackage?: number
  ppoNote?: string
}

export interface SelfPlacement {
  id: string
  studentId: string
  companyName: string
  role: string
  /** City the student will physically intern in — feeds the T&P location report. */
  location: string
  startDate: string
  endDate: string
  stipend: number
  offerLetterUploaded: boolean
  joiningLetterUploaded: boolean
  certificateUploaded: boolean
  nocUploaded: boolean
  offerLetterUrl?: string
  offerLetterData?: string
  offerLetterName?: string
  joiningLetterUrl?: string
  joiningLetterData?: string
  joiningLetterName?: string
  nocUrl?: string
  nocData?: string
  nocName?: string
  certificateUrl?: string
  certificateData?: string
  certificateName?: string
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
}

export interface Achievement {
  id: string
  studentId: string
  type: 'paper' | 'conference' | 'hackathon' | 'certification'
  title: string
  date: string
  evidenceName: string
  evidenceUrl?: string
  evidenceData?: string
  status: 'pending' | 'verified' | 'rejected'
}

export interface Message {
  id: string
  threadId: string
  fromRole: Role
  fromName: string
  fromUserId?: string
  body: string
  at: string
  system?: boolean
  attachmentName?: string
}

export interface Thread {
  id: string
  subject: string
  participants: Role[]
  participantIds?: string[]
  participantNames: string
  unreadFor: Role[]
  unreadForIds?: string[]
}

export interface Notification {
  id: string
  forRole: Role
  title: string
  body: string
  at: string
  read: boolean
}

export interface AuditEntry {
  id: string
  actor: string
  action: string
  target: string
  reason?: string
  at: string
}
