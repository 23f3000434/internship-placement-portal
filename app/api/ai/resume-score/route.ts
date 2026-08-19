import { NextResponse } from 'next/server'
import type { Student } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const student = (await req.json()) as Partial<Student>
    
    let score = 40 // base
    const strengths: string[] = []
    const suggestions: string[] = []

    // Check resume upload
    if (student.resumeUploaded) {
      score += 20
      strengths.push('Resume document attached and parsed')
    } else {
      suggestions.push('Upload your latest resume PDF to unlock full eligibility')
    }

    // Check skills
    const skillsCount = (student.skills || []).length
    if (skillsCount >= 5) {
      score += 15
      strengths.push(`Strong core skill stack (${skillsCount} skills documented)`)
    } else if (skillsCount >= 3) {
      score += 10
      strengths.push(`${skillsCount} skills listed`)
      suggestions.push('Add 2+ complementary framework or tooling skills (e.g., Git, Docker, REST APIs)')
    } else {
      score += 5
      suggestions.push('Add at least 3-5 technical skills relevant to your domain')
    }

    // Check certifications
    const certsCount = (student.certifications || []).length
    if (certsCount >= 2) {
      score += 15
      strengths.push(`Verified industry certifications (${certsCount} on record)`)
    } else if (certsCount === 1) {
      score += 10
      strengths.push('Has 1 verified professional certification')
      suggestions.push('Add cloud/domain certification (e.g., AWS, Azure, NPTEL, Google)')
    } else {
      suggestions.push('Earn and record recognized certifications to stand out to top recruiters')
    }

    // Check CGPA
    if ((student.cgpa || 0) >= 8.5) {
      score += 10
      strengths.push(`Exceptional academic record (CGPA: ${(student.cgpa || 0).toFixed(1)})`)
    } else if ((student.cgpa || 0) >= 7.5) {
      score += 5
      strengths.push(`Consistent academic performance (CGPA: ${(student.cgpa || 0).toFixed(1)})`)
    }

    // Check backlogs
    if ((student.backlogs || 0) === 0) {
      score += 5
      strengths.push('Clean academic history with zero active backlogs')
    } else {
      suggestions.push(`Clear pending backlogs (${student.backlogs} active) to qualify for 100% of campus drives`)
    }

    const finalScore = Math.min(Math.max(score, 35), 98)

    return NextResponse.json({
      success: true,
      score: finalScore,
      rating: finalScore >= 85 ? 'Excellent' : finalScore >= 70 ? 'Good' : 'Needs Polish',
      strengths,
      suggestions,
      analyzedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to score profile' }, { status: 400 })
  }
}
