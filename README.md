<div align="center">

# Kinma Movers

**No matter the size of load you wan move, your size of motto dey.**

On-demand mini-truck logistics for Lagos, run from the Ikorodu hub.
Instant quotes, trusted drivers, one dashboard for the whole operation.

[How it started](docs/STORY.md) · [Roadmap](docs/ROADMAP.md) · [Architecture](docs/ARCHITECTURE.md)

</div>

---

## What it is

Kinma Movers works like Uber or Bolt, built for goods instead of passengers. Customers move household items, furniture and shop goods in and out of Ikorodu to anywhere in Lagos using Suzuki Carry mini trucks.

- **Customers** see a fair price before they book, then book in about a minute and pay on delivery.
- **Drivers** from a trusted network get jobs on their phone, accept them, and step through each trip.
- **The owner** runs everything from one dashboard: jobs, drivers, prices and matching.

## Features

### For customers
- **Instant, honest quotes.** The full price breakdown is shown before booking, and it can't change on the day.
- **AI load assistant.** Type *"2 bedroom flat, big fridge, 6 cartons"* and get the right load size, helpers, number of trips and packing tips.
- **Trip map.** Pickup, drop-off and the approximate road distance are shown as you choose.
- **Book now or schedule** a date and time.

### For drivers
- Apply online with plate and licence number, and start once the owner approves you.
- Go online, set where you are, and see new jobs with what you'll earn.
- Accept a job to see the customer's details, open Google Maps directions, and move the trip from pickup to delivery.
- Track today's trips and earnings.

### For the owner
- **Live job board** showing what needs a driver, what's on the road and what was delivered today.
- **Smart matching.** Each open job shows the best driver and the reasons, such as *"very close (2.1 km), online now, top rated 4.9★"*. Assign with one tap.
- **Driver management:** approve, suspend and view details.
- **Price editor** for zone fares, load sizes, helper and stairs fees, the out-of-hub charge and the driver's share. Changes go live within a minute.

## Pricing

Ikorodu is the hub. The **farthest zone** on the trip sets the fare, because the truck always returns home.

| Zone | Areas | Base fare |
|---|---|---:|
| A · Ikorodu town | Ikorodu Garage, Agric, Ijede, Igbogbo, Ebute, Owutu, Odogunyan | ₦15,000 |
| B · Near corridor | Mile 12, Ketu, Ojota, Isheri, Magodo, Maryland | ₦50,000 |
| C · Mainland | Ikeja, Yaba, Surulere, Oshodi, Ogba, Gbagada | ₦60,000 |
| D · Island and Lekki | Victoria Island, Ikoyi, Lekki Phase 1, Ajah, Sangotedo | ₦100,000 |
| E · Far Lagos | Badagry, Epe, Ibeju-Lekki, Ikotun | ₦120,000 |

**Price = zone fare × load size + helpers + stairs**

| Item | Amount |
|---|---|
| Load size | small ×1 · household ×1.3 · furniture ×1.5 · full truck ×1.8 |
| Loading helper | ₦5,000 each |
| Stairs | ₦2,000 per floor, at pickup and at drop-off (ground floor free) |
| Pickup outside Ikorodu | + 40% of that zone's fare |
| Driver's share | 80% |

*Example:* furniture from Ikorodu to Lekki Phase 1, 1 helper, 2 floors of stairs costs ₦100,000 × 1.5 + ₦5,000 + ₦4,000 = **₦159,000**.

## Tech stack

| Layer | Choice |
|---|---|
| Web app (customers, drivers, admin) | [Next.js](https://nextjs.org) 15, React 19, Tailwind CSS 4 |
| Database, sign-in, security rules | [Supabase](https://supabase.com) (Postgres) |
| AI load assistant | [Claude API](https://docs.claude.com) |
| Maps | [Leaflet](https://leafletjs.com) + OpenStreetMap |
| Hosting | [Vercel](https://vercel.com) |

## Getting started

### 1. Database
1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, open a new query, paste the whole of [`supabase/setup.sql`](supabase/setup.sql) and press **Run** (once only). This creates the tables and security rules, and loads the prices above. The same SQL is split by step in `supabase/migrations/`.
3. From **Project Settings → API**, copy the project URL, `anon` key and `service_role` key.

### 2. Run locally
```bash
cp .env.example .env.local   # fill in the Supabase keys (and optionally ANTHROPIC_API_KEY)
npm install
npm run dev                  # http://localhost:3000
```

### 3. Make yourself admin
Sign up once at `/driver/signup`, then in the Supabase SQL Editor run:
```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```
Sign in at `/login` and you'll land on `/admin`.

### 4. Deploy
Import the repository on [vercel.com](https://vercel.com), add the same environment variables, and deploy.

## Project structure

```
src/
  app/
    page.tsx               customer booking page
    api/bookings/          saves a booking after recalculating the price
    api/quote/             current price list
    api/ai/load/           AI load assistant
    driver/                driver sign-up and job screen
    login/                 sign-in
    admin/                 owner dashboard and its actions
  components/              header, booking form, trip map
  lib/
    pricing.ts             quote formula
    pricing-db.ts          live prices from the database
    matching.ts            smart driver matching
    geo.ts                 area coordinates and distances
    supabase/              database connections
supabase/migrations/       tables, security rules, starting prices
docs/                      story, roadmap, architecture
```

## Roadmap

Phase 1 is nearly complete. Next come SMS/WhatsApp alerts and a customer tracking page, followed by Paystack payments, live GPS, photo proof and native apps. The ideas that will set Kinma Movers apart include WhatsApp booking in Pidgin, photo-based load pricing, return-load matching and AI driver sourcing. They're described in [docs/ROADMAP.md](docs/ROADMAP.md).

---

<div align="center">
© 2026 Kinma Movers · Ikorodu, Lagos · All rights reserved.
</div>
