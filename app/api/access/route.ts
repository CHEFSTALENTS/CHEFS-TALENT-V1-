import { NextRequest, NextResponse } from 'next/server';

type Area = 'public' | 'admin' | 'chef';

const ADMIN_CODE = process.env.ADMIN_ACCESS_CODE || '';
const PUBLIC_CODE = process.env.SITE_ACCESS_CODE || process.env.PUBLIC_ACCESS_CODE || '';
const CHEF_CODE = process.env.CHEF_CODE || ''; // optionnel si tu l'utilises

function json(ok: boolean, extra: Record<string, any> = {}, status = 200) {
  return NextResponse.json({ success: ok, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const area: Area = (body?.area || 'public') as Area;
    const code = String(body?.code || '').trim();
    const next = String(body?.next || '/');

    // Sécurité simple sur le "next" pour éviter open-redirect
    const safeNext = next.startsWith('/') ? next : '/';

    // --- Vérification code selon zone ---
    let isValid = false;

    if (area === 'admin') {
      isValid = !!ADMIN_CODE && code === ADMIN_CODE;
    } else if (area === 'chef') {
      // optionnel : si tu veux gate chef, sinon tu peux renvoyer false
      isValid = !!CHEF_CODE && code === CHEF_CODE;
    } else {
      // public
      isValid = !!PUBLIC_CODE && code === PUBLIC_CODE;
    }

    if (!isValid) {
      return json(false, { error: 'CODE_INVALID' }, 401);
    }

    const res = json(true, { next: safeNext });

    // --- Pose cookies de gate ---
    // Durée: 7 jours
    const maxAge = 60 * 60 * 24 * 7;

    if (area === 'admin') {
      res.cookies.set('ct_gate_admin', '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge,
      });
    } else if (area === 'chef') {
      res.cookies.set('ct_gate_chef', '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge,
      });
    } else {
      res.cookies.set('ct_gate_public', '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge,
      });
    }

    return res;
  } catch (e) {
    console.error('[api/access] error', e);
    return json(false, { error: 'SERVER_ERROR' }, 500);
  }
}

// (Optionnel) GET pour debug rapide (désactive si tu veux)
export async function GET(req: NextRequest) {
  const hasPublic = req.cookies.get('ct_gate_public')?.value === '1';
  const hasAdmin = req.cookies.get('ct_gate_admin')?.value === '1';
  const hasChef = req.cookies.get('ct_gate_chef')?.value === '1';

  return NextResponse.json({
    success: true,
    gates: { public: hasPublic, admin: hasAdmin, chef: hasChef },
  });
}
