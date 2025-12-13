'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { Button, Section, Reveal, Marker, Label } from '../../components/ui';
import { Layout } from '../../components/Layout';

export default function PrivateClientsPage() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      {/* Hero Section - Full Bleed Background */}
     <section className="relative min-h-[90vh] flex flex-col justify-end pb-32 px-6 md:px-12 bg-stone-900">
  {/* Background image */}
  <div className="absolute inset-0 z-0">
    <img
      src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"
      alt="Private Villa Dining"
      className="w-full h-full object-cover"
    />
    {/* Premium overlay (contrast guarantee) */}
    <div className="absolute inset-0 bg-stone-950/65" />
    {/* Subtle vignette for readability */}
    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/35 to-transparent" />
  </div>

  {/* Content */}
  <div className="relative z-10 max-w-7xl w-full mx-auto">
    <Reveal>
      <div className="w-[1px] h-16 bg-white/80 mb-12" />

      <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal leading-[0.9] tracking-tight mb-12 text-white">
        Des chefs privés,
        <br />
        <span className="text-white/75">pensés pour votre lieu de vie et vos réceptions.</span>
      </h1>
    </Reveal>

    <Reveal
      delay={0.2}
      className="flex flex-col md:flex-row gap-12 md:items-end justify-between border-t border-white/15 pt-12"
    >
      <p className="text-xl md:text-2xl text-white/80 font-light max-w-2xl leading-relaxed">
        Chef Talents accompagne des clients privés recherchant des chefs fiables, discrets et expérimentés pour leur domicile,
        leur villa ou leur résidence, partout en Europe.
      </p>

      <div className="flex flex-col sm:flex-row gap-6">
        <Link href="/request?type=private">
          <Button
            size="lg"
            className="bg-white text-stone-900 hover:bg-stone-100 border-none w-full sm:w-auto"
          >
            Soumettre une demande
          </Button>
        </Link>

        <Button
          variant="outline"
          size="lg"
          className="text-white border-white/50 hover:bg-white/10 hover:border-white w-full sm:w-auto"
          onClick={() => scrollTo('positioning')}
        >
          Comment ça fonctionne
        </Button>
      </div>
    </Reveal>
  </div>
</section>

      {/* Positioning & What We Provide - Paper Background */}
      <Section className="bg-paper" id="positioning">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-3">
             <Marker />
             <Label>Notre approche</Label>
          </div>
          <div className="md:col-span-9">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-serif text-stone-900 leading-tight mb-16">
                Pour celles et ceux qui privilégient la constance à la facilité.
              </h2>
              <div className="grid md:grid-cols-2 gap-16 text-lg text-stone-600 font-light leading-relaxed">
                <div>
                  <p className="mb-6">
                    Chef Talents n’est pas conçu pour des réservations impulsives.
                    La plateforme s’adresse à des clients qui attendent, chez eux, le même niveau d’exigence que dans les établissements les plus reconnus.
                  </p>
                  <p>
                    Nous sélectionnons et accompagnons des chefs capables d’opérer avec rigueur, discrétion et régularité.
                  </p>
                </div>
                <div>
                  <h3 className="font-serif text-xl text-stone-900 mb-6">Ce que nous proposons</h3>
                  <ul className="space-y-4">
                     {[
                       "Des chefs privés sélectionnés selon vos attentes",
                       "Des prestations à domicile, en villa ou en résidence",
                       "Une gestion structurée des dîners ponctuels comme des séjours prolongés",
                       "Un fonctionnement discret, aligné avec des standards élevés",
                       "Un interlocuteur unique tout au long de la mission"
                     ].map((item, i) => (
                       <li key={i} className="flex items-start gap-3">
                         <div className="w-1.5 h-1.5 bg-stone-400 rounded-full mt-2.5 shrink-0" />
                         <span>{item}</span>
                       </li>
                     ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Service Modes - Warm Grid */}
      <section className="py-32 border-y border-stone-200 bg-stone-100">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <Reveal>
            <Label className="mb-12 block">Deux manières de faire appel à un chef</Label>
          </Reveal>
          
          <div className="grid lg:grid-cols-2 gap-12">
             {/* Mode 1 */}
             <div className="bg-paper p-12 md:p-20 hover:shadow-sm transition-all duration-500 border border-stone-200">
                <Label className="text-stone-400 mb-8 block">01 — Ponctuel</Label>
                <h3 className="text-4xl font-serif mb-6 text-stone-900">Fast Match</h3>
                <p className="text-stone-500 text-lg font-light mb-12 max-w-md">
                  Pour des demandes simples, sur une date unique.
                  Nous identifions des chefs disponibles correspondant à votre besoin et encadrons la mission dans des conditions claires.
                </p>
                <ul className="space-y-4 mb-12">
                  <li className="text-sm uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2">Identité vérifiée</li>
                  <li className="text-sm uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2">Consultation Menu</li>
                  <li className="text-sm uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2">Tarification claire</li>
                </ul>
                <Link href="/request?type=private">
                  <Button variant="outline">Démarrer Fast Match</Button>
                </Link>
             </div>

             {/* Mode 2 */}
             <div className="bg-[#2E2B26] p-12 md:p-20 text-stone-200">
                <Label className="text-stone-500 mb-8 block">02 — Suivi</Label>
                <h3 className="text-4xl font-serif mb-6 text-paper">Concierge Match</h3>
                <p className="text-stone-400 text-lg font-light mb-12 max-w-md">
                   Pour les séjours prolongés, les besoins récurrents ou les demandes spécifiques.
                   Les missions sont sélectionnées et suivies via un processus accompagné.
                </p>
                <ul className="space-y-4 mb-12">
                  <li className="text-sm uppercase tracking-widest text-stone-500 border-b border-stone-700 pb-2">NDA & Vérifications</li>
                  <li className="text-sm uppercase tracking-widest text-stone-500 border-b border-stone-700 pb-2">Gestion de personnel</li>
                  <li className="text-sm uppercase tracking-widest text-stone-500 border-b border-stone-700 pb-2">Suivi dédié</li>
                </ul>
                <Link href="/request?type=concierge">
<Button
  size="lg"
  className="
    bg-white 
    text-stone-900 
    hover:bg-stone-100 
    border border-white/20
    px-10
  "
>
  Contactez nous
</Button>                </Link>
             </div>
          </div>
        </div>
      </section>

      {/* Use Cases - List Style - Paper Background */}
      <Section className="bg-paper">
        <div className="grid md:grid-cols-12 gap-16">
          <div className="md:col-span-4">
             <Marker />
             <Label>Exemples de demandes</Label>
          </div>
          <div className="md:col-span-8">
            <div className="grid gap-px bg-stone-200 border-t border-stone-200">
              {[
                "Dîner privé à domicile ou en villa",
                "Séjours familiaux nécessitant un service quotidien",
                "Résidence saisonnière à la montagne ou en bord de mer",
                "Accueil d’invités avec attentes alimentaires spécifiques",
                "Accompagnement culinaire sur plusieurs semaines"
              ].map((item, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="bg-paper py-10 px-0 flex items-baseline justify-between hover:pl-8 transition-all duration-500 cursor-default border-b border-stone-200 group">
                    <h3 className="text-2xl md:text-3xl font-serif text-stone-700 group-hover:text-stone-900 transition-colors">{item}</h3>
                    <span className="text-xs uppercase tracking-widest text-stone-400 hidden md:inline-block">Possible</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Footer CTA & Discretion */}
      <section className="py-40 px-6 bg-stone-100 text-center">
         <div className="max-w-4xl mx-auto space-y-24">
           {/* Discretion Section */}
           <Reveal className="space-y-8">
             <Lock className="h-8 w-8 text-stone-400 mx-auto" strokeWidth={1} />
             <h2 className="text-3xl md:text-4xl font-serif text-stone-900">La discrétion comme engagement.</h2>
             <p className="text-stone-500 max-w-lg mx-auto text-lg font-light leading-relaxed">
               Chef Talents opère avec discrétion à chaque étape. Les lieux, les identités et les missions ne sont jamais rendus publics. Les références sont communiquées de manière sélective.
             </p>
           </Reveal>

           {/* Final CTA */}
           <Reveal className="border-t border-stone-200 pt-24">
             <h2 className="text-4xl md:text-6xl font-serif text-stone-900 mb-8">
               Soumettre votre demande
             </h2>
             <p className="text-stone-500 text-lg font-light mb-12 max-w-xl mx-auto">
               Présentez-nous votre besoin et votre contexte. Nous vous proposerons une solution adaptée à vos attentes.
             </p>
             <Link href="/request?type=private">
               <Button size="lg" className="h-20 px-16 text-sm">
                 Soumettre une demande <ArrowRight className="ml-4 w-4 h-4" />
               </Button>
             </Link>
           </Reveal>
         </div>
      </section>
    </Layout>
  );
}
