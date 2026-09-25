import { NextResponse } from "next/server";
import { loadPricing } from "@/lib/pricing-db";

// Public price list the booking form uses to show live quotes.
export async function GET() {
  return NextResponse.json(await loadPricing(), {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
