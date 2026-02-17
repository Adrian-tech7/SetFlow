import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export async function createConnectedAccount(email: string, type: 'business' | 'caller') {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      transfers: { requested: true },
      ...(type === 'business' ? { card_payments: { requested: true } } : {}),
    },
    metadata: { platform: 'closeflow', accountType: type },
  })
  return account
}

export async function createAccountLink(accountId: string, returnUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${returnUrl}?refresh=true`,
    return_url: `${returnUrl}?success=true`,
    type: 'account_onboarding',
  })
  return accountLink
}

export async function chargeBusinessAndPayCaller(
  businessStripeId: string,
  callerStripeId: string,
  totalCharge: number,
  callerPayout: number,
  metadata: Record<string, string>
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalCharge * 100),
    currency: 'usd',
    customer: businessStripeId,
    metadata: {
      ...metadata,
      platform: 'closeflow',
    },
    automatic_payment_methods: { enabled: true },
  })

  return paymentIntent
}

export async function transferToCaller(
  amount: number,
  callerStripeId: string,
  metadata: Record<string, string>
) {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    destination: callerStripeId,
    metadata,
  })
  return transfer
}

export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  }
}
