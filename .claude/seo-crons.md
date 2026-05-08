# SEO Crons — Configuration

> Fichier de référence pour recréer les 3 crons SEO automatisés.
> Les crons Claude Code sont session-only et expirent après 7 jours.
> **Action Thomas** : 1× par semaine, ouvrir Claude Code et écrire :
> "Recrée les 3 crons SEO depuis .claude/seo-crons.md"

## Architecture

3 crons durables qui ouvrent toujours une PR (jamais de merge auto, jamais de push main).

| Cron | Fréquence | Mission |
|---|---|---|
| `content-weekly` | Lundi 9h57 | Picore le prochain item de `seo-backlog.md`, rédige, ouvre PR |
| `health-weekly` | Mercredi 8h12 | Scan technique (alt, schema, hreflang, h1), fixe les triviaux, PR |
| `audit-monthly` | 1er du mois 7h08 | Audit complet, MAJ `/llms.txt`, rapport `seo-reports/`, PR |

## Cron 1 — Content production

- **Cron expression** : `57 9 * * 1`
- **Recurring** : true
- **Durable** : true

```
[CRON SEO content production — lundi matin]

Repo : /Users/lacantinedethomas/dev/CHEFS-TALENT-V1-
Branche de travail : main (à jour)

Mission : produire le prochain article du backlog SEO en autonomie, ouvrir une PR, attendre review de Thomas.

Étapes obligatoires :
1. cd dans le repo, git fetch + git pull origin main
2. Lis seo-backlog.md à la racine
3. Trouve le PREMIER item non coché ([ ]) sous une section "Sprint" (ignore "Done")
4. Si tous les items sont cochés : ouvre une issue GitHub "SEO backlog épuisé — à réalimenter" et termine
5. Identifie le tag entre crochets : [comparatif], [pillar-fr], [pillar-en], [pillar-es], [pricing], [study], [faq-batch], [llms-txt], [freeform]
6. Crée une branche : seo/auto-YYYY-MM-DD-{slug-court}
7. Rédige le contenu :
   - [comparatif] : 1500-2500 mots, voix consultant, tableau comparatif factuel honnête, conclusion "quand choisir l'un ou l'autre", 5 FAQs, ajoute l'entrée dans data/articles.ts
   - [pillar-*] : 8000-10000 mots, structure H2/H3 claire, listes, tableaux prix, 8-10 FAQs, internal linking massif vers /destinations et autres /insights
   - [pricing] : tableaux chiffrés par destination/format, voix factuelle, 5 FAQs
   - [study] : squelette du baromètre + sections vides à remplir avec data réelle (Thomas validera)
   - [faq-batch] : ajoute des arrays faqs[] aux pages destinations correspondantes, respecte le pattern existant
   - [llms-txt] : crée public/llms.txt avec liste des pages clés du site
   - Voix : consultant-stratège, AUCUN em-dash, AUCUN tic IA, prose dense
8. Marque l'item [x] dans seo-backlog.md avec la date du jour entre parenthèses
9. git add, commit "SEO: {titre court}", push la branche
10. Ouvre une PR avec gh pr create. Body : ce qui a été produit, internal links, schema, points d'attention pour Thomas
11. Affiche l'URL de la PR

Règles strictes :
- JAMAIS push sur main
- JAMAIS merge la PR toi-même
- Si doute éditorial : PR draft (gh pr create --draft) avec questions
- Si la branche existe déjà : passe à l'item suivant non coché
```

## Cron 2 — Health check

- **Cron expression** : `12 8 * * 3`
- **Recurring** : true
- **Durable** : true

```
[CRON SEO health check — mercredi matin]

Repo : /Users/lacantinedethomas/dev/CHEFS-TALENT-V1-
Branche de travail : main (à jour)

Mission : auditer la santé technique SEO, corriger les fixes triviaux, ouvrir une PR si quelque chose a bougé.

Étapes :
1. cd dans le repo, git fetch + git pull origin main
2. Crée une branche : seo/health-YYYY-MM-DD
3. Scanne en parallèle :
   a. Images sans alt (Image et img dans app/ et components/)
   b. Pages sans <h1> ou avec >1 <h1>
   c. Liens internes cassés
   d. Schema JSON-LD invalide
   e. generateMetadata manquant sur pages publiques (hors /admin /chef /api)
   f. Hreflang FR/EN/ES sur layouts root, /en, /es
   g. Images > 500KB dans public/
4. Classe en FIX TRIVIAL (corrige auto) ou REVIEW HUMAIN (liste dans rapport)
5. Si rien : seo-reports/health-YYYY-MM-DD.md "Tout va bien" + PR informative
6. Si fixes : commit "SEO health: {résumé}", push, PR avec body listant fixes + REVIEW HUMAIN
7. Affiche URL PR

Règles : jamais merge auto, jamais push main, toujours PR.
```

## Cron 3 — Audit mensuel

- **Cron expression** : `8 7 1 * *`
- **Recurring** : true
- **Durable** : true

```
[CRON SEO audit mensuel — 1er du mois]

Repo : /Users/lacantinedethomas/dev/CHEFS-TALENT-V1-
Branche de travail : main (à jour)

Mission : audit SEO mensuel global, comparaison vs mois précédent, MAJ /llms.txt, archivage.

Étapes :
1. cd dans le repo, git fetch + git pull origin main
2. Crée une branche : seo/audit-YYYY-MM
3. Lance le skill searchfit-seo:seo-audit avec contexte "Audit mensuel récurrent Chefs Talents, focus ranking chef privé FR/EN/ES"
4. Compare au rapport seo-reports/audit-{mois precedent}.md s'il existe (régressions / progrès)
5. Mets à jour public/llms.txt avec description, pages clés, URLs canoniques requêtes prioritaires
6. Vérifie sitemap.xml liste toutes les pages publiques
7. Vérifie hreflang root + /en + /es
8. Sauvegarde dans seo-reports/audit-YYYY-MM.md (critique / warnings / opportunities / passing / progrès)
9. Si fixes : ajoute les triviaux au commit, liste les autres dans rapport
10. Commit "SEO audit mensuel YYYY-MM", push, PR avec exec summary
11. Affiche URL PR

Règles : jamais merge auto, jamais push main.
```

## Recreation procedure

Pour recréer les 3 crons après expiration / fermeture session, ouvrir Claude Code dans ce repo et écrire :

> Recrée les 3 crons SEO depuis `.claude/seo-crons.md`

Claude lira ce fichier et invoquera `CronCreate` 3 fois avec les expressions et prompts ci-dessus.
