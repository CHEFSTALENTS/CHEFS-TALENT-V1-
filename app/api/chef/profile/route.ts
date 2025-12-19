import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { auth } from "@/services/storage";

// GET -> récupérer le profil
export async function GET() {
  const user = auth.getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("chef_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // PGRST116 = no rows returned
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || null);
}

// PUT -> upsert profil
export async function PUT(req: Request) {
  const user = auth.getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.json();

  const payload = {
    user_id: user.id,
    email: user.email,
    profile: body.profile ?? body, // accepte {profile} ou profil direct
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("chef_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
