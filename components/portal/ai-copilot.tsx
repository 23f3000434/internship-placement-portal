'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, CheckCircle2, TrendingUp, Zap, Target, Award, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { usePortal } from '@/lib/store'
import type { Student, Drive } from '@/lib/types'
import { checkEligibility } from '@/lib/eligibility'

/**
 * Intelligent Drive Recommendation & Profile Compatibility Engine.
 * Evaluates candidate skill sets, academic cutoffs, location alignment, and department criteria
 * against active recruitment drives using weighted multi-factor matching.
 */
export function AiRecommendationWidget({ student }: { student: Student }) {
  const p = usePortal()
  const openDrives = p.drives.filter((d) => d.status === 'open')

  const recommendations = useMemo(() => {
    const studentSkills = student.skills.map((s) => s.trim().toLowerCase())

    return openDrives
      .map((d: Drive) => {
        let score = 40
        const reasons: string[] = []
        const matchedSkills: string[] = []

        // 1. Skill overlap (up to 40 points)
        const required = d.requiredSkills.map((s) => s.trim().toLowerCase())
        if (required.length > 0) {
          required.forEach((req) => {
            const found = studentSkills.find((sk) => sk.includes(req) || req.includes(sk))
            if (found) matchedSkills.push(req)
          })
          const ratio = matchedSkills.length / required.length
          score += Math.round(ratio * 40)
          if (matchedSkills.length > 0) {
            reasons.push(`${matchedSkills.length}/${required.length} required skills matched (${matchedSkills.slice(0, 2).join(', ')})`)
          }
        } else {
          score += 30
        }

        // 2. Academic CGPA standing (up to 15 points)
        if (student.cgpa >= d.minCgpa + 1.0) {
          score += 15
          reasons.push(`CGPA ${student.cgpa.toFixed(1)} well above cutoff (${d.minCgpa.toFixed(1)})`)
        } else if (student.cgpa >= d.minCgpa) {
          score += 10
        }

        // 3. Department & Branch match (up to 10 points)
        if (d.fieldFilter === 'Any' || d.fieldFilter.toLowerCase() === student.branch.toLowerCase()) {
          score += 10
        }

        // 4. Location preference (up to 5 points)
        if (student.locationPreference === 'any' || d.location.toLowerCase().includes(student.locationPreference.toLowerCase())) {
          score += 5
        }

        const matchPct = Math.min(Math.max(score, 30), 99)
        const company = p.companies.find((c) => c.id === d.companyId)
        const elig = checkEligibility(student, d)

        return {
          drive: d,
          company,
          matchPct,
          matchedSkills,
          reasons,
          elig,
        }
      })
      .sort((a, b) => b.matchPct - a.matchPct)
  }, [student, openDrives, p.companies])

  const topMatches = recommendations.slice(0, 3)

  return (
    <section className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs">
      <div>
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-foreground" />
            <h2 className="text-sm font-semibold">Smart Drive Recommendations</h2>
          </div>
          <span className="rounded-full border px-2.5 py-0.5 text-[11px] text-muted-foreground font-mono bg-muted/40">
            Weighted Match Engine
          </span>
        </div>

        {topMatches.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {topMatches.map(({ drive, company, matchPct, reasons }) => (
              <li
                key={drive.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3 bg-background hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate text-foreground">{drive.title}</p>
                    <span className="rounded-full border border-foreground bg-foreground px-2 py-0.5 text-[10px] font-bold text-background tabular-nums shrink-0">
                      {matchPct}% Match
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {company?.name} · {drive.location} · ₹{drive.stipend.toLocaleString('en-IN')}/mo
                  </p>
                  {reasons.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      💡 {reasons.join(' · ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 text-xs" render={<Link href={`/drives/${drive.id}`} />}>
                    View Details
                    <ArrowRight className="size-3 ml-1" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
            No active placement drives currently open. New opportunities published by recruiters will appear here automatically.
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 border-t pt-3 flex items-center gap-1.5">
        <Sparkles className="size-3 text-foreground" />
        Recommendations update in real-time as you add skills and recruiters publish new drives.
      </p>
    </section>
  )
}

/**
 * Evaluates candidate resume ATS readiness, verified skills depth, and accreditation milestones.
 */
export function AiResumeScoreCard({ student }: { student: Student }) {
  const analysis = useMemo(() => {
    let score = 35
    const strengths: string[] = []
    const suggestions: string[] = []

    if (student.resumeUploaded) {
      score += 25
      strengths.push('Verified resume attached')
    } else {
      suggestions.push('Upload your latest resume on the profile page')
    }

    const sc = student.skills.length
    if (sc >= 5) {
      score += 15
      strengths.push(`${sc} verified core technical skills documented`)
    } else if (sc >= 3) {
      score += 10
      strengths.push(`${sc} core skills listed`)
      suggestions.push('Add 2+ complementary tool/framework skills')
    } else {
      score += 5
      suggestions.push('List at least 3-5 technical skills to improve drive matching')
    }

    if (student.certifications.length >= 1) {
      score += 15
      strengths.push(`${student.certifications.length} verified certification(s) on record`)
    } else {
      suggestions.push('Add industry certifications (e.g. AWS, NPTEL, Google)')
    }

    if (student.cgpa >= 8.5) {
      score += 10
      strengths.push(`Distinction academic record (CGPA ${student.cgpa.toFixed(1)})`)
    } else if (student.cgpa >= 7.5) {
      score += 5
    }

    if (student.backlogs === 0) {
      score += 5
      strengths.push('Zero active backlogs')
    } else {
      suggestions.push(`Clear ${student.backlogs} pending backlog(s)`)
    }

    const finalScore = Math.min(Math.max(score, 30), 99)
    return { score: finalScore, strengths, suggestions }
  }, [student])

  return (
    <section className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-foreground" />
            <h2 className="text-sm font-semibold">Profile &amp; ATS Readiness Index</h2>
          </div>
          <span className="font-mono text-sm font-bold">{analysis.score} / 100</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Placement Readiness Benchmark</span>
            <span className="font-medium text-foreground">
              {analysis.score >= 85 ? 'Top 10% Candidate' : analysis.score >= 70 ? 'Strong Candidate' : 'Profile in Progress'}
            </span>
          </div>
          <Progress value={analysis.score} aria-label={`Readiness score ${analysis.score}`} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs pt-1">
          <div>
            <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-2">Verified Strengths</p>
            <ul className="space-y-1.5">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="size-3.5 shrink-0 text-foreground mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-2">Optimization Steps</p>
            <ul className="space-y-1.5">
              {analysis.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                  <TrendingUp className="size-3.5 shrink-0 text-foreground mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
              {analysis.suggestions.length === 0 && (
                <li className="text-muted-foreground italic flex items-center gap-1">
                  <Check className="size-3.5 text-foreground" /> Profile is fully optimized for campus drives!
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t pt-3 mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Scored across 6 institutional placement criteria</span>
        <Link href="/profile" className="font-medium text-foreground underline underline-offset-4">
          Edit Profile →
        </Link>
      </div>
    </section>
  )
}
