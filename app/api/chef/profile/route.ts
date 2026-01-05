import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isProfileCompleteForValidation } from '@/lib/profileCompletion';

/**
 * GET /api/chef/profile?id=UUID
 * -> { profile: object | null }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? searchParams.get("userId");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });


  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chef_profiles")
    .select("user_id,email,profile,created_at,updated_at")
    .eq("user_id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data?.profile ?? null });
}

async function upsertProfile(req: Request) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();

  // Supporte :
  // - { id, email?, profile }
  // - { userId, email?, profile }
  // - { user_id, email?, profile }
  // - { profile: { id | userId | user_id, email, ... } }
  // - { id, email, ... } (profil brut)
  const id =
    body?.id ??
    body?.userId ??
    body?.user_id ??
    body?.profile?.id ??
    body?.profile?.userId ??
    body?.profile?.user_id;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const email =
    body?.email ??
    body?.profile?.email ??
    null;

  // ✅ On ne stocke QUE le profil
  // Si body.profile existe -> c’est la source de vérité
  // Sinon -> on enlève les clés wrapper connues
  let profileRaw = body?.profile ?? body;

  if (!body?.profile && profileRaw && typeof profileRaw === "object") {
    // enlève les wrappers
    const { id, userId, user_id, email, pending, ...rest } = profileRaw as any;
    profileRaw = rest;
  }

  // ✅ auto-transition draft -> pending_validation si profil éligible
  const currentStatus = String((profileRaw as any)?.status ?? "draft");
  const { ok } = isProfileCompleteForValidation(profileRaw);

  const nextStatus =
    currentStatus === "draft" && ok ? "pending_validation" : currentStatus;

  const profileForDb =
    profileRaw && typeof profileRaw === "object"
      ? { ...profileRaw, status: nextStatus, updatedAt: new Date().toISOString() }
      : { status: nextStatus, updatedAt: new Date().toISOString() };

  const payload = {
    user_id: id,
    email,
    profile: profileForDb,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("chef_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id,email,profile,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data?.profile ?? null });
}

export async function POST(req: Request) {
  return upsertProfile(req);
}

export async function PUT(req: Request) {
  return upsertProfile(req);
}
