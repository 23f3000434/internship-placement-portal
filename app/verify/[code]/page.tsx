import PublicVerifyPage from '../page'

export default async function VerifyByCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <PublicVerifyPage searchParams={Promise.resolve({ code })} />
}
