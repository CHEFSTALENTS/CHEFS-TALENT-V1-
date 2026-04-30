export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const missionId = decodeURIComponent(ctx.params.id || '').trim();
    const body = await req.json();
    const { contractUrl } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: mission, error: fetchErr } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();

    if (fetchErr || !mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Update statut → confirmed
    await supabase
      .from('missions')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        contract_url: contractUrl || mission.contract_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId);

    // Email de confirmation au chef
    const firstName = (mission.chef_name || 'Chef').split(' ')[0];
    const startFormatted = mission.start_date
      ? new Date(mission.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';

    try {
      await resend.emails.send({
        from: 'Thomas — Chefs Talents <thomas@chefstalents.com>',
        to: mission.chef_email,
        subject: `Mission confirmed — ${mission.location || 'Private mission'}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4efe8;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 32px;">
    <p style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8a7f73;margin:0 0 40px;">CHEFS TALENTS — MISSION CONFIRMED</p>
    <h1 style="font-size:28px;font-weight:normal;color:#161616;margin:0 0 8px;">Hi ${firstName},</h1>
    <p style="font-size:16px;line-height:1.8;color:#59544d;margin:0 0 32px;">Your mission has been confirmed. Here are the final details.</p>

    <div style="background:#161616;border-radius:16px;padding:28px 32px;margin:0 0 28px;">
      <p style="color:#B08D57;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 20px;">✓ Mission confirmed</p>
      <table style="width:100%;border-collapse:collapse;">
        ${mission.location ? `<tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;width:140px;">Location</td><td style="color:#fff;font-size:14px;padding:6px 0;">${mission.location}</td></tr>` : ''}
        <tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;">Start date</td><td style="color:#fff;font-size:14px;padding:6px 0;">${startFormatted}</td></tr>
        ${mission.guest_count ? `<tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;">Guests</td><td style="color:#fff;font-size:14px;padding:6px 0;">${mission.guest_count}</td></tr>` : ''}
        ${mission.chef_amount ? `<tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;">Your fee</td><td style="color:#B08D57;font-size:18px;font-weight:bold;padding:6px 0;">${Number(mission.chef_amount).toLocaleString('en-GB')} €</td></tr>` : ''}
      </table>
    </div>

    ${(contractUrl || mission.contract_url) ? `
    <div style="background:#fff;border:1px solid #d8d1c7;border-radius:16px;padding:24px 28px;margin:0 0 28px;">
      <p style="color:#8a7f73;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">Contract</p>
      <p style="color:#161616;font-size:14px;margin:0 0 12px;">Please review and sign your mission contract.</p>
      <a href="${contractUrl || mission.contract_url}" style="display:inline-block;background:#161616;color:#fff;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;border-radius:30px;">
        View contract →
      </a>
    </div>` : ''}

    <div style="background:#f4efe8;border:1px solid #d8d1c7;border-radius:16px;padding:24px 28px;margin:0 0 28px;">
      <p style="color:#8a7f73;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">Next steps</p>
      <p style="color:#161616;font-size:14px;line-height:1.8;margin:0;">
        → Review your contract<br/>
        → Contact us if you have any questions<br/>
        → Prepare for the mission
      </p>
    </div>

    <div style="border-top:1px solid #d8d1c7;padding-top:32px;">
      <p style="font-size:15px;color:#59544d;margin:0 0 4px;">Best regards,</p>
      <p style="font-size:16px;color:#161616;font-weight:bold;margin:0 0 4px;">Thomas Delcroix</p>
      <p style="font-size:13px;color:#8a7f73;margin:0;">Chefs Talents · +33 7 56 82 76 12</p>
    </div>
  </div>
</body>
</html>`,
      });

      await supabase
        .from('missions')
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq('id', missionId);

    } catch (e) {
      console.error('[admin/missions/confirm] email error', e);
    }

    return NextResponse.json({ ok: true, status: 'confirmed' });

  } catch (err) {
    console.error('[admin/missions/confirm] server error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
