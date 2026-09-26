import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { COMPANY, contactLine } from "@/lib/company";

export const metadata: Metadata = { title: "Privacy notice · Kinma Movers" };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy notice"
      intro={`${COMPANY.name} keeps only the information it needs to move your goods safely, and never sells it. This notice explains what we keep, why, who can see it, and how to have it deleted. It follows the Nigeria Data Protection Act 2023.`}
    >
      <h2>1. What we keep</h2>
      <ul>
        <li><b>Customers:</b> your name, phone number, pickup and drop-off addresses, what you are moving, the price, and the status of your booking.</li>
        <li><b>Drivers:</b> name, phone, email, plate and licence number, approval status, the area you set, whether you are online, ratings and job history.</li>
        <li><b>Load descriptions</b> typed into &ldquo;Tell us what you&apos;re moving&rdquo;, so we can improve load suggestions.</li>
        <li><b>Records of what was agreed:</b> the terms version accepted, the levy warnings shown, and levies recorded, so disputes can be settled fairly.</li>
      </ul>
      <p>We do not collect your bank card details, your live location, your contacts or your photos.</p>

      <h2>2. Why we use it</h2>
      <ul>
        <li>To give you a price, find a driver and complete the move.</li>
        <li>To contact you about your booking.</li>
        <li>To handle complaints and keep customers and drivers safe.</li>
        <li>To meet legal and accounting duties.</li>
      </ul>
      <p>We do not sell or rent your information. We do not use it for advertising or share it with advertisers. We do not use it for any purpose you have not been told about here.</p>

      <h2>3. Who can see it</h2>
      <ul>
        <li><b>Your driver</b> sees your name, phone and addresses only after accepting your job, and only for that job. Before that, drivers see just the areas, load and pay.</li>
        <li><b>The {COMPANY.name} team</b> sees bookings to manage jobs and complaints.</li>
        <li><b>Service providers</b> who run parts of the service for us: our database and sign-in provider (Supabase), our website host (Vercel), and, when load suggestions use AI, an AI provider that processes the description you typed. They may only use it to provide their service to us. Maps are loaded from OpenStreetMap, which sees your internet address like any website.</li>
        <li><b>The police or courts</b>, only when the law requires it.</li>
      </ul>

      <h2>4. How long we keep it</h2>
      <ul>
        <li>Bookings: 2 years after the move, for accounting and disputes. After that, names, phone numbers and addresses are deleted and only anonymous totals are kept.</li>
        <li>Load descriptions: 12 months.</li>
        <li>Driver accounts: while you drive with us, and 2 years after you leave.</li>
      </ul>

      <h2>5. How we protect it</h2>
      <p>Information is sent over encrypted connections and stored in a secured database. Access is limited by role: customers&apos; details are hidden from drivers until they accept a job, and only admins can see all bookings. Drivers agree not to save or share customer details.</p>

      <h2>6. Your rights</h2>
      <p>You can ask us to show you the information we hold about you, correct it, delete it, or stop using it. We will reply within 30 days. We may need to keep some records the law requires, and will tell you if so. To make a request, {contactLine()}.</p>
      <p>If you are not happy with how we handle your information, you can complain to the Nigeria Data Protection Commission (NDPC).</p>

      <h2>7. Changes</h2>
      <p>If we change this notice we will update the date at the top. We will not start using your information in a new way without telling you first.</p>
    </LegalPage>
  );
}
