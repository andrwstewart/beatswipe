import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { beatId } = await req.json()
    if (!beatId) return NextResponse.json({ error: 'Missing beatId' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: beat } = await supabase
      .from('beats')
      .select('id, title, price_cents, producer_id, audio_url, producer:profiles(display_name, username, stripe_account_id, stripe_payouts_enabled)')
      .eq('id', beatId)
      .single()

    if (!beat || !beat.price_cents || beat.price_cents <= 0) {
      return NextResponse.json({ error: 'Beat is not for sale' }, { status: 400 })
    }

    // Don't charge if they already bought it
    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .eq('beat_id', beatId)
      .eq('buyer_id', user.id)
      .eq('status', 'completed')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ alreadyPurchased: true, audioUrl: beat.audio_url })
    }

    const host = req.headers.get('host')
    const proto = host?.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${proto}://${host}`

    const producer = beat.producer as unknown as {
      display_name: string | null
      username: string
      stripe_account_id: string | null
      stripe_payouts_enabled: boolean
    } | null
    const producerName = producer?.display_name ?? producer?.username ?? 'Producer'

    const platformCents = Math.round(beat.price_cents * 0.25)
    const producerConnected = !!(producer?.stripe_payouts_enabled && producer?.stripe_account_id)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: beat.title,
            description: `Beat by ${producerName} · BeatSwipe`,
          },
          unit_amount: beat.price_cents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      // If the producer has connected their Stripe account, split automatically:
      // Stripe sends 75% to producer, keeps 25% as our application fee.
      ...(producerConnected ? {
        payment_intent_data: {
          application_fee_amount: platformCents,
          transfer_data: { destination: producer!.stripe_account_id! },
        },
      } : {}),
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&beat_id=${beatId}`,
      cancel_url: `${baseUrl}/feed`,
      metadata: {
        beatId,
        buyerId: user.id,
        producerId: beat.producer_id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
