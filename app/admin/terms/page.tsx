'use client';

import React, { useEffect, useState } from 'react';

const TERMS_TEXT_KEY = 'ct_terms_chefs_text';
const TERMS_VERSION_KEY = 'ct_terms_chefs_version';

export default function AdminTermsPage() {
  const [text, setText] = useState('');
  const [version, setVersion] = useState('v1');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TERMS_TEXT_KEY) || '';
      const v = localStorage.getItem(TERMS_VERSION_KEY) || 'v1';
      setText(t);
      setVersion(v);
    } catch {}
  }, []);

  const save = () => {
    setSaved(false);
    try {
      localStorage.setItem(TERMS_TEXT_KEY, text);
      localStorage.setItem(TERMS_VERSION_KEY, version || 'v1');
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Conditions Chefs</h1>
          <p className="text-white/60 text-sm mt-1">
CONDITIONS DE COLLABORATION – CHEFS

Chef Talents

Dernière mise à jour : 09/01/2026

⸻

1. Objet

Les présentes Conditions de Collaboration ont pour objet de définir les modalités selon lesquelles les chefs indépendants (ci-après le « Chef ») collaborent avec Chef Talents, plateforme de mise en relation entre chefs privés et clients (particuliers, conciergeries, agences, entreprises).

Chef Talents agit exclusivement en qualité d’intermédiaire de mise en relation, de gestion et de coordination administrative et financière, sans lien de subordination avec le Chef.

⸻

2. Statut du Chef

Le Chef déclare exercer son activité en tant que professionnel indépendant (auto-entrepreneur, société, ou équivalent étranger).

À ce titre, le Chef reconnaît et garantit :
	•	être seul responsable de ses obligations fiscales, sociales et administratives ;
	•	disposer de l’ensemble des autorisations légales, assurances (notamment responsabilité civile professionnelle) et compétences nécessaires à l’exercice de son activité ;
	•	exercer son activité sous sa propre responsabilité.

Chef Talents n’est ni employeur, ni donneur d’ordre exclusif.

L’inscription du Chef sur la plateforme Chef Talents est sans exclusivité et sans engagement de volume.

Le Chef demeure libre d’exercer son activité en dehors de Chef Talents, sous réserve du respect des obligations de confidentialité et de non-contournement prévues aux présentes.

⸻

2.1 Absence de lien de subordination

Le Chef intervient en tant que prestataire indépendant, dans le cadre d’une relation commerciale librement consentie.

Il est expressément convenu que :
	•	le Chef n’est pas salarié de Chef Talents ;
	•	le Chef n’est pas salarié du client final ;
	•	aucune relation de subordination, d’exclusivité ou de dépendance juridique ne peut être caractérisée entre le Chef, Chef Talents et le client ;
	•	le Chef demeure libre d’accepter ou de refuser toute mission proposée via la plateforme.

Le Chef conserve l’entière liberté :
	•	de fixer ses tarifs ;
	•	d’organiser son travail ;
	•	de définir ses méthodes d’exécution, dans le respect du cahier des charges validé avec le client.

Le recours aux services de Chef Talents, y compris pour la gestion des paiements, ne saurait en aucun cas être interprété comme la création d’un contrat de travail ou d’un lien de subordination.

⸻

2.2 Cas particulier des missions yachting

Dans le cadre de certaines missions spécifiques, notamment à bord de yachts ou navires, le Chef peut être amené à intervenir en qualité de salarié du yacht, de l’armateur ou de la société d’exploitation du navire.

Dans ce cas :
	•	le contrat de travail est établi directement entre le Chef et l’entité exploitante ;
	•	Chef Talents n’est ni employeur, ni co-employeur, ni responsable des obligations sociales, fiscales ou contractuelles liées à ce contrat.

⸻

3. Processus de sélection des Chefs

L’accès à la plateforme Chef Talents est soumis à validation.

Deux niveaux de sélection peuvent s’appliquer :
	1.	Validation standard
Étude du dossier, du parcours professionnel, des références et du positionnement.
	2.	Validation premium (prestations haut de gamme / résidences)
Validation renforcée incluant, le cas échéant, un entretien visio et une analyse approfondie du niveau de service.

Chef Talents se réserve le droit :
	•	de refuser une candidature sans justification ;
	•	de limiter certains types de missions à des profils validés premium.

L’inscription du Chef sur la plateforme ne constitue en aucun cas une garantie d’attribution de missions.

Les missions sont proposées en fonction :
	•	des besoins spécifiques des clients ;
	•	du profil, de l’expérience, des disponibilités et du niveau de validation du Chef ;
	•	des critères propres à chaque mission.

Chef Talents n’a aucune obligation de volume, de fréquence ou de récurrence de missions.

⸻

4. Fixation des tarifs

Le Chef fixe librement ses tarifs, notamment :
	•	prix par personne pour les prestations ponctuelles (déjeuner, dîner, événement) ;
	•	prix par jour pour les missions de résidence (villa, yacht, chalet, long séjour).

Ces tarifs constituent la rémunération nette du Chef.

Aucune commission n’est prélevée sur les honoraires du Chef.

Chef Talents applique des frais de service facturés au client, en supplément du tarif du Chef.

Chaque mission fait l’objet d’une validation préalable du Chef avant confirmation définitive.

Chef Talents se réserve le droit de proposer ultérieurement des offres d’abonnement ou de services premium.
Ces offres feront l’objet de conditions distinctes et ne seront pas obligatoires pour rester inscrit sur la plateforme.

⸻

5. Facturation et encaissement

5.1 Encaissement client
	•	Le client règle 100 % de la prestation à l’avance via Chef Talents.
	•	Pour les prestations supérieures à 10 000 €, un acompte minimum de 50 % est exigé pour activer la mission.

Chef Talents facture au client la prestation globale (honoraires du Chef + frais de service).

⸻

5.2 Paiement du Chef
	•	Le Chef facture Chef Talents, et non le client final.
	•	La part du Chef est reversée via Stripe ou virement, selon les modalités définies.
	•	Le paiement intervient après réalisation de la prestation, ou selon les conditions spécifiques prévues.

Chef Talents agit en qualité de tiers de confiance dans la gestion et la répartition des flux financiers.

⸻

6. Déroulé d’une mission
	1.	Réception de la demande
	2.	Échange et validation du périmètre (menu, rythme, contraintes)
	3.	Validation du devis par les parties
	4.	Encaissement client
	5.	Réalisation de la prestation
	6.	Facturation du Chef à Chef Talents
	7.	Paiement du Chef

Le Chef s’engage à respecter le cahier des charges validé et à maintenir un niveau de service conforme à son positionnement.

⸻

7. Annulations et manquements

7.1 Annulation par le Chef

Toute annulation doit être immédiatement signalée à Chef Talents.

En cas d’annulation moins de 48 heures avant la prestation, Chef Talents se réserve le droit de :
	•	suspendre temporairement le compte du Chef ;
	•	limiter l’accès aux futures missions ;
	•	appliquer toute mesure nécessaire afin de préserver la satisfaction du client.

⸻

7.2 Annulation grave (no-show / moins de 24h)

Toute annulation :
	•	à moins de 24 heures ;
	•	ou sans justification valable ;
	•	ou sans communication,

entraîne l’exclusion immédiate et définitive de la plateforme dès la première occurrence.

Chef Talents se réserve également le droit de réclamer réparation en cas de préjudice subi.

⸻

8. Qualité, image et comportement

Le Chef s’engage à :
	•	adopter une tenue et une attitude professionnelles ;
	•	respecter les règles d’hygiène, de sécurité alimentaire et de discrétion ;
	•	préserver l’image et la réputation de Chef Talents.

Tout comportement inapproprié pourra entraîner suspension ou exclusion.

⸻

9. Confidentialité & non-contournement

Confidentialité

L’ensemble des informations auxquelles le Chef a accès via Chef Talents est strictement confidentiel
(client, conciergerie, lieux, budgets, habitudes, coordonnées, documents, menus, échanges).

Le Chef s’engage à ne divulguer aucune information sans autorisation écrite préalable de Chef Talents, sauf obligation légale.

⸻

Non-contournement

Le Chef s’interdit, pendant la durée de la collaboration et pendant 12 mois après la dernière mission, de :
	•	contracter directement avec un client, une conciergerie, un armateur ou toute entité présentée par Chef Talents ;
	•	accepter une mission similaire hors du cadre de Chef Talents ;
	•	utiliser les informations obtenues à des fins personnelles ou concurrentes.

Toute tentative de contournement constitue un manquement grave.

⸻

Sanctions

En cas de violation :
	•	suspension ou résiliation immédiate ;
	•	annulation des missions en cours ;
	•	indemnité forfaitaire minimale équivalente aux frais de service non perçus, sans préjudice de dommages et intérêts.

⸻

10. Données & communication

Chef Talents est autorisé à utiliser le profil du Chef (photos, bio) à des fins de promotion, sauf opposition écrite.

⸻

11. Suspension / Résiliation

Chef Talents peut suspendre ou résilier l’accès du Chef en cas de manquement, de retours clients négatifs répétés ou pour préserver la qualité du réseau.

Le Chef peut demander la suppression de son compte à tout moment.

⸻

12. Responsabilité

Chef Talents ne saurait être tenu responsable :
	•	de l’exécution de la prestation réalisée par le Chef ;
	•	des dommages causés au client ou à des tiers ;
	•	des litiges entre le Chef et le client.

Le Chef demeure seul responsable de sa prestation et de ses conséquences.

⸻

13. Force majeure

Aucune des parties ne pourra être tenue responsable en cas de non-exécution résultant d’un cas de force majeure.

⸻

14. Évolution des conditions

Chef Talents se réserve le droit de modifier les présentes Conditions.
Les Chefs devront accepter les mises à jour pour continuer à accéder à la plateforme.

⸻

15. Droit applicable

Les présentes Conditions sont régies par le droit français.
Tout litige relève des tribunaux compétents.

⸻

16. Acceptation

Le Chef reconnaît avoir lu, compris et accepté sans réserve les présentes Conditions de Collaboration.

☑ J’ai lu et j’accepte les conditions de collaboration Chef Talents
          
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs text-white/60">Version</label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5"
              placeholder="v1"
            />
            <p className="text-xs text-white/40 mt-2">
              Change la version (ex: v2) si tu modifies les CG → les chefs devront re-accepter.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-white/60">Texte</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-2 w-full min-h-[520px] px-3 py-3 rounded-xl border border-white/10 bg-white/5"
              placeholder="Colle tes conditions ici…"
            />
          </div>
        </div>

        <button
          onClick={save}
          className="px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90"
        >
          Enregistrer
        </button>

        {saved ? <div className="text-sm text-emerald-300">✅ Enregistré</div> : null}
      </div>
    </div>
  );
}
