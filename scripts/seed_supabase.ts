import { createClient } from '@supabase/supabase-js'
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
} from '../lib/seed'

const supabaseUrl = 'https://etnmaluhlgwvwjpxvnof.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bm1hbHVobGd3dndqcHh2bm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMTcxNDEsImV4cCI6MjEwMjc5MzE0MX0.i6MDgMc7vg7dtpmKQpvceNVnfF4DT9-glCMvjxTMNz8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seed() {
  console.log('Seeding initial full platform state to Supabase...')
  const payload = {
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

  const { error } = await supabase.from('portal_data').upsert({
    id: 'main_v1',
    state: payload,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Failed to seed Supabase:', error.message)
  } else {
    console.log('✅ Successfully seeded full platform state to Supabase!')
  }
}

seed()
