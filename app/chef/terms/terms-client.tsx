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
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const userId = data.session?.user?.id;
      if (!userId) {
        router.replace('/chef/login');
        return;
      }

      const res = await fetch('/api/chef/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          userId,
          version: CURRENT_TERMS_VERSION,
          accepted: true,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'ACCEPT_FAIL');
      }

      // UX fallback
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
          <div className="text-xs uppercase tracking-[0.25em] text-stone-400">
            Chef Talents
          </div>

          <h1 className="mt-2 text-3xl md:text-4xl font-serif">
            {title}
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Dernière mise à jour : {CURRENT_TERMS_VERSION}
          </p>

          {/* ===================== CONDITIONS ===================== */}
          <div className="mt-8 prose prose-stone max-w-none">

            <h2>1. Objet</h2>
            <p>
              Les présentes Conditions de Collaboration ont pour objet de définir
              les modalités selon lesquelles les chefs indépendants (ci-après le
              « Chef ») collaborent avec Chef Talents, plateforme de mise en
              relation entre chefs privés et clients (particuliers,
              conciergeries, agences, entreprises).
            </p>
            <p>
              Chef Talents agit exclusivement en qualité d’intermédiaire
              commercial et de gestion, sans lien de subordination avec le Chef.
            </p>

            <h2>2. Statut du Chef</h2>
            <p>
              Le Chef déclare exercer son activité en tant qu’indépendant
              (auto-entrepreneur, société, ou équivalent étranger).
            </p>
            <ul>
              <li>Il est seul responsable de ses obligations fiscales, sociales et assurantielles.</li>
              <li>Il garantit disposer des autorisations légales, assurances professionnelles et compétences nécessaires.</li>
            </ul>
            <p>
              L’inscription sur la plateforme est sans engagement d’exclusivité
              et sans garantie de missions.
            </p>

            <h3>2.1 Absence de lien de subordination</h3>
            <p>
              Le Chef intervient en tant que prestataire indépendant. Il est
              expressément convenu qu’aucune relation de subordination,
              d’exclusivité ou de dépendance juridique ne peut être caractérisée
              entre le Chef, Chef Talents et le client final.
            </p>
            <p>
              Le Chef demeure libre d’accepter ou de refuser toute mission, de
              fixer ses tarifs et d’organiser son travail dans le respect du
              cahier des charges validé.
            </p>

            <h4>Cas particulier des missions yachting</h4>
            <p>
              Dans certaines missions spécifiques (yachts, navires), le Chef
              peut intervenir en qualité de salarié du yacht, de l’armateur ou
              de la société d’exploitation.
            </p>
            <p>
              Dans ce cas, le contrat est conclu directement entre le Chef et
              l’entité exploitante. Chef Talents n’est ni employeur, ni
              co-employeur et n’assume aucune obligation liée à ce contrat.
            </p>

            <h2>3. Processus de sélection</h2>
            <p>
              L’accès à la plateforme est soumis à validation. L’inscription ne
              constitue en aucun cas une garantie d’attribution de missions.
            </p>

            <h2>4. Fixation des tarifs</h2>
            <p>Le Chef fixe librement ses tarifs (prix/pax, prix/jour, etc.).</p>
            <p>
              Chef Talents applique des frais de service facturés au client, en
              supplément du tarif du Chef.
            </p>

            <h2>5. Facturation et encaissement</h2>
            <p>
              Le client règle la prestation à l’avance via Chef Talents (tiers
              de confiance). Le paiement du Chef intervient après réalisation de
              la prestation (ou conditions spécifiques validées).
            </p>

            <h2>6. Déroulé d’une mission</h2>
            <ol>
              <li>Réception de la demande</li>
              <li>Validation du périmètre</li>
              <li>Validation du devis</li>
              <li>Encaissement client</li>
              <li>Réalisation de la prestation</li>
              <li>Facturation du Chef</li>
              <li>Paiement du Chef</li>
            </ol>

            <h2>7. Annulations et manquements</h2>
            <p>
              Toute annulation doit être immédiatement signalée. Une annulation
              à moins de 48h peut entraîner suspension ou limitation d’accès.
            </p>
            <p>
              Toute annulation à moins de 24h sans justification ou sans
              communication entraîne l’exclusion immédiate.
            </p>

            <h2>8. Qualité, image et comportement</h2>
            <p>
              Le Chef s’engage à adopter une tenue et une attitude
              professionnelles, à respecter les règles d’hygiène, de sécurité
              alimentaire et de discrétion.
            </p>

            <h2>9. Confidentialité et non-contournement</h2>
            <p>
              L’ensemble des informations obtenues via Chef Talents est
              strictement confidentiel. Toute tentative de contournement est
              interdite pendant la collaboration et pendant 12 mois après la
              dernière mission.
            </p>

            <h2>10. Données et communication</h2>
            <p>
              Chef Talents est autorisé à utiliser le profil du Chef (photos,
              bio) à des fins de promotion, sauf opposition écrite.
            </p>

            <h2>11. Suspension et résiliation</h2>
            <p>
              Chef Talents peut suspendre ou résilier l’accès en cas de
              manquement ou pour préserver la qualité du réseau.
            </p>

            <h2>12. Droit applicable</h2>
            <p>
              Les présentes Conditions sont régies par le droit français. Tout
              litige relève des tribunaux compétents.
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

            <div className="text-xs text-stone-400">
              Version en vigueur : {CURRENT_TERMS_VERSION}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
