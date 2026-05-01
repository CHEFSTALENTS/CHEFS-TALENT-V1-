export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      requestId,
      clientEmail,
      clientName,
      chefIds,        // array de 2-3 chef IDs sélectionnés
      nccUrl,         // lien NCC signé
    } = body;

    if (!clientEmail || !chefIds?.length || !requestId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer les profils des chefs sélectionnés
    const { data: profiles, error } = await supabase
      .from('chef_profiles')
      .select('id, bio, years_experience, specialties, languages, cuisines, images, profile_type, seniority_level, base_city, coverage_zones, environments')
      .in('id', chefIds);

    if (error) {
      console.error('[send-profiles] supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const chefs = profiles ?? [];
    const firstName = (clientName || 'Madame, Monsieur').split(' ')[0];

    // Générer les blocs HTML pour chaque chef anonymisé
    const chefBlocks = chefs.map((chef: any, i: number) => {
      const images = Array.isArray(chef.images) ? chef.images.filter(Boolean) : [];
      const specialties = Array.isArray(chef.specialties) ? chef.specialties.join(', ') : chef.specialties || '';
      const languages = Array.isArray(chef.languages) ? chef.languages.join(', ') : chef.languages || '';
      const cuisines = Array.isArray(chef.cuisines) ? chef.cuisines.join(', ') : chef.cuisines || '';
      const coverageZones = Array.isArray(chef.coverage_zones) ? chef.coverage_zones.join(', ') : '';
      const profileLabel = chef.profile_type === 'yacht' ? 'Chef Yacht' : chef.profile_type === 'residence' ? 'Chef Résidence' : 'Chef Privé';
      const seniorityLabel = chef.seniority_level ? (chef.seniority_level.charAt(0).toUpperCase() + chef.seniority_level.slice(1)) : '';
      const mainImage = images[0] || null;

      return `
      <div style="background:#ffffff;border:1px solid #e8e3dc;border-radius:16px;padding:28px 32px;margin-bottom:24px;">
        <div style="display:flex;align-items:flex-start;gap:20px;margin-bottom:20px;">
          ${mainImage ? `<img src="${mainImage}" alt="Chef ${i + 1}" style="width:80px;height:80px;border-radius:12px;object-fit:cover;flex-shrink:0;" />` : `<div style="width:80px;height:80px;border-radius:12px;background:#f4efe8;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;">👨‍🍳</div>`}
          <div>
            <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#8a7f73;margin:0 0 6px;">Profil ${i + 1} — Confidentiel</p>
            <p style="font-size:18px;font-weight:bold;color:#161616;margin:0 0 4px;">${profileLabel}${seniorityLabel ? ` · ${seniorityLabel}` : ''}</p>
            ${chef.base_city ? `<p style="font-size:13px;color:#8a7f73;margin:0;">📍 Basé(e) à ${chef.base_city}</p>` : ''}
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${chef.years_experience ? `<tr><td style="color:#8a7f73;padding:5px 0;width:140px;">Expérience</td><td style="color:#161616;font-weight:500;">${chef.years_experience} ans</td></tr>` : ''}
          ${specialties ? `<tr><td style="color:#8a7f73;padding:5px 0;">Spécialités</td><td style="color:#161616;font-weight:500;">${specialties}</td></tr>` : ''}
          ${cuisines ? `<tr><td style="color:#8a7f73;padding:5px 0;">Cuisine</td><td style="color:#161616;font-weight:500;">${cuisines}</td></tr>` : ''}
          ${languages ? `<tr><td style="color:#8a7f73;padding:5px 0;">Langues</td><td style="color:#161616;font-weight:500;">${languages}</td></tr>` : ''}
          ${coverageZones ? `<tr><td style="color:#8a7f73;padding:5px 0;">Destinations</td><td style="color:#161616;font-weight:500;">${coverageZones}</td></tr>` : ''}
        </table>

        ${chef.bio ? `<p style="font-size:13px;color:#59544d;line-height:1.7;margin:16px 0 0;padding-top:16px;border-top:1px solid #f0ebe4;">${chef.bio.slice(0, 300)}${chef.bio.length > 300 ? '...' : ''}</p>` : ''}

        ${images.length > 1 ? `
        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
          ${images.slice(1, 4).map((img: string) => `<img src="${img}" style="width:72px;height:72px;border-radius:8px;object-fit:cover;" />`).join('')}
        </div>` : ''}
      </div>`;
    }).join('');

    // Envoyer l'email au client
    await resend.emails.send({
      from: 'Thomas — Chefs Talents <thomas@chefstalents.com>',
      to: clientEmail,
      subject: 'Chefs Talents — Sélection de profils chefs',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4efe8;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 24px;">

    <p style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8a7f73;margin:0 0 32px;">CHEFS TALENTS — SÉLECTION CONFIDENTIELLE</p>

    <h1 style="font-size:26px;font-weight:normal;color:#161616;margin:0 0 16px;line-height:1.3;">
      ${firstName ? `Bonjour ${firstName},` : 'Madame, Monsieur,'}
    </h1>

    <p style="font-size:15px;line-height:1.8;color:#59544d;margin:0 0 32px;">
      Suite à votre demande et à la signature de notre accord de confidentialité, 
      nous avons sélectionné <strong>${chefs.length} profil${chefs.length > 1 ? 's' : ''}</strong> correspondant à vos critères.
    </p>

    <div style="background:#161616;border-radius:16px;padding:20px 24px;margin:0 0 32px;">
      <p style="color:#8a7f73;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Important</p>
      <p style="color:#ffffff;font-size:13px;line-height:1.7;margin:0;">
        Ces profils sont strictement confidentiels et réservés à votre usage exclusif. 
        Les coordonnées des chefs vous seront transmises uniquement après signature du contrat de mission.
      </p>
    </div>

    ${chefBlocks}

    <div style="background:#fff;border:1px solid #e8e3dc;border-radius:16px;padding:24px 28px;margin:32px 0;">
      <p style="color:#8a7f73;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">Prochaines étapes</p>
      <p style="color:#161616;font-size:14px;line-height:1.8;margin:0;">
        → Indiquez-nous votre profil préféré (Profil 1, 2 ou 3)<br/>
        → Nous organisons un appel de présentation<br/>
        → Contrat de mission signé → mise en relation directe
      </p>
    </div>

    <div style="border-top:1px solid #e8e3dc;padding-top:32px;margin-top:16px;">
      <p style="font-size:14px;color:#59544d;margin:0 0 4px;">Cordialement,</p>
      <p style="font-size:15px;color:#161616;font-weight:bold;margin:0 0 4px;">Thomas Delcroix</p>
      <p style="font-size:12px;color:#8a7f73;margin:0;">Chefs Talents · +33 7 56 82 76 12 · chefstalents.com</p>
    </div>

  </div>
</body>
</html>`,
    });

    // Mettre à jour le statut de la demande → chefs_selected
    await supabase
      .from('client_requests')
      .update({
        status: 'chefs_selected',
        ncc_signed_url: nccUrl || null,
        chef_ids_selected: chefIds,
        profiles_sent_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    // Notification interne
    await resend.emails.send({
      from: 'Chefs Talents <noreply@chefstalents.com>',
      to: 'contact@chefstalents.com',
      subject: `✅ Profils envoyés — ${clientName || clientEmail}`,
      html: `<div style="font-family:monospace;padding:24px;">
        <h2>Profils anonymisés envoyés</h2>
        <p><strong>Client :</strong> ${clientName || '—'} (${clientEmail})</p>
        <p><strong>Demande :</strong> ${requestId}</p>
        <p><strong>Chefs sélectionnés :</strong> ${chefIds.length} profils</p>
        <p><strong>IDs :</strong> ${chefIds.join(', ')}</p>
      </div>`,
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[send-profiles] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
