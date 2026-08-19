import { NextResponse } from 'next/server'
import { seedDrives, seedCompanies } from '@/lib/seed'
import type { Student, Drive } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const student = (await req.json()) as Partial<Student>
    const studentSkills = (student.skills || []).map((s) => s.toLowerCase())
    const studentCgpa = student.cgpa || 7.0
    const studentBranch = student.branch || ''

    const openDrives = seedDrives.filter((d) => d.status === 'open')

    const scoredDrives = openDrives.map((d: Drive) => {
      let score = 50 // baseline
      const reasons: string[] = []

      // Skill overlap
      const required = d.requiredSkills.map((s) => s.toLowerCase())
      const matchedSkills = required.filter((s) => studentSkills.some((sk) => sk.includes(s) || s.includes(sk)))
      
      if (required.length > 0) {
        const skillRatio = matchedSkills.length / required.length
        score += Math.round(skillRatio * 35)
        if (matchedSkills.length > 0) {
          reasons.push(`Matches your skills in ${matchedSkills.join(', ')}`)
        }
      } else {
        score += 25
      }

      // CGPA bonus
      if (studentCgpa >= d.minCgpa + 1.0) {
        score += 10
        reasons.push(`Strong academic standing (${studentCgpa.toFixed(1)} vs ${d.minCgpa.toFixed(1)} req)`)
      } else if (studentCgpa >= d.minCgpa) {
        score += 5
      }

      // Branch match
      if (d.fieldFilter === 'Any' || d.fieldFilter.toLowerCase() === studentBranch.toLowerCase()) {
        score += 5
        reasons.push(`Department alignment (${studentBranch})`)
      }

      const matchPercentage = Math.min(Math.max(score, 45), 98)
      const company = seedCompanies.find((c) => c.id === d.companyId)

      return {
        driveId: d.id,
        title: d.title,
        companyName: company?.name || 'Company',
        location: d.location,
        workMode: d.workMode,
        stipend: d.stipend,
        matchPercentage,
        matchedSkills,
        reasons,
        rationale: reasons.join(' · ') || 'Good baseline fit for your profile profile and department.',
      }
    })

    scoredDrives.sort((a, b) => b.matchPercentage - a.matchPercentage)

    return NextResponse.json({
      success: true,
      recommendations: scoredDrives,
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 400 })
  }
}
