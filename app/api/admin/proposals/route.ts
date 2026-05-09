export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { escapeHtml } from '@/lib/escapeHtml';

const resend = new Resend(process.env.RESEND_API_KEY);

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =============================================================
// GET /api/admin/proposals
//   - sans query : retourne toutes les proposals (récentes en tête)
//   - ?requestId=X : retourne les proposals d'une demande client
//   - ?chefId=X : retourne les proposals d'un chef
// =============================================================
export async function GET(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');
    const chefId = searchParams.get('chefId');
    const status = searchParams.get('status');

    const supabase = supabaseAdmin();
    let query = supabase
      .from('mission_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (requestId) query = query.eq('request_id', requestId);
    if (chefId) query = query.eq('chef_id', chefId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      console.error('[admin/proposals] GET error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (e: any) {
    console.error('[admin/proposals] GET fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// =============================================================
// POST /api/admin/proposals
// Body :
//   {
//     requestId?: string | null,
//     chefId: string,
//     chefEmail: string,
//     chefName?: string,
//     title?, location?, startDate?, endDate?, guestCount?,
//     serviceLevel?, notes?, contractUrl?,
//     chefAmount?, clientAmount?,
//     pitched?: boolean,           // true → status='pitched' direct
//     channel?: 'email' | 'whatsapp' | 'manual',
//     sendEmail?: boolean,         // si true ET pitched ET channel='email',
//                                  //  envoie le brief Resend au chef
//   }
// =============================================================
export async function POST(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => ({}));
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
      pitched,
      channel,
      sendEmail,
    } = body;

    if (!chefId || !chefEmail) {
      return NextResponse.json(
        { error: 'chefId and chefEmail required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const commission =
      clientAmount && chefAmount
        ? Number(clientAmount) - Number(chefAmount)
        : null;

    const status = pitched ? 'pitched' : 'shortlisted';
    const nowIso = new Date().toISOString();

    const insertRow: Record<string, any> = {
      request_id: requestId || null,
      chef_id: chefId,
      chef_email: chefEmail,
      chef_name: chefName || null,
      title: title || null,
      location: location || null,
      start_date: startDate || null,
      end_date: endDate || null,
      guest_count: guestCount || null,
      service_level: serviceLevel || null,
      notes: notes || null,
      contract_url: contractUrl || null,
      chef_amount: chefAmount ?? null,
      client_amount: clientAmount ?? null,
      commission_amount: commission,
      status,
      channel: channel || null,
      pitched_at: pitched ? nowIso : null,
    };

    const { data: proposal, error } = await supabase
      .from('mission_proposals')
      .insert(insertRow)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/proposals] POST insert error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Envoi email Resend si demandé
    let emailOk = false;
    if (pitched && channel === 'email' && sendEmail) {
      try {
        await sendProposalEmailToChef({
          chefEmail,
          chefName,
          location,
          startDate,
          endDate,
          guestCount,
          serviceLevel,
          notes,
          chefAmount,
          contractUrl,
        });
        emailOk = true;
        await supabase
          .from('mission_proposals')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', proposal.id);
      } catch (e: any) {
        console.error('[admin/proposals] email failed', e?.message);
      }
    }

    // Met à jour la request en 'in_review' si elle est encore 'new'
    if (requestId) {
      await supabase
        .from('client_requests')
        .update({ status: 'in_review' })
        .eq('id', requestId)
        .eq('status', 'new');
    }

    return NextResponse.json({
      ok: true,
      proposalId: proposal.id,
      proposal,
      emailSent: emailOk,
    });
  } catch (e: any) {
    console.error('[admin/proposals] POST fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// =============================================================
// Email Resend : brief mission au chef
// (réutilise le template d'AssignMissionModal/api/admin/missions)
// =============================================================
async function sendProposalEmailToChef(params: {
  chefEmail: string;
  chefName?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  guestCount?: number;
  serviceLevel?: string;
  notes?: string;
  chefAmount?: number;
  contractUrl?: string;
}) {
  const {
    chefEmail,
    chefName,
    location,
    startDate,
    endDate,
    guestCount,
    serviceLevel,
    notes,
    chefAmount,
    contractUrl,
  } = params;

  const startFormatted = startDate
    ? new Date(startDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';
  const endFormatted = endDate
    ? new Date(endDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const firstName = (chefName || 'Chef').split(' ')[0];
  const respondUrl = `${process.env.NEXT_PUBLIC_APP_URL}/chef/missions`;

  await resend.emails.send({
    from: 'Thomas — Chefs Talents <contact@chefstalents.com>',
    to: chefEmail,
    subject: `New mission proposal — ${location || 'Private mission'}`,
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
}
