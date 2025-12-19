import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/chef/profile?id=UUID
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chef_profiles")
    .select("*")
.eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

// POST ou PUT -> upsert
async function upsertProfile(req: Request) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();

  const id = body?.id || body?.profile?.id;
  const email = body?.email || body?.profile?.email;
  const profile = body?.profile || body; // objet complet profil

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const payload = {
  id: id,                         // ✅ correspond à ta colonne "id"
  email: email ?? null,
  profile: profile ?? {},         // ✅ ton JSON dans la colonne profile (jsonb)
  updated_at: new Date().toISOString(),
};
  const { data, error } = await supabase
    .from("chef_profiles")
.upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  return upsertProfile(req);
}

export async function PUT(req: Request) {
  return upsertProfile(req);
}
