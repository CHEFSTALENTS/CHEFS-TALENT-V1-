import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Button, Section, Reveal, Marker, Label } from '../components/ui';

const Chefs = () => {
  return (
    <>
      {/* Hero */}
      <section className="pt-40 pb-20 px-6 md:px-12 max-w-[100rem] mx-auto">
        <Reveal>
          <div className="flex flex-col md:flex-row gap-12 items-end justify-between border-b border-stone-200 pb-12">
            <div>
              <Label className="mb-6">Espace Professionnel</Label>
              <h1 className="text-5xl md:text-7xl font-serif text-stone-900 leading-[1.1] max-w-4xl">
                Chef Talents, un cadre professionnel pour chefs privés.
              </h1>
            </div>
            <div className="max-w-md pb-2">
              <p className="text-lg text-stone-500 font-light mb-8 leading-relaxed">
                Chef Talents s’adresse aux chefs souhaitant intervenir auprès de clients privés, conciergeries et résidences exigeantes, dans un cadre structuré, discret et professionnel.
              </p>
              <div className="flex gap-6 items-center">
                <Link to="/chef/signup">
                  <Button>Créer un compte chef</Button>
                </Link>
                <Link to="/chef/login" className="text-sm font-medium text-stone-900 hover:text-stone-600 underline underline-offset-4">
                  Connexion membre
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Positioning / Image */}
      <section className="px-6 md:px-12 max-w-[100rem] mx-auto mb-32">
        <Reveal delay={0.2}>
          <div className="grid md:grid-cols-12 gap-12 items-center">
             <div className="md:col-span-8">
               <div className="aspect-[21/9] bg-stone-200 w-full overflow-hidden relative">
                 <img 
                   src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop" 
                   alt="Chef plating detail"
                   className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" 
                 />
               </div>
             </div>
             <div className="md:col-span-4 space-y-6">
                <h3 className="text-2xl font-serif text-stone-900">Un réseau encadré, pas une plateforme ouverte.</h3>
                <p className="text-stone-500 font-light leading-relaxed">
                  Chef Talents n’est pas une place de marché ouverte.
                  Les chefs présents sur la plateforme sont sélectionnés et intégrés selon des critères précis, afin de garantir un niveau d’exigence constant auprès des clients et partenaires.
                </p>
                <p className="text-stone-500 font-light leading-relaxed">
                  L’inscription permet d’accéder à un espace professionnel dédié, distinct du site public.
                </p>
             </div>
          </div>
        </Reveal>
      </section>

      {/* Target & Offer */}
      <Section className="bg-stone-50">
        <div className="grid md:grid-cols-12 gap-16">
          <div className="md:col-span-3">
            <Marker />
            <Label>Cadre & Profil</Label>
          </div>
          <div className="md:col-span-9">
             <div className="grid md:grid-cols-2 gap-16">
                <Reveal>
                  <h3 className="text-2xl font-serif mb-6 text-stone-900">À qui s’adresse Chef Talents</h3>
                  <ul className="space-y-4 text-stone-500 font-light leading-relaxed list-disc pl-4">
                    <li>Chefs privés ou indépendants</li>
                    <li>Habitués aux environnements exigeants (domiciles privés, villas, résidences, yachts)</li>
                    <li>Capables de travailler avec autonomie, régularité et discrétion</li>
                    <li>Souhaitant évoluer dans un cadre structuré et maîtrisé</li>
                  </ul>
                </Reveal>
                <Reveal delay={0.1}>
                  <h3 className="text-2xl font-serif mb-6 text-stone-900">Ce que propose Chef Talents aux chefs</h3>
                  <ul className="space-y-4 text-stone-500 font-light leading-relaxed list-disc pl-4">
                    <li>Accès à des missions privées sélectionnées</li>
                    <li>Cadre clair pour les demandes et conditions</li>
                    <li>Relation professionnelle encadrée avec clients et conciergeries</li>
                    <li>Espace personnel pour gérer profil et disponibilités</li>
                    <li>Exposition maîtrisée, sans mise en concurrence publique</li>
                  </ul>
                </Reveal>
             </div>
          </div>
        </div>
      </Section>

      {/* Process */}
      <Section className="bg-paper">
         <div className="max-w-4xl mx-auto text-center mb-16">
            <Marker className="mx-auto" />
            <Label>Adhésion</Label>
            <h2 className="text-4xl font-serif text-stone-900 mt-6">Comment rejoindre Chef Talents</h2>
         </div>

         <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { 
                step: "01", 
                title: "Compte Chef", 
                desc: "Créer un compte chef pour initier le processus." 
              },
              { 
                step: "02", 
                title: "Profil", 
                desc: "Compléter son profil avec parcours et références." 
              },
              { 
                step: "03", 
                title: "Validation", 
                desc: "Validation du profil par l'équipe Chef Talents." 
              },
              { 
                step: "04", 
                title: "Accès", 
                desc: "Accès à la plateforme chef après validation." 
              }
            ].map((item, i) => (
               <Reveal key={i} delay={i * 0.1} className="bg-white border border-stone-100 p-8">
                  <span className="text-2xl font-serif text-stone-300 block mb-4">{item.step}.</span>
                  <h3 className="text-lg font-medium text-stone-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-stone-500 font-light leading-relaxed">{item.desc}</p>
               </Reveal>
            ))}
         </div>
      </Section>

      {/* Discretion & Final CTA */}
      <section className="bg-stone-900 py-32 text-center px-6">
         <div className="max-w-2xl mx-auto space-y-16">
           <Reveal>
              <h3 className="text-2xl font-serif text-paper mb-6">Discrétion et respect du cadre</h3>
              <p className="text-stone-400 font-light leading-relaxed">
                Les profils chefs ne sont jamais visibles publiquement.
                Les informations clients, lieux et missions sont communiquées uniquement dans le cadre des demandes validées.
                Chef Talents repose sur une relation de confiance.
              </p>
           </Reveal>

           <div className="w-px h-12 bg-stone-700 mx-auto" />

           <Reveal delay={0.1}>
              <h2 className="text-4xl md:text-5xl font-serif text-paper mb-8">
                Créer un compte chef
              </h2>
              <p className="text-stone-400 text-lg font-light mb-12 max-w-xl mx-auto">
                La création de compte est nécessaire pour accéder à la plateforme chef.
                L’inscription ne vaut pas validation automatique.
              </p>
              <Link to="/chef/signup">
                <Button size="lg" className="bg-paper text-stone-900 hover:bg-white border-none h-16 px-12">
                  Créer un compte chef <ArrowUpRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
           </Reveal>
         </div>
      </section>
    </>
  );
};

export default Chefs;