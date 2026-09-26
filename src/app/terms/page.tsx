import Link from "next/link";
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { COMPANY, contactLine } from "@/lib/company";

export const metadata: Metadata = { title: "Customer terms · Kinma Movers" };

export default function CustomerTerms() {
  return (
    <LegalPage
      title="Customer terms"
      intro={`These terms apply when you book a move with ${COMPANY.name}. By ticking "I agree" when you book, you accept them. They are written to be fair to you and to the driver who carries your goods.`}
    >
      <h2>1. What we do</h2>
      <p>{COMPANY.name} connects you with a vetted driver and a Suzuki Carry mini truck to move your goods within Lagos, with Ikorodu as our hub. The driver who accepts your job does the move. We set the price, choose and check drivers, and handle complaints.</p>

      <h2>2. Your price</h2>
      <ul>
        <li>You see the full price and how it is made up before you book. The driver cannot change it on the day.</li>
        <li>The price covers the truck, fuel, the driver, the helpers and the stairs you booked.</li>
        <li>If the load is much bigger than what you booked, or needs more helpers or floors, the driver will tell you before loading. The extra is worked out from our published price list, and you can agree to it, remove some items, or cancel as in section 6.</li>
        <li><b>Paying online.</b> Once a driver accepts your booking, you pay the full price on your booking page through our payment partner, Paystack (card, bank transfer or USSD). The driver starts travelling to you only after payment. We hold the money until delivery.</li>
        <li><b>Delivery code.</b> Your booking page shows a 4-digit code. Give it to the driver only when all your goods have arrived. It confirms delivery and releases the driver&apos;s pay.</li>
        <li>Where online payment is not yet available for your booking, you pay the driver on delivery by cash or bank transfer.</li>
        <li>You pay only the amount on your booking plus any levy under section 3. Never pay extra money the driver asks for outside the app. If this happens, report it to us.</li>
      </ul>

      <h2>3. Area levies (union, market and estate charges)</h2>
      <p>In some parts of Lagos, unions, market associations, estates or communities demand a fee before a truck can enter, for example around Alaba International Market, Mile 2, the Badagry Expressway, Ajah, Abraham Adesanya, Ibeju-Lekki and Admiralty Road. These charges are not ours and we cannot remove them. To keep them fair:</p>
      <ul>
        <li>We show a warning, with the usual amount where we know it, before you book.</li>
        <li>If a levy is demanded, the driver pays it and records the amount and place in the app straight away. You refund exactly that amount at delivery. We take no commission on levies.</li>
        <li>If the amount demanded is above the usual amount we showed, the driver will call you before paying so you can agree, or arrange another entry point.</li>
        <li>If trucks are not allowed into your street or estate, the driver will stop at the nearest safe point and call you. Carrying from there can be done by the booked helpers. Extra helpers are charged at the published rate only if you agree.</li>
        <li>If you think a levy was not really paid, or is too high, raise it through our <Link href="/complaints">complaints policy</Link>. We will ask the driver for the record and any ticket or photo.</li>
      </ul>

      <h2>4. What you agree to do</h2>
      <ul>
        <li>Describe your load honestly and choose the right size.</li>
        <li>Give a correct phone number and addresses, and be reachable on the day.</li>
        <li>Have the goods packed and ready. Fragile items should be wrapped, and fridges and freezers defrosted.</li>
        <li>Be present, or have someone you trust present, at pickup and delivery.</li>
        <li>Treat the driver and helpers with respect.</li>
      </ul>

      <h2>5. Goods we don&apos;t carry</h2>
      <ul>
        <li>Anything illegal, stolen or that needs a permit you don&apos;t have.</li>
        <li>Weapons, explosives, fireworks, and petrol or diesel in containers. Empty gas cylinders are fine, but not full ones.</li>
        <li>Live animals, and dangerous chemicals.</li>
        <li>Cash, jewellery and important documents. Keep these with you. We are not responsible for them if they are packed in the load.</li>
      </ul>
      <p>The driver may refuse any item that is unsafe or against the law.</p>

      <h2>6. Changes and cancellations</h2>
      <ul>
        <li>You can cancel free of charge until a driver starts driving to your pickup.</li>
        <li>If you cancel after the driver has started driving to you, or the driver arrives and cannot load because you are not there or the goods are not ready after 30 minutes, you pay a call-out fee of 20% of the trip fare. This goes to the driver for fuel and time.</li>
        <li>If we or the driver cancel, you pay nothing and we will try to find another driver.</li>
        <li>If you paid online, refunds go back to your original payment method: in full if you cancel before the driver starts travelling, or minus the call-out fee after that. Your bank may take a few working days to show it.</li>
      </ul>

      <h2>7. Care of your goods</h2>
      <ul>
        <li>The driver and helpers will load, carry and unload with reasonable care.</li>
        <li>Check your goods at delivery. Report any damage or loss before the driver leaves if you can, and no later than 24 hours after delivery, with photos.</li>
        <li>If we find the damage or loss was caused by the driver or helpers, we will arrange repair or pay compensation for its fair value, up to ₦100,000 per booking unless we agree a higher amount in writing before the move.</li>
        <li>We are not responsible for damage caused by poor packing, items that were already damaged, or delays caused by traffic, weather, road closures, levy points or the police.</li>
      </ul>

      <h2>8. Safety and conduct</h2>
      <p>We check every driver before they can take jobs. Drivers must follow our <Link href="/driver-terms">driver terms</Link>. If you feel unsafe or a driver behaves badly, {contactLine()} straight away.</p>

      <h2>9. Your information</h2>
      <p>We use your details only to carry out your move and handle any complaint. We do not sell them. Read our <Link href="/privacy">privacy notice</Link> to see what we keep and for how long.</p>

      <h2>10. Complaints</h2>
      <p>If something goes wrong, tell us. Our <Link href="/complaints">complaints policy</Link> explains how we listen to both you and the driver, and how quickly we respond.</p>

      <h2>11. The law that applies</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria and Lagos State. Nothing in them takes away your rights under the Federal Competition and Consumer Protection Act 2018.</p>
      <p>We may update these terms. The version you agreed to is saved with your booking, and changes apply only to new bookings.</p>
    </LegalPage>
  );
}
