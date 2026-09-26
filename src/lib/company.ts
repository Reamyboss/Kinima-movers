// Business details shown in the terms, privacy notice and complaints policy.
// Fill these in before launch; empty values are left out of the pages.
export const COMPANY = {
  name: "Kinma Movers",
  registeredName: "", // e.g. the name on the CAC certificate
  phone: "",          // office phone / WhatsApp for customers and drivers
  email: "",          // complaints and privacy requests
  address: "Ikorodu, Lagos State, Nigeria",
};

// Bump when the terms change, so each booking records which version was agreed.
export const TERMS_VERSION = "2026-09-26.2";

export function contactLine(): string {
  const bits = [COMPANY.phone && `call or WhatsApp ${COMPANY.phone}`, COMPANY.email && `email ${COMPANY.email}`].filter(Boolean);
  return bits.length ? bits.join(" or ") : "contact the Kinma Movers office";
}
