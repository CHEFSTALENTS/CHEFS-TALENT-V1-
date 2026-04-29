import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, background, destinations, type, lang } = body;

    if (!email || !fullName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 1. Stocker dans Supabase
    const { data, error } = await supabase
      .from('chef_enquiries')
      .insert({
        full_name: fullName,
        email,
        background: background || null,
        destinations: destinations || null,
        type: type || 'integration_programme',
        lang: lang || 'en',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // On continue quand même pour envoyer l'email
    }

    // 2. Email de confirmation au chef
    const firstName = fullName.split(' ')[0] || fullName;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Thomas — Chefs Talents <thomas@chefstalents.com>',
        to: email,
        subject: 'Your application — Chefs Talents Private Chef Network',
        html: `
          <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; padding: 48px 32px; background: #f4efe8; color: #161616;">
            <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #8a7f73; margin-bottom: 32px;">CHEFS TALENTS</p>
            <h1 style="font-size: 32px; font-weight: normal; margin-bottom: 24px; line-height: 1.2;">Hi ${firstName},</h1>
            <p style="font-size: 16px; line-height: 1.8; color: #59544d; margin-bottom: 16px;">
              Thank you for reaching out about our integration programme.
            </p>
            <p style="font-size: 16px; line-height: 1.8; color: #59544d; margin-bottom: 16px;">
              We've received your details and will come back to you within 24 hours.
            </p>
            <div style="background: #161616; border-radius: 16px; padding: 28px; margin: 32px 0;">
              <p style="color: #8a7f73; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 16px;">What to expect</p>
              <p style="color: #ffffff; font-size: 15px; line-height: 1.8; margin: 0;">
                → A short exchange to learn more about your background<br/>
                → Details on our integration programme<br/>
                → If it's a fit, access to our active roster for summer 2026
              </p>
            </div>
            <p style="font-size: 16px; line-height: 1.8; color: #59544d; margin-bottom: 32px;">
              We currently have active demand in Ibiza, Saint-Tropez and Mykonos — so timing is good.
            </p>
            <p style="font-size: 16px; color: #59544d;">Speak soon,</p>
            <p style="font-size: 16px; color: #161616; font-weight: bold; margin-top: 8px;">Thomas Delcroix<br/><span style="font-weight: normal; color: #8a7f73; font-size: 14px;">Chefs Talents · +33 7 56 82 76 12</span></p>
          </div>
        `,
      }),
    });

    // 3. Notification interne à Thomas
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Chefs Talents <noreply@chefstalents.com>',
        to: 'contact@chefstalents.com',
        subject: `Nouvelle candidature programme — ${fullName}`,
        html: `
          <div style="font-family: monospace; padding: 24px;">
            <h2>Nouvelle candidature — Programme d'intégration</h2>
            <p><strong>Nom :</strong> ${fullName}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Parcours :</strong> ${background || '—'}</p>
            <p><strong>Destinations :</strong> ${destinations || '—'}</p>
            <p><strong>Langue :</strong> ${lang || 'en'}</p>
            <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
        `,
      }),
    });

    return NextResponse.json({ ok: true, id: data?.id });

  } catch (err) {
    console.error('chef-enquiry error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
