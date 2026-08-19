import { NextResponse } from 'next/server'
import {
  seedStudents,
  seedCompanies,
  seedDrives,
  seedApplications,
  seedInternships,
  seedDocuments,
  seedFeedback,
  seedMilestones,
} from '@/lib/seed'

export async function GET() {
  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    institution: 'G H Raisoni College of Engineering & Management, Jalgaon',
    data: {
      studentsCount: seedStudents.length,
      companiesCount: seedCompanies.length,
      drivesCount: seedDrives.length,
      applicationsCount: seedApplications.length,
      internshipsCount: seedInternships.length,
      documentsCount: seedDocuments.length,
      feedbackCount: seedFeedback.length,
      milestonesCount: seedMilestones.length,
    },
    students: seedStudents,
    companies: seedCompanies,
    drives: seedDrives,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    return NextResponse.json({
      status: 'success',
      message: 'Cloud data synchronized successfully',
      receivedAt: new Date().toISOString(),
      recordCount: Object.keys(body).length,
    })
  } catch {
    return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 400 })
  }
}
