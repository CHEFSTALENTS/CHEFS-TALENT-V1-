export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'thomas@chef-talents.com';
const TABLE = 'chef_profiles';

function safeObj(v: any) {
  if (!v) return {};
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } }
  if (typeof v === 'object') return v;
  return {};
}

function normalizeProfile(raw: any) {
  const p = safeObj(raw);
  return safeObj(p.profile || p.data || p.user || p);
}

function toArr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === 'string') return v.split(/,|;/).map(s => s.trim()).filter(Boolean);
  return [];
}

function clean(v: any): string {
  return String(v ?? '').trim();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  const adminEmail = req.headers.get('x-admin-email');
  if (adminEmail?.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const chefEmail = decodeURIComponent(params.email);

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Missing env' }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: row, error } = await supabase
    .from(TABLE)
    .select('email,profile')
    .eq('email', chefEmail)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Chef not found' }, { status: 404 });

  const p = normalizeProfile(row.profile);

  // ── Données du profil ──────────────────────────────────────
  const bio         = clean(p.bio || p.about || p.description);
  const languages   = toArr(p.languages);
  const cuisines    = toArr(p.cuisines || p.specialties);
  const missionTypes = toArr(p.missionTypes || p.formats || p.profileType);
  const years       = p.yearsExperience ? String(p.yearsExperience) : null;
  const availability = clean(p.availability?.nextAvailableFrom
    ? `Disponible à partir du ${new Date(p.availability.nextAvailableFrom).toLocaleDateString('fr-FR')}`
    : p.availability?.availableNow === true ? 'Disponible immédiatement'
    : p.availability?.availableNow === false ? 'Sur demande'
    : p.availableFrom || '');
  const photoUrl    = clean(p.avatarUrl || p.photoUrl || p.avatar || p.photo || '');

  // Références anonymisées
  const references: string[] = toArr(p.references || p.experiences || p.background);

  // ── Génération HTML → PDF via API Puppeteer-like ──────────
  // On génère du HTML que l'on va renvoyer pour impression côté client
  // (Next.js serverless ne peut pas exécuter puppeteer)
  // → On retourne plutôt un HTML imprimable que le navigateur convertit en PDF

  const html = buildPortfolioHtml({
    bio, languages, cuisines, missionTypes,
    years, availability, photoUrl, references,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'inline',
    },
  });
}

function buildPortfolioHtml(data: {
  bio: string;
  languages: string[];
  cuisines: string[];
  missionTypes: string[];
  years: string | null;
  availability: string;
  photoUrl: string;
  references: string[];
}) {
  const {
    bio, languages, cuisines, missionTypes,
    years, availability, photoUrl, references,
  } = data;

  const hasPhoto = photoUrl.startsWith('http');

  const tagHtml = (items: string[], color = '#B08D57') =>
    items.map(item => `
      <span style="display:inline-block;margin:3px 4px 3px 0;padding:5px 12px;
        border:1px solid #d8d1c7;border-radius:20px;font-size:12px;
        color:#3f3a34;font-family:Georgia,serif;letter-spacing:0.03em;">
        ${item}
      </span>
    `).join('');

  const sectionHtml = (title: string, content: string) => `
    <div style="margin-bottom:28px;">
      <div style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;
        color:#9a9187;font-family:Georgia,serif;margin-bottom:10px;
        padding-bottom:8px;border-bottom:1px solid #e8e2db;">
        ${title}
      </div>
      ${content}
    </div>
  `;

  const missionLabels: Record<string, string> = {
    yacht: 'Yacht', villa: 'Villa privée', chalet: 'Chalet',
    residence: 'Résidence', event: 'Événement', daily: 'Présence quotidienne',
    private: 'Chef privé', dinner: 'Dîner privé',
  };

  const missionDisplay = missionTypes.length
    ? missionTypes.map(m => missionLabels[m.toLowerCase()] || m)
    : [];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Profil Chef — Chefs Talents</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #f4efe8;
      font-family: 'Inter', ui-sans-serif, sans-serif;
      color: #161616;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      position: relative;
    }

    /* BARRE LATÉRALE */
    .sidebar {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 72mm;
      background: #161616;
      padding: 40px 28px;
      display: flex;
      flex-direction: column;
    }

    /* CONTENU PRINCIPAL */
    .main {
      margin-left: 72mm;
      padding: 44px 36px 40px 40px;
      min-height: 297mm;
    }

    /* HEADER */
    .header {
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e8e2db;
    }

    .brand {
      font-size: 9px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #9a9187;
      font-family: 'EB Garamond', Georgia, serif;
      margin-bottom: 16px;
    }

    .chef-title {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 36px;
      font-weight: 400;
      color: #161616;
      line-height: 1.1;
      margin-bottom: 6px;
    }

    .chef-subtitle {
      font-size: 13px;
      color: #7d756a;
      font-weight: 300;
      letter-spacing: 0.02em;
    }

    /* SIDEBAR éléments */
    .sidebar-section {
      margin-bottom: 28px;
    }

    .sidebar-label {
      font-size: 8px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      font-family: 'Inter', sans-serif;
      margin-bottom: 10px;
      padding-bottom: 7px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .sidebar-tag {
      display: inline-block;
      margin: 3px 4px 3px 0;
      padding: 4px 10px;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 20px;
      font-size: 11px;
      color: rgba(255,255,255,0.85);
      font-family: 'Inter', sans-serif;
      font-weight: 300;
    }

    .sidebar-text {
      font-size: 12px;
      color: rgba(255,255,255,0.7);
      font-family: 'Inter', sans-serif;
      font-weight: 300;
      line-height: 1.7;
    }

    /* PHOTO */
    .photo-wrap {
      width: 100%;
      aspect-ratio: 3/4;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 28px;
      background: #2a2a2a;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .photo-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
    }

    .photo-placeholder {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* BIO */
    .bio-text {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 15.5px;
      line-height: 1.75;
      color: #3f3a34;
      font-weight: 400;
    }

    /* TAGS */
    .tag {
      display: inline-block;
      margin: 3px 4px 3px 0;
      padding: 5px 13px;
      border: 1px solid #d8d1c7;
      border-radius: 20px;
      font-size: 12px;
      color: #3f3a34;
      font-weight: 300;
    }

    /* RÉFÉRENCE */
    .reference-item {
      padding: 12px 0;
      border-bottom: 1px solid #ece6df;
      font-size: 13px;
      color: #59544d;
      font-weight: 300;
      line-height: 1.6;
      font-style: italic;
    }

    .reference-item:last-child { border-bottom: none; }

    /* SECTION TITLE */
    .section-title {
      font-size: 10px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #9a9187;
      font-family: 'EB Garamond', Georgia, serif;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e8e2db;
    }

    .section-block {
      margin-bottom: 28px;
    }

    /* CONFIDENTIALITÉ */
    .confidential-banner {
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .confidential-text {
      font-size: 9px;
      color: rgba(255,255,255,0.3);
      line-height: 1.6;
      font-family: 'Inter', sans-serif;
    }

    /* FOOTER */
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e8e2db;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-brand {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 13px;
      color: #9a9187;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .footer-note {
      font-size: 10px;
      color: #b8b2aa;
      font-weight: 300;
    }

    /* PRINT */
    @media print {
      body { background: #fff; }
      .page { margin: 0; box-shadow: none; }
      @page { size: A4; margin: 0; }
      .no-print { display: none; }
    }

    /* BOUTON IMPRESSION */
    .print-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #161616;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 999;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }

    .print-bar-label {
      font-size: 13px;
      color: rgba(255,255,255,0.7);
      font-family: 'Inter', sans-serif;
    }

    .print-btn {
      background: #fff;
      color: #161616;
      border: none;
      padding: 9px 20px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.02em;
    }

    .print-btn:hover { background: #f0ebe4; }

    @media screen {
      body { padding-top: 56px; }
      .page {
        margin: 24px auto;
        box-shadow: 0 8px 40px rgba(0,0,0,0.12);
        border-radius: 4px;
        overflow: hidden;
      }
    }
  </style>
</head>
<body>

  <!-- Barre d'impression -->
  <div class="print-bar no-print">
    <span class="print-bar-label">Portfolio Chef — Chefs Talents · Document confidentiel</span>
    <button class="print-btn" onclick="window.print()">Télécharger en PDF</button>
  </div>

  <div class="page">
    <!-- SIDEBAR NOIRE -->
    <div class="sidebar">

      ${hasPhoto ? `
      <div class="photo-wrap">
        <img src="${photoUrl}" alt="Photo chef" crossorigin="anonymous" />
      </div>
      ` : `
      <div class="photo-wrap">
        <div class="photo-placeholder"></div>
      </div>
      `}

      ${languages.length ? `
      <div class="sidebar-section">
        <div class="sidebar-label">Langues</div>
        ${languages.map(l => `<span class="sidebar-tag">${l}</span>`).join('')}
      </div>
      ` : ''}

      ${years ? `
      <div class="sidebar-section">
        <div class="sidebar-label">Expérience</div>
        <div class="sidebar-text">${years} ans d'expérience</div>
      </div>
      ` : ''}

      ${availability ? `
      <div class="sidebar-section">
        <div class="sidebar-label">Disponibilité</div>
        <div class="sidebar-text">${availability}</div>
      </div>
      ` : ''}

      <div class="confidential-banner">
        <div class="confidential-text">
          Document confidentiel<br/>
          Chefs Talents · Usage exclusif client<br/>
          Ne pas diffuser sans autorisation
        </div>
      </div>
    </div>

    <!-- CONTENU PRINCIPAL -->
    <div class="main">

      <!-- HEADER -->
      <div class="header">
        <div class="brand">Chefs Talents · Profil Chef</div>
        <h1 class="chef-title">Chef Sélectionné</h1>
        <p class="chef-subtitle">Profil anonymisé · Usage exclusif client</p>
      </div>

      <!-- BIO -->
      ${bio ? `
      <div class="section-block">
        <div class="section-title">Présentation</div>
        <p class="bio-text">${bio}</p>
      </div>
      ` : ''}

      <!-- CUISINES -->
      ${cuisines.length ? `
      <div class="section-block">
        <div class="section-title">Spécialités culinaires</div>
        <div>${cuisines.map(c => `<span class="tag">${c}</span>`).join('')}</div>
      </div>
      ` : ''}

      <!-- TYPES DE MISSIONS -->
      ${missionDisplay.length ? `
      <div class="section-block">
        <div class="section-title">Types de missions</div>
        <div>${missionDisplay.map(m => `<span class="tag">${m}</span>`).join('')}</div>
      </div>
      ` : ''}

      <!-- RÉFÉRENCES -->
      ${references.length ? `
      <div class="section-block">
        <div class="section-title">Références (anonymisées)</div>
        ${references.map(r => `<div class="reference-item">${r}</div>`).join('')}
      </div>
      ` : ''}

      <!-- FOOTER -->
      <div class="footer">
        <span class="footer-brand">CHEFS TALENTS</span>
        <span class="footer-note">contact@chefstalents.com · chefstalents.com</span>
      </div>

    </div>
  </div>

  <script>
    // Auto-print si paramètre ?print=1
    if (new URLSearchParams(window.location.search).get('print') === '1') {
      window.addEventListener('load', () => setTimeout(() => window.print(), 600));
    }
  </script>
</body>
</html>`;
}
