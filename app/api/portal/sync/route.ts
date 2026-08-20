import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('portal_data')
      .select('state, updated_at')
      .eq('id', 'main_v1')
      .single()

    if (error) {
      // Table might not exist yet; return status
      return NextResponse.json({
        synced: false,
        message: 'No remote record or table not created yet',
        error: error.message,
      })
    }

    return NextResponse.json({
      synced: true,
      state: data?.state,
      updatedAt: data?.updated_at,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    return NextResponse.json({ synced: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
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
