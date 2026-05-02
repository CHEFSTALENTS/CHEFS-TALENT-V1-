// app/api/chef/propose-mission/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();
  const { chefId, chefName, destination, dates, guests, budget, notes } = body;

  await resend.emails.send({
    from: 'Chefs Talents <noreply@chefstalents.com>',
    to: 'contact@chefstalents.com',
    subject: `🔁 Mission proposée par ${chefName} — ${destination}`,
    html: `
      <div style="font-family:monospace;padding:24px;max-width:600px">
        <h2>Mission proposée par un chef du réseau</h2>
        <p><strong>Chef :</strong> ${chefName} (${chefId})</p>
        <hr/>
        <p><strong>Destination :</strong> ${destination}</p>
        <p><strong>Dates :</strong> ${dates}</p>
        <p><strong>Convives :</strong> ${guests || '—'}</p>
        <p><strong>Budget estimé :</strong> ${budget || '—'}</p>
        <p><strong>Notes :</strong> ${notes || '—'}</p>
        <hr/>
        <p style="color:#888">Si la mission aboutit, le chef touche 5% de commission.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
