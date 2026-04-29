import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInternalChefEnquiry({
  enquiryId,
  email,
  fullName,
  background,
  destinations,
  lang,
  createdAtISO,
}: {
  enquiryId: string;
  email: string;
  fullName?: string;
  background?: string;
  destinations?: string;
  lang: string;
  createdAtISO: string;
}) {
  const date = new Date(createdAtISO).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  await resend.emails.send({
    from: 'Chefs Talents <noreply@chefstalents.com>',
    to: 'contact@chefstalents.com',
    subject: `🍳 Nouvelle candidature programme — ${fullName ?? email}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4efe8;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 32px;">

    <p style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8a7f73;margin:0 0 32px;">
      CHEFS TALENTS — CANDIDATURE CHEF
    </p>

    <div style="background:#161616;border-radius:16px;padding:28px 32px;margin:0 0 28px;">
      <p style="color:#8a7f73;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 20px;">
        Nouvelle candidature — Programme d'intégration
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#8a7f73;font-size:13px;padding:6px 0;vertical-align:top;width:140px;">Nom</td>
          <td style="color:#ffffff;font-size:14px;padding:6px 0;">${fullName ?? '—'}</td>
        </tr>
        <tr>
          <td style="color:#8a7f73;font-size:13px;padding:6px 0;vertical-align:top;">Email</td>
          <td style="color:#ffffff;font-size:14px;padding:6px 0;">
            <a href="mailto:${email}" style="color:#B08D57;text-decoration:none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="color:#8a7f73;font-size:13px;padding:6px 0;vertical-align:top;">Parcours</td>
          <td style="color:#ffffff;font-size:14px;padding:6px 0;">${background ?? '—'}</td>
        </tr>
        <tr>
          <td style="color:#8a7f73;font-size:13px;padding:6px 0;vertical-align:top;">Destinations</td>
          <td style="color:#ffffff;font-size:14px;padding:6px 0;">${destinations ?? '—'}</td>
        </tr>
        <tr>
          <td style="color:#8a7f73;font-size:13px;padding:6px 0;vertical-align:top;">Langue</td>
          <td style="color:#ffffff;font-size:14px;padding:6px 0;">${lang.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="color:#8a7f73;font-size:13px;padding:6px 0;vertical-align:top;">Date</td>
          <td style="color:#ffffff;font-size:14px;padding:6px 0;">${date}</td>
        </tr>
        <tr>
          <td style="color:#8a7f73;font-size:13px;padding:6px 0;vertical-align:top;">ID</td>
          <td style="color:#8a7f73;font-size:12px;padding:6px 0;">${enquiryId}</td>
        </tr>
      </table>
    </div>

    <div style="background:#ffffff;border:1px solid #d8d1c7;border-radius:16px;padding:24px 28px;margin:0 0 28px;">
      <p style="color:#8a7f73;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">Actions suggérées</p>
      <p style="color:#161616;font-size:14px;line-height:1.7;margin:0 0 8px;">
        → Répondre sous 24h à <a href="mailto:${email}" style="color:#B08D57;">${email}</a>
      </p>
      <p style="color:#161616;font-size:14px;line-height:1.7;margin:0 0 8px;">
        → Qualifier le profil (niveau, disponibilité, expérience)
      </p>
      <p style="color:#161616;font-size:14px;line-height:1.7;margin:0;">
        → Si pertinent, présenter le programme d'intégration (500€)
      </p>
    </div>

    <p style="font-size:12px;color:#8a7f73;text-align:center;">
      Chefs Talents · chefstalents.com
    </p>

  </div>
</body>
</html>`,
  });
}
