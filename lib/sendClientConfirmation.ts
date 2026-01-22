// lib/sendClientConfirmation.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendClientConfirmation({
  email,
  firstName,
  type,
}: {
  email: string;
  firstName?: string;
  type: 'fast' | 'concierge';
}) {
  const delay =
    type === 'fast'
      ? 'sous 24 à 48h'
      : 'sous 48 à 72h';

  return resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: email,
    subject: 'Nous avons bien reçu votre demande – Chef Talents',
    text: `Bonjour ${firstName || ''},

Nous avons bien reçu votre demande.

Notre équipe analyse actuellement votre besoin afin de vous proposer une sélection de chefs correspondant à vos attentes.

⏱️ Délai indicatif de réponse : ${delay}

Aucune réservation n’est effectuée sans votre validation préalable.

À très bientôt,
Chef Talents`,
  });
}
