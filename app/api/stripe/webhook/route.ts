import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Must read raw body before any parsing — Stripe verifies signature on raw bytes
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { beatId, buyerId, producerId } = session.metadata ?? {}

    if (!beatId || !buyerId || !producerId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const amountCents = session.amount_total ?? 0
    const platformCents = Math.round(amountCents * 0.25)
    const producerCents = amountCents - platformCents

    const supabase = createServiceClient()

    // Record the purchase (service role bypasses RLS)
    await supabase.from('purchases').upsert({
      beat_id: beatId,
      buyer_id: buyerId,
      producer_id: producerId,
      stripe_session_id: session.id,
      amount_cents: amountCents,
      producer_amount_cents: producerCents,
      platform_amount_cents: platformCents,
      status: 'completed',
    }, { onConflict: 'stripe_session_id' })

    // Record download interaction — DB trigger bumps downloads_count automatically
    await supabase.from('interactions').upsert(
      { user_id: buyerId, beat_id: beatId, type: 'download' },
      { onConflict: 'user_id,beat_id,type' }
    )
  }

  return NextResponse.json({ received: true })
}
