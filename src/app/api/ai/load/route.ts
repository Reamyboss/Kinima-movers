import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";

// AI load assistant: the customer describes their load in their own words
// (English or Pidgin) and gets the right load size, helpers and a truck check.

const Suggestion = z.object({
  loadType: z.enum(["small", "household", "furniture", "full"]),
  helpers: z.number().int().min(0).max(4),
  tripsNeeded: z.number().int().min(1).max(10),
  summary: z.string().describe("One or two friendly sentences for the customer, plain English"),
  tips: z.array(z.string()).max(3).describe("Short packing or safety tips specific to this load"),
});

const SYSTEM = `You help customers of Kinma Movers, a mini-truck moving service in Lagos, Nigeria, describe their load.
Every truck is a Suzuki Carry: open flatbed about 2.4 m long and 1.4 m wide, up to about 1 tonne.
Customers may write in English or Nigerian Pidgin.

Choose loadType:
- small: boxes, bags, a few small items
- household: contents of a room or small shop, mixed items
- furniture: one or more big pieces (bed, sofa, wardrobe, fridge, freezer, generator)
- full: a whole flat or anything that fills the bed

Suggest loading helpers (0-4) based on heavy or awkward items; the driver helps too, so a single fridge needs 1.
tripsNeeded is how many Suzuki Carry trips the load will take; say more than 1 when it clearly will not fit.
Keep tips practical and specific (for example: strap the fridge upright, remove wardrobe doors). Never quote prices.`;

// Light per-visitor limit so the public endpoint can't run up the bill.
const hits = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 8;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooMany(ip)) return NextResponse.json({ error: "Please wait a few minutes before asking again." }, { status: 429 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "The AI assistant isn't switched on yet." }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const description = typeof body?.description === "string" ? body.description.trim().slice(0, 600) : "";
  if (description.length < 3) return NextResponse.json({ error: "Tell us what you're moving." }, { status: 400 });

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2000,
      output_config: { effort: "low", format: betaZodOutputFormat(Suggestion) },
      // Hands the request to another model if this one declines.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: description }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return NextResponse.json({ error: "We couldn't read that. Try listing the main items." }, { status: 422 });
    }
    const suggestion = response.parsed_output;
    await adminClient()?.from("ai_load_requests").insert({ description, suggestion });
    return NextResponse.json(suggestion);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "The assistant is busy. Please pick your load type below." }, { status: 429 });
    }
    console.error("ai load assistant failed", error);
    return NextResponse.json({ error: "The assistant is unavailable. Please pick your load type below." }, { status: 502 });
  }
}
