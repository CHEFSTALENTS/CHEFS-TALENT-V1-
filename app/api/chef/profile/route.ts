import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isProfileCompleteForValidation } from '@/lib/profileCompletion';
import { requireChefOr401 } from '@/lib/auth/requireChef';

/**
 * GET /api/chef/profile
 * -> { profile: object | null }
 *
 * Auth: Bearer token Supabase. L'`id` query éventuel est ignoré — la
 * source de vérité est `auth.user.id`.
 */
export async function GET(req: Request) {
  const auth = await requireChefOr401(req);
  if (auth instanceof NextResponse) return auth;
  const id = auth.user.id;

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
  const auth = await requireChefOr401(req);
  if (auth instanceof NextResponse) return auth;
  const id = auth.user.id; // SOURCE DE VÉRITÉ — jamais issu du body

  const supabase = getSupabaseAdmin();
  const body = await req.json();

  // Supporte :
  // 1) { id, email?, profile }
  // 2) { profile: { id, email, ... } }
  // 3) directement { id, email, ... } (profil brut)
  // Note : tout `id` / `user_id` reçu via le body est ignoré ; on utilise
  // exclusivement `auth.user.id` issu du token Supabase.
  const email = body?.email ?? body?.profile?.email ?? null;
  const profile = body?.profile ?? body;
// ✅ auto-transition draft -> pending_validation si profil éligible
const currentStatus = String((profile as any)?.status ?? 'draft');
const { ok } = isProfileCompleteForValidation(profile);

const nextStatus =
  currentStatus === 'draft' && ok ? 'pending_validation' : currentStatus;

const profileForDb =
  profile && typeof profile === 'object'
    ? { ...profile, status: nextStatus, updatedAt: new Date().toISOString() }
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
