# Kinma Movers

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
Run the files in `supabase/migrations/` in order in the Supabase SQL editor (or `supabase db push`). They create the tables, row-level security, driver job functions, and seed the owner's zone prices.

Make yourself admin after signing up once: `update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`

## Pages
- `/` customer quote and booking
- `/driver/signup`, `/login`, `/driver` driver application, sign-in, online switch, job list, trip steps
- `/admin` jobs board with manual assign and cancel, driver approval, price editor

## Pricing
`src/lib/pricing.ts` holds the quote formula. Prices live in the `pricing_*` tables so they can be edited from the admin panel:

total = zone fare × load size + helpers × ₦5,000 + floors of stairs (pickup + drop-off) × ₦2,000, plus 40% of the pickup zone fare when pickup is outside Ikorodu town. The server recomputes every price; the browser never sets it.

## Roadmap
- Phase 1: booking site ✅, driver app ✅, admin dashboard ✅, SMS/WhatsApp alerts, customer trip tracking page
- Phase 2: Paystack, live tracking, photo proof, ratings, payouts
- Phase 3: Android/iOS apps, more vehicle sizes, business accounts
