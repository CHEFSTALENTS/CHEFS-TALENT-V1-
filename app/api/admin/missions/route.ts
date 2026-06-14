export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { escapeHtml } from '@/lib/escapeHtml';
import { chefNotificationsEnabled, logChefNotificationSkipped } from '@/lib/email/chefNotifications';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const {
      requestId,
      chefId,
      chefEmail,
      chefName,
      title,
      location,
      startDate,
      endDate,
      guestCount,
      serviceLevel,
      notes,
      chefAmount,
      clientAmount,
      contractUrl,
      // Si false : pas d'email Resend au chef ni de notif interne (cas
      // « mission spontanée » où le deal est déjà closer hors-app, on
      // veut juste tracker dans le tableau de bord). Default true pour
      // conserver le comportement existant.
      notifyChef = true,
    } = body;

    if (!chefId || !chefEmail) {
      return NextResponse.json({ error: 'chefId and chefEmail required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const commission = clientAmount && chefAmount
      ? Number(clientAmount) - Number(chefAmount)
      : null;

    // 0. Propagation CRM : si requestId est fourni, on récupère
    //    partner_id + acquisition_channel pour les recopier sur la
    //    mission (chaîne demande → devis → mission cohérente).
    //    Permet à body.partnerId/source de surcharger si besoin.
    let propagatedPartnerId: string | null = body.partnerId || null;
    let propagatedSource: string | null = null;
    if (body.source !== undefined) {
      const allowed = ['partner', 'google_ads', 'direct', 'word_of_mouth', 'press', 'other'];
      const s = body.source ? String(body.source).toLowerCase() : null;
      propagatedSource = s && allowed.includes(s) ? s : null;
    }
    if (requestId && !propagatedPartnerId) {
      const { data: req } = await supabase
        .from('client_requests')
        .select('partner_id, acquisition_channel')
        .eq('id', requestId)
        .maybeSingle();
      if (req) {
        propagatedPartnerId = req.partner_id || null;
        if (!propagatedSource) propagatedSource = req.acquisition_channel || null;
      }
    }

    // 1. Créer la mission
    const { data: mission, error } = await supabase
      .from('missions')
      .insert({
        request_id: requestId || null,
        partner_id: propagatedPartnerId,
        source: propagatedSource,
        chef_id: chefId,
        chef_email: chefEmail,
        chef_name: chefName || null,
        status: 'offered',
        title: title || null,
        location: location || null,
        start_date: startDate || null,
        end_date: endDate || null,
        guest_count: guestCount || null,
        service_level: serviceLevel || null,
        notes: notes || null,
        chef_amount: chefAmount || null,
        client_amount: clientAmount || null,
        commission_amount: commission,
        contract_url: contractUrl || null,
        offered_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[admin/missions] insert error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const missionId = mission.id;

    // 2. Mettre à jour le statut de la demande client
    if (requestId) {
      await supabase
        .from('client_requests')
        .update({ status: 'assigned' })
        .eq('id', requestId);
    }

    // 3. Email au chef
    const startFormatted = startDate
      ? new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';
    const endFormatted = endDate
      ? new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : null;
    const firstName = (chefName || 'Chef').split(' ')[0];
    const respondUrl = `${process.env.NEXT_PUBLIC_APP_URL}/chef/missions`;

    let emailOk = false;

    // Skip email + notif interne si notifyChef=false (mission spontanée)
    if (!notifyChef) {
      return NextResponse.json({
        ok: true,
        missionId,
        emailSent: false,
        notified: false,
      });
    }

    // ⚠️ Kill switch global — voir lib/email/chefNotifications.ts
    if (!chefNotificationsEnabled()) {
      logChefNotificationSkipped('missions/POST', chefEmail);
    } else {
    try {
      await resend.emails.send({
        from: 'Thomas — Chefs Talents <contact@chefstalents.com>',
        to: chefEmail,
        subject: `New mission proposal — ${location || title || 'Private mission'}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4efe8;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 32px;">
    <p style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8a7f73;margin:0 0 40px;">CHEFS TALENTS — MISSION PROPOSAL</p>
    <h1 style="font-size:28px;font-weight:normal;color:#161616;margin:0 0 8px;">Hi ${escapeHtml(firstName)},</h1>
    <p style="font-size:16px;line-height:1.8;color:#59544d;margin:0 0 32px;">We have a new mission that matches your profile. Please review the details below and let us know if you're available.</p>

    <div style="background:#161616;border-radius:16px;padding:28px 32px;margin:0 0 28px;">
      <p style="color:#8a7f73;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 20px;">Mission details</p>
      <table style="width:100%;border-collapse:collapse;">
        ${location ? `<tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;width:140px;">Location</td><td style="color:#fff;font-size:14px;padding:6px 0;">${escapeHtml(location)}</td></tr>` : ''}
        ${startDate ? `<tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;">Start date</td><td style="color:#fff;font-size:14px;padding:6px 0;">${escapeHtml(startFormatted)}</td></tr>` : ''}
        ${endDate ? `<tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;">End date</td><td style="color:#fff;font-size:14px;padding:6px 0;">${escapeHtml(endFormatted)}</td></tr>` : ''}
        ${guestCount ? `<tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;">Guests</td><td style="color:#fff;font-size:14px;padding:6px 0;">${escapeHtml(guestCount)} guests</td></tr>` : ''}
        ${serviceLevel ? `<tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;">Service</td><td style="color:#fff;font-size:14px;padding:6px 0;">${escapeHtml(serviceLevel)}</td></tr>` : ''}
        ${chefAmount ? `<tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;">Your fee</td><td style="color:#B08D57;font-size:16px;font-weight:bold;padding:6px 0;">${Number(chefAmount).toLocaleString('en-GB')} €</td></tr>` : ''}
        ${notes ? `<tr><td style="color:#8a7f73;font-size:13px;padding:6px 0;vertical-align:top;">Notes</td><td style="color:#fff;font-size:14px;padding:6px 0;">${escapeHtml(notes)}</td></tr>` : ''}
      </table>
    </div>

    <div style="background:#fff;border:1px solid #d8d1c7;border-radius:16px;padding:24px 28px;margin:0 0 28px;">
      <p style="color:#8a7f73;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">Your response</p>
      <p style="color:#161616;font-size:14px;line-height:1.7;margin:0 0 16px;">Please log in to your dashboard to accept or decline this mission. We need your response within <strong>48 hours</strong>.</p>
      <a href="${respondUrl}" style="display:inline-block;background:#161616;color:#fff;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:14px 28px;border-radius:30px;">
        View mission & respond →
      </a>
    </div>

    ${contractUrl ? `
    <div style="background:#f4efe8;border:1px solid #d8d1c7;border-radius:16px;padding:24px 28px;margin:0 0 28px;">
      <p style="color:#8a7f73;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">Contract</p>
      <p style="color:#161616;font-size:14px;line-height:1.7;margin:0 0 12px;">Your mission contract is ready to review.</p>
      <a href="${contractUrl}" style="color:#B08D57;font-size:14px;">View contract →</a>
    </div>` : ''}

    <div style="border-top:1px solid #d8d1c7;padding-top:32px;">
      <p style="font-size:15px;color:#59544d;margin:0 0 4px;">Best regards,</p>
      <p style="font-size:16px;color:#161616;font-weight:bold;margin:0 0 4px;">Thomas Delcroix</p>
      <p style="font-size:13px;color:#8a7f73;margin:0;">Chefs Talents · +33 7 56 82 76 12</p>
    </div>
  </div>
</body>
</html>`,
      });
      emailOk = true;
    } catch (e) {
      console.error('[admin/missions] email error', e);
    }
    } // end else (chefNotificationsEnabled)

    if (emailOk) {
      await supabase
        .from('missions')
        .update({ offer_email_sent_at: new Date().toISOString() })
        .eq('id', missionId);
    }

    // 4. Notification interne
    try {
      await resend.emails.send({
        from: 'Chefs Talents <contact@chefstalents.com>',
        to: 'contact@chefstalents.com',
        subject: `✅ Mission assignée — ${chefName || chefEmail} · ${location || ''}`,
        html: `<div style="font-family:monospace;padding:24px;">
          <h2>Mission créée</h2>
          <p><strong>Chef :</strong> ${escapeHtml(chefName || '—')} (${escapeHtml(chefEmail)})</p>
          <p><strong>Lieu :</strong> ${escapeHtml(location || '—')}</p>
          <p><strong>Dates :</strong> ${escapeHtml(startFormatted)}${endFormatted ? ` → ${escapeHtml(endFormatted)}` : ''}</p>
          <p><strong>Convives :</strong> ${escapeHtml(guestCount || '—')}</p>
          <p><strong>Rémunération chef :</strong> ${chefAmount ? `${escapeHtml(String(chefAmount))}€` : '—'}</p>
          <p><strong>Mission ID :</strong> ${escapeHtml(missionId)}</p>
          <p><strong>Email envoyé au chef :</strong> ${emailOk ? 'Oui ✅' : 'Non ❌'}</p>
        </div>`,
      });
    } catch (e) {
      console.error('[admin/missions] internal email error', e);
    }

    return NextResponse.json({ ok: true, missionId, emailSent: emailOk });

  } catch (err) {
    console.error('[api/admin/missions] server error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET — lister toutes les missions
export async function GET(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
