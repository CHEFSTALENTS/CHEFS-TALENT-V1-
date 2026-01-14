// app/api/chef/onboarding/evaluate/route.ts
import { NextResponse } from "next/server";
import { computeChefScore, type ChefProfile } from "@/lib/chefScore";

type Action = { title: string; route: string; priority: "high" | "medium" | "low" };

function actionsFromMissingKeys(keys: string[]): Action[] {
  const map: Record<string, Action> = {
    name: { title: "Compléter identité", route: "/chef/identity", priority: "high" },
    phone: { title: "Ajouter téléphone", route: "/chef/identity", priority: "high" },
    city: { title: "Compléter ville / base", route: "/chef/mobility", priority: "high" },
    bio: { title: "Compléter la bio", route: "/chef/identity", priority: "medium" },
    cuisines: { title: "Ajouter cuisines", route: "/chef/preferences", priority: "medium" },
    specialties: { title: "Ajouter spécialités", route: "/chef/preferences", priority: "medium" },
    languages: { title: "Ajouter langues", route: "/chef/identity", priority: "low" },
    portfolio: { title: "Ajouter photos portfolio", route: "/chef/portfolio", priority: "high" },
    mobility: { title: "Compléter mobilité", route: "/chef/mobility", priority: "high" },
  };

  const out = keys.map((k) => map[k]).filter(Boolean);

  const seen = new Set<string>();
  return out.filter((a) => {
    const id = `${a.route}|${a.title}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function buildPitches(chef: any) {
  const name =
    (chef.name?.trim?.() ? chef.name : `${chef.firstName || ""} ${chef.lastName || ""}`.trim()) || "Chef";

  const baseCity = chef.location?.baseCity ?? chef.baseCity ?? chef.city ?? "—";
  const radius = chef.location?.travelRadiusKm ?? chef.travelRadiusKm;
  const intl = chef.location?.internationalMobility ?? chef.internationalMobility;

  const cuisines = Array.isArray(chef.cuisines) ? chef.cuisines.slice(0, 5).join(", ") : "";
  const specs = Array.isArray(chef.specialties) ? chef.specialties.slice(0, 5).join(", ") : "";
  const langs = Array.isArray(chef.languages) ? chef.languages.join(", ") : "";

  const daily = chef.pricing?.residence?.dailyRate;
  const ppp = chef.pricing?.event?.pricePerPerson;

  const mobilityLine =
    `${baseCity}` +
    (typeof radius === "number" ? ` · rayon ${radius} km` : "") +
    (intl ? " · international" : "");

  const pitchFR =
    `${name} · ${mobilityLine}. ` +
    (cuisines ? `Cuisine : ${cuisines}. ` : "") +
    (specs ? `Formats : ${specs}. ` : "") +
    (langs ? `Langues : ${langs}. ` : "") +
    (daily ? `Résidence : ${daily}€/jour. ` : "") +
    (ppp ? `Événement : dès ${ppp}€/pers.` : "");

  const pitchEN =
    `${name} · ${mobilityLine}. ` +
    (cuisines ? `Cuisine: ${cuisines}. ` : "") +
    (specs ? `Formats: ${specs}. ` : "") +
    (langs ? `Languages: ${langs}. ` : "") +
    (daily ? `Residency: €${daily}/day. ` : "") +
    (ppp ? `Events: from €${ppp}/pp.` : "");

  return { pitchFR, pitchEN };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const chef = (body?.chef ?? null) as ChefProfile | null;
  if (!chef) {
    return NextResponse.json({ error: "Missing chef payload" }, { status: 400 });
  }

  const result = computeChefScore(chef);

  const missingKeys = result.rules.filter((r) => !r.ok).map((r) => r.key);
  const nextActions = actionsFromMissingKeys(missingKeys);

  return NextResponse.json({
    chefId: (chef as any).id ?? null,
    evaluation: {
      score: result.score,
      okWeight: result.okWeight,
      totalWeight: result.totalWeight,
      rules: result.rules,
      missingKeys,
      nextActions,
    },
    pitches: buildPitches(chef),
  });
}
