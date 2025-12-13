'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, Lock } from 'lucide-react';
import { Button, Section, Reveal, Marker, Badge, Label } from '../../components/ui';
import { Layout } from '../../components/Layout';

export default function ConciergeriesPage() {
  return (
    <Layout>
      {/* Hero Section - Warm Dark */}
      <section className="relative bg-stone-900 text-paper min-h-[80vh] flex flex-col justify-center px-6 md:px-12 pt-32 pb-20 overflow-hidden">
        {/* Subtle Background Texture */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
           <img 
             src="https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=2600&auto=format&fit=crop" 
             alt="Texture" 
             className="w-full h-full object-cover grayscale"
           />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-12">
          <Reveal>
            <Marker className="bg-stone-700 mx-auto" />
            <Badge variant="outline" className="text-stone-400 border-stone-700 mx-auto mb-6">
              Partenaires B2B
            </Badge>
            <h1 className="text-5xl md:text-8xl font-serif font-normal leading-[0.95] text-stone-100">
              Une infrastructure de <br/> chefs privés, pensée pour <br/> les conciergeries.
            </h1>
          </Reveal>
          
          <Reveal delay={0.2}>
            <p className="text-stone-400 text-xl font-light leading-relaxed max-w-2xl mx-auto">
              Chefs Talents accompagne les conciergeries de luxe, agences de villas et les charters de Yacht avec une sélection de chefs privés conçue pour la fiabilité, la discrétion et la rapidité, partout en Europe.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              
            <Link href="/request">
  <Button
    size="lg"
    className="bg-white text-stone-900 hover:bg-stone-100 w-full sm:w-auto"
  >
    Soumettre une demande
  </Button>
</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The Context - Paper Background */}
      <Section className="bg-paper">
        <div className="grid md:grid-cols-12 gap-16">
          <div className="md:col-span-4">
             <Marker />
             <Label>Le Contexte</Label>
          </div>
          <div className="md:col-span-8 space-y-12">
            <Reveal>
              <h2 className="text-4xl md:text-5xl font-serif font-normal text-stone-900 leading-tight">
                Quand le niveau d’exigence est élevé, l’improvisation n’a pas sa place.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="space-y-6 text-lg text-stone-600 font-light leading-relaxed">
                <p>
                  Les conciergeries opèrent dans des environnements où la marge d’erreur est minimale.
                  Changements de dernière minute, séjours prolongés, clients exigeants et contexte confidentiel demandent plus qu’une simple mise en relation.
                </p>
                <p>
                  Chef Talents a été conçu pour réduire l’incertitude opérationnelle, tout en préservant la flexibilité.
                </p>
              </div>
            </Reveal>
            
            <div className="grid md:grid-cols-1 gap-6 pt-12 border-t border-stone-200">
               <Label className="mb-4 block">Ce que Chef Talents prend en charge pour vous</Label>
               {[
                 "Accès à une Sélection Select de chefs approuvés",
                 "Gestion structurée des séjours, résidences et demandes multi-dates",
                 "Continuité de service et gestion des remplacements",
                 "Chefs multilingues, habitués aux standards UHNW",
                 "Professionnels aptes à opérer avec discrétion (NDA, confidentialité)",
                 "Un interlocuteur unique pour les missions complexes"
               ].map((item, i) => (
                 <Reveal key={i} delay={0.3 + (i * 0.1)} className="flex items-start gap-4">
                   <div className="mt-2 w-1 h-1 bg-stone-400 rounded-full shrink-0" />
                   <span className="text-stone-700 font-light text-lg">{item}</span>
                 </Reveal>
               ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Atmospheric Break - Image */}
      <div className="w-full h-[60vh] overflow-hidden bg-stone-200 relative">
        <img 
          src="https://images.unsplash.com/photo-1565538810643-b5bdb714032a?q=80&w=2574&auto=format&fit=crop" 
          alt="Concierge Desk Detail" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/10" />
      </div>

      {/* The Select Roster - Warm Stone Background */}
      <Section className="bg-stone-100">
        <div className="max-w-5xl mx-auto">
           <div className="text-center mb-16">
             <Briefcase className="w-8 h-8 text-stone-400 mx-auto mb-6" strokeWidth={1} />
             <h2 className="text-4xl font-serif font-normal text-stone-900">La Sélection Select</h2>
             <p className="text-stone-500 mt-4 font-light max-w-2xl mx-auto">
               La Sélection Select n’est pas publique.
               Elle est réservée aux conciergeries et propriétés nécessitant des chefs validés pour des contextes complexes et à forts enjeux.
             </p>
             <p className="text-stone-400 text-sm mt-4 font-medium uppercase tracking-wider">
               * Tous les chefs de Chef Talents ne sont pas éligibles à la Sélection Select.
             </p>
           </div>
           
           <div className="grid sm:grid-cols-2 gap-px bg-stone-300 border border-stone-300">
             {[
               { title: "Expérience confirmée", desc: "En villas, chalets, yachts ou résidences privées." },
               { title: "Autonomie", desc: "Capacité à opérer de manière autonome et constante." },
               { title: "Validation", desc: "Références professionnelles et validation de parcours." },
               { title: "Soft Skills", desc: "Alignement avec des exigences de confidentialité et de service." }
             ].map((crit, i) => (
               <Reveal key={i} className="bg-paper p-12 hover:bg-white transition-colors">
                 <h4 className="font-serif text-2xl mb-4 text-stone-900">{crit.title}</h4>
                 <p className="text-stone-500 font-light leading-relaxed">{crit.desc}</p>
               </Reveal>
             ))}
           </div>
        </div>
      </Section>

      {/* Process Section - Paper Background */}
      <Section className="bg-paper">
         <div className="grid md:grid-cols-12 gap-16">
            <div className="md:col-span-4">
               <Marker />
               <Label>Méthodologie</Label>
            </div>
            <div className="md:col-span-8">
               <h2 className="text-4xl font-serif text-stone-900 mb-12">Un processus structuré, orienté conciergerie</h2>
               <div className="space-y-12">
                  {[
                    { step: "1", title: "Soumettre un brief", text: "Dates, lieu, profil des invités, niveau de service et exigences spécifiques." },
                    { step: "2", title: "Sélection et matching", text: "Nous identifions des chefs alignés avec la mission, la disponibilité et vos standards." },
                    { step: "3", title: "Confirmation & coordination", text: "Nous coordonnons la mission et assurons la continuité et le suivi opérationnel." }
                  ].map((item, i) => (
                     <Reveal key={i} className="flex gap-6 border-t border-stone-200 pt-8">
                        <span className="text-3xl font-serif text-stone-300">{item.step}.</span>
                        <div>
                           <h4 className="text-xl font-serif text-stone-900 mb-2">{item.title}</h4>
                           <p className="text-stone-500 font-light">{item.text}</p>
                        </div>
                     </Reveal>
                  ))}
               </div>
            </div>
         </div>
      </Section>

      {/* Use Cases - Stone Background */}
      <Section className="bg-stone-100">
          <div className="max-w-4xl mx-auto">
             <div className="text-center mb-12">
               <Label>Cas d'usage</Label>
               <h2 className="text-4xl font-serif text-stone-900">Exemples de demandes conciergerie</h2>
             </div>
             <div className="grid md:grid-cols-2 gap-6">
                {[
                  "Chef saisonnier pour un chalet (Alpes)",
                  "Résidence multi-semaines en villa (Méditerranée)",
                  "Missions sur yacht avec rotation d’invités",
                  "Séjours familiaux avec attentes récurrentes",
                  "Demandes sensibles et last-minute à forte exposition"
                ].map((item, i) => (
                   <Reveal key={i} className="bg-paper p-8 border border-stone-200">
                      <span className="text-stone-700 font-light text-lg">{item}</span>
                   </Reveal>
                ))}
             </div>
          </div>
       </Section>

      {/* Trust & Final CTA */}
      <section className="bg-stone-800 text-stone-100 py-40 px-6">
        <div className="max-w-4xl mx-auto space-y-24">
           {/* Discretion Part */}
           <Reveal className="text-center space-y-8">
              <Lock className="h-8 w-8 text-stone-500 mx-auto" strokeWidth={1} />
              <h2 className="text-4xl md:text-5xl font-serif font-normal text-paper">La discrétion, par conception.</h2>
              <p className="text-stone-400 max-w-xl mx-auto text-lg font-light leading-relaxed">
                Chef Talents opère avec discrétion à chaque étape. Les lieux, clients et détails de missions ne sont jamais publics. Les références sont partagées de manière sélective.
              </p>
           </Reveal>
           
           {/* Final CTA Part */}
           <Reveal className="text-center border-t border-stone-700 pt-24 space-y-8">
              <h3 className="text-3xl font-serif text-paper">Demander l’accès à la Sélection Select</h3>
              <p className="text-stone-400 font-light">
                 Présentez-nous votre activité et vos standards. Nous étudierons votre demande et confirmerons l’éligibilité.
              </p>
              <div className="pt-4">
                <Link href="/request?type=concierge">
                  <Button size="lg" className="bg-paper text-stone-900 hover:bg-stone-200 border-none">
                    Demander l’accès
                  </Button>
                </Link>
              </div>
           </Reveal>
        </div>
      </section>
    </Layout>
  );
}
