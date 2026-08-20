import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import {
  seedStudents,
  seedCompanies,
  seedDrives,
  seedApplications,
  seedInterviews,
  seedInternships,
  seedDocuments,
  seedWeeklyReports,
  seedAttendance,
  seedMilestones,
  seedFeedback,
  seedSelfPlacements,
  seedAchievements,
  seedThreads,
  seedMessages,
  seedNotifications,
  seedAudit,
  faculty,
} from '@/lib/seed'
import type { Student, Company, Faculty } from '@/lib/types'

const defaultState = {
  students: seedStudents,
  companies: seedCompanies,
  faculty,
  drives: seedDrives,
  applications: seedApplications,
  interviews: seedInterviews,
  internships: seedInternships,
  documents: seedDocuments,
  weeklyReports: seedWeeklyReports,
  attendance: seedAttendance,
  milestones: seedMilestones,
  feedback: seedFeedback,
  selfPlacements: seedSelfPlacements,
  achievements: seedAchievements,
  threads: seedThreads,
  messages: seedMessages,
  notifications: seedNotifications,
  audit: seedAudit,
  uid: 500,
}

function dedupeStudents(list: Student[]): Student[] {
  const seen = new Set<string>()
  const result: Student[] = []
  for (const s of list) {
    const email = (s.email || '').trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    result.push(s)
  }
  return result
}

function dedupeCompanies(list: Company[]): Company[] {
  const seen = new Set<string>()
  const result: Company[] = []
  for (const c of list) {
    const email = (c.hrEmail || c.email || '').trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    result.push(c)
  }
  return result
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('portal_data')
      .select('state, updated_at')
      .eq('id', 'main_v1')
      .single()

    if (error || !data?.state) {
      return NextResponse.json({
        synced: true,
        state: defaultState,
        updatedAt: new Date().toISOString(),
      })
    }

    const state = data.state as Record<string, unknown>
    if (Array.isArray(state.students)) {
      state.students = dedupeStudents(state.students as Student[])
    }
    if (Array.isArray(state.companies)) {
      state.companies = dedupeCompanies(state.companies as Company[])
    }

    return NextResponse.json({
      synced: true,
      state,
      updatedAt: data.updated_at,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    return NextResponse.json({ synced: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1. Atomic Student Registration
    if (body.action === 'register_student' && body.student) {
      const student = body.student as Student
      student.email = (student.email || '').trim().toLowerCase()

      const { data } = await supabase.from('portal_data').select('state').eq('id', 'main_v1').single()
      const currentState = (data?.state as typeof defaultState) || defaultState
      const existingStudents = Array.isArray(currentState.students) ? currentState.students : seedStudents
      if (existingStudents.some((existing) => existing.email.trim().toLowerCase() === student.email)) {
        return NextResponse.json(
          { synced: false, error: 'An account with this email already exists.' },
          { status: 409 },
        )
      }

      const updatedStudents = dedupeStudents([...existingStudents, student])
      const newState = { ...currentState, students: updatedStudents }

      const { error: saveError } = await supabase.from('portal_data').upsert({
        id: 'main_v1',
        state: newState,
        updated_at: new Date().toISOString(),
      })
      if (saveError) {
        return NextResponse.json({ synced: false, error: saveError.message }, { status: 400 })
      }

      return NextResponse.json({
        synced: true,
        action: 'register_student',
        student,
        students: updatedStudents,
      })
    }

    // 2. Atomic Company Registration
    if (body.action === 'register_company' && body.company) {
      const company = body.company as Company
      company.hrEmail = (company.hrEmail || '').trim().toLowerCase()

      const { data } = await supabase.from('portal_data').select('state').eq('id', 'main_v1').single()
      const currentState = (data?.state as typeof defaultState) || defaultState
      const existingCompanies = Array.isArray(currentState.companies) ? currentState.companies : seedCompanies

      const updatedCompanies = dedupeCompanies([
        ...existingCompanies.filter((c) => c.hrEmail.trim().toLowerCase() !== company.hrEmail),
        company,
      ])

      const newState = {
        ...currentState,
        companies: updatedCompanies,
      }

      await supabase.from('portal_data').upsert({
        id: 'main_v1',
        state: newState,
        updated_at: new Date().toISOString(),
      })

      return NextResponse.json({
        synced: true,
        action: 'register_company',
        company,
        companies: updatedCompanies,
      })
    }

    // 3. Full Snapshot Upsert
    if (Array.isArray(body.students)) {
      body.students = dedupeStudents(body.students as Student[])
    }
    if (Array.isArray(body.companies)) {
      body.companies = dedupeCompanies(body.companies as Company[])
    }

    const { error } = await supabase.from('portal_data').upsert({
      id: 'main_v1',
      state: body,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json({ synced: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ synced: true, timestamp: new Date().toISOString() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    return NextResponse.json({ synced: false, error: message }, { status: 500 })
  }
}
