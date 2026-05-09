// lib/escapeHtml.ts
// Helper minimaliste pour échapper les caractères HTML spéciaux dans
// du contenu utilisateur injecté dans une string HTML (typiquement
// des emails transactionnels ou pages serveur).
//
// Couvre : &, <, >, ", '
// NE PAS utiliser pour échapper les attributs href ou src (utiliser un
// validateur d'URL dédié).

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
