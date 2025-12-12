'use client';

import React from 'react';
import { Section } from '../../components/ui';
import { Layout } from '../../components/Layout';

export default function LegalPage() {
  return (
    <Layout>
      <Section className="max-w-3xl">
        <h1 className="text-3xl font-serif mb-8">Mentions Légales & Confidentialité</h1>
        <div className="prose prose-stone max-w-none text-stone-600 space-y-6">
          <p className="font-medium">Dernière mise à jour : Octobre 2023</p>
          
          <h3 className="text-xl font-serif text-stone-900">1. Éditeur du site</h3>
          <p>
            Le site Chef Talents est édité par Chef Talents SAS, au capital de 10.000€, 
            immatriculée au RCS de Paris. Siège social : Paris, France.
          </p>

          <h3 className="text-xl font-serif text-stone-900">2. Protection des données (RGPD)</h3>
          <p>
            Conformément à la loi "Informatique et Libertés", vous disposez d'un droit d'accès, 
            de rectification et de suppression des données vous concernant. 
            Pour exercer ce droit, contactez privacy@cheftalents.com.
          </p>

          <h3 className="text-xl font-serif text-stone-900">3. Propriété intellectuelle</h3>
          <p>
            L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur 
            et la propriété intellectuelle. Tous les droits de reproduction sont réservés.
          </p>
        </div>
      </Section>
    </Layout>
  );
}