'use client';

// ProcessTimeline — Section "Comment ça se passe vraiment quand vous appelez"
// Sticky vertical avec trait de progression scroll-linked + chaque étape qui
// s'éclaire en entrant dans le viewport. Pas de jargon, pas de marketing —
// le vrai déroulé d'une mission, étape par étape.

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Phone, ClipboardList, FileText, Users, MousePointerClick, FileSignature, Handshake, Sparkles } from 'lucide-react';

type Step = {
  number: string;
  duration: string;
  title: string;
  body: string;
  icon: typeof Phone;
};

const STEPS: Step[] = [
  {
    number: '01',
    duration: '< 6h',
    title: 'Vous remplissez le formulaire, on répond',
    body: "Lieu, dates, nombre de couverts, type d'événement. Trois lignes suffisent. On vous répond sous 6 heures — ou avec un retour franc si on ne peut pas faire.",
    icon: Phone,
  },
  {
    number: '02',
    duration: '15 min',
    title: 'On qualifie ensemble',
    body: "Un appel rapide pour cadrer : niveau de service attendu, contraintes du lieu (cuisine équipée ou pas, distance courses), habitudes alimentaires, langues parlées, format de mission (dîner unique, séjour, résidence longue, remplacement).",
    icon: ClipboardList,
  },
  {
    number: '03',
    duration: '24h',
    title: 'On vous envoie un devis',
    body: "Devis détaillé : honoraires chef, frais de coordination, conditions de paiement, durée d'engagement. Aucune zone grise. Vous savez exactement ce que vous payez et à qui ça va.",
    icon: FileText,
  },
  {
    number: '04',
    duration: '24h',
    title: 'On vous présente 2 ou 3 profils',
    body: "Pas une liste de 50 chefs. Deux, parfois trois. Chacun choisi à la main pour votre mission précise. Vous recevez les CVs, parcours, références — sur dossier.",
    icon: Users,
  },
  {
    number: '05',
    duration: 'À votre rythme',
    title: 'Vous sélectionnez un profil',
    body: "À cette étape, vous ne parlez pas encore au chef directement. C'est volontaire — sans contrat signé, pas de mise en relation. Si vous voulez creuser un profil, on organise un call à trois (vous, le chef, moi).",
    icon: MousePointerClick,
  },
  {
    number: '06',
    duration: 'Le jour même',
    title: 'On signe : contrat de prestation ou contrat d\'essai',
    body: "Contrat de prestation pour les missions confirmées. Contrat d'essai pour les missions longues où vous voulez tester avant d'engager. Dans les deux cas : signature électronique, NCC (accord de non-contournement), conditions claires.",
    icon: FileSignature,
  },
  {
    number: '07',
    duration: 'Après paiement',
    title: 'Paiement reçu → mise en relation directe',
    body: "Une fois l'acompte versé, je vous mets en contact direct avec le chef. Vous échangez sur le menu, les vins, les allergies, la logistique. C'est à ce moment-là que la relation chef-client commence — pas avant.",
    icon: Handshake,
  },
  {
    number: '08',
    duration: 'Avant + pendant',
    title: 'Le chef opère. On supervise la logistique.',
    body: "Le chef gère sa cuisine — menu, courses, équipement, exécution sur place. Nous, on suit la logistique en parallèle : transport, hébergement chef, paiements, ajustements de dernière minute. On reste joignable pendant toute la mission.",
    icon: Sparkles,
  },
];

export default function ProcessTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 70%', 'end 30%'],
  });

  // Le trait vertical qui se remplit au scroll
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section className="bg-white px-6 py-24 md:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        {/* Header section */}
        <div className="mb-16 md:mb-20 max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Le déroulé</p>
          <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
            Voici ce qui se passe<br />quand vous nous appelez.
          </h2>
          <p className="mt-6 text-[18px] font-light leading-8 text-[#59544d] md:text-xl md:leading-relaxed">
            De votre premier message jusqu'au service en place. Pas de zone grise.
          </p>
        </div>

        {/* Timeline */}
        <div ref={containerRef} className="relative">
          {/* Trait vertical fond (track) */}
          <div
            className="absolute top-0 left-[22px] sm:left-[30px] w-[2px] bg-[#d8d1c7] h-full hidden sm:block"
            aria-hidden
          />
          {/* Trait vertical de progression (rempli au scroll) */}
          <motion.div
            className="absolute top-0 left-[22px] sm:left-[30px] w-[2px] bg-[#161616] hidden sm:block"
            style={{ height: lineHeight }}
            aria-hidden
          />

          <ol className="space-y-10 md:space-y-14">
            {STEPS.map((step, i) => (
              <Step key={step.number} step={step} index={i} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Step({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px 0px -100px 0px' });
  const Icon = step.icon;

  return (
    <motion.li
      ref={ref}
      className="relative sm:pl-20"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Pastille étape (avec icône) */}
      <div className="hidden sm:flex absolute left-0 top-0 h-[62px] w-[62px] items-center justify-center rounded-full border bg-white z-10
        transition-colors duration-700"
        style={{
          borderColor: inView ? '#161616' : '#d8d1c7',
        }}
      >
        <div
          className="h-[44px] w-[44px] rounded-full flex items-center justify-center transition-colors duration-700"
          style={{
            backgroundColor: inView ? '#161616' : 'transparent',
            color: inView ? '#fff' : '#8a7f73',
          }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
      </div>

      {/* Carte de contenu */}
      <div className="rounded-[24px] border border-[#c9bfb1] bg-[#f6f1ea] p-6 md:p-8 transition-colors duration-700"
        style={{
          borderColor: inView ? '#a09890' : '#d8d1c7',
        }}
      >
        <div className="flex items-baseline gap-3 mb-3 flex-wrap">
          <span className="font-serif text-3xl text-[#161616]">{step.number}</span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#7d756a]">
            {step.duration}
          </span>
        </div>
        <h3 className="text-xl md:text-2xl font-serif text-[#161616] mb-3">
          {step.title}
        </h3>
        <p className="text-[16px] md:text-[17px] font-light leading-7 text-[#59544d]">
          {step.body}
        </p>
      </div>
    </motion.li>
  );
}
