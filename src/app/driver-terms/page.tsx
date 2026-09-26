import Link from "next/link";
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { COMPANY, contactLine } from "@/lib/company";

export const metadata: Metadata = { title: "Driver terms · Kinma Movers" };

export default function DriverTerms() {
  return (
    <LegalPage
      title="Driver terms"
      intro={`These terms apply to every driver who takes jobs through ${COMPANY.name}. By ticking "I agree" when you apply, you accept them. They protect you, the customer and the business.`}
    >
      <h2>1. Working with us</h2>
      <ul>
        <li>You work as an independent driver, not an employee. You choose when to go online and which jobs to accept.</li>
        <li>To be approved you need a valid driver&apos;s licence, a roadworthy vehicle with current papers (vehicle licence, roadworthiness certificate and insurance), and you must give us true details. We may ask for a guarantor.</li>
        <li>Tell us straight away if your licence, vehicle papers or phone number change.</li>
      </ul>

      <h2>2. Your pay</h2>
      <ul>
        <li>Each job shows what you will earn before you accept it. That amount does not change after you accept.</li>
        <li>You collect the customer&apos;s payment at delivery, by cash or transfer. You keep your earning and send the {COMPANY.name} share to our account within 24 hours.</li>
        <li>Levies you pay on a job are refunded to you by the customer at cost. We take nothing from them.</li>
        <li>If a customer cancels after you start driving to them, or keeps you waiting over 30 minutes at pickup, the call-out fee in our <Link href="/terms">customer terms</Link> goes to you.</li>
      </ul>

      <h2>3. Area levies and barriers</h2>
      <ul>
        <li>Read the levy warning on each job before you accept.</li>
        <li>Pay only what is actually demanded. Record the amount and place in the app straight away, and photograph any ticket or receipt.</li>
        <li>If the amount is above the usual amount shown, call the customer before paying.</li>
        <li>Never pay a levy you did not record, and never add money to a levy. A false levy record is treated as dishonesty.</li>
        <li>If trucks are barred from the customer&apos;s street, stop at the nearest safe point and call the customer.</li>
      </ul>

      <h2>4. How you must work</h2>
      <ul>
        <li>Be on time, polite and honest. Wear clean clothes and keep your truck clean.</li>
        <li>Never ask the customer for more money than the app shows, apart from recorded levies.</li>
        <li>Do not drive under the influence of alcohol or drugs, and do not use your phone in your hand while driving.</li>
        <li>Load safely: do not overload the truck, tie goods down, and cover them when it rains.</li>
        <li>Do not carry goods listed as forbidden in our <Link href="/terms">customer terms</Link>. You may refuse any unsafe item.</li>
        <li>Do not carry passengers other than your helpers and, if they choose, the customer.</li>
        <li>Obey traffic laws. Fines you receive for your own driving are yours to pay.</li>
      </ul>

      <h2>5. Customer information</h2>
      <p>You see the customer&apos;s name, phone number and address only after you accept a job. Use them only for that job. Do not save them, share them, or contact the customer for anything else after the job. Breaking this rule leads to removal from the platform.</p>

      <h2>6. Damage, loss and accidents</h2>
      <ul>
        <li>Take reasonable care with customers&apos; goods. Tell us straight away about any damage, loss or accident.</li>
        <li>If we find, after hearing your side, that damage or loss was caused by you or your helpers through carelessness, you may be asked to pay part or all of the cost. It can be taken from future earnings in agreed instalments.</li>
        <li>You are responsible for your vehicle, its insurance and its repairs.</li>
      </ul>

      <h2>7. Ratings, warnings and suspension</h2>
      <ul>
        <li>Customers can rate you, and we look at complaints, cancellations and levy records.</li>
        <li>Before any suspension we will tell you what the complaint is and listen to your side, unless there is a serious safety risk. Then we may pause your account first and hear you within 48 hours.</li>
        <li>Serious dishonesty, violence, theft, or driving under the influence leads to immediate removal.</li>
        <li>You can challenge any decision through our <Link href="/complaints">complaints policy</Link>.</li>
      </ul>

      <h2>8. Your information</h2>
      <p>We keep your name, phone, email, plate and licence number, and your job history, to run the service, pay you, and keep customers safe. Our <Link href="/privacy">privacy notice</Link> explains the rest.</p>

      <h2>9. Leaving</h2>
      <p>You can stop driving with us at any time; {contactLine()} to close your account. Money owed either way is settled within 7 days.</p>

      <h2>10. The law that applies</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria and Lagos State. We may update them, and we will tell you in the app before changes apply to new jobs.</p>
    </LegalPage>
  );
}
