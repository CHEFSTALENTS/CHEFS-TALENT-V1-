import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function computeTermsAccepted(profile: any): boolean {
  if (!profile) return false;

  // ✅ cas simples
  if (profile.termsAccepted === true) return true;
  if (profile.terms_accepted === true) return true;

  // ✅ cas date/ts (accepté si une date/ts existe)
  const at =
    profile.termsAcceptedAt ??
    profile.terms_accepted_at ??
    profile.termsAccepted_at ??
    profile.terms_acceptedAt;

  if (typeof at === "string" && at.trim().length > 0) return true;
  if (typeof at === "number" && at > 0) return true;

  // ✅ cas version (si tu stockes une version acceptée)
  const v =
    profile.termsAcceptedVersion ??
    profile.terms_accepted_version ??
    profile.terms_version;

  if (typeof v === "string" && v.trim().length > 0) return true;
  if (typeof v === "number" && v > 0) return true;

  return false;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chef_profiles")
    .select("profile")
    .eq("user_id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profile = (data?.profile as any) ?? null;

  const status = profile?.status ?? null;
  const termsAccepted = computeTermsAccepted(profile);

  return NextResponse.json({
    status,
    termsAccepted,
  });
}
