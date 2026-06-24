import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { searchKnowledgeBase } from '@/lib/ai/knowledge-base'

export async function POST(request: Request) {
  const { query, limit = 10 } = await request.json().catch(() => ({ query: null }))
  if (!query) {
    return NextResponse.json({ error: 'query required' }, { status: 400 })
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const results = await searchKnowledgeBase(service, query, limit)
    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
