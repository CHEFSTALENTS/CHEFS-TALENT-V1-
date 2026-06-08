// lib/email/chefNotifications.ts
//
// Kill switch global pour TOUS les mails sortants vers les chefs
// (notifications de mission, rappels avant mission, propositions, etc.)
//
// Désactivé par défaut depuis juin 2026 (demandé par Thomas — contenu
// inadapté en l'état au démarrage de saison).
//
// Réactivation :
//   Set CHEF_NOTIFICATIONS_ENABLED=1 dans les env vars Vercel.

export function chefNotificationsEnabled(): boolean {
  return process.env.CHEF_NOTIFICATIONS_ENABLED === '1';
}

/**
 * Log standardisé quand on skip un mail chef à cause du kill switch.
 * Utile pour confirmer dans les logs Vercel qu'aucun mail n'est parti.
 */
export function logChefNotificationSkipped(source: string, to: string | null): void {
  console.log(
    `[chef-notif] skipped (${source}) → ${to ?? 'no-email'} — CHEF_NOTIFICATIONS_ENABLED != "1"`,
  );
}
