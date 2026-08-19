'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle, Briefcase, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { usePortal } from '@/lib/store'
import type { Student, Drive } from '@/lib/types'
import { checkEligibility } from '@/lib/eligibility'

export function AiRecommendationWidget({ student }: { student: Student }) {
  const p = usePortal()
  const openDrives = p.drives.filter((d) => d.status === 'open')

  const recommendations = useMemo(() => {
    const studentSkills = student.skills.map((s) => s.toLowerCase())
    
    return openDrives.map((d: Drive) => {
      let score = 50
      const reasons: string[] = []

      // Skill overlap
      const required = d.requiredSkills.map((s) => s.toLowerCase())
      const matched = required.filter((s) => studentSkills.some((sk) => sk.includes(s) || s.includes(sk)))
      
      if (required.length > 0) {
        const ratio = matched.length / required.length
        score += Math.round(ratio * 35)
        if (matched.length > 0) {
          reasons.push(`${matched.length}/${required.length} required skills matched`)
        }
      } else {
        score += 25
      }

      // CGPA bonus
      if (student.cgpa >= d.minCgpa + 0.8) {
        score += 10
        reasons.push(`CGPA ${student.cgpa.toFixed(1)} well above cutoff`)
      } else if (student.cgpa >= d.minCgpa) {
        score += 5
      }

      // Branch match
      if (d.fieldFilter === 'Any' || d.fieldFilter === student.branch) {
        score += 5
      }

      const matchPct = Math.min(Math.max(score, 45), 98)
      const company = p.companies.find((c) => c.id === d.companyId)
      const elig = checkEligibility(student, d)

      return {
        drive: d,
        company,
        matchPct,
        reasons,
        elig,
      }
    }).sort((a, b) => b.matchPct - a.matchPct)
  }, [student, openDrives, p.companies])

  const topMatches = recommendations.slice(0, 3)

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-foreground" />
          <h2 className="text-sm font-semibold">AI Recommended Drives</h2>
        </div>
        <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground font-mono">
          Smart Match Engine
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {topMatches.map(({ drive, company, matchPct, reasons, elig }) => (
          <li key={drive.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border p-3 bg-background hover:bg-muted/30 transition-colors">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{drive.title}</p>
                <span className="rounded-full border border-foreground bg-foreground px-2 py-0.5 text-[10px] font-bold text-background tabular-nums">
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
              <Button size="sm" variant="outline" render={<Link href={`/drives/${drive.id}`} />}>
                View Details
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function AiResumeScoreCard({ student }: { student: Student }) {
  const analysis = useMemo(() => {
    let score = 40
    const strengths: string[] = []
    const suggestions: string[] = []

    if (student.resumeUploaded) {
      score += 20
      strengths.push('Verified resume PDF attached')
    } else {
      suggestions.push('Upload your latest resume PDF')
    }

    const sc = student.skills.length
    if (sc >= 5) {
      score += 15
      strengths.push(`${sc} verified core skills documented`)
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

    const finalScore = Math.min(Math.max(score, 35), 98)
    return { score: finalScore, strengths, suggestions }
  }, [student])

  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-foreground" />
          <h2 className="text-sm font-semibold">AI Profile &amp; ATS Readiness Score</h2>
        </div>
        <span className="font-mono text-sm font-bold">{analysis.score} / 100</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Placement Readiness Index</span>
          <span className="font-medium text-foreground">
            {analysis.score >= 85 ? 'Top 10% Candidate' : analysis.score >= 70 ? 'Strong Candidate' : 'Profile in Progress'}
          </span>
        </div>
        <Progress value={analysis.score} aria-label={`Readiness score ${analysis.score}`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 text-xs">
        <div>
          <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Strengths</p>
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
          <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-2">Improvement Tips</p>
          <ul className="space-y-1.5">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                <TrendingUp className="size-3.5 shrink-0 text-foreground mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
            {analysis.suggestions.length === 0 && (
              <li className="text-muted-foreground italic">Profile is fully optimized for campus drives!</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}
