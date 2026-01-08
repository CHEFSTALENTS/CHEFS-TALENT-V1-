
mport { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const email = String(body?.email || '').trim().toLowerCase();
    const company = String(body?.company || '').trim();
    const role = String(body?.role || '').trim();
    const source = String(body?.source || 'access_gate').trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'INVALID_EMAIL' }, { status: 400 });
    }

    const payload = {
      email,
      company: company || null,
      role: role || null,
      source,
      createdAt: new Date().toISOString(),
    };

    // 1) WEBHOOK (Make/Zapier)
    const webhookUrl = process.env.WAITLIST_WEBHOOK_URL;
    if (webhookUrl) {
      const r = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      if (!r.ok) {
        return NextResponse.json({ success: false, error: 'WEBHOOK_FAILED' }, { status: 502 });
      }

      return NextResponse.json({ success: true, mode: 'webhook' });
    }

    // 2) SUPABASE (service role)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      const insert = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify([
          {
            email: payload.email,
            company: payload.company,
            role: payload.role,
            source: payload.source,
          },
        ]),
        cache: 'no-store',
      });

      if (!insert.ok) {
        const txt = await insert.text().catch(() => '');
        return NextResponse.json(
          { success: false, error: 'SUPABASE_INSERT_FAILED', detail: txt.slice(0, 400) },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true, mode: 'supabase' });
    }

    // 3) Rien configuré
    return NextResponse.json(
      { success: false, error: 'NO_STORAGE_CONFIGURED' },
      { status: 500 }
    );
  } catch (e) {
    return NextResponse.json({ success: false, error: 'SERVER_ERROR' }, { status: 500 });
  }
}
