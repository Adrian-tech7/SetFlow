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
    metadata: { platform: 'setflow', accountType: type },
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

export async function createPaymentIntent(
  amount: number,
  businessStripeId: string,
  callerStripeId: string,
  callerPayout: number,
  metadata: Record<string, string>
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd',
    transfer_data: {
      destination: businessStripeId,
    },
    metadata: {
      ...metadata,
      callerStripeId,
      callerPayout: String(callerPayout),
    },
  })
  return paymentIntent
}

export async function transferToConnectedAccount(
  amount: number,
  destinationAccountId: string,
  metadata: Record<string, string>
) {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    destination: destinationAccountId,
    metadata,
  })
  return transfer
}
