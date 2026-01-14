// app/api/chef/onboarding/evaluate/route.ts
import { NextResponse } from "next/server";

type ChefPayload = any;

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function hasText(s?: string | null, minLen = 3) {
  return typeof s === "string" && s.trim().length >= minLen;
}

function scoreChef(chef: ChefPayload) {
  const missing: string[] = [];
  const redFlags: string[] = [];
  const nextActions: Array<{ title: string; route: string; priority: "high" | "medium" | "low" }> = [];

  // --- Completeness (40) ---
  let completeness = 0;

  const identityOk =
    hasText(chef.firstName) && hasText(chef.lastName) && hasText(chef.email) && hasText(chef.phone, 8);

  if (identityOk) completeness += 10;
  else {
    missing.push("Identité incomplète (prénom/nom/email/téléphone)");
    nextActions.push({ title: "Compléter identité", route: "/chef/identity", priority: "high" });
  }

  const baseCity = chef.baseCity || chef.location?.baseCity;
  const radius = chef.travelRadiusKm ?? chef.location?.travelRadiusKm;
  const intl = chef.internationalMobility ?? chef.location?.internationalMobility;

  if (hasText(baseCity) && typeof radius === "number") completeness += 10;
  else {
    missing.push("Zone & mobilité (ville + rayon)");
    nextActions.push({ title: "Compléter zone & mobilité", route: "/chef/mobility", priority: "high" });
  }

  const cuisinesOk = Array.isArray(chef.cuisines) && chef.cuisines.length >= 3;
  const specsOk = Array.isArray(chef.specialties) && chef.specialties.length >= 3;

  if (cuisinesOk && specsOk) completeness += 10;
  else {
    if (!cuisinesOk) missing.push("Cuisines (min 3)");
    if (!specsOk) missing.push("Spécialités (min 3)");
    nextActions.push({ title: "Compléter expérience & préférences", route: "/chef/preferences", priority: "medium" });
  }

  const avatarOk = hasText(chef.avatarUrl) || hasText(chef.photoUrl);
  const photosCount = Array.isArray(chef.images) ? chef.images.length : 0;
  if (avatarOk && photosCount >= 6) completeness += 10;
  else {
    if (!avatarOk) missing.push("Photo de profil (avatar)");
    if (photosCount < 6) missing.push("Portfolio (min 6 photos)");
    nextActions.push({ title: "Compléter portfolio", route: "/chef/portfolio", priority: "high" });
  }

  // --- Matchability (30) ---
  let matchability = 0;

  const pricing = chef.pricing;
  const hasResidenceRate = pricing?.residence?.dailyRate && pricing?.residence?.currency;
  const hasEventRate = pricing?.event?.pricePerPerson;

  if (hasResidenceRate || hasEventRate) matchability += 15;
  else {
    missing.push("Tarifs (résidence et/ou event)");
    nextActions.push({ title: "Renseigner les tarifs", route: "/chef/pricing", priority: "high" });
  }

  const langs = Array.isArray(chef.languages) ? chef.languages : [];
  if (langs.length >= 2) matchability += 5;
  else {
    missing.push("Langues (min 2 recommandé)");
    nextActions.push({ title: "Ajouter les langues", route: "/chef/identity", priority: "low" });
  }

  const years = chef.yearsExperience;
  if (typeof years === "number" && years >= 2) matchability += 5;
  else {
    missing.push("Années d’expérience");
    nextActions.push({ title: "Ajouter l’expérience", route: "/chef/experience", priority: "medium" });
  }

  const missionTypes = Array.isArray(chef.missionTypes) ? chef.missionTypes : [];
  const environments = Array.isArray(chef.environments) ? chef.environments : [];
  if (missionTypes.length > 0 && environments.length > 0) matchability += 5;
  else {
    missing.push("Types de mission / environnements");
    nextActions.push({ title: "Définir types de missions", route: "/chef/preferences", priority: "medium" });
  }

  // --- Premium quality (30) ---
  let premium = 0;

  const bio = chef.bio || "";
  if (bio.trim().length >= 350) premium += 10;
  else {
    missing.push("Bio (plus détaillée recommandée)");
    nextActions.push({ title: "Améliorer la bio", route: "/chef/identity", priority: "medium" });
  }

  const certs = chef.certifications?.items || [];
  const hasHaccp = Array.isArray(certs) && certs.some((c: string) => c.toLowerCase().includes("haccp"));
  const wantsYacht = Boolean(pricing?.flags?.yacht) || missionTypes.includes("yacht");

  if (hasHaccp) premium += 5;
  else redFlags.push("HACCP non renseigné (recommandé)");

  if (!wantsYacht) {
    premium += 5; // pas requis
  } else {
    const hasStcw = Array.isArray(certs) && certs.some((c: string) => c.toLowerCase().includes("stcw"));
    if (hasStcw) premium += 5;
    else redFlags.push("Yacht activé mais STCW absent (à vérifier)");
  }

  const hasWeb = hasText(chef.websiteUrl) || hasText(chef.website);
  const hasInsta = hasText(chef.instagramUrl) || hasText(chef.instagram);
  if (hasWeb) premium += 3;
  if (hasInsta) premium += 2;
  if (!hasWeb && !hasInsta) redFlags.push("Présence digitale absente (site/instagram)");

  if (chef.termsAccepted) premium += 5;
  else {
    redFlags.push("Conditions non acceptées");
    nextActions.push({ title: "Accepter les conditions", route: "/chef/terms", priority: "high" });
  }

  if (chef.status === "approved") premium += 5;

  const total = clamp(completeness + matchability + premium);

  // Deduplicate nextActions by route+title
  const seen = new Set<string>();
  const deduped = nextActions.filter((a) => {
    const k = `${a.route}|${a.title}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return {
    score: total,
    breakdown: { completeness, matchability, premium },
    missing: Array.from(new Set(missing)),
    redFlags,
    nextActions: deduped.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1)),
  };
}

function buildPitches(chef: ChefPayload) {
  const name = chef.name || `${chef.firstName || ""} ${chef.lastName || ""}`.trim();
  const baseCity = chef.baseCity || chef.location?.baseCity || "—";
  const radius = chef.travelRadiusKm ?? chef.location?.travelRadiusKm;
  const intl = chef.internationalMobility ?? chef.location?.internationalMobility;

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
    `${name} (niveau ${chef.seniorityLevel || "—"}, ${chef.yearsExperience || "—"} ans exp.) · ` +
    `${mobilityLine}. ` +
    (cuisines ? `Cuisine : ${cuisines}. ` : "") +
    (specs ? `Formats : ${specs}. ` : "") +
    (langs ? `Langues : ${langs}. ` : "") +
    (daily ? `Résidence : ${daily}€/jour. ` : "") +
    (ppp ? `Événement : dès ${ppp}€/pers.` : "");

  const pitchEN =
    `${name} (${chef.seniorityLevel || "senior"}, ${chef.yearsExperience || "—"}y exp.) · ` +
    `${mobilityLine}. ` +
    (cuisines ? `Cuisine: ${cuisines}. ` : "") +
    (specs ? `Formats: ${specs}. ` : "") +
    (langs ? `Languages: ${langs}. ` : "") +
    (daily ? `Residency: €${daily}/day. ` : "") +
    (ppp ? `Events: from €${ppp}/pp.` : "");

  return { pitchFR, pitchEN };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  // MVP: on accepte un chef payload direct (comme tu viens de coller)
  const chef = body?.chef as ChefPayload | undefined;

  if (!chef) {
    return NextResponse.json({ error: "Missing chef payload" }, { status: 400 });
  }

  const evaluation = scoreChef(chef);
  const pitches = buildPitches(chef);

  return NextResponse.json({
    chefId: chef.id,
    status: chef.status,
    evaluation,
    pitches,
  });
}
