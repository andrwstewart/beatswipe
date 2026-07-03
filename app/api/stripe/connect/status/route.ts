import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ connected: false, payoutsEnabled: false })
    }

    const account = await stripe.accounts.retrieve(profile.stripe_account_id)
    const payoutsEnabled = account.payouts_enabled ?? false

    if (payoutsEnabled) {
      const service = createServiceClient()
      await service
        .from('profiles')
        .update({ stripe_payouts_enabled: true })
        .eq('id', user.id)
    }

    return NextResponse.json({ connected: true, payoutsEnabled })
  } catch (err) {
    console.error('Stripe Connect status error:', err)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
