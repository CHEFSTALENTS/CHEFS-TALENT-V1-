// app/guide/page.tsx
// Landing page lead magnet : "Guide pour engager un chef privé".
// Capture email + redirige vers /guide/merci avec lien vers le guide complet.

import type { Metadata } from 'next';
import { Layout } from '../../components/Layout';
import GuideCaptureForm from './_components/GuideCaptureForm';

const SITE_URL = 'https://chefstalents.com';

export const metadata: Metadata = {
  title: 'Guide gratuit : engager un chef privé en France',
  description:
    "Téléchargez notre guide gratuit : 7 questions à poser avant d'engager un chef privé. Critères de sélection, budget, logistique, NDA. Par Chefs Talents.",
  alternates: { canonical: `${SITE_URL}/guide` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/guide`,
    title: 'Guide gratuit : 7 questions à poser avant d\'engager un chef privé',
    description:
      'Critères de sélection, budget, logistique, NDA — le guide pratique par Chefs Talents.',
    images: [`${SITE_URL}/images/editorial/hero-chef-talents.jpg`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guide : engager un chef privé en France',
    description:
      'Critères de sélection, budget, logistique, NDA — le guide pratique.',
    images: [`${SITE_URL}/images/editorial/hero-chef-talents.jpg`],
  },
};

export default function GuideLandingPage() {
  return (
    <Layout>
      <section className="bg-paper pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-4">
            Guide gratuit
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight mb-6">
            7 questions à poser avant d'engager un chef privé
          </h1>
          <p className="text-xl text-stone-500 font-light leading-relaxed max-w-2xl">
            Critères de sélection, budget, logistique, discrétion. Le guide
            que nous donnons aux familles UHNW et cadres dirigeants avant
            chaque placement.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 px-6 md:px-12 border-t border-stone-100">
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          {/* Colonne gauche : value props */}
          <div className="space-y-6 text-stone-700">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-2">Au sommaire</div>
              <ul className="space-y-3 text-base leading-relaxed">
                <li>
                  <strong className="text-stone-900">1.</strong> Comment évaluer le parcours d'un chef (Michelin-trained, restaurants étoilés, autonomie sur yacht)
                </li>
                <li>
                  <strong className="text-stone-900">2.</strong> Le budget réel par jour, semaine et saison — sans piège
                </li>
                <li>
                  <strong className="text-stone-900">3.</strong> Logistique d'une mission longue durée (villa, chalet, résidence)
                </li>
                <li>
                  <strong className="text-stone-900">4.</strong> NDA, discrétion et confidentialité : ce qui doit être contractuel
                </li>
                <li>
                  <strong className="text-stone-900">5.</strong> La clause de remplacement chef — pourquoi c'est non-négociable
                </li>
                <li>
                  <strong className="text-stone-900">6.</strong> Comment tester un chef avant de l'engager pour une saison
                </li>
                <li>
                  <strong className="text-stone-900">7.</strong> Marketplace vs agence sélective : choisir le bon canal
                </li>
              </ul>
            </div>

            <div className="border-t border-stone-200 pt-6 text-sm text-stone-500">
              Écrit à partir des critères que nous appliquons en interne pour
              sélectionner les chefs que nous plaçons en villa, sur yacht ou
              en résidence.
            </div>
          </div>

          {/* Colonne droite : formulaire */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 md:p-8">
            <GuideCaptureForm />
          </div>
        </div>
      </section>

      <section className="bg-stone-50 py-16 px-6 md:px-12 border-t border-stone-200">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-4">
            Chefs Talents
          </div>
          <p className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
            Agence française de chefs privés. Nous plaçons des profils
            Michelin-trained pour des familles, cadres dirigeants, yachts et
            résidences en Europe — du dîner ponctuel à la mission de saison.
          </p>
        </div>
      </section>
    </Layout>
  );
}
