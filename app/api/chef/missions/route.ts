export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// GET — missions du chef connecté
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const chefId = url.searchParams.get('chefId');

    if (!chefId) return NextResponse.json({ error: 'Missing chefId' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('chef_id', chefId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data || [] });

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — chef accepte ou refuse une mission
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { missionId, chefId, action } = body; // action: 'accepted' | 'declined'

    if (!missionId || !chefId || !['accepted', 'declined'].includes(action)) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Vérifier que la mission appartient bien à ce chef
    const { data: mission, error: fetchErr } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .eq('chef_id', chefId)
      .single();

    if (fetchErr || !mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    const patch: any = {
      status: action,
      updated_at: new Date().toISOString(),
    };
    if (action === 'accepted') patch.accepted_at = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('missions')
      .update(patch)
      .eq('id', missionId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Notification interne à Thomas
    try {
      await resend.emails.send({
        from: 'Chefs Talents <noreply@chefstalents.com>',
        to: 'contact@chefstalents.com',
        subject: `${action === 'accepted' ? '✅ Mission ACCEPTÉE' : '❌ Mission REFUSÉE'} — ${mission.chef_name || mission.chef_email}`,
        html: `<div style="font-family:monospace;padding:24px;">
          <h2>Mission ${action === 'accepted' ? 'acceptée ✅' : 'refusée ❌'}</h2>
          <p><strong>Chef :</strong> ${mission.chef_name || '—'} (${mission.chef_email})</p>
          <p><strong>Lieu :</strong> ${mission.location || '—'}</p>
          <p><strong>Dates :</strong> ${mission.start_date || '—'}${mission.end_date ? ` → ${mission.end_date}` : ''}</p>
          <p><strong>Mission ID :</strong> ${missionId}</p>
          ${action === 'accepted' ? '<p><strong>→ Action requise :</strong> Confirmez la mission dans l\'admin et envoyez le contrat.</p>' : ''}
        </div>`,
      });
    } catch (e) {
      console.error('[chef/missions] notify error', e);
    }

    return NextResponse.json({ ok: true, status: action });

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
