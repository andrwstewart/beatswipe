import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function handleOnboard(req: NextRequest): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, username')
      .eq('id', user.id)
      .single()

    let accountId = profile?.stripe_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      accountId = account.id

      const service = createServiceClient()
      await service
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id)
    }

    const host = req.headers.get('host')
    const proto = host?.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${proto}://${host}`

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/api/stripe/connect/onboard`,
      return_url: `${baseUrl}/profile/${profile?.username}?stripe_connected=1`,
      type: 'account_onboarding',
    })

    return { url: accountLink.url }
  } catch (err) {
    console.error('Stripe Connect onboard error:', err)
    return { error: 'Failed to start Stripe onboarding' }
  }
}

// GET: handles the refresh_url Stripe redirects to when the link expires
export async function GET(req: NextRequest) {
  const result = await handleOnboard(req)
  if (result.url) return NextResponse.redirect(result.url)
  const host = req.headers.get('host')
  const proto = host?.includes('localhost') ? 'http' : 'https'
  return NextResponse.redirect(`${proto}://${host}/feed?stripe_error=1`)
}

// POST: called by the UI button, returns { url } for client-side redirect
export async function POST(req: NextRequest) {
  const result = await handleOnboard(req)
  if (result.url) return NextResponse.json({ url: result.url })
  return NextResponse.json({ error: result.error }, { status: 500 })
}
