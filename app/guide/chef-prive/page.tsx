// app/guide/chef-prive/page.tsx
// LE guide complet — long-form, conçu pour être lu en ligne (le PDF n'apporte
// rien de plus côté UX). Sert à la fois pour le lead magnet (les leads y
// arrivent via email après capture) ET pour le SEO (page indexable).

import type { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '../../../components/Layout';

const SITE_URL = 'https://chefstalents.com';
const URL = `${SITE_URL}/guide/chef-prive`;

export const metadata: Metadata = {
  title: '7 questions à poser avant d\'engager un chef privé — Le guide',
  description:
    'Le guide complet par Chefs Talents : critères de sélection, budget, logistique, NDA, clause de remplacement, marketplace vs agence. Conçu pour les familles UHNW et cadres dirigeants.',
  alternates: { canonical: URL },
  openGraph: {
    type: 'article',
    url: URL,
    title: '7 questions à poser avant d\'engager un chef privé',
    description:
      'Critères de sélection, budget, logistique, NDA — le guide pratique par Chefs Talents.',
    images: [`${SITE_URL}/images/editorial/hero-chef-talents.jpg`],
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '7 questions à poser avant d\'engager un chef privé',
  description:
    'Le guide complet par Chefs Talents : critères de sélection, budget, logistique, NDA, clause de remplacement, marketplace vs agence.',
  author: { '@type': 'Organization', name: 'Chefs Talents', url: SITE_URL },
  publisher: {
    '@type': 'Organization',
    name: 'Chefs Talents',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/images/editorial/hero-chef-talents.jpg`,
    },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

export default function GuideChefPrivePage() {
  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <article className="bg-paper min-h-screen pt-32 pb-24">
        {/* Header */}
        <header className="px-6 md:px-12 max-w-3xl mx-auto mb-16 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-6">
            Guide Chefs Talents
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight mb-6">
            7 questions à poser avant d'engager un chef privé
          </h1>
          <p className="text-xl text-stone-500 font-light leading-relaxed max-w-2xl mx-auto">
            Critères de sélection, budget, logistique, discrétion. Le guide
            que nous donnons aux familles et cadres dirigeants avant chaque
            placement.
          </p>
        </header>

        {/* Body */}
        <div className="px-6 md:px-12 max-w-2xl mx-auto space-y-12 text-stone-700">
          <Section>
            <Intro>
              <p>
                Engager un chef privé n'a rien d'évident. Entre les marketplaces
                qui agrègent des centaines de profils non-vérifiés et les
                agences confidentielles qui ne publient ni leurs prix ni leurs
                références, beaucoup de clients arbitrent à l'aveugle — et le
                paient sur leur saison d'été ou leur dîner d'affaires.
              </p>
              <p>
                Ce guide regroupe les <strong>7 questions</strong> que nous
                posons systématiquement à nos chefs avant un placement, et que
                vous devriez poser à toute agence ou tout chef indépendant que
                vous évaluez. Il s'adresse autant aux familles qui réservent
                une villa Cap-Ferrat pour août qu'à un cadre dirigeant qui veut
                surprendre douze invités pour un dîner ponctuel.
              </p>
            </Intro>
          </Section>

          <Section>
            <H2>1. Quel est le parcours réel du chef ?</H2>
            <p>
              Un parcours en restaurant étoilé ne fait pas tout, mais c'est
              l'indicateur de loin le plus fiable. Demandez les noms précis des
              établissements et la durée des passages. Trois ans chez Yannick
              Alléno ou Anne-Sophie Pic ont une signification que vingt ans de
              freelance n'ont pas.
            </p>
            <p>
              Pour les missions yacht ou multi-résidences, demandez aussi
              l'expérience d'autonomie complète : un chef habitué à un brigade
              de quinze en restaurant n'est pas nécessairement à l'aise seul
              dans une cuisine de villa, à gérer ses commandes, son service et
              son rangement.
            </p>
            <Aside>
              Chez Chefs Talents, nous écartons systématiquement les profils
              dont les références ne peuvent pas être vérifiées par téléphone
              auprès des établissements cités.
            </Aside>
          </Section>

          <Section>
            <H2>2. Quel budget réel pour ma mission ?</H2>
            <p>
              Méfiez-vous des prix « au couvert » affichés en hero sur les
              marketplaces : ils sont calibrés pour attirer le clic. Le budget
              réel se calcule différemment selon le type de mission.
            </p>
            <p><strong>Pour un dîner ponctuel</strong> (3-6 heures, 4-15 couverts) :
              vous arbitrerez entre 400 et 1 500 € pour un chef indépendant
              correct, 1 200 à 3 500 € pour un profil Michelin-trained, hors
              produits.</p>
            <p><strong>Pour une mission en villa</strong> (semaine ou saison) :
              raisonnez en honoraires journaliers (700-2 500 €) plus le
              logement et les déplacements, sur la durée. Pour une saison
              complète, la tarification se négocie en forfait avec acompte.</p>
            <p><strong>Pour un yacht</strong> : la fourchette s'élargit selon
              la taille du bateau, le nombre de convives et la durée. Comptez
              une enveloppe semaine plus large qu'en villa.</p>
            <Aside>
              Demandez toujours si les courses, la vaisselle, les linges et le
              transport sont inclus ou facturés à part. Une mauvaise surprise
              de 30 % du devis arrive en général sur ces postes.
            </Aside>
          </Section>

          <Section>
            <H2>3. Comment se gère la logistique d'une mission longue ?</H2>
            <p>
              Sur une mission de plusieurs semaines, la cuisine n'est plus
              l'enjeu — la logistique l'est. Un bon chef privé en mission
              longue cartographie dès le premier jour les marchés matinaux
              locaux, les fermes biologiques et les fournisseurs spécialisés.
            </p>
            <p>
              Demandez comment le chef gère ses commandes, son stockage, ses
              déchets, et sa coordination avec le reste du personnel de
              maison. Un chef qui ne sait pas répondre précisément à ces
              questions n'a probablement pas fait de mission longue
              auparavant — ou pas dans le standard que vous attendez.
            </p>
          </Section>

          <Section>
            <H2>4. La discrétion est-elle contractuelle ?</H2>
            <p>
              Un chef qui circule chez vous voit, entend, parfois croise des
              invités. La discrétion ne peut pas reposer sur la confiance
              orale : elle doit être un <strong>NDA signé</strong>, avec une
              clause de confidentialité opposable juridiquement.
            </p>
            <p>
              Pour les profils habitués aux clientèles UHNW, c'est un acquis.
              Pour les profils plus généralistes, c'est rarement le cas — et
              ça peut se révéler problématique lors d'un événement privé ou
              d'un séjour familial sensible.
            </p>
            <Aside>
              Tous les chefs que nous plaçons chez Chefs Talents signent un
              NDA avant leur première mission. La clause est étendue aux
              invités, conversations entendues et photographies.
            </Aside>
          </Section>

          <Section>
            <H2>5. Que se passe-t-il si le chef se désiste ?</H2>
            <p>
              C'est la question la plus oubliée et la plus coûteuse. Un chef
              indépendant qui annule à J-3 vous laisse seul avec votre yacht
              affrété ou votre villa pleine de famille. Une marketplace ne
              vous proposera au mieux qu'un remplaçant aléatoire.
            </p>
            <p>
              Demandez systématiquement : <strong>existe-t-il une clause de
              remplacement contractuelle ?</strong> Si oui, sous quels délais,
              avec quel profil équivalent, et qui prend en charge l'écart de
              tarif éventuel ?
            </p>
            <Aside>
              C'est l'un des points sur lesquels nous nous engageons
              contractuellement (engagement de 24 mois) — à notre connaissance,
              aucun de nos concurrents directs ne le formalise.
            </Aside>
          </Section>

          <Section>
            <H2>6. Peut-on tester avant d'engager pour une saison ?</H2>
            <p>
              Pour une mission ponctuelle, l'enjeu est limité. Pour une saison
              de plusieurs semaines ou un placement permanent, c'est
              fondamental.
            </p>
            <p>
              Un dîner de probation (4-8 couverts, en condition réelle, avec
              briefing sur les préférences alimentaires et contraintes
              spécifiques) coûte 600 à 1 500 € et vous évite trois mois de
              cohabitation tendue. C'est la meilleure assurance qui existe sur
              ce marché.
            </p>
            <p>
              Toute agence ou chef qui refuse ce principe pour une mission
              longue est à éviter — ou alors la prestation doit pouvoir être
              annulée sans frais après le premier service.
            </p>
          </Section>

          <Section>
            <H2>7. Marketplace, agence ou chef indépendant — comment choisir ?</H2>
            <p>
              Les trois canaux existent et chacun a son cas d'usage :
            </p>
            <ul>
              <li>
                <strong>Marketplace ouverte</strong> (Take a Chef, MiumMium,
                yhangry) : pertinent pour un dîner unique à budget contenu,
                avec une faible exigence sur le parcours du chef. Vous arbitrez
                seul entre des dizaines de profils non vettés.
              </li>
              <li>
                <strong>Chef indépendant</strong> sourcé via votre réseau :
                pertinent si vous avez une recommandation forte d'un proche qui
                a déjà testé. Le risque de remplacement reste sur vos épaules.
              </li>
              <li>
                <strong>Agence sélective</strong> : pertinent pour les missions
                à enjeu (saisons, placements longs, événements UHNW, yachts).
                Vous payez pour la sélection, la vérification, le NDA, et la
                garantie de remplacement.
              </li>
            </ul>
            <p>
              Le bon réflexe : utilisez la marketplace pour un dîner-test à 80 €
              de risque, et l'agence pour la saison à 30 000 € de risque.
            </p>
          </Section>

          <Section>
            <Outro>
              <H2>Et ensuite ?</H2>
              <p>
                Si vous avez un projet en cours d'arbitrage — saison à
                Saint-Tropez, dîner d'affaires à Paris, mission yacht
                Méditerranée, chef permanent pour une résidence — nous pouvons
                vous proposer une short-list de 2-3 profils sous 48 heures, avec
                références vérifiables, parcours détaillé et tarification claire.
              </p>
              <p>
                Aucun engagement avant d'avoir vu les profils.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/request"
                  className="inline-flex items-center justify-center px-6 py-3 rounded bg-stone-900 text-white font-medium hover:bg-stone-800 transition"
                >
                  Soumettre une demande
                </Link>
                <Link
                  href="/insights"
                  className="inline-flex items-center justify-center px-6 py-3 rounded border border-stone-300 text-stone-900 font-medium hover:bg-stone-50 transition"
                >
                  Explorer le journal
                </Link>
              </div>
            </Outro>
          </Section>
        </div>
      </article>
    </Layout>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="space-y-4">{children}</section>;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl md:text-3xl font-serif text-stone-900 mt-12 mb-4 leading-tight">
      {children}
    </h2>
  );
}

function Intro({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 text-lg leading-relaxed text-stone-700">{children}</div>;
}

function Outro({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-stone-200 pt-12 mt-12 space-y-4 text-base leading-relaxed text-stone-700">
      {children}
    </div>
  );
}

function Aside({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 px-5 py-4 border-l-2 border-stone-900 bg-stone-50 text-sm text-stone-700 leading-relaxed">
      {children}
    </div>
  );
}
