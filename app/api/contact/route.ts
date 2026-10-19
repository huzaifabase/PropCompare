import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validators";
import { createServiceClient } from "@/lib/supabase";
import { hashIp } from "@/lib/format";

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
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
    }
    const { website, ...data } = parsed.data;
    const isSpam = Boolean(website && website.length > 0); // honeypot filled
    const sb = createServiceClient();
    const salt = process.env.IP_HASH_SALT || "propcompare";
    const { error } = await sb.from("contact_submissions").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      subject: data.subject,
      message: data.message,
      ip_hash: await hashIp(ip, salt),
      is_spam: isSpam,
    });
    if (error) throw error;
    // NOTE: email notification to CONTACT_NOTIFY_EMAIL is not wired up yet.
    // Configure RESEND_API_KEY + CONTACT_NOTIFY_EMAIL to enable it (see DEPLOYMENT.md).
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact error", e);
    return NextResponse.json({ error: "Could not send your message right now." }, { status: 500 });
  }
}
