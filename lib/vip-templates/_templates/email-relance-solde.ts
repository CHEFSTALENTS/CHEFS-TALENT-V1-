// lib/vip-templates/_templates/email-relance-solde.ts
// Template VIP — Relance graduée d'un solde impayé (3 niveaux)

import type { VipTemplate } from '../types';

export const emailRelanceSolde: VipTemplate = {
  slug: 'email-relance-solde',
  pillar: 'business',
  publishedAt: '2026-05-08',

  fr: {
    title: 'Relance graduée d’un solde impayé',
    excerpt:
      'Trois niveaux de relance, à envoyer à J+5, J+15 et J+30 après la date d’échéance. La gradation calme préserve la relation tout en posant le cadre. À adapter à chaque dossier.',
    eyebrow: 'RELANCE — SOLDE EN ATTENTE',
    body: [
      { kind: 'title', text: 'Relance graduée' },
      { kind: 'subtitle', text: 'Trois niveaux, sur quarante-cinq jours' },
      { kind: 'spacer', mm: 6 },
      { kind: 'rule' },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'I', text: 'Premier niveau — J+5' },
      {
        kind: 'p',
        text: 'Email court, neutre, factuel. Vous vous assurez simplement que la facture est arrivée. Aucune pression à ce stade. Le family office traite parfois en interne et un retard de cinq jours est dans la norme.',
      },
      { kind: 'fillLine', label: 'Objet', hint: 'Facture n° XXX — confirmation de réception' },
      { kind: 'spacer', mm: 2 },
      {
        kind: 'p',
        text: 'Bonjour [prénom],',
      },
      {
        kind: 'p',
        text: 'Je reviens rapidement vers vous concernant la facture n° [numéro] émise le [date], pour un montant de [montant] €, dont l’échéance était fixée au [date d’échéance].',
      },
      {
        kind: 'p',
        text: 'Je m’assure simplement qu’elle vous est bien parvenue. Si vous avez besoin d’un nouvel envoi ou d’un complément d’information, n’hésitez pas à me le signaler.',
      },
      {
        kind: 'p',
        text: 'Bien à vous,\nThomas Delcroix',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'II', text: 'Deuxième niveau — J+15' },
      {
        kind: 'p',
        text: 'Email plus structuré, ferme mais courtois. Vous demandez explicitement une date prévisionnelle de paiement. Ce niveau déclenche le règlement dans environ 70 % des cas.',
      },
      { kind: 'fillLine', label: 'Objet', hint: 'Facture n° XXX — date de règlement' },
      { kind: 'spacer', mm: 2 },
      {
        kind: 'p',
        text: 'Bonjour [prénom],',
      },
      {
        kind: 'p',
        text: 'Je me permets de revenir vers vous concernant la facture n° [numéro], émise le [date], dont l’échéance fixée au [date d’échéance] est désormais dépassée de quinze jours.',
      },
      {
        kind: 'p',
        text: 'Je vous remercie de bien vouloir me communiquer une date prévisionnelle de règlement. Si une difficulté technique ou administrative bloque le traitement, je suis à votre disposition pour la lever rapidement.',
      },
      {
        kind: 'p',
        text: 'Bien à vous,\nThomas Delcroix',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'III', text: 'Troisième niveau — J+30' },
      {
        kind: 'p',
        text: 'Mise en demeure formelle, à envoyer par lettre recommandée avec accusé de réception (et en copie email). Ce document est un acte juridique qui ouvre les voies de recours.',
      },
      { kind: 'fillLine', label: 'Objet', hint: 'Mise en demeure — Facture n° XXX' },
      { kind: 'spacer', mm: 2 },
      {
        kind: 'p',
        text: 'Madame, Monsieur,',
      },
      {
        kind: 'p',
        text: 'Par la présente, je vous mets en demeure de procéder au règlement de la facture n° [numéro], d’un montant de [montant] €, émise le [date] et dont l’échéance, fixée au [date d’échéance], est dépassée depuis trente jours.',
      },
      {
        kind: 'p',
        text: 'Conformément aux conditions de paiement de notre contrat signé le [date du contrat], des pénalités de retard sont dues à compter du [date d’échéance + 1] au taux de [taux] applicable.',
      },
      {
        kind: 'p',
        text: 'Je vous demande de bien vouloir régulariser cette situation dans un délai de quinze jours à compter de la réception de la présente lettre. À défaut, je serai contraint de saisir le tribunal de commerce compétent.',
      },
      {
        kind: 'p',
        text: 'Je reste évidemment ouvert à un échange amiable pour clarifier toute incompréhension qui aurait pu subsister.',
      },
      {
        kind: 'p',
        text: 'Veuillez agréer, Madame, Monsieur, l’expression de mes salutations distinguées.\n\nThomas Delcroix',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      {
        kind: 'note',
        text: 'Sortir de cette procédure pour des raisons émotionnelles est la principale cause de soldes définitivement perdus. Tenez les trois étapes calmement, dans l’ordre, sans précipitation et sans renoncement.',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'Les pourcentages et délais cités dans cet email sont à adapter à votre contrat. Pour la mise en demeure, conserver l’accusé de réception pour preuve en cas de procédure ultérieure.',
      },
    ],
  },

  en: {
    title: 'Graduated dunning of an unpaid balance',
    excerpt:
      'Three levels of dunning, sent at D+5, D+15 and D+30 after the due date. Calm gradation preserves the relationship while setting the frame. Adapt to each file.',
    eyebrow: 'DUNNING — BALANCE PENDING',
    body: [
      { kind: 'title', text: 'Graduated dunning' },
      { kind: 'subtitle', text: 'Three levels, across forty-five days' },
      { kind: 'spacer', mm: 6 },
      { kind: 'rule' },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'I', text: 'First level — D+5' },
      {
        kind: 'p',
        text: 'Short, neutral, factual email. You are simply ensuring the invoice has arrived. No pressure at this stage. The family office sometimes processes internally and a five-day delay is within norm.',
      },
      { kind: 'fillLine', label: 'Subject', hint: 'Invoice no. XXX — confirmation of receipt' },
      { kind: 'spacer', mm: 2 },
      { kind: 'p', text: 'Hello [first name],' },
      {
        kind: 'p',
        text: 'I am following up briefly regarding invoice no. [number] issued on [date], for an amount of [amount] €, with due date set on [due date].',
      },
      {
        kind: 'p',
        text: 'I am simply ensuring it has reached you. If you need a fresh send or any complementary information, please let me know.',
      },
      { kind: 'p', text: 'With kind regards,\nThomas Delcroix' },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'II', text: 'Second level — D+15' },
      {
        kind: 'p',
        text: 'More structured email, firm but courteous. You explicitly ask for an expected payment date. This level triggers settlement in about 70% of cases.',
      },
      { kind: 'fillLine', label: 'Subject', hint: 'Invoice no. XXX — settlement date' },
      { kind: 'spacer', mm: 2 },
      { kind: 'p', text: 'Hello [first name],' },
      {
        kind: 'p',
        text: 'I am following up regarding invoice no. [number], issued on [date], whose due date set on [due date] is now fifteen days past.',
      },
      {
        kind: 'p',
        text: 'I would be grateful for an expected payment date. If a technical or administrative issue is blocking processing, I am at your disposal to address it promptly.',
      },
      { kind: 'p', text: 'With kind regards,\nThomas Delcroix' },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'III', text: 'Third level — D+30' },
      {
        kind: 'p',
        text: 'Formal default notice, sent by registered mail with acknowledgement of receipt (and email copy). This document is a legal act opening recourse channels.',
      },
      { kind: 'fillLine', label: 'Subject', hint: 'Default notice — Invoice no. XXX' },
      { kind: 'spacer', mm: 2 },
      { kind: 'p', text: 'Dear Sir, Madam,' },
      {
        kind: 'p',
        text: 'I hereby formally request payment of invoice no. [number], for an amount of [amount] €, issued on [date], whose due date set on [due date] has been past for thirty days.',
      },
      {
        kind: 'p',
        text: 'In accordance with the payment terms of our contract signed on [contract date], late payment penalties apply from [due date + 1] at the applicable rate of [rate].',
      },
      {
        kind: 'p',
        text: 'I request that this situation be regularised within fifteen days from receipt of this letter. Failing that, I will be required to refer the matter to the competent commercial court.',
      },
      {
        kind: 'p',
        text: 'I naturally remain open to an amicable exchange to clarify any remaining misunderstanding.',
      },
      { kind: 'p', text: 'Yours faithfully,\nThomas Delcroix' },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      {
        kind: 'note',
        text: 'Stepping out of this procedure for emotional reasons is the main cause of permanently lost balances. Hold the three steps calmly, in order, without haste and without giving up.',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'Percentages and deadlines mentioned must be adapted to your contract. Keep the registered mail acknowledgement as proof for any later proceeding.',
      },
    ],
  },
};
