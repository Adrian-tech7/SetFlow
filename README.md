# SetFlow

**The B2B Appointment Setting Marketplace**

SetFlow connects businesses with unused leads to independent cold callers who get paid per verified appointment.

## How It Works

1. **Businesses** upload leads and set their booking link
2. **Callers** request access to lead batches
3. Callers work leads externally and book via the business's booking link
4. **Webhook verification** confirms the appointment
5. **Stripe** automatically splits the payment

## Tier Pricing

| Tier | Business Charge | Caller Payout | Platform Fee |
|------|----------------|---------------|-------------|
| Basic | $75 | $50 | $25 |
| Advanced | $100 | $75 | $25 |
| Elite | $125 | $100 | $25 |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth.js
- **Payments**: Stripe Connect
- **Language**: TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL, Stripe keys, etc.

# Push database schema
npm run db:push

# Generate Prisma client
npm run db:generate

# Run development server
npm run dev
```

## Environment Variables

See `.env.example` for all required variables.

## License

MIT
