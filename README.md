# Kinma Movers

**No matter the size of load you wan move, your size of motto dey.**

Kinma Movers is a booking app for moving goods, household items and furniture with Suzuki Carry mini trucks. It works like Uber or Bolt, but for logistics. Customers get an instant price, book a truck and pay on delivery. Drivers accept jobs and update each trip from their phone. The owner runs everything from one dashboard.

All operations run from **Ikorodu, Lagos**, and trucks go in and out of Ikorodu to anywhere in Lagos.

---

## What's in the app

| Page | Who uses it | What it does |
|---|---|---|
| `/` | Customers | Choose pickup and drop-off areas, what you're moving, helpers and stairs. See the price at once, then book with your name, phone and addresses. |
| `/driver/signup` | New drivers | Apply with name, phone, plate number and licence number. |
| `/login` | Drivers and admin | Sign in. |
| `/driver` | Approved drivers | Go online, see new jobs, accept one, get Google Maps directions, and move the trip from pickup to delivery. Shows today's earnings. |
| `/admin` | Owner | Job board (assign a driver, cancel), approve or suspend drivers, and edit every price. |

Drivers see the customer's name, phone and street address only after they accept a job.

---

## How prices work

Ikorodu is the hub. A trip is priced by the **farthest zone it touches**, because the truck always returns to Ikorodu.

| Zone | Areas | Base fare |
|---|---|---|
| A · Ikorodu town | Ikorodu Garage, Agric, Ijede, Igbogbo, Ebute, Owutu, Odogunyan | ₦15,000 |
| B · Near corridor | Mile 12, Ketu, Ojota, Isheri, Magodo, Maryland | ₦50,000 |
| C · Mainland | Ikeja, Yaba, Surulere, Oshodi, Ogba, Gbagada | ₦60,000 |
| D · Island and Lekki | Victoria Island, Ikoyi, Lekki Phase 1, Ajah, Sangotedo | ₦100,000 |
| E · Far Lagos | Badagry, Epe, Ibeju-Lekki, Ikotun | ₦120,000 |

**Price = zone fare × load size + helpers + stairs**

- **Load size:** small load ×1, household ×1.3, furniture ×1.5, full truck ×1.8
- **Loading helpers:** ₦5,000 each
- **Stairs:** ₦2,000 per floor, counted at pickup and at drop-off (ground floor is free)
- **Pickup outside Ikorodu:** adds 40% of that zone's fare for the truck to get there
- **Driver share:** 80% of the total

Example: furniture from Ikorodu to Lekki Phase 1 with 1 helper and 2 floors of stairs costs ₦100,000 × 1.5 + ₦5,000 + ₦4,000 = **₦159,000**.

Every number above can be changed from the admin **Prices** tab. The server always recalculates the price when a booking is made, so the price cannot be changed from the browser.

---

## Built with

- [Next.js](https://nextjs.org) for the website, driver app and admin in one project
- [Supabase](https://supabase.com) for the database, sign-in and security rules
- [Vercel](https://vercel.com) for hosting

---

## Set it up

### 1. Database (Supabase)
1. Create a free project at supabase.com.
2. Open **SQL Editor** and run the two files in `supabase/migrations/` in order (`0001_init.sql`, then `0002_driver_flow.sql`). This creates the tables and security rules, and loads the prices above.
3. Under **Project Settings → API**, copy the project URL, the `anon` key and the `service_role` key.

### 2. Run on your computer
```bash
cp .env.example .env.local   # paste the three Supabase values in here
npm install
npm run dev                  # open http://localhost:3000
```

### 3. Make yourself the admin
Sign up once at `/driver/signup` with your own email, then run this in the Supabase SQL Editor:
```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```
Sign in at `/login` and you'll land on `/admin`.

### 4. Put it online (Vercel)
Import this repository at vercel.com, add the same three values under **Environment Variables**, and deploy.

---

## Project layout

```
src/
  app/
    page.tsx              customer booking page
    api/bookings/         saves a booking after rechecking the price
    api/quote/            current price list
    driver/               driver sign-up and job screen
    login/                sign-in
    admin/                owner dashboard and its actions
  components/             shared pieces (header, booking form)
  lib/pricing.ts          the quote formula
  lib/pricing-db.ts       loads live prices from the database
  lib/supabase/           database connections
supabase/migrations/      database tables, rules and starting prices
```

---

## Roadmap

**Phase 1: launch** ✅ booking site, ✅ driver app, ✅ admin dashboard. Still to do: SMS or WhatsApp alerts, and a trip tracking page for customers.

**Phase 2: trust and payments.** Paystack payments, live driver location, photo proof at pickup and delivery, ratings, driver payouts.

**Phase 3: grow.** Android and iOS apps, bigger trucks, business accounts, and return loads so trucks don't come back to Ikorodu empty.
