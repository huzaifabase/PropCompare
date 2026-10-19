import { NextRequest, NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validators";
import { createServiceClient } from "@/lib/supabase";

// Simple in-memory rate limiter (per-IP). For production scale use Redis/Upstash.
const hits = new Map<string, number[]>();
function rateLimited(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > limit;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
    }
    const body = await req.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
    }
    const sb = createServiceClient();
    const { error } = await sb.from("newsletter_subscribers").insert({
      email: parsed.data.email.toLowerCase(),
      consent: true,
      source: "website",
    });
    if (error) {
      // 23505 = unique violation → already subscribed; don't leak, treat as success
      if (error.code === "23505") return NextResponse.json({ ok: true });
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("newsletter error", e);
    return NextResponse.json({ error: "Could not subscribe right now." }, { status: 500 });
  }
}
