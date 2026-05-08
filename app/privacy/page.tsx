'use client';

import React from 'react';
import { Layout } from '../../components/Layout';
import { Section, Label, Marker } from '../../components/ui';

export default function PrivacyPage() {
  return (
    <Layout>
      <Section className="bg-paper pt-32">
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <div className="mb-16">
            <Marker />
            <Label>Protection des données</Label>
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mt-6 mb-4">
              Politique de confidentialité
            </h1>
            <p className="text-stone-500 font-light">
              Dernière mise à jour : <strong>Mai 2026</strong>
            </p>
          </div>

          {/* Sommaire */}
          <div className="border border-stone-200 p-6 mb-20 bg-stone-50">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-4">Sommaire</p>
            <ul className="space-y-2 text-stone-700 text-sm">
              <li><a href="#responsable" className="hover:underline">→ 1. Responsable du traitement</a></li>
              <li><a href="#donnees" className="hover:underline">→ 2. Données collectées</a></li>
              <li><a href="#finalites" className="hover:underline">→ 3. Finalités et bases légales</a></li>
              <li><a href="#destinataires" className="hover:underline">→ 4. Destinataires et sous-traitants</a></li>
              <li><a href="#conservation" className="hover:underline">→ 5. Durées de conservation</a></li>
              <li><a href="#transferts" className="hover:underline">→ 6. Transferts hors Union Européenne</a></li>
              <li><a href="#droits" className="hover:underline">→ 7. Vos droits</a></li>
              <li><a href="#securite" className="hover:underline">→ 8. Sécurité</a></li>
              <li><a href="#cookies" className="hover:underline">→ 9. Cookies et traceurs</a></li>
              <li><a href="#mineurs" className="hover:underline">→ 10. Mineurs</a></li>
              <li><a href="#modifications" className="hover:underline">→ 11. Modifications</a></li>
              <li><a href="#contact" className="hover:underline">→ 12. Contact et réclamations</a></li>
            </ul>
          </div>

          <div className="space-y-12 text-stone-600 font-light leading-relaxed">

            {/* 1. Responsable */}
            <section id="responsable" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">1. Responsable du traitement</h2>
              <p>
                Le responsable du traitement des données personnelles collectées via le site chefstalents.com est :
              </p>
              <p>
                <strong>SASU Chefs Talents</strong><br />
                SIRET : 89832072600026<br />
                RCS : Bordeaux<br />
                Siège social : 73 rue Porte Dijeaux, 33000 Bordeaux, France<br />
                Représentée par Thomas Delcroix, Président
              </p>
              <p>
                <strong>Référent en protection des données</strong> : Thomas Delcroix.
                Compte tenu de la taille actuelle de la structure et de la nature des traitements effectués
                (volumétrie limitée, absence de traitement à grande échelle de données sensibles), Chefs Talents
                n'est pas tenue de désigner un Délégué à la Protection des Données (DPO) au sens de l'article 37
                du RGPD. Un référent dédié est néanmoins identifié pour répondre aux demandes des personnes concernées.
              </p>
              <p>
                Contact privacy : <a href="mailto:privacy@chefstalents.com" className="underline hover:text-stone-900">privacy@chefstalents.com</a>
              </p>
            </section>

            {/* 2. Données */}
            <section id="donnees" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">2. Données collectées</h2>
              <p>Les catégories de données collectées varient selon votre relation avec Chefs Talents.</p>

              <div className="space-y-3">
                <p className="font-medium text-stone-800">Visiteurs du site</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>données de connexion techniques (adresse IP, navigateur, pages consultées) ;</li>
                  <li>données issues d'éventuels formulaires de contact (nom, email, message).</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-stone-800">Clients soumettant un brief</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>identité (nom, prénom, raison sociale le cas échéant) ;</li>
                  <li>coordonnées (email, téléphone) ;</li>
                  <li>brief mission : lieu, dates, format, budget, contraintes ;</li>
                  <li>contraintes médicales et alimentaires des convives (allergies, intolérances, régimes spécifiques) ;</li>
                  <li>acceptation du NDA et des CGV ;</li>
                  <li>données de paiement (gérées par Stripe, non stockées par Chefs Talents).</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-stone-800">Chefs inscrits sur la plateforme</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>identité (nom, prénom, photo) ;</li>
                  <li>coordonnées (email, téléphone) ;</li>
                  <li>parcours professionnel, expériences, langues, spécialités ;</li>
                  <li>portfolio (photos de plats, références) ;</li>
                  <li>justificatifs : attestation RC Pro, certifications STCW / ENG1 / MLC pour le yachting, justificatifs hygiène ;</li>
                  <li>coordonnées bancaires (RIB / IBAN) pour le versement des rémunérations ;</li>
                  <li>statut professionnel (auto-entrepreneur, société) ;</li>
                  <li>acceptation des Conditions de Collaboration et historique d'acceptation (versions, dates) ;</li>
                  <li>données de paiement liées aux abonnements VIP ou Boost (gérées par Stripe).</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-stone-800">Sensibilité particulière</p>
                <p>
                  Les contraintes alimentaires des convives (allergies, intolérances, régimes médicaux comme le
                  diabète) peuvent être qualifiées de données de santé au sens de l'article 9 du RGPD. Elles sont
                  traitées sur la base de l'exécution du contrat de mission, dans la stricte limite nécessaire à
                  la sécurité de la prestation, transmises uniquement au Chef qui exécute la mission, et supprimées
                  dans un délai maximum de 90 jours après la fin de la mission concernée.
                </p>
              </div>
            </section>

            {/* 3. Finalités */}
            <section id="finalites" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">3. Finalités et bases légales</h2>
              <p>Les données sont traitées pour les finalités suivantes :</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-stone-800 border-b border-stone-200">Finalité</th>
                      <th className="text-left px-4 py-3 font-medium text-stone-800 border-b border-stone-200">Base légale (RGPD)</th>
                    </tr>
                  </thead>
                  <tbody className="font-light">
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Gestion des briefs et missions client</td>
                      <td className="px-4 py-3">Exécution du contrat (art. 6.1.b)</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Inscription et gestion des comptes Chefs</td>
                      <td className="px-4 py-3">Exécution du contrat (art. 6.1.b)</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Facturation, encaissements, paiements aux Chefs</td>
                      <td className="px-4 py-3">Exécution du contrat + obligation légale (art. 6.1.c)</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Lutte contre la fraude et les abus</td>
                      <td className="px-4 py-3">Intérêt légitime (art. 6.1.f)</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Communication marketing (newsletter, broadcasts)</td>
                      <td className="px-4 py-3">Consentement (art. 6.1.a) — désabonnement à tout moment</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Données de santé des convives (allergies, régimes)</td>
                      <td className="px-4 py-3">Exécution du contrat + nécessité vitale (art. 9.2.b et 9.2.c)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Mesure d'audience anonymisée du site</td>
                      <td className="px-4 py-3">Intérêt légitime (art. 6.1.f) — pas de traceur publicitaire</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Destinataires */}
            <section id="destinataires" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">4. Destinataires et sous-traitants</h2>
              <p>
                Les données sont accessibles aux seuls collaborateurs habilités de Chefs Talents et aux sous-traitants
                techniques nécessaires au fonctionnement du service. Aucune donnée n'est vendue ou cédée à des tiers
                à des fins commerciales.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-stone-800 border-b border-stone-200">Sous-traitant</th>
                      <th className="text-left px-4 py-3 font-medium text-stone-800 border-b border-stone-200">Rôle</th>
                      <th className="text-left px-4 py-3 font-medium text-stone-800 border-b border-stone-200">Localisation</th>
                    </tr>
                  </thead>
                  <tbody className="font-light">
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Vercel Inc.</td>
                      <td className="px-4 py-3">Hébergement et infrastructure web</td>
                      <td className="px-4 py-3">États-Unis</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Supabase Inc.</td>
                      <td className="px-4 py-3">Base de données, authentification, stockage fichiers</td>
                      <td className="px-4 py-3">États-Unis</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Stripe Payments Europe Ltd.</td>
                      <td className="px-4 py-3">Paiements abonnements VIP / Boost</td>
                      <td className="px-4 py-3">Irlande (Union Européenne)</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Resend, Inc.</td>
                      <td className="px-4 py-3">Envoi des emails transactionnels et marketing</td>
                      <td className="px-4 py-3">États-Unis</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Revolut Bank UAB</td>
                      <td className="px-4 py-3">Cartes de mission (achats matières premières)</td>
                      <td className="px-4 py-3">Lituanie (Union Européenne)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">WhatsApp Business / Meta Platforms</td>
                      <td className="px-4 py-3">Communication directe avec Clients et Chefs</td>
                      <td className="px-4 py-3">Irlande / États-Unis</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                Chaque sous-traitant agit sur instructions documentées de Chefs Talents et est lié par un accord
                de traitement de données conforme à l'article 28 du RGPD.
              </p>
            </section>

            {/* 5. Conservation */}
            <section id="conservation" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">5. Durées de conservation</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-stone-800 border-b border-stone-200">Catégorie de donnée</th>
                      <th className="text-left px-4 py-3 font-medium text-stone-800 border-b border-stone-200">Durée de conservation</th>
                    </tr>
                  </thead>
                  <tbody className="font-light">
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Profil Chef inscrit (compte actif)</td>
                      <td className="px-4 py-3">Durée de la collaboration + 24 mois (NCC) puis archivage 5 ans</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Données de mission (briefs, contrats, échanges)</td>
                      <td className="px-4 py-3">10 ans après la fin de mission (obligations comptables et commerciales)</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Données de santé / allergies des convives</td>
                      <td className="px-4 py-3">90 jours après la fin de la mission concernée</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Factures et pièces comptables</td>
                      <td className="px-4 py-3">10 ans (article L123-22 du Code de commerce)</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Acceptation des CGU (versions, dates, IP)</td>
                      <td className="px-4 py-3">Durée du compte + 5 ans</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Données de paiement (Stripe, traitées par sous-traitant)</td>
                      <td className="px-4 py-3">Selon politique Stripe, 10 ans pour les justificatifs</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3">Newsletter (consentement actif)</td>
                      <td className="px-4 py-3">Jusqu'au désabonnement, puis suppression sous 30 jours</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Logs techniques (sécurité, audit)</td>
                      <td className="px-4 py-3">12 mois</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6. Transferts */}
            <section id="transferts" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">6. Transferts hors Union Européenne</h2>
              <p>
                Certains de nos sous-traitants (Vercel, Supabase, Resend, Meta) sont établis aux États-Unis et
                peuvent à ce titre traiter des données personnelles hors Union Européenne. Ces transferts sont
                encadrés par les mécanismes prévus par le RGPD :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Clauses contractuelles types</strong> de la Commission Européenne, intégrées aux contrats
                  de sous-traitance ;
                </li>
                <li>
                  <strong>Data Privacy Framework (DPF)</strong> pour les sous-traitants américains certifiés ;
                </li>
                <li>
                  mesures techniques complémentaires (chiffrement en transit et au repos, ségrégation des données).
                </li>
              </ul>
              <p>
                Les versions à jour de ces engagements sont disponibles sur demande à
                <a href="mailto:privacy@chefstalents.com" className="underline hover:text-stone-900"> privacy@chefstalents.com</a>.
              </p>
            </section>

            {/* 7. Droits */}
            <section id="droits" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">7. Vos droits</h2>
              <p>Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Accès</strong> : obtenir confirmation que vos données sont traitées et en obtenir copie ;</li>
                <li><strong>Rectification</strong> : corriger des données inexactes ou incomplètes ;</li>
                <li><strong>Effacement</strong> (« droit à l'oubli ») : sous réserve des obligations légales de conservation ;</li>
                <li><strong>Limitation</strong> : restreindre le traitement dans certaines circonstances ;</li>
                <li><strong>Opposition</strong> : pour les traitements fondés sur l'intérêt légitime ou à des fins de marketing ;</li>
                <li><strong>Portabilité</strong> : récupérer vos données dans un format structuré, lisible par machine ;</li>
                <li><strong>Retrait du consentement</strong> à tout moment pour les traitements fondés sur ce dernier ;</li>
                <li><strong>Directives post-mortem</strong> : indiquer le sort de vos données après votre décès.</li>
              </ul>
              <p>
                <strong>Procédure</strong> : envoyez votre demande à
                <a href="mailto:privacy@chefstalents.com" className="underline hover:text-stone-900"> privacy@chefstalents.com</a>.
                Une copie de pièce d'identité pourra vous être demandée en cas de doute raisonnable sur votre identité.
                Une réponse vous sera adressée dans un délai maximum d'un mois, prorogeable de deux mois en cas de
                demande complexe.
              </p>
              <p>
                <strong>Réclamation</strong> : si vous estimez que le traitement de vos données ne respecte pas le
                RGPD, vous pouvez introduire une réclamation auprès de la Commission Nationale de l'Informatique et
                des Libertés (CNIL) :
                <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer" className="underline hover:text-stone-900"> cnil.fr/fr/plaintes</a>.
              </p>
            </section>

            {/* 8. Sécurité */}
            <section id="securite" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">8. Sécurité</h2>
              <p>Chefs Talents met en œuvre des mesures techniques et organisationnelles appropriées :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>chiffrement des données en transit (HTTPS, TLS 1.2+) ;</li>
                <li>chiffrement des données au repos sur les bases Supabase et Stripe ;</li>
                <li>authentification forte pour les accès administrateur ;</li>
                <li>politique de gestion des accès (principe du moindre privilège) ;</li>
                <li>journalisation des accès sensibles ;</li>
                <li>sauvegardes régulières et plan de reprise d'activité chez les sous-traitants.</li>
              </ul>
              <p>
                En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits et libertés,
                vous serez informé(e) dans les meilleurs délais conformément à l'article 34 du RGPD.
              </p>
            </section>

            {/* 9. Cookies */}
            <section id="cookies" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">9. Cookies et traceurs</h2>
              <p>
                Le site chefstalents.com utilise uniquement des cookies strictement nécessaires à son fonctionnement
                (session, authentification, sécurité). Aucun cookie publicitaire ou de profilage n'est déposé sans
                votre consentement explicite préalable.
              </p>
              <p>
                Si nous intégrons à l'avenir des outils de mesure d'audience (statistiques anonymisées), un bandeau
                de gestion du consentement sera mis en place conformément aux recommandations de la CNIL.
              </p>
            </section>

            {/* 10. Mineurs */}
            <section id="mineurs" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">10. Mineurs</h2>
              <p>
                Les services Chefs Talents s'adressent à des professionnels (Chefs) et à des adultes capables de
                contracter (Clients). Aucune donnée personnelle de personne mineure n'est collectée volontairement.
                Les contraintes alimentaires d'enfants présents lors des missions sont fournies par leurs représentants
                légaux et traitées dans le strict cadre de l'exécution du contrat.
              </p>
            </section>

            {/* 11. Modifications */}
            <section id="modifications" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">11. Modifications de la présente politique</h2>
              <p>
                Chefs Talents peut modifier la présente politique pour l'adapter à l'évolution de la réglementation,
                de ses pratiques ou de ses sous-traitants. La date de dernière mise à jour figure en tête de
                document. Les modifications substantielles font l'objet d'une notification aux personnes concernées
                par email ou via leur tableau de bord.
              </p>
            </section>

            {/* 12. Contact */}
            <section id="contact" className="space-y-4 scroll-mt-32 border-t border-stone-200 pt-12">
              <h2 className="text-2xl font-serif text-stone-900">12. Contact et réclamations</h2>
              <p>
                Pour toute question relative à la présente politique ou à l'exercice de vos droits :
              </p>
              <ul className="space-y-2">
                <li>
                  Email dédié : <a href="mailto:privacy@chefstalents.com" className="underline hover:text-stone-900">privacy@chefstalents.com</a>
                </li>
                <li>
                  Email général : <a href="mailto:contact@chefstalents.com" className="underline hover:text-stone-900">contact@chefstalents.com</a>
                </li>
                <li>
                  Courrier : SASU Chefs Talents — 73 rue Porte Dijeaux, 33000 Bordeaux, France
                </li>
              </ul>
              <p>
                Autorité de contrôle compétente : Commission Nationale de l'Informatique et des Libertés (CNIL),
                3 place de Fontenoy, 75007 Paris.
              </p>
            </section>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
