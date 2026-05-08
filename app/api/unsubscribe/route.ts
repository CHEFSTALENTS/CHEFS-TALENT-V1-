// app/api/unsubscribe/route.ts
// Endpoint de désinscription conforme RFC 8058 (List-Unsubscribe one-click).
// Accepte GET (clic depuis email) et POST (Gmail/Outlook one-click).
//
// Marque le chef avec marketingUnsubscribedAt sur son profil. Les fonctions
// d'envoi de mailings (sendVipNewTipToAll, sendVipBroadcast, sendBoostEndingSoon)
// excluent les chefs ayant ce flag. Les emails transactionnels (achat,
// activation) ne sont pas concernés.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UnsubCategory = 'vip' | 'boost' | 'broadcast' | 'transactional';

const VALID_CATEGORIES: UnsubCategory[] = [
  'vip',
  'boost',
  'broadcast',
  'transactional',
];

/**
 * Cherche un chef_profiles dont le profile.email = email donné.
 * Retourne user_id et profile actuel, ou null si introuvable.
 */
async function findChefByEmail(email: string) {
  const admin = getSupabaseAdmin();
  const target = email.trim().toLowerCase();

  // 1) recherche directe sur la colonne email
  const { data: row1 } = await admin
    .from('chef_profiles')
    .select('user_id, email, profile')
    .ilike('email', target)
    .maybeSingle();
  if (row1) return row1;

  // 2) fallback sur profile->>email
  const { data: row2 } = await admin
    .from('chef_profiles')
    .select('user_id, email, profile')
    .eq('profile->>email', target)
    .maybeSingle();
  return row2 ?? null;
}

async function markUnsubscribed(opts: {
  email: string;
  category: UnsubCategory;
}) {
  const row = await findChefByEmail(opts.email);
  if (!row) {
    // Pas trouvé : on ne révèle rien (anti enum) mais on retourne ok pour
    // que l'utilisateur reçoive une confirmation propre.
    return { ok: true, found: false };
  }

  const admin = getSupabaseAdmin();
  const profile = (row.profile as any) ?? {};
  const next = {
    ...profile,
    marketingUnsubscribedAt: new Date().toISOString(),
    marketingUnsubscribedFrom: opts.category,
    updatedAt: new Date().toISOString(),
  };

  const { error } = await admin
    .from('chef_profiles')
    .update({ profile: next })
    .eq('user_id', row.user_id);

  if (error) {
    console.error('[unsubscribe] update failed', error);
    return { ok: false, found: true };
  }

  return { ok: true, found: true };
}

function htmlPage(opts: {
  ok: boolean;
  email: string;
  locale: 'fr' | 'en';
}) {
  const FONT =
    "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

  const t =
    opts.locale === 'en'
      ? {
          title: 'Unsubscribed',
          ok: 'You have been unsubscribed from our mailing list.',
          fail:
            'We were unable to process your request. If the problem persists, reply to this email with the word STOP.',
          email: 'Email',
          home: 'Back to chefstalents.com',
        }
      : {
          title: 'Désinscription confirmée',
          ok: 'Vous êtes désinscrit de notre liste de diffusion.',
          fail:
            'Nous n’avons pas pu traiter votre demande. Si le problème persiste, répondez à cet email avec le mot STOP.',
          email: 'Email',
          home: 'Retour vers chefstalents.com',
        };

  return `<!DOCTYPE html>
<html lang="${opts.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f4f4f5;
      font-family: ${FONT};
      color: #09090b;
      -webkit-font-smoothing: antialiased;
    }
    .wrap {
      max-width: 480px;
      margin: 80px auto;
      padding: 0 24px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 40px 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      text-align: center;
    }
    h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-weight: 400;
      font-size: 28px;
      letter-spacing: -0.02em;
      margin: 0 0 16px;
    }
    p {
      font-size: 15px;
      color: #52525b;
      line-height: 1.6;
      margin: 0 0 12px;
    }
    .email {
      font-size: 13px;
      color: #71717a;
      font-family: ui-monospace, Menlo, Consolas, monospace;
      margin-top: 24px;
      padding: 8px 12px;
      background: #fafafa;
      border-radius: 6px;
      display: inline-block;
    }
    .accent { color: #7f1d1d; }
    a {
      color: #71717a;
      text-decoration: underline;
      font-size: 13px;
    }
    .home { margin-top: 32px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>${t.title}</h1>
      <p>${opts.ok ? t.ok : t.fail}</p>
      ${opts.email ? `<div class="email">${opts.email}</div>` : ''}
      <div class="home">
        <a href="https://chefstalents.com">${t.home}</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function pickCategory(raw: string | null): UnsubCategory {
  if (raw && VALID_CATEGORIES.includes(raw as UnsubCategory)) {
    return raw as UnsubCategory;
  }
  return 'broadcast';
}

function pickLocale(req: Request): 'fr' | 'en' {
  // Tente de déduire la locale depuis Accept-Language. Défaut FR.
  const al = req.headers.get('accept-language') || '';
  if (/^en/i.test(al)) return 'en';
  return 'fr';
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email') || '';
  const category = pickCategory(url.searchParams.get('c'));
  const locale = pickLocale(req);

  if (!email || !email.includes('@')) {
    return new NextResponse(
      htmlPage({ ok: false, email: '', locale }),
      { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }

  const result = await markUnsubscribed({ email, category });
  return new NextResponse(
    htmlPage({ ok: result.ok, email, locale }),
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

/**
 * RFC 8058 one-click POST. Le corps est généralement
 * "List-Unsubscribe=One-Click" en application/x-www-form-urlencoded.
 * Le client (Gmail, Outlook) attend une réponse 200 sans intervention.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email') || '';
  const category = pickCategory(url.searchParams.get('c'));

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
  }

  // On confirme la requête one-click même si on ne peut pas vérifier le body,
  // pour respecter la spec et éviter de bloquer le flow Gmail/Outlook.
  await markUnsubscribed({ email, category });
  return new NextResponse('', { status: 200 });
}
