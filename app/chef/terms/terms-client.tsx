'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

const CURRENT_TERMS_VERSION = '09/01/2026';
const LS_TERMS_KEY = `ct_chef_terms_v_${CURRENT_TERMS_VERSION}`;

export default function TermsClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const next = sp.get('next') || '/chef/dashboard';

  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = useMemo(() => 'Conditions de collaboration – Chefs', []);

  const accept = async () => {
    setErr(null);

    if (!checked) {
      setErr("Merci de cocher la case d’acceptation.");
      return;
    }

    setLoading(true);

    try {
      // 1) Lire session Supabase pour récupérer userId
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const userId = data.session?.user?.id;
      if (!userId) {
        router.replace('/chef/login');
        return;
      }

      // 2) Enregistrer en DB
      const res = await fetch('/api/chef/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          userId,
          accepted: true,
          version: CURRENT_TERMS_VERSION,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'ACCEPT_FAIL');
      }

      // 3) Fallback local (UX)
      try {
        localStorage.setItem(LS_TERMS_KEY, '1');
      } catch {}

      router.replace(next);
    } catch {
      setErr("Impossible d’enregistrer l’acceptation. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-stone-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-stone-200 bg-white shadow-sm p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-stone-400">Chef Talents</div>

          <h1 className="mt-2 text-3xl md:text-4xl font-serif">{title}</h1>

          <p className="mt-2 text-sm text-stone-500">Dernière mise à jour : {CURRENT_TERMS_VERSION}</p>

          {/* ===================== CONDITIONS ===================== */}
          <div className="mt-8 prose prose-stone max-w-none">
            Les présentes Conditions de Collaboration ont pour objet de définir les modalités selon lesquelles les chefs indépendants
                (ci-après le « Chef ») collaborent avec Chef Talents, plateforme de mise en relation entre chefs privés et clients
                (particuliers, conciergeries, agences, entreprises).
              </p>
              <p>
                Chef Talents agit en qualité d’intermédiaire commercial et de gestion, sans lien de subordination avec le Chef.
              </p>

              <hr />

              <h2>2. Statut du Chef</h2>
              <p>
                Le Chef déclare exercer son activité en tant qu’indépendant (auto-entrepreneur, société, équivalent étranger).
              </p>
              <ul>
                <li>Il est seul responsable de ses obligations fiscales, sociales et assurantielles.</li>
                <li>
                  Il garantit disposer de toutes les autorisations légales, assurances (notamment RC Pro) et compétences nécessaires à
                  l’exercice de son activité.
                </li>
              </ul>
              <p>
                Chef Talents n’est ni employeur, ni donneur d’ordre exclusif. L’inscription du Chef sur la plateforme est sans engagement
                exclusif.
              </p>
              <p>
                Le Chef demeure libre d’exercer son activité en dehors de Chef Talents, sous réserve du respect des obligations de
                confidentialité et de non-contournement prévues aux présentes.
              </p>

              <h3>2.1 Absence de lien de subordination</h3>
              <p>
                Le Chef intervient en tant que prestataire indépendant, dans le cadre d’une relation commerciale librement consentie.
              </p>
              <p>Il est expressément convenu que :</p>
              <ul>
                <li>le Chef n’est pas salarié de Chef Talents ;</li>
                <li>le Chef n’est pas salarié du client final ;</li>
                <li>
                  aucune relation de subordination, d’exclusivité ou de dépendance juridique ne peut être caractérisée entre le Chef,
                  Chef Talents et le client ;
                </li>
                <li>le Chef demeure libre d’accepter ou de refuser toute mission proposée via la plateforme.</li>
              </ul>

              <h4>Cas particulier des missions yachting</h4>
              <p>
                Dans le cadre de certaines missions spécifiques, notamment à bord de yachts ou navires, le Chef peut être amené à
                intervenir en qualité de salarié du yacht, de l’armateur ou de la société d’exploitation du navire.
              </p>
              <p>Dans ce cas :</p>
              <ul>
                <li>le contrat de travail est établi directement entre le Chef et l’entité exploitante du yacht ;</li>
                <li>
                  Chef Talents n’est ni employeur, ni co-employeur, ni responsable des obligations sociales, fiscales ou contractuelles
                  liées à ce contrat.
                </li>
              </ul>
              <p>
                Le Chef conserve l’entière liberté d’accepter ou refuser une mission, de fixer ses tarifs et d’organiser son travail dans
                le respect du cahier des charges validé.
              </p>
              <p>
                Chef Talents intervient exclusivement en qualité d’intermédiaire de mise en relation et de gestion administrative et
                financière, sans direction ni contrôle hiérarchique sur l’exécution de la prestation.
              </p>
              <p>
                En toute hypothèse, le recours aux services de Chef Talents, y compris pour la gestion des paiements, ne saurait être
                interprété comme la création d’un lien de subordination ou d’un contrat de travail entre le Chef et Chef Talents.
              </p>

              <hr />

              <h2>3. Processus de sélection des Chefs</h2>
              <p>L’accès à la plateforme Chef Talents est soumis à validation. Deux niveaux de sélection peuvent s’appliquer :</p>
              <ol>
                <li>
                  <b>Validation standard</b> : étude du dossier, parcours professionnel, références, positionnement.
                </li>
                <li>
                  <b>Validation premium</b> (prestations haut de gamme / résidences) : validation renforcée incluant, le cas échéant, un
                  entretien visio et une analyse approfondie du niveau de service.
                </li>
              </ol>
              <p>Chef Talents se réserve le droit :</p>
              <ul>
                <li>de refuser une candidature sans justification ;</li>
                <li>de limiter certains types de missions à des profils validés premium.</li>
              </ul>
              <p>
                L’inscription du Chef sur la plateforme Chef Talents ne constitue en aucun cas une garantie d’attribution de missions.
                Les missions sont proposées en fonction des besoins clients, du profil, de l’expérience, des disponibilités et du niveau
                de validation du Chef.
              </p>
              <p>Chef Talents n’a aucune obligation de volume, de fréquence ou de récurrence de missions.</p>

              <hr />

              <h2>4. Fixation des tarifs</h2>
              <p>Le Chef fixe librement ses tarifs, notamment :</p>
              <ul>
                <li>prix par personne pour les prestations ponctuelles (déjeuner, dîner, événement),</li>
                <li>prix par jour pour les missions de résidence (villa, yacht, chalet, long séjour).</li>
              </ul>
              <p>Ces tarifs constituent la rémunération nette du Chef.</p>
              <p>
                <b>Aucune commission n’est prélevée sur les honoraires du Chef.</b> Chef Talents applique des frais de service facturés au
                client, en supplément du tarif du Chef. Le Chef est informé et valide chaque mission avant confirmation.
              </p>
              <p>
                Chef Talents se réserve le droit de proposer, à l’avenir, des offres d’abonnement ou de services premium (non
                obligatoires), destinées à améliorer la visibilité, l’accompagnement, l’accès à certaines missions ou à des
                fonctionnalités avancées. Ces offres feront l’objet de conditions distinctes.
              </p>

              <hr />

              <h2>5. Facturation et encaissement</h2>

              <h3>5.1 Encaissement client</h3>
              <ul>
                <li>Le client règle 100 % de la prestation à l’avance via Chef Talents.</li>
                <li>
                  Pour les prestations supérieures à <b>10 000 €</b>, un acompte de <b>50 % minimum</b> est exigé à la commande pour activer
                  le chef.
                </li>
              </ul>
              <p>Chef Talents facture au client la prestation globale (honoraires Chef + frais de service).</p>

              <h3>5.2 Paiement du Chef</h3>
              <ul>
                <li>La part du Chef est reversée via Stripe ou virement, selon les modalités définies.</li>
                <li>Le Chef facture Chef Talents, et non le client final.</li>
                <li>Le paiement intervient après réalisation de la prestation (ou selon conditions spécifiques prévues).</li>
              </ul>
              <p>Chef Talents agit comme tiers de confiance dans la répartition des flux financiers.</p>

              <hr />

              <h2>6. Déroulé d’une mission</h2>
              <ol>
                <li>Réception de la demande</li>
                <li>Échange et validation du périmètre (menu, rythme, contraintes)</li>
                <li>Validation du devis par les parties</li>
                <li>Encaissement client</li>
                <li>Réalisation de la prestation</li>
                <li>Facturation du Chef à Chef Talents</li>
                <li>Paiement du Chef</li>
              </ol>
              <p>Le Chef s’engage à respecter le cahier des charges validé et à maintenir un niveau de service conforme à son positionnement.</p>

              <hr />

              <h2>7. Annulations et manquements</h2>

              <h3>7.1 Annulation par le Chef</h3>
              <ul>
                <li>Toute annulation doit être immédiatement signalée à Chef Talents.</li>
                <li>
                  En cas d’annulation moins de <b>48h</b> avant la prestation, Chef Talents se réserve le droit de suspendre temporairement
                  le compte et/ou de limiter l’accès aux futures missions.
                </li>
              </ul>

              <h3>7.2 Annulation grave (no-show / &lt; 24h sans justification)</h3>
              <p>
                Toute annulation à moins de 24 heures, sans justification valable, ou sans communication, entraîne l’exclusion immédiate
                et définitive de la plateforme, dès la première occurrence.
              </p>
              <p>Chef Talents se réserve également le droit de réclamer réparation en cas de préjudice client.</p>

              <hr />

              <h2>8. Qualité, image et comportement</h2>
              <p>Le Chef s’engage à :</p>
              <ul>
                <li>adopter une tenue et une attitude professionnelles,</li>
                <li>respecter les règles d’hygiène, de sécurité alimentaire et de discrétion,</li>
                <li>ne pas nuire à l’image de Chef Talents.</li>
              </ul>
              <p>Tout comportement inapproprié pourra entraîner suspension ou exclusion.</p>

              <hr />

              <h2>9. Confidentialité &amp; non-contournement</h2>

              <h3>Confidentialité</h3>
              <p>
                Le Chef reconnaît que l’ensemble des informations auxquelles il a accès dans le cadre de son inscription et de ses
                missions via Chef Talents (incluant notamment : identité des clients, conciergeries, lieux, budgets, habitudes, contraintes
                logistiques, échanges, documents, menus, coordonnées) revêt un caractère strictement confidentiel.
              </p>
              <p>
                Le Chef s’engage à ne divulguer aucune de ces informations à des tiers, sauf accord écrit préalable de Chef Talents ou
                obligation légale.
              </p>

              <h3>Non-contournement</h3>
              <p>
                Le Chef s’interdit formellement, pendant toute la durée de sa collaboration avec Chef Talents et pendant une période de
                <b> 12 mois</b> après la dernière mission, de :
              </p>
              <ul>
                <li>contracter directement avec un client, une conciergerie, un armateur ou toute entité présentée par Chef Talents ;</li>
                <li>
                  accepter une mission similaire ou équivalente avec ces mêmes parties, en dehors du cadre de Chef Talents ;
                </li>
                <li>utiliser les informations obtenues via Chef Talents à des fins personnelles ou concurrentes.</li>
              </ul>
              <p>Toute tentative de contournement, directe ou indirecte, sera considérée comme un manquement grave.</p>

              <h3>Sanctions</h3>
              <p>En cas de violation avérée des obligations de confidentialité ou de non-contournement :</p>
              <ul>
                <li>Chef Talents se réserve le droit de suspendre ou résilier immédiatement l’accès du Chef à la plateforme ;</li>
                <li>toute mission en cours pourra être annulée ;</li>
                <li>
                  Chef Talents pourra réclamer une indemnité forfaitaire minimale équivalente aux frais de service non perçus, sans
                  préjudice de dommages et intérêts complémentaires.
                </li>
              </ul>

              <hr />

              <h2>10. Données &amp; communication</h2>
              <p>
                Chef Talents est autorisé à utiliser le profil du Chef (photos, bio) à des fins de promotion et à mentionner certaines
                prestations à titre de référence (sauf opposition écrite).
              </p>

              <hr />

              <h2>11. Suspension / Résiliation</h2>
              <p>Chef Talents peut suspendre ou résilier l’accès d’un Chef :</p>
              <ul>
                <li>en cas de manquement aux présentes conditions,</li>
                <li>en cas de retours clients négatifs répétés,</li>
                <li>pour préserver la qualité du réseau.</li>
              </ul>
              <p>Le Chef peut demander la suppression de son compte à tout moment.</p>

              <hr />

              <h2>12. Droit applicable</h2>
              <p>
                Les présentes Conditions sont régies par le droit français. Tout litige relève des tribunaux compétents.
              </p>

              <hr />

              <h2>13. Acceptation</h2>
              <p>
                Le Chef reconnaît avoir lu, compris et accepté sans réserve les présentes Conditions de Collaboration.
              </p>
            </div>
          {/* ===================== FIN CONDITIONS ===================== */}

          <div className="mt-10 border-t border-stone-200 pt-6 space-y-4">
            <label className="flex items-start gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1"
              />
              <span>J’ai lu et j’accepte les Conditions de Collaboration Chef Talents.</span>
            </label>

            {err ? <div className="text-sm text-red-600">{err}</div> : null}

            <button
              onClick={accept}
              disabled={loading || !checked}
              className="w-full rounded-2xl bg-stone-900 text-white py-3 font-medium hover:bg-stone-800 disabled:opacity-40"
            >
              {loading ? 'Enregistrement…' : 'Accepter et continuer'}
            </button>

            <div className="text-xs text-stone-400">Version en vigueur : {CURRENT_TERMS_VERSION}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
