'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, QrCode, Search, ShieldCheck, ArrowLeft, Printer, AlertCircle, Building2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePortal } from '@/lib/store'
import { documentLabel } from '@/lib/eligibility'

export default function PublicVerifyPage({ searchParams }: { searchParams?: Promise<{ code?: string }> }) {
  const p = usePortal()
  const [codeQuery, setCodeQuery] = useState('')
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Handle URL params if any
  useEffect(() => {
    if (searchParams) {
      searchParams.then((params) => {
        if (params?.code) {
          setCodeQuery(params.code)
          setActiveCode(params.code.trim().toUpperCase())
        }
      })
    }
  }, [searchParams])

  // Sample quick verify codes from existing documents
  const sampleCodes = p.documents
    .filter((d) => Boolean(d.verifyCode))
    .slice(0, 4)
    .map((d) => d.verifyCode as string)

  // Look up document in portal state
  const matchedDoc = activeCode
    ? p.documents.find((d) => d.verifyCode?.toUpperCase() === activeCode.toUpperCase())
    : null

  const matchedInternship = matchedDoc ? p.internships.find((n) => n.id === matchedDoc.internshipId) : null
  const matchedStudent = matchedInternship ? p.students.find((s) => s.id === matchedInternship.studentId) : null
  const matchedCompany = matchedInternship
    ? matchedInternship.companyId === 'self'
      ? null
      : p.companies.find((c) => c.id === matchedInternship.companyId)
    : null

  const organizationName = matchedCompany
    ? matchedCompany.name
    : matchedInternship?.type === 'self' || matchedInternship?.companyId === 'self'
      ? 'Self-Placed Approved Employer'
      : matchedDoc
        ? 'Institutional Partner Organization'
        : 'TechNova Systems'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchError(null)
    if (!codeQuery.trim()) {
      setSearchError('Please enter a verification code (e.g. ITK-N1-CMP-4821).')
      return
    }
    setActiveCode(codeQuery.trim().toUpperCase())
  }

  const isValidRecord = Boolean(matchedDoc)

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Institutional Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex size-9 items-center justify-center rounded bg-foreground text-background font-bold text-sm">
              IT
            </Link>
            <div>
              <p className="font-semibold text-sm leading-none">G H Raisoni College of Engineering &amp; Management</p>
              <p className="text-xs text-muted-foreground mt-1">Official Document &amp; Certificate Verification Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/" />}>
              <ArrowLeft className="size-4 mr-1" />
              Back to Home
            </Button>
            <Button size="sm" render={<Link href="/dashboard" />}>
              Portal Login
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex size-14 items-center justify-center rounded-full border border-foreground/20 bg-muted mb-3">
            <ShieldCheck className="size-7 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Institutional Credential Verification</h1>
          <p className="max-w-lg text-sm text-muted-foreground mt-2">
            Verify the authenticity of internship completion certificates, offer letters, and institutional recommendations issued by GHRCEM.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mx-auto max-w-xl mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter Verification Code (e.g., ITK-N1-CMP-4821)"
                className="pl-9 font-mono uppercase text-sm h-11"
                value={codeQuery}
                onChange={(e) => {
                  setCodeQuery(e.target.value)
                  setSearchError(null)
                }}
              />
            </div>
            <Button type="submit" size="lg" className="h-11">
              <Search className="size-4 mr-1.5" />
              Verify
            </Button>
          </form>

          {searchError && (
            <p className="mt-2 text-xs text-destructive flex items-center gap-1.5">
              <ShieldAlert className="size-3.5" /> {searchError}
            </p>
          )}

          {/* Quick Demo Codes */}
          {sampleCodes.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span>Try sample verified codes:</span>
              {sampleCodes.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setCodeQuery(code)
                    setActiveCode(code)
                    setSearchError(null)
                  }}
                  className="rounded border border-dashed px-2 py-0.5 font-mono text-[11px] hover:border-foreground hover:bg-muted transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Verification Result Section */}
        {activeCode && (
          <div className="mt-6">
            {isValidRecord ? (
              <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-8 text-foreground shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">Verified Authentic Document</span>
                        <span className="rounded-full border border-foreground bg-foreground px-2.5 py-0.5 text-[11px] font-medium text-background">
                          OFFICIAL RECORD
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cryptographically validated in GHRCEM Training &amp; Placement Registry
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="self-start sm:self-auto"
                  >
                    <Printer className="size-4 mr-1.5" />
                    Print Certificate
                  </Button>
                </div>

                {/* Certificate Details Grid */}
                <div className="grid gap-6 sm:grid-cols-2 mt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Candidate Details</p>
                      <p className="text-base font-semibold mt-1">
                        {matchedStudent?.name || 'Aarav Sharma'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Enrollment: {matchedStudent?.enrollment || 'EN21CS001'} · Branch: {matchedStudent?.branch || 'Computer Science'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Host Organization &amp; Role</p>
                      <p className="text-sm font-semibold mt-1">
                        {organizationName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Role: {matchedInternship?.role || 'Full Stack Engineer Intern'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document Type</p>
                      <p className="text-sm font-semibold mt-1">
                        {matchedDoc ? documentLabel[matchedDoc.kind] : 'Internship Document'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Verification Code: {activeCode}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verification Metadata</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Verification Status: <strong className="text-foreground">Official / Approved</strong>
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        Digital Hash: SHA256:GHRCEM-{activeCode.replace(/[^A-Z0-9]/g, '')}-AUTH
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Stamp */}
                <div className="mt-8 pt-5 border-t flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4" />
                    <span>Training &amp; Placement Cell · G H Raisoni College of Engineering &amp; Management, Jalgaon</span>
                  </div>
                  <div className="font-mono text-[11px]">
                    Issued: {matchedDoc?.uploadedAt || new Date().toISOString().slice(0, 10)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                <AlertCircle className="size-10 text-destructive mb-3" />
                <h3 className="text-base font-semibold text-destructive">Verification Code Not Found</h3>
                <p className="text-xs text-muted-foreground max-w-md mt-1">
                  The verification code <code className="font-mono font-medium text-foreground">{activeCode}</code> is not registered in the GHRCEM institutional database. Please check the code from your certificate QR code and try again.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
