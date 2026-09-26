import Link from "next/link";
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { COMPANY, contactLine } from "@/lib/company";

export const metadata: Metadata = { title: "Complaints policy · Kinma Movers" };

export default function Complaints() {
  return (
    <LegalPage
      title="Complaints policy"
      intro="Customers and drivers can both complain, and we hear both sides before we decide. This is how it works."
    >
      <h2>1. How to complain</h2>
      <ul>
        <li>To make a complaint, {contactLine()}. Give your booking number (it starts with KM-).</li>
        <li>Tell us what happened, when and where, and send any photos, receipts or levy tickets you have.</li>
        <li>For damage or loss, complain within 24 hours of delivery. For anything else, within 14 days.</li>
        <li>If you feel unsafe, contact us straight away. If someone is in danger, call the police or emergency services on 112 first.</li>
      </ul>

      <h2>2. What happens next</h2>
      <ol>
        <li><b>Within 24 hours</b> we confirm we have your complaint and tell you who is handling it.</li>
        <li><b>We hear both sides.</b> We contact the other person (the driver or the customer) and ask for their account and evidence. Neither side is assumed to be at fault.</li>
        <li><b>We check the records.</b> The booking holds the price the customer agreed to, the levy warnings shown, every status change with its time, and any levies the driver recorded.</li>
        <li><b>Within 7 days</b> we tell both sides our decision and the reason. Complex cases can take up to 14 days, and we will tell you if so.</li>
      </ol>

      <h2>3. What we can do</h2>
      <ul>
        <li><b>For customers:</b> an apology, a refund or part refund, repair or compensation under our <Link href="/terms">customer terms</Link>, or a free rebooking.</li>
        <li><b>For drivers:</b> payment of a call-out fee or levy the customer refused, removal of an unfair rating, or cancelling a warning.</li>
        <li><b>For conduct problems:</b> a warning, extra checks, suspension or removal of the driver, or refusing future bookings from a customer who abused a driver.</li>
      </ul>

      <h2>4. Levy disputes</h2>
      <p>If a customer questions a levy, we look at the driver&apos;s record made in the app at the time, any ticket or photo, and the usual amount we published for that place. A recorded levy that matches the usual amount is accepted. A levy that was not recorded at the time, or is far above the usual amount without the customer being called first, is not charged to the customer.</p>

      <h2>5. If you disagree with our decision</h2>
      <p>Ask for a review within 7 days of our decision. The owner of {COMPANY.name} will look at the case again personally and reply within 7 days. If you are a customer and still not satisfied, you can contact the Federal Competition and Consumer Protection Commission (FCCPC). For complaints about your personal data, see our <Link href="/privacy">privacy notice</Link>.</p>

      <h2>6. Fair treatment</h2>
      <p>No one is penalised for making an honest complaint. We keep complaint details private and share them only with the people involved in the booking.</p>
    </LegalPage>
  );
}
