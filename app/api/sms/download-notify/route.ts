import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { producerId, beatTitle } = await req.json()
    if (!producerId || !beatTitle) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the downloader's username from their session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch downloader username + producer phone in parallel
    const [{ data: downloader }, { data: producer }] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', user.id).single(),
      supabase.from('profiles').select('phone').eq('id', producerId).single(),
    ])

    // Skip silently if producer has no phone number
    if (!producer?.phone) return NextResponse.json({ ok: true, skipped: true })

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio env vars not set')
      return NextResponse.json({ error: 'SMS not configured' }, { status: 500 })
    }

    const client = twilio(accountSid, authToken)
    const downloaderName = downloader?.username ? `@${downloader.username}` : 'Someone'

    await client.messages.create({
      body: `BeatSwipe: ${downloaderName} downloaded your beat "${beatTitle}". Keep posting on Beatswipe.net to maintain this success 🎵`,
      from: fromNumber,
      to: producer.phone,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('SMS notify error:', err)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}
