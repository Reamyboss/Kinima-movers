# CarryGo

Mini truck logistics for Lagos, run from the Ikorodu hub. Customers get an instant quote and book a Suzuki Carry; drivers accept and run jobs; the owner manages drivers and prices.

> No matter the size of load you wan move, your size of motto dey.

## Stack
- Next.js (App Router) on Vercel
- Supabase (Postgres, auth, realtime)

## Run locally
```bash
cp .env.example .env.local   # fill in Supabase keys
npm install
npm run dev
```
Without Supabase keys the site still shows quotes from the built-in price list; bookings need the database.

## Database
Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor (or `supabase db push`). It creates the tables, row-level security and seeds the owner's zone prices.

## Pricing
`src/lib/pricing.ts` holds the quote formula. Prices live in the `pricing_*` tables so they can be edited from the admin panel:

total = zone fare × load size + helpers × ₦5,000 + floors of stairs (pickup + drop-off) × ₦2,000, plus 40% of the pickup zone fare when pickup is outside Ikorodu town. The server recomputes every price; the browser never sets it.

## Roadmap
- Phase 1: booking site ✅ started, driver app, admin dashboard, SMS/WhatsApp alerts
- Phase 2: Paystack, live tracking, photo proof, ratings, payouts
- Phase 3: Android/iOS apps, more vehicle sizes, business accounts
