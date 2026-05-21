// app/guide/merci/page.tsx
// Page de remerciement après soumission du formulaire de capture.
// Affiche un lien direct vers le guide complet.

import type { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '../../../components/Layout';

export const metadata: Metadata = {
  title: 'Merci — Votre guide est prêt',
  robots: { index: false, follow: true },
};

export default function GuideMerciPage() {
  return (
    <Layout>
      <section className="bg-paper min-h-[80vh] pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-6">
            Merci
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight mb-6">
            Votre guide est prêt
          </h1>
          <p className="text-lg text-stone-600 font-light leading-relaxed mb-10">
            Un email de confirmation vient de partir vers votre boîte. Vous
            pouvez aussi le consulter immédiatement :
          </p>

          <Link
            href="/guide/chef-prive"
            className="inline-flex items-center px-8 py-4 rounded bg-stone-900 text-white font-medium hover:bg-stone-800 transition"
          >
            Lire le guide
          </Link>

          <div className="mt-16 border-t border-stone-200 pt-10 text-left max-w-xl mx-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-4">
              Et si vous avez déjà un projet précis ?
            </div>
            <p className="text-base text-stone-600 leading-relaxed mb-6">
              Saison à Saint-Tropez, dîner ponctuel à Paris, chef permanent
              pour une résidence, mission yacht en Méditerranée — soumettez
              votre demande, nous vous présentons une short-list sous 48h.
            </p>
            <Link
              href="/request"
              className="inline-flex items-center text-stone-900 font-medium underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
            >
              Soumettre une demande →
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
