// lib/whatsappBrief.ts
import type { RequestEntity } from '@/types';

const nl = '\n';

type BriefVariant = 'chef' | 'admin' | 'partner';

type BuildOptions = {
  variant?: BriefVariant;            // default: 'chef'
  brandName?: string;               // default: 'Chef Talents'
  hideCompany?: boolean;            // default: true (pour chef/partner)
  includeContacts?: boolean;         // force include contact bloc (admin)
  includeInternalId?: boolean;       // admin only
};

function clean(s?: string | number | null) {
  const t = String(s ?? '').trim();
  return t ? t : null;
}

function labelLine(label: string, value?: string | number | null) {
  const v = clean(value);
  return v ? `${label} ${v}` : null;
}

function joinLines(lines: Array<string | null | undefined>) {
  return lines.filter(Boolean).join(nl);
}

function formatDates(r: RequestEntity) {
  const start = clean(r.dates?.start);
  const end = clean(r.dates?.end);

  if (start && end) return `${start} → ${end}`;
  if (start) return start;
  if (end) return end;
  return null;
}

function humanMissionType(v?: string | null) {
  const x = (v || '').toLowerCase();
  if (!x) return null;
  if (x === 'residence') return 'résidence';
  if (x === 'yacht') return 'yacht';
  if (x === 'daily') return 'présence quotidienne';
  if (x === 'event') return 'événement';
  if (x === 'dinner') return 'dîner privé';
  return v;
}

function humanServiceLevel(v?: string | null) {
  const x = (v || '').toLowerCase();
  if (!x) return null;
  if (x === 'chef_only') return 'chef uniquement';
  if (x === 'chef_service') return 'chef + service';
  if (x === 'full_team') return 'équipe complète';
  return v;
}

function safeContactCompany(r: RequestEntity) {
  const company = clean(r.contact?.company);
  const name = clean(r.contact?.name);
  return company || name || null;
}

function buildHeader(variant: BriefVariant, brandName: string) {
  if (variant === 'admin') return `🛠️ DEMANDE — ${brandName} (interne)`;
  return `👨‍🍳 DEMANDE CHEF PRIVÉ — ${brandName}`;
}

/**
 * ✅ Brief principal
 * - variant="chef" = aucun contact client/conciergerie
 * - variant="admin" = peut inclure contacts
 * - variant="partner" = pareil que chef par défaut, mais ton wording peut évoluer
 */
export function buildWhatsappBrief(r: RequestEntity, opts: BuildOptions = {}) {
  const variant: BriefVariant = opts.variant ?? 'chef';
  const brandName = opts.brandName ?? 'Chef Talents';

  const hideCompanyDefault = variant !== 'admin';
  const hideCompany = opts.hideCompany ?? hideCompanyDefault;

  const includeContacts =
    opts.includeContacts ?? (variant === 'admin'); // admin: oui par défaut

  const header = buildHeader(variant, brandName);

  const top = joinLines([
    labelLine('📍 Lieu :', r.location),
    labelLine('📅 Dates :', formatDates(r)),
    labelLine('👥 Convives :', r.guestCount ? `${r.guestCount} pers` : null),
    labelLine('🎯 Mission :', humanMissionType(r.missionType)),
    labelLine('🧩 Service :', humanServiceLevel(r.serviceLevel)),
    labelLine('💰 Budget :', clean(r.budgetRange)),
  ]);

  const prefs = joinLines([
    clean(r.preferences?.cuisine) ? `🍽️ Style culinaire :${nl}${clean(r.preferences?.cuisine)}` : null,
    clean(r.preferences?.allergies) ? `⚠️ Restrictions / allergies :${nl}${clean(r.preferences?.allergies)}` : null,
    clean(r.preferences?.languages) ? `🗣️ Langues souhaitées :${nl}${clean(r.preferences?.languages)}` : null,
  ]);

  // notes = brief complet (tu as dit que tu récupères maintenant tout le global brief ici)
  const notes = clean(r.notes) ? `📝 Brief :${nl}${clean(r.notes)}` : null;

  // bloc contact (uniquement admin, et jamais exposé chef/partner)
  const contactBlock =
    includeContacts
      ? joinLines([
          safeContactCompany(r) && !hideCompany ? `🏢 Contact : ${safeContactCompany(r)}` : null,
          clean(r.contact?.email) ? `✉️ Email : ${clean(r.contact?.email)}` : null,
          clean(r.contact?.phone) ? `📞 Téléphone : ${clean(r.contact?.phone)}` : null,
        ])
      : null;

  const footerChef = joinLines([
    `Votre profil a retenu mon attention pour cette demande.`,
    ``,
    `Seriez-vous disponible sur ces dates ?`,
    `Est-ce que le tarif vous convient ?`,
    ``,
    `Si oui, je présente votre profil au client au plus vite.`,
    ``,
    `Répondez ici avec : dispo + tarif + éventuelles questions.`,
    ``,
    `—`,
    `${brandName}`,
  ]);

  const footerAdmin = joinLines([
    opts.includeInternalId ? `🆔 Request ID: ${r.id}` : null,
    `—`,
    `${brandName} — interne`,
  ]);

  const footerPartner = joinLines([
    `Votre profil a retenu mon attention pour cette demande.`,
    ``,
    `Pouvez-vous me confirmer : dispo + tarif ?`,
    ``,
    `—`,
    `${brandName}`,
  ]);

  const footer =
    variant === 'admin' ? footerAdmin : variant === 'partner' ? footerPartner : footerChef;

  return joinLines([
    header,
    '—',
    top,
    prefs ? `—${nl}${prefs}` : null,
    notes ? `—${nl}${notes}` : null,
    contactBlock ? `—${nl}${contactBlock}` : null,
    '—',
    footer,
  ]);
}

/** Helpers pratiques */
export function buildWhatsappBriefForChef(r: RequestEntity, brandName?: string) {
  return buildWhatsappBrief(r, { variant: 'chef', brandName, hideCompany: true, includeContacts: false });
}

export function buildWhatsappBriefForAdmin(r: RequestEntity, brandName?: string) {
  return buildWhatsappBrief(r, { variant: 'admin', brandName, hideCompany: false, includeContacts: true, includeInternalId: true });
}

export function buildWhatsappBriefForPartner(r: RequestEntity, brandName?: string) {
  return buildWhatsappBrief(r, { variant: 'partner', brandName, hideCompany: true, includeContacts: false });
}

// Ouvre WhatsApp (web/app) avec le message prérempli
export function openWhatsappWithText(text: string, phoneE164?: string | null) {
  const encoded = encodeURIComponent(text);

  const url = phoneE164
    ? `https://wa.me/${phoneE164.replace(/\D/g, '')}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, '_blank', 'noopener,noreferrer');
}
