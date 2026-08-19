import type { Drive, Student } from './types'

/** One row in the criteria table shown on a drive page — every rule is always displayed, pass or fail. */
export interface CriterionResult {
  label: string
  required: string
  yours: string
  pass: boolean
  /** Blocking rules make the student ineligible; non-blocking ones are advisory only. */
  blocking: boolean
  /** Set when the rule fails — this is the human-readable reason the spec asks for. */
  reason?: string
}

export type Eligibility =
  | { state: 'eligible'; criteria: CriterionResult[] }
  | { state: 'not_eligible'; reason: string; reasons: string[]; criteria: CriterionResult[] }
  | { state: 'missing_info'; reason: string; reasons: string[]; criteria: CriterionResult[] }

const list = (xs: string[]) => (xs.length ? xs.join(', ') : 'None')

/**
 * Evaluates every company-specified criterion and always explains itself.
 * Gate order: account state, then profile completeness, then the drive window,
 * then the academic and skill criteria.
 */
export function checkEligibility(student: Student, drive: Drive): Eligibility {
  const criteria: CriterionResult[] = []

  // --- Account gates -------------------------------------------------------
  if (student.status === 'blocked') {
    const reason = 'Account blocked by admin'
    return { state: 'not_eligible', reason, reasons: [reason], criteria }
  }
  if (student.status === 'rejected') {
    const reason = 'Profile verification was rejected — resubmit your documents'
    return { state: 'missing_info', reason, reasons: [reason], criteria }
  }
  if (student.status !== 'approved') {
    const reason = 'Account pending admin verification'
    return { state: 'missing_info', reason, reasons: [reason], criteria }
  }

  // --- Profile completeness ------------------------------------------------
  const missing: string[] = []
  if (!student.resumeUploaded) missing.push('Resume not uploaded')
  if (!student.idDocsUploaded) missing.push('ID documents not uploaded')
  if (missing.length) {
    return { state: 'missing_info', reason: missing[0], reasons: missing, criteria }
  }

  // --- Drive window --------------------------------------------------------
  if (drive.status === 'closed') {
    const reason = 'Application deadline has passed'
    return { state: 'not_eligible', reason, reasons: [reason], criteria }
  }

  // --- Company-specified criteria -----------------------------------------
  const open = drive.anyoneCanApply

  // 1. Minimum CGPA
  const cgpaPass = open || student.cgpa >= drive.minCgpa
  criteria.push({
    label: 'Minimum CGPA',
    required: open ? 'Open to all' : drive.minCgpa.toFixed(1),
    yours: student.cgpa.toFixed(1),
    pass: cgpaPass,
    blocking: true,
    reason: cgpaPass ? undefined : `CGPA below required criteria (${drive.minCgpa.toFixed(1)} required, you have ${student.cgpa.toFixed(1)})`,
  })

  // 2. Active backlogs
  const backlogPass = open || student.backlogs <= drive.maxBacklogs
  criteria.push({
    label: 'Active backlogs',
    required: open ? 'Open to all' : drive.maxBacklogs >= 99 ? 'No limit' : `${drive.maxBacklogs} maximum`,
    yours: String(student.backlogs),
    pass: backlogPass,
    blocking: true,
    reason: backlogPass ? undefined : `${student.backlogs} active backlog${student.backlogs === 1 ? '' : 's'} — limit is ${drive.maxBacklogs}`,
  })

  // 3. Department / branch
  const branchPass = open || drive.fieldFilter === 'Any' || drive.fieldFilter === student.branch
  criteria.push({
    label: 'Department',
    required: open || drive.fieldFilter === 'Any' ? 'Any branch' : drive.fieldFilter,
    yours: student.branch,
    pass: branchPass,
    blocking: true,
    reason: branchPass ? undefined : `Restricted to ${drive.fieldFilter} — your branch is ${student.branch}`,
  })

  // 4. Passing year
  const yearPass = open || drive.passingYears.length === 0 || drive.passingYears.includes(student.passingYear)
  criteria.push({
    label: 'Passing year',
    required: open || drive.passingYears.length === 0 ? 'Any year' : drive.passingYears.join(' / '),
    yours: String(student.passingYear),
    pass: yearPass,
    blocking: true,
    reason: yearPass ? undefined : `Open to the ${drive.passingYears.join(' / ')} batch — you pass out in ${student.passingYear}`,
  })

  // 5. Required skills
  const have = student.skills.map((s) => s.toLowerCase())
  const missingSkills = drive.requiredSkills.filter((s) => !have.includes(s.toLowerCase()))
  const skillsPass = open || missingSkills.length === 0
  criteria.push({
    label: 'Required skills',
    required: open ? 'Open to all' : list(drive.requiredSkills),
    yours: list(student.skills),
    pass: skillsPass,
    blocking: true,
    reason: skillsPass ? undefined : `Required skill missing: ${missingSkills.join(', ')}`,
  })

  // 6. Certifications
  const certs = student.certifications.map((c) => c.toLowerCase())
  const missingCerts = drive.requiredCertifications.filter((c) => !certs.includes(c.toLowerCase()))
  const certPass = open || missingCerts.length === 0
  criteria.push({
    label: 'Certifications',
    required: open ? 'Open to all' : list(drive.requiredCertifications),
    yours: list(student.certifications),
    pass: certPass,
    blocking: true,
    reason: certPass ? undefined : `Required certification missing: ${missingCerts.join(', ')}`,
  })

  // 7. Location preference — advisory, never blocks an application.
  const locPass =
    open ||
    drive.locationFilter === 'any' ||
    student.locationPreference === 'any' ||
    drive.locationFilter === student.locationPreference
  criteria.push({
    label: 'Location preference',
    required: open || drive.locationFilter === 'any' ? 'Any' : drive.locationFilter,
    yours: student.locationPreference,
    pass: locPass,
    blocking: false,
    reason: locPass ? undefined : `Drive prefers ${drive.locationFilter} candidates — yours is ${student.locationPreference}`,
  })

  const reasons = criteria.filter((c) => c.blocking && !c.pass).map((c) => c.reason as string)
  if (reasons.length) {
    return { state: 'not_eligible', reason: reasons[0], reasons, criteria }
  }
  return { state: 'eligible', criteria }
}

/**
 * Skills the student is missing across every drive they are not yet eligible for,
 * ranked by how many drives demand them. Drives the student can already clear are
 * excluded so the list is genuinely actionable.
 */
export function skillGap(student: Student, drives: Drive[]) {
  const counts = new Map<string, number>()
  const have = student.skills.map((s) => s.toLowerCase())
  for (const d of drives) {
    if (d.status !== 'open' || d.anyoneCanApply) continue
    for (const s of d.requiredSkills) {
      if (!have.includes(s.toLowerCase())) counts.set(s, (counts.get(s) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([skill, drives]) => ({ skill, drives }))
    .sort((a, b) => b.drives - a.drives || a.skill.localeCompare(b.skill))
}

/** ISO date (yyyy-mm-dd) offset from today — used to prefill native date inputs. */
export function isoDate(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export const statusLabel: Record<string, string> = {
  applied: 'Applied',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  selected: 'Selected',
  rejected: 'Rejected',
  pending: 'Pending',
  approved: 'Approved',
  blocked: 'Blocked',
  verified: 'Verified',
  submitted: 'Submitted',
  company_approved: 'Company Verified',
  faculty_reviewed: 'Faculty Reviewed',
  flagged: 'Flagged',
  open: 'Open',
  closed: 'Closed',
  active: 'Active',
  completed: 'Completed',
  in_progress: 'In Progress',
  not_uploaded: 'Not Uploaded',
  uploaded: 'Uploaded',
  none: 'Not Recommended',
  recommended: 'Recommended',
  offered: 'PPO Offered',
  accepted: 'PPO Accepted',
  declined: 'PPO Declined',
}

export const documentLabel: Record<string, string> = {
  offer_letter: 'Offer Letter',
  joining_letter: 'Joining Letter',
  acceptance: 'Acceptance Letter',
  completion_certificate: 'Completion Certificate',
  ppo_letter: 'PPO Letter',
}
