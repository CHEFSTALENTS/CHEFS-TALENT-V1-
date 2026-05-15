// app/villa/page.tsx
// Landing page dédiée aux campagnes Google Ads.
// Server Component avec metadata + schema FAQ. Tous les CTA pointent
// vers /request?source=villa-landing pour utiliser le 7-step unique
// (conversion tracking, brief complet, email de confirmation déjà OK).
//
// Design v2 : fond blanc, accents burgundy, carousel témoignages,
// image break + galerie pour plus de chair visuelle.

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import TestimonialsCarousel from './_components/TestimonialsCarousel';

const BASE = 'https://chefstalents.com';
const URL = `${BASE}/villa`;

const REQUEST_URL = '/request?source=villa-landing';
const WHATSAPP_NUMBER = '33756827612'; // +33 7 56 82 76 12

// Palette
const ACCENT = '#7f1d1d';        // burgundy
const ACCENT_SOFT = '#fef2f2';   // burgundy 50, fond très léger

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'À partir de quelle durée acceptez-vous une mission ?',
    answer:
      "Nous acceptons les missions à partir de 3 jours. Notre savoir-faire prend tout son sens sur les séjours longs, d'une semaine à plusieurs mois.",
  },
  {
    question: 'Quels sont les ordres de grandeur tarifaires ?',
    answer:
      "Une prestation chef privé démarre à partir de 2 500 € par semaine selon le profil et le format. Les missions longue durée et yacht font l'objet d'une négociation dédiée.",
  },
  {
    question: 'Travaillez-vous avec les conciergeries ?',
    answer:
      "Oui. Nous avons un accès partenaire dédié, avec une grille adaptée et une priorité de traitement pour les conciergeries et house managers.",
  },
  {
    question: "Que se passe-t-il en cas d'imprévu (annulation, indisponibilité) ?",
    answer:
      "Nous prévoyons systématiquement un profil de remplacement pré-validé pour les missions longues. La continuité opérationnelle est notre engagement.",
  },
  {
    question: "Qui s'occupe des courses et de la logistique ?",
    answer:
      "Le chef gère intégralement le sourcing (marchés, producteurs locaux, livraisons spéciales). Vous n'avez rien à coordonner.",
  },
  {
    question: 'Comment garantissez-vous la confidentialité ?',
    answer:
      "Aucune référence n'est rendue publique. Les chefs sont contractualisés avec clause de confidentialité. La discrétion fait partie des critères de sélection.",
  },
];

export const metadata: Metadata = {
  title: 'Chef privé pour villas, yachts et résidences — Chefs Talents',
  description:
    "Chef privé pour villas, yachts et résidences. D'un dîner à toute la saison. Réponse sous 6 à 24h, partout en Europe.",
  alternates: { canonical: URL },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Chef privé pour villas, yachts et résidences — Chefs Talents',
    description:
      "D'un dîner à toute la saison. Réponse sous 6 à 24h, partout en Europe.",
    url: URL,
    siteName: 'Chefs Talents',
    images: ['/images/editorial/villa-service.jpg'],
    locale: 'fr_FR',
    type: 'website',
  },
};

const GALLERY = [
  {
    src: '/images/editorial/IMG_1622.jpg',
    alt: 'Terrasse de villa avec vue infinity sur la Méditerranée',
    label: 'Villa Méditerranée',
  },
  {
    src: '/images/editorial/IMG_1624.jpg',
    alt: 'Table dressée à bord d\'un yacht au mouillage',
    label: 'Yacht charter',
  },
  {
    src: '/images/editorial/IMG_1620.jpg',
    alt: 'Table d\'hôtes en extérieur au coucher de soleil',
    label: 'Dîner privé',
  },
  {
    src: '/images/editorial/IMG_1625.jpg',
    alt: 'Service à bord d\'un yacht en baie de Monaco',
    label: 'Service en mer',
  },
];

const TESTIMONIALS = [
  {
    quote: "Réactivité, qualité, discrétion. Exactement ce dont nous avions besoin pour nos clients de l'été.",
    author: 'Selma R.',
    role: 'Villa Manager, Cap Ferrat',
  },
  {
    quote: 'Chef proposé sous 6h, installé chez nous dans la semaine. Le séjour entier en a été transformé.',
    author: 'Alexandre P.',
    role: 'Locataire saison, Saint-Tropez',
  },
  {
    quote: 'Un partenaire fiable pour des demandes complexes. Discrétion totale, ce qui est non-négociable pour nous.',
    author: 'Constance L.',
    role: 'Conciergerie, Monaco',
  },
  {
    quote: "Le chef a tenu trois services par jour pendant deux semaines, sans une fausse note. Brigade en tête.",
    author: 'Karim B.',
    role: 'Charter manager, Antibes',
  },
  {
    quote: "Ils ont compris notre brief en cinq minutes au téléphone. Le profil envoyé matchait à 100 %.",
    author: 'Élise V.',
    role: 'Famille UHNW, Ibiza',
  },
  {
    quote: "Chef trouvé un week-end, en pleine saison. Personne d'autre n'aurait pu nous sortir de là.",
    author: 'Henri D.',
    role: 'Owner villa, Saint-Jean-Cap-Ferrat',
  },
  {
    quote: "Coordination impeccable avec notre house manager. Le chef s'est intégré comme s'il était là depuis toujours.",
    author: 'Béatrice M.',
    role: 'Conciergerie privée, Genève',
  },
];

export default function VillaLandingPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <main className="bg-white text-[#161616]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#161616] text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/editorial/IMG_1619.jpg"
            alt="Table dressée bord de piscine vue mer Méditerranée"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32 lg:px-16 lg:py-40">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">
            Chefs Talents
          </p>
          <h1 className="mt-4 max-w-4xl text-[2.6rem] font-serif leading-[1.04] text-white md:text-[4.2rem]">
            Chefs privés pour vos villas,<br />
            yachts et résidences.
          </h1>
          <p className="mt-6 max-w-2xl text-[18px] font-light leading-8 text-white/90 md:text-2xl md:leading-relaxed">
            D'un dîner à toute la saison. Une orchestration sans friction, partout en Europe.
          </p>
          <p className="mt-3 text-[14px] text-white/70">
            Réponse sous 6 à 24h.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={REQUEST_URL}
              className="inline-flex min-h-[60px] items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-[#161616] transition hover:bg-white/90"
            >
              Décrire mon projet <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour Thomas, j'ai un projet de chef privé.")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[60px] items-center justify-center rounded-full border border-white/30 px-7 py-4 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              WhatsApp — Thomas
            </a>
          </div>
        </div>

        {/* Bandeau chiffres */}
        <div className="relative border-t border-white/10 bg-black/45 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-4 px-6 py-6 md:grid-cols-4 md:px-10 lg:px-16">
            <Stat value="400" label="chefs" />
            <Stat value="400" label="missions" />
            <Stat value="50" label="destinations" />
            <Stat value="6-24h" label="délai" />
          </div>
        </div>
      </section>

      {/* ── POUR QUI ──────────────────────────────────────── */}
      <section className="bg-white px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            Pour qui
          </p>
          <h2 className="mt-4 max-w-3xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
            Trois profils, un même standard.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <PersonaCard
              title="Propriétaires et locataires de villas"
              body="Saison estivale, long stay ou séjour court. Côte d'Azur, Ibiza, Mykonos, Sardaigne. Nos chefs s'installent chez vous le temps qu'il faut."
            />
            <PersonaCard
              title="Yacht charters"
              body="Chefs habitués au yachting privé, expérience galley en mer, gestion logistique de bord. Mobilité internationale."
            />
            <PersonaCard
              title="Conciergeries et house managers"
              body="Un interlocuteur dédié, un réseau exclusif, une fiabilité que vos clients vous reconnaîtront."
            />
          </div>
        </div>
      </section>

      {/* ── IMAGE BREAK ──────────────────────────────────── */}
      <section className="bg-white px-6 pt-2 pb-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px]">
          <div className="relative h-[52vh] md:h-[64vh]">
            <Image
              src="/images/editorial/IMG_1623.jpg"
              alt="Villa contemporaine avec piscine, vue collines et mer Méditerranée"
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-3xl px-7 pb-9 md:px-12 md:pb-14">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/85">
                  Exécution
                </p>
                <h3 className="mt-3 text-[2rem] font-serif leading-[1.06] text-white md:text-5xl">
                  Une présence discrète, une exécution constante,<br className="hidden md:inline" /> un niveau de service tenu.
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ORCHESTRATION ─────────────────────────────────── */}
      <section className="bg-white px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
              Orchestration
            </p>
            <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
              Plus qu'une mise en relation.<br />
              <span style={{ color: ACCENT }}>Une orchestration.</span>
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="text-[18px] font-light leading-8 text-[#3a352e] md:text-2xl md:leading-relaxed">
              Nous ne livrons pas un chef : nous cadrons une mission. Qualification du besoin, sélection ciblée parmi 400 profils, coordination du brief, anticipation des imprévus.
            </p>
            <p className="mt-6 text-[16px] leading-8 text-[#5d5651] md:text-lg">
              Notre rôle n'est pas de servir. Il est de faire en sorte que rien ne dépasse, et que tout soit juste.
            </p>
          </div>
        </div>
      </section>

      {/* ── GALERIE ──────────────────────────────────────── */}
      <section className="bg-white px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            Décors
          </p>
          <h2 className="mt-4 max-w-3xl text-[2.2rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
            Là où nos chefs interviennent.
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {GALLERY.map((img) => (
              <figure
                key={img.src + img.label}
                className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-stone-100"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition duration-700 hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 md:p-4">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white">
                    {img.label}
                  </span>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES (carousel défilant) ─────────────── */}
      <section
        className="overflow-hidden py-24"
        style={{ backgroundColor: ACCENT_SOFT }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            Témoignages
          </p>
          <h2 className="mt-4 max-w-3xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
            Ce que nos clients en disent.
          </h2>
        </div>

        <div className="mt-12">
          <TestimonialsCarousel testimonials={TESTIMONIALS} accent={ACCENT} />
        </div>
      </section>

      {/* ── CONFIDENTIALITÉ ──────────────────────────────── */}
      <section className="bg-[#161616] px-6 py-24 text-white md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">Confidentialité</p>
            <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-white md:text-6xl">
              La discrétion<br />n'est pas une option.
            </h2>
          </div>
          <div className="lg:col-span-8">
            <p className="max-w-[24rem] text-[18px] font-light leading-8 text-white/88 md:max-w-3xl md:text-2xl md:leading-relaxed">
              Nos chefs interviennent dans les villas, chalets, yachts et résidences privées à travers l'Europe. Les lieux, les clients et les missions ne sont jamais rendus publics.
            </p>
            <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-white/78 md:max-w-3xl md:text-xl md:leading-relaxed">
              Les références sont partagées de manière sélective. La confidentialité fait partie intégrante de notre manière de travailler.
            </p>
          </div>
        </div>
      </section>

      {/* ── MÉTHODE ──────────────────────────────────────── */}
      <section className="bg-white px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>Méthode</p>
          <h2 className="mt-4 max-w-3xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
            Une demande simple.<br />Un traitement structuré.
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <StepCard
              number="01"
              title="Qualification"
              text="Nous analysons le lieu, les dates, le niveau de service, le format de mission et le budget indicatif."
            />
            <StepCard
              number="02"
              title="Sélection"
              text="Nous identifions les profils les plus pertinents selon la mission, l'environnement et les exigences exprimées."
            />
            <StepCard
              number="03"
              title="Coordination"
              text="Une fois le profil validé, nous cadrons la mission et restons le point de contact pour son bon déroulement."
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section
        className="px-6 py-24 md:px-10 lg:px-16"
        style={{ backgroundColor: ACCENT_SOFT }}
      >
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            Questions fréquentes
          </p>
          <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
            Avant de demander.
          </h2>

          <div className="mt-12 space-y-8">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question}>
                <h3 className="text-xl font-medium text-[#161616]">
                  {item.question}
                </h3>
                <p className="mt-3 text-[16px] leading-7 text-[#3a352e]">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#161616] px-6 py-28 text-white md:px-10 md:py-32 lg:px-16">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/images/editorial/IMG_1620.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/40" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">Votre projet</p>
          <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-white md:text-6xl">
            Décrivez votre projet.<br />Réponse sous 6 à 24h.
          </h2>
          <p className="mt-8 max-w-2xl mx-auto text-[17px] font-light leading-8 text-white/85">
            Thomas, votre interlocuteur, vous recontacte avec une sélection ciblée selon votre brief.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={REQUEST_URL}
              className="inline-flex min-h-[60px] items-center justify-center rounded-full bg-white px-9 py-4 text-sm font-medium text-[#161616] transition hover:bg-white/90"
            >
              Décrire mon projet <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour Thomas, j'ai un projet de chef privé.")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[60px] items-center justify-center rounded-full border border-white/30 px-7 py-4 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              WhatsApp — Thomas
            </a>
          </div>

          <p className="mt-10 text-[12px] text-white/55">
            Sans engagement · Aucune réservation sans votre validation
          </p>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2 text-white">
      <span className="text-3xl font-serif md:text-4xl">{value}</span>
      <span className="text-[11px] uppercase tracking-[0.2em] text-white/65">{label}</span>
    </div>
  );
}

function PersonaCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="group rounded-[24px] border border-stone-200 bg-white p-7 transition hover:border-[#7f1d1d]/30 hover:shadow-[0_18px_40px_-20px_rgba(127,29,29,0.25)]">
      <div
        className="h-[3px] w-10 mb-5 rounded-full"
        style={{ backgroundColor: '#7f1d1d' }}
      />
      <h3 className="text-xl font-serif text-[#161616]">{title}</h3>
      <p className="mt-4 text-[15px] font-light leading-7 text-[#5d5651]">{body}</p>
    </div>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-7">
      <p
        className="text-[11px] font-medium uppercase tracking-[0.24em]"
        style={{ color: '#7f1d1d' }}
      >
        {number}
      </p>
      <h3 className="mt-4 text-xl font-serif text-[#161616]">{title}</h3>
      <p className="mt-3 text-[15px] font-light leading-7 text-[#5d5651]">{text}</p>
    </div>
  );
}
