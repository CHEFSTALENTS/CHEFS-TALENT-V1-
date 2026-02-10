// lib/whatsappBrief.ts
import type { RequestEntity } from '@/types';

const nl = '\n';

function clean(s?: string | null) {
  const t = String(s ?? '').trim();
  return t ? t : null;
}

function labelLine(label: string, value?: string | number | null) {
  const v = clean(value as any);
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

export function buildWhatsappBrief(r: RequestEntity) {
  const header = `👨‍🍳 DEMANDE CHEF PRIVÉ — CHEF TALENTS`;

  const top = joinLines([
    labelLine('📍 Lieu :', r.location),
    labelLine('📅 Dates :', formatDates(r)),
    labelLine('👥 Convives :', r.guestCount ? `${r.guestCount} pers` : null),
    labelLine('🎯 Mission :', clean(r.missionType) || null),
    labelLine('🧩 Service :', clean(r.serviceLevel) || null),
    labelLine('💰 Budget :', clean(r.budgetRange) || null),
  ]);

  const prefs = joinLines([
    clean(r.preferences?.cuisine) ? `🍽️ Style culinaire :${nl}${r.preferences?.cuisine}` : null,
    clean(r.preferences?.allergies) ? `⚠️ Restrictions / allergies :${nl}${r.preferences?.allergies}` : null,
    clean(r.preferences?.languages) ? `🗣️ Langues souhaitées :${nl}${r.preferences?.languages}` : null,
  ]);

  const notes = clean(r.notes)
    ? `📝 Brief :${nl}${r.notes}`
    : null;


 const footer = joinLines([
  `Votre profil a retenu toute notre attention pour cette demande.`,
  ``,
  `Seriez-vous disponible sur ces dates ?`,
  `Est-ce que le budget vous convient ?`,
  ``,
  `Si oui, nous pourrons présenter votre profil au client très rapidement.`,
  ``,
  `—`,
  `Chef Talents`,
]);

return joinLines([
  header,
  '—',
  top,
  prefs ? `—${nl}${prefs}` : null,
  notes ? `—${nl}${notes}` : null,
  '—',
  footer,
]);
}

// Ouvre WhatsApp (web/app) avec le message prérempli
export function openWhatsappWithText(text: string, phoneE164?: string | null) {
  const encoded = encodeURIComponent(text);

  // Si tu as le téléphone du chef plus tard: wa.me/<phone>?text=...
  const url = phoneE164
    ? `https://wa.me/${phoneE164.replace(/\D/g, '')}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, '_blank', 'noopener,noreferrer');
}
