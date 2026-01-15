// supabase/functions/weekly-onboarding-agent/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ChefRow = {
  user_id: string;
  email: string;
  profile: any;
  onboarding_last_message_at: string | null;
  onboarding_nudge_count: number | null;
  status?: string | null;
};

const TABLE = "chef_profiles";

// ---- small helpers ----
const MIN_PORTFOLIO_PHOTOS = 5;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function getPortfolioPhotosCount(p: any): number {
  const imgs = p?.images ?? p?.photos ?? p?.gallery ?? p?.portfolioImages ?? [];
  return Array.isArray(imgs) ? imgs.filter(Boolean).length : 0;
}

function pickBaseCity(p: any) {
  return safeStr(p?.location?.baseCity ?? p?.baseCity ?? p?.city);
}

function computeDashboardChecks(profile: any) {
  const p: any = profile ?? {};
  const bio = safeStr(p.bio ?? p.about ?? p.description);
  const years = p.yearsExperience ?? p.experienceYears ?? 0;

  const identityOk =
    !!safeStr(p.name) &&
    !!safeStr(p.phone) &&
    (!!safeStr(p.city) || !!safeStr(p.location?.baseCity) || !!safeStr(p.baseCity));

  const experienceOk = Number(years ?? 0) > 0 || bio.length >= 80;

  const photoCount = getPortfolioPhotosCount(p);
  const portfolioOk = photoCount >= MIN_PORTFOLIO_PHOTOS;

  const pricing = p.pricing ?? null;
  const hasPricing =
    !!pricing &&
    (Number(pricing?.residence?.dailyRate ?? 0) > 0 ||
      Number(pricing?.event?.pricePerPerson ?? 0) > 0 ||
      Number(p.dailyRate ?? 0) > 0 ||
      Number(p.pricePerPerson ?? 0) > 0);

  const mobilityOk =
    !!safeStr(p.location?.baseCity) ||
    !!safeStr(p.baseCity) ||
    p.location?.internationalMobility === true ||
    (p.location?.coverageZones?.length ?? 0) > 0 ||
    (p.coverageZones?.length ?? 0) > 0;

  const preferencesOk = (p.cuisines?.length ?? 0) >= 1 && (p.languages?.length ?? 0) >= 1;

  // availability est "true" dans ton dashboard aujourd’hui => on n’en fait pas un bloquant
  return {
    identityOk,
    experienceOk,
    portfolioOk,
    hasPricing,
    mobilityOk,
    preferencesOk,
    photoCount,
  };
}

function buildNextAction(profile: any) {
  const c = computeDashboardChecks(profile);

  // Priorité = exactement ton UX dashboard (ce qui bloque le plus)
  if (!c.identityOk) return { title: "Compléter identité", route: "/chef/identity", reason: "Nom, téléphone, ville" };
  if (!c.portfolioOk) return { title: "Compléter portfolio", route: "/chef/portfolio", reason: `Min ${MIN_PORTFOLIO_PHOTOS} photos` };
  if (!c.hasPricing) return { title: "Renseigner les tarifs", route: "/chef/pricing", reason: "Prix / jour ou prix / personne" };
  if (!c.mobilityOk) return { title: "Définir zone & mobilité", route: "/chef/mobility", reason: "Ville, zones, déplacements" };
  if (!c.preferencesOk) return { title: "Ajouter préférences", route: "/chef/preferences", reason: "Cuisines + langues" };
  if (!c.experienceOk) return { title: "Compléter expérience", route: "/chef/experience", reason: "Bio + expérience" };

  return null; // profil “complet” selon ton dashboard
}

function shouldNudge(row: ChefRow) {
  const st = safeStr((row as any).status ?? row.profile?.status);
  // On ne relance pas si déjà validé/actif
  if (st === "approved" || st === "active") return false;

  const last = row.onboarding_last_message_at ? new Date(row.onboarding_last_message_at).getTime() : 0;
  if (!last) return true;
  return Date.now() - last >= ONE_WEEK_MS;
}

// ---- Email sender (Resend) ----
async function sendEmail(to: string, subject: string, html: string) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Chef Talents <onboarding@chef-talents.com>";

  if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Resend error: ${res.status} ${t}`);
  }
}

function onboardingEmailTemplate(args: {
  firstName?: string;
  nextTitle: string;
  nextRoute: string;
  reason: string;
}) {
  const name = safeStr(args.firstName) || "Chef";
  const link = `https://chefstalents.com${args.nextRoute}`;

  return {
    subject: `Chef Talents — une étape rapide pour activer votre profil`,
    html: `
      <div style="font-family:ui-sans-serif,system-ui;line-height:1.5">
        <p>Bonjour ${name},</p>
        <p>
          Pour finaliser votre onboarding, il vous manque une étape :
          <strong>${args.nextTitle}</strong> <span style="color:#666">(${args.reason})</span>.
        </p>
        <p>
          <a href="${link}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#111;color:#fff;text-decoration:none">
            ${args.nextTitle}
          </a>
        </p>
        <p style="color:#666;font-size:13px;margin-top:18px">
          On ne relance pas plus d’une fois par semaine pour éviter de vous spammer.
        </p>
        <p>— Chef Talents</p>
      </div>
    `,
  };
}

serve(async (req) => {
  // (optionnel) protéger l’endpoint si tu le déclenches via HTTP cron
  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  if (CRON_SECRET) {
    const got = req.headers.get("x-cron-secret") || "";
    if (got !== CRON_SECRET) return new Response("Unauthorized", { status: 401 });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // 1) Charger chefs à relancer (on filtre soft côté code + throttle)
  const { data, error } = await supabase
    .from(TABLE)
    .select("user_id,email,profile,onboarding_last_message_at,onboarding_nudge_count,status")
    .limit(500);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const rows = (data ?? []) as ChefRow[];

  let scanned = 0;
  let nudged = 0;
  const details: any[] = [];

  for (const row of rows) {
    scanned++;

    const profile = row.profile ?? {};
    const email = safeStr(row.email || profile.email);
    if (!email) continue;

    if (!shouldNudge(row)) continue;

    const next = buildNextAction(profile);
    if (!next) continue; // rien à faire

    // 2) Envoyer email (WhatsApp plus tard)
    const firstName = safeStr(profile.firstName ?? profile.user_metadata?.firstName);
    const tpl = onboardingEmailTemplate({
      firstName,
      nextTitle: next.title,
      nextRoute: next.route,
      reason: next.reason,
    });

    try {
      await sendEmail(email, tpl.subject, tpl.html);

      // 3) Log en DB
      const nowIso = new Date().toISOString();
      await supabase
        .from(TABLE)
        .update({
          onboarding_last_message_at: nowIso,
          onboarding_last_action: next.route,
          onboarding_nudge_count: (row.onboarding_nudge_count ?? 0) + 1,
        })
        .eq("user_id", row.user_id);

      nudged++;
      details.push({ email, action: next.route, ok: true });
    } catch (e) {
      details.push({ email, action: next.route, ok: false, error: String(e?.message ?? e) });
    }
  }

  return new Response(JSON.stringify({ ok: true, scanned, nudged, details }), {
    headers: { "Content-Type": "application/json" },
  });
});
