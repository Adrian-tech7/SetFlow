# SetFlow

**The B2B Appointment Setting Marketplace**

SetFlow connects businesses sitting on unused leads with independent cold callers who get paid per verified appointment. No monthly fees — pay only for results.

## How It Works

1. **Businesses** upload their unused lead lists via CSV
2. **Callers** browse available leads and request access
3. **Businesses** approve access requests
4. **Callers** work the leads externally (phone, email, etc.)
5. **Appointments** get booked through the business's booking link
6. **Webhook verification** confirms the appointment is real
7. **Stripe** automatically splits the payment

## Pricing Tiers

| Tier | Business Pays | Caller Earns | Platform Fee |
|------|--------------|-------------|-------------|
| 🟢 Basic | $75 | $50 | $25 |
| 🔵 Advanced | $100 | $75 | $25 |
| ⚡ Elite | $125 | $100 | $25 |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Payments**: Stripe Connect
- **Deployment**: Vercel

## Getting Started

```bash
# Clone
git clone https://github.com/Adrian-tech7/SetFlow.git
cd SetFlow

# Install
npm install

# Set up env
cp .env.example .env
# Fill in your DATABASE_URL, NEXTAUTH_SECRET, Stripe keys

# Push database schema
npx prisma db push

# Run dev server
npm run dev
```

## Features

### MVP (Current)
- [x] User auth (Business + Caller roles)
- [x] Stripe Connect onboarding
- [x] CSV lead upload with validation
- [x] Lead browsing and access requests
- [x] Business approval workflow
- [x] Appointment creation and tracking
- [x] Webhook-based appointment verification
- [x] Automatic payment splitting
- [x] Dashboard with stats
- [x] Tier-based pricing (Basic/Advanced/Elite)
- [x] Ratings system
- [x] Dispute management
- [x] Role-based navigation

### Phase 2 (Planned)
- [ ] Auto tier progression
- [ ] In-app messaging
- [ ] Leaderboards
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] ML fraud detection
- [ ] Referral program
- [ ] Mobile app

## License

MIT
