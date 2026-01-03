import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // status source de vérité = table "chefs" OU "chef_users" selon ton schema
  // D'après tes captures, tu utilises ChefUser et status pending_validation/approved/active

  // 👉 ICI: adapte le nom de table si besoin
  const { data, error } = await supabase
    .from("chefs") // <-- si ta table s'appelle autrement, remplace
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ status: data?.status ?? null });
}
