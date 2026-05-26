// lib/portfolio/buildFromProfile.ts
//
// Adapter : transforme le profil brut Supabase d'un chef en données prêtes
// pour le template Portfolio v2 (lib/portfolio/templateV2.ts).
//
// Logique : on remplit ce qu'on peut depuis le profil. Pour les champs
// éditoriaux (headline, subtitle, why, quote) absents du modèle de données
// chef, on dérive intelligemment depuis la bio ou on met un placeholder
// éditorial neutre.

import type { PortfolioV2Input } from './templateV2';

const MISSION_LABELS: Record<string, string> = {
  yacht: 'Yacht',
  villa: 'Villa privée',
  chalet: 'Chalet',
  residence: 'Résidence',
  event: 'Événement privé',
  daily: 'Présence quotidienne',
  private: 'Chef privé',
  dinner: 'Dîner ponctuel',
  one_shot: 'Dîner ponctuel',
  one_shot_dinner: 'Dîner ponctuel',
  longue_duree: 'Mission longue durée',
  long_term: 'Mission longue durée',
  saisonnier: 'Saisonnier',
  permanent: 'Placement permanent',
};

function clean(v: any): string {
  return String(v ?? '').trim();
}

function toArr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === 'string') return v.split(/,|;/).map((s) => s.trim()).filter(Boolean);
  return [];
}

/**
 * Hash simple → code anonymisé type CT-XXX (3 chiffres) basé sur l'email.
 * Stable : un même email donne toujours le même code.
 */
function anonymizeCode(email: string): string {
  const s = email.toLowerCase().trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  const n = (Math.abs(h) % 900) + 100; // 100-999
  return `CT-${n}`;
}

/**
 * Splitte une bio en lead phrase + paragraphes.
 * Heuristique : 1ère phrase = lead, le reste split en moitiés.
 */
function splitBio(bio: string): { lead: string; p1: string; p2: string } {
  const cleaned = bio.replace(/\s+/g, ' ').trim();
  if (!cleaned) return { lead: '', p1: '', p2: '' };

  // Sépare sur les phrases (point/!/?)
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) return { lead: '', p1: cleaned, p2: '' };
  if (sentences.length === 1) return { lead: sentences[0], p1: '', p2: '' };

  const lead = sentences[0];
  const rest = sentences.slice(1);
  const half = Math.ceil(rest.length / 2);
  return {
    lead,
    p1: rest.slice(0, half).join(' '),
    p2: rest.slice(half).join(' '),
  };
}

/**
 * Extrait une phrase utilisable comme citation. Préfère une phrase de
 * la bio qui contient "je", "mon", "j'", "ma" (ton personnel).
 * Fallback : phrase la plus longue de la bio.
 */
function extractQuote(bio: string): string {
  const cleaned = bio.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter((s) => s.length > 25 && s.length < 220);
  if (sentences.length === 0) return '';
  const personal = sentences.find((s) => /\b(je |j['']|mon |ma |mes )\b/i.test(s));
  return personal || sentences.reduce((a, b) => (a.length >= b.length ? a : b), '');
}

/**
 * Construit la liste des « dishes » (3-5) depuis les photos portfolio.
 * Préfère les URLs http(s). Tronque à 5.
 */
function buildDishes(profilePhotos: string[]): Array<{ url: string; name: string }> {
  return profilePhotos
    .filter((u) => /^https?:\/\//.test(u))
    .slice(0, 5)
    .map((url, i) => ({ url, name: `Dish ${i + 1}` }));
}

export type RawProfileInput = {
  email: string;
  profile: any;
};

/**
 * Mappe le profil brut sur l'entrée du template v2.
 * Tous les fallbacks éditoriaux sont neutres et premium-tone.
 */
export function buildPortfolioV2InputFromProfile(input: RawProfileInput): PortfolioV2Input {
  const p = input.profile || {};

  // --- Identité de base ---
  const bio = clean(p.bio || p.about || p.description);
  const languages = toArr(p.languages).map((l) => l.toUpperCase().slice(0, 2)).filter(Boolean);
  const cuisines = toArr(p.cuisines || p.specialties);
  const missionTypesRaw = toArr(p.missionTypes || p.formats || p.profileType);
  const missionTypes = missionTypesRaw
    .map((m) => MISSION_LABELS[m.toLowerCase()] || m)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const years = typeof p.yearsExperience === 'number' ? p.yearsExperience : null;
  const chefPhotoUrl = clean(p.avatarUrl || p.photoUrl || p.avatar || p.photo);

  // --- Photos portfolio → dishes + cover ---
  const allPhotos: string[] = [
    ...toArr(p.images),
    ...toArr(p.photos),
    ...toArr(p.gallery),
    ...toArr(p.portfolioImages),
    ...toArr(p.portfolioPhotos),
    ...toArr(p.media),
  ]
    .filter((u) => /^https?:\/\//.test(u))
    .filter((u, i, arr) => arr.indexOf(u) === i);

  // Cover = première photo (différente du portrait si possible)
  const coverImageUrl = allPhotos.find((u) => u !== chefPhotoUrl) || allPhotos[0] || chefPhotoUrl || '';
  // Dishes = les photos suivantes (sans la cover, sans le portrait)
  const dishesPool = allPhotos.filter((u) => u !== coverImageUrl && u !== chefPhotoUrl);
  const dishes = buildDishes(dishesPool.length >= 3 ? dishesPool : allPhotos);

  // --- Bio split ---
  const { lead, p1, p2 } = splitBio(bio);

  // --- Disponibilité ---
  const availObj = p.availability;
  const availability = availObj?.nextAvailableFrom
    ? `From ${new Date(availObj.nextAvailableFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : availObj?.availableNow === true
    ? 'Immediate'
    : availObj?.availableNow === false
    ? 'On request'
    : 'On request';

  // --- Fallbacks éditoriaux pour les champs absents du modèle ---
  const referenceCode = anonymizeCode(input.email);

  // Headline : si bio existe, on prend une formulation neutre.
  // Si pas de bio, fallback éditorial.
  const headlineFromCuisine = cuisines[0]
    ? `A ${cuisines[0].toLowerCase()}<br/>storyteller, <em>through<br/>&amp; through.</em>`
    : `A culinary<br/>storyteller, <em>through<br/>&amp; through.</em>`;
  const headlineTitleHtml = headlineFromCuisine;

  // Subtitle : si bio → première phrase tronquée. Sinon fallback.
  const coverSubtitle = lead
    ? lead.slice(0, 180) + (lead.length > 180 ? '…' : '')
    : `${years || 'Years of'} ${years ? 'years' : ''} refining the language of taste, presence, and discretion at the highest standards.`.trim();

  // Bio lead enrichi avec span accent
  const bioLeadHtml = lead
    ? `A chef whose plates feel both <span class="ct-accent">precise and generous</span>, ${lead.charAt(0).toLowerCase() + lead.slice(1)}`
    : `A chef whose plates feel both <span class="ct-accent">precise and generous</span> — a quiet talent, selected by our committee for the rare consistency of their work.`;

  const bioParagraph1 = p1 ||
    (years
      ? `With ${years} years of experience across private residences, yacht missions and event catering, this chef brings both technical precision and a calm presence to every service.`
      : `Selected by our committee for the consistency of their craft, this chef brings both technical precision and a calm presence to every service — from intimate dinners to season-long residencies.`);

  const bioParagraph2 = p2 ||
    `Equally fluent in indulgence and restraint, they adapt their menus to the rhythm of the household, sourcing locally when possible, importing on demand when required, and always tailoring each plate to the guests in front of them.`;

  // Why : textes éditoriaux par défaut (toujours présents)
  const whyParagraph1 = `We selected this chef for the rare combination of technical mastery, hospitality instinct, and discretion. Beyond the verified CV, our committee tested their ability to deliver under real conditions — calm under pressure, generous in service, precise in execution.`;
  const whyParagraph2 = `Beyond the craft, what convinced us was the human dimension: a chef who reads the room, anticipates needs without intruding, and signs an NDA without hesitation. The kind of profile we trust with our most demanding clients.`;

  const chefQuote = extractQuote(bio) ||
    'I always work with local and small suppliers, because the integrity of the produce is the first promise we make to our guests.';

  // Si moins de 3 dishes disponibles, on essaye de remplir avec le portrait
  // ou avec la cover pour atteindre le minimum visuel.
  let finalDishes = dishes;
  if (finalDishes.length < 3) {
    const padding: Array<{ url: string; name: string }> = [];
    if (coverImageUrl && !finalDishes.find((d) => d.url === coverImageUrl)) {
      padding.push({ url: coverImageUrl, name: 'Signature' });
    }
    if (chefPhotoUrl && !finalDishes.find((d) => d.url === chefPhotoUrl)) {
      padding.push({ url: chefPhotoUrl, name: 'In the kitchen' });
    }
    finalDishes = [...finalDishes, ...padding].slice(0, 3);
  }

  return {
    referenceCode,
    coverImageUrl: coverImageUrl || chefPhotoUrl,
    chefPhotoUrl: chefPhotoUrl || coverImageUrl,
    headlineTitleHtml,
    coverSubtitle,
    bioLeadHtml,
    bioParagraph1,
    bioParagraph2,
    experienceYears: years,
    languages,
    availability,
    culinaryTags: cuisines,
    missionTags: missionTypes,
    whyParagraph1,
    whyParagraph2,
    dishes: finalDishes,
    chefQuote,
  };
}
