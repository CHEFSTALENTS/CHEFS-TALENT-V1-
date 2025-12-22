import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/chef/profile?id=UUID
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chef_profiles")
    .select("user_id,email,profile,created_at,updated_at")
    .eq("user_id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // On renvoie directement le JSON profile (ce que ton front attend)
  return NextResponse.json({ profile: data?.profile ?? null });
}

async function upsertProfile(req: Request) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();

  const id = body?.id || body?.profile?.id;
  const email = body?.email || body?.profile?.email || null;
  const profile = body?.profile || body;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const payload = {
    user_id: id,
    email: email ?? null, 
    profile,: profile ?? {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("chef_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id,email,profile,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data.profile });
}

export async function POST(req: Request) {
  return upsertProfile(req);
}
export async function PUT(req: Request) {
  return upsertProfile(req);
}
