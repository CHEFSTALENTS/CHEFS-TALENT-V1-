// lib/chef-i18n.ts
// Système i18n maison pour le dashboard chef. Zéro dépendance externe.
// Persistance : localStorage + champ profile.preferredLocale (Supabase chef_profiles).
// Étendre les sections progressivement par batch (B1 = nav + terms + dashboard).

export type Locale = 'fr' | 'en' | 'es';

export const LOCALES: Locale[] = ['fr', 'en', 'es'];
export const DEFAULT_LOCALE: Locale = 'fr';
export const LOCALE_STORAGE_KEY = 'ct_chef_locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
};

export const LOCALE_FULL_LABELS: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

/** Interpolation simple : format("Boost · {n}j", { n: 5 }) -> "Boost · 5j" */
export function format(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export function isLocale(v: unknown): v is Locale {
  return v === 'fr' || v === 'en' || v === 'es';
}

// ─────────────────────────────────────────────────────────────────────
// Dictionary type — étendre par sections au fil des batches.
// ─────────────────────────────────────────────────────────────────────

export type Dictionary = {
  switcher: {
    ariaLabel: string;
  };
  common: {
    loading: string;
    save: string;
    saving: string;
    cancel: string;
    submit: string;
    submitting: string;
    close: string;
    open: string;
    edit: string;
    complete: string;
    optional: string;
    required: string;
    savedSuccess: string;
    saveError: string;
    sectionLabel: string; // "Profil"
  };
  nav: {
    portal: string;
    dashboard: string;
    missions: string;
    earnings: string;
    pricing: string;
    identity: string;
    experience: string;
    portfolio: string;
    mobility: string;
    availability: string;
    preferences: string;
    settings: string;
    terms: string;
    logout: string;
    termsLabel: string;
    termsAccepted: string;
    termsToValidate: string;
    loading: string;
    openMenu: string;
    closeMenu: string;
  };
  termsModal: {
    tagline: string;
    title: string;
    description: string;
    readTerms: string;
    accept: string;
    accepting: string;
    versionInForce: string; // "Version en vigueur : {version}"
    error: string;
  };
  dashboard: {
    label: string;
    greeting: string; // "Bonjour, Chef {name}."
    badgeVip: string;
    profileLabel: string;
    profileTypes: {
      private: string;
      residence: string;
      yacht: string;
      pastry: string;
    };
    seniority: {
      junior: string;
      confirmed: string;
      senior: string;
    };
    accountStatusLabel: string;
    status: {
      pending_validation: string;
      approved: string;
      active: string;
      paused: string;
      draft: string;
    };
    onboardingTier: {
      ready: string;
      almost: string;
      progress: string;
      todo: string;
    };
    profileCompletedLabel: string;
    checklistLabel: string;
    profileCompletionBody: string;
    profileCompletionGoal: string;
    completeProfileCta: string;
    activationCardTitle: string;
    activationCardBody: string;
    activationProgress: string; // "{score}% / 80% requis"
    actionCardEdit: string;
    actionCardComplete: string;

    // Calendly
    calendlyLabel: string;
    calendlyTitle: string;
    calendlyDescription: string;
    calendlyCta: string;

    // VIP
    vipMember: string;
    vipMemberDesc: string;
    vipAccessTips: string;
    vipPriceLabel: string;
    vipTitle: string;
    vipBenefits: string[];
    vipCta: string;
    vipRedirecting: string;

    // Boost
    boostActiveLabel: string; // "Boost actif · {days}j restants"
    boostInactiveLabel: string;
    boostActiveTitle: string;
    boostInactiveTitle: string;
    boostActiveDesc: string;
    boostInactiveDesc: string;
    boostCta: string;

    // Propose mission
    proposeNetwork: string;
    proposeTitle: string;
    proposeDesc: string;
    proposeCtaOpen: string;
    proposeCtaClose: string;
    proposeFieldDestination: string;
    proposeFieldDates: string;
    proposeFieldGuests: string;
    proposeFieldBudget: string;
    proposeFieldNotes: string;
    proposePlaceholderDestination: string;
    proposePlaceholderDates: string;
    proposePlaceholderGuests: string;
    proposePlaceholderBudget: string;
    proposePlaceholderNotes: string;
    proposeCtaSubmit: string;
    proposeCtaSubmitting: string;
    proposeSuccess: string;

    // Checks (action cards)
    checks: {
      identity: { title: string; desc: string };
      experience: { title: string; desc: string };
      portfolio: {
        title: string;
        descOk: string; // "OK ({count}/{min})"
        descMissing: string; // "Min. {min} photos ({count}/{min})"
      };
      pricing: { title: string; desc: string };
      mobility: { title: string; desc: string };
      availability: { title: string; desc: string };
      preferences: { title: string; desc: string };
    };
  };

  // ─────────────────────────────────────────────────────────────────
  // Pages profil — B2
  // ─────────────────────────────────────────────────────────────────

  identity: {
    pageTitle: string;
    classificationTitle: string;
    profileTypeLabel: string;
    profileTypes: {
      private: { label: string; sub: string };
      residence: { label: string; sub: string };
      yacht: { label: string; sub: string };
    };
    seniorityLabel: string;
    seniority: {
      junior: string;
      confirmed: string;
      senior: string;
    };
    personalInfoTitle: string;
    firstName: string;
    lastName: string;
    emailLabel: string;
    phoneLabel: string;
    phonePlaceholder: string;
    photoLabel: string;
    photoChange: string;
    photoUpload: string;
    photoConstraints: string;
    photoHint: string;
    alertSelectImage: string;
    alertImageTooLarge: string; // "Image trop lourde (max {max}MB)."
    uploadError: string;
  };

  experience: {
    pageTitle: string;
    yearsLabel: string;
    environmentsLabel: string;
    environments: {
      restaurant: string;
      hotel: string;
      private_villa: string;
      yacht: string;
      chalet: string;
      events: string;
    };
    certificationsLabel: string;
    certs: {
      HACCP: { label: string; hint: string };
      foodSafety: { label: string; hint: string };
      STCW: { label: string; hint: string };
      ENG1: { label: string; hint: string };
      firstAid: { label: string; hint: string };
      fireSafety: { label: string; hint: string };
      lifeguard: { label: string; hint: string };
      security: { label: string; hint: string };
    };
    certsNotesLabel: string;
    certsNotesPlaceholder: string;
    certsNotesHint: string;
    bioLabel: string;
    bioPlaceholder: string;
    bioHint: string;
    sessionExpired: string;
  };

  portfolio: {
    pageLabel: string; // "Visuel"
    pageTitle: string;
    importantTitle: string;
    importantBody1: string;
    importantBody2: string; // "Minimum 5 photos pour valider votre portfolio."
    linksLabel: string;
    instagramLabel: string;
    websiteLabel: string;
    instagramPlaceholder: string;
    websitePlaceholder: string;
    linksHint: string;
    saveLinksCta: string;
    invalidInstagram: string;
    invalidWebsite: string;
    saveLinksError: string;
    addPhotosLabel: string;
    photoConstraints: string; // "JPG/PNG/WebP • max 8MB / image • idéal : 5 à 10 photos"
    portfolioValid: string;
    portfolioMissing: string; // "Ajoute encore {n} photo(s) pour valider ton portfolio."
    uploadCta: string;
    uploadSuccess: string;
    noImages: string;
    uploadFailed: string; // "Aucune image n'a pu être uploadée (format/taille)."
    uploadError: string;
    deleteError: string;
  };

  mobility: {
    pageLabel: string; // "Logistique"
    pageTitle: string;
    helpAriaLabel: string;
    helpTitle: string;
    helpModalTitle: string;
    helpModalSubtitle: string;
    helpStep1Title: string;
    helpStep1Desc: string;
    helpStep2Title: string;
    helpStep2Desc: string;
    helpStep2Refs: string;
    helpStep3Title: string;
    helpStep3Desc: string;
    helpImportantTitle: string;
    helpImportantBody: string;
    helpImportantNote: string;
    helpUnderstood: string;
    positioningLabel: string;
    positioning: {
      international: { label: string; desc: string };
      large: { label: string; desc: string };
      regional: { label: string; desc: string };
      local: { label: string; desc: string };
    };
    baseCityLabel: string;
    baseCityPlaceholder: string;
    baseCityHint: string;
    radiusLabel: string;
    radiusPlaceholder: string;
    radiusHint: string;
    intlLabel: string;
    intlDesc: string;
    suggestedZonesLabel: string;
    suggestedZonesAuto: string;
    suggestedZonesEmpty: string;
    suggestedZonesHint: string;
    saveError: string;
  };
};

// ─────────────────────────────────────────────────────────────────────
// Dictionnaire FR
// ─────────────────────────────────────────────────────────────────────

const fr: Dictionary = {
  switcher: { ariaLabel: 'Changer de langue' },
  common: {
    loading: 'Chargement…',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    cancel: 'Annuler',
    submit: 'Envoyer',
    submitting: 'Envoi…',
    close: 'Fermer',
    open: 'Ouvrir',
    edit: 'Modifier',
    complete: 'Compléter',
    optional: 'optionnel',
    required: 'requis',
    savedSuccess: 'Modifications enregistrées.',
    saveError: 'Erreur lors de la sauvegarde',
    sectionLabel: 'Profil',
  },
  nav: {
    portal: 'Portal',
    dashboard: 'Tableau de bord',
    missions: 'Missions',
    earnings: 'Revenus',
    pricing: 'Tarifs',
    identity: 'Identité',
    experience: 'Expérience',
    portfolio: 'Portfolio',
    mobility: 'Zone & Mobilité',
    availability: 'Disponibilités',
    preferences: 'Préférences',
    settings: 'Paramètres',
    terms: 'Conditions',
    logout: 'Déconnexion',
    termsLabel: 'Conditions :',
    termsAccepted: 'acceptées',
    termsToValidate: 'à valider',
    loading: 'Chargement…',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
  },
  termsModal: {
    tagline: 'Chef Talents · Portail Chef',
    title: 'Conditions de collaboration',
    description:
      'Pour accéder au portail et recevoir des missions, vous devez lire et accepter les conditions de collaboration.',
    readTerms: 'Lire les conditions',
    accept: 'Accepter et continuer',
    accepting: 'Enregistrement…',
    versionInForce: 'Version en vigueur : {version}',
    error: "Impossible d'enregistrer l'acceptation. Réessaie.",
  },
  dashboard: {
    label: 'Tableau de bord',
    greeting: 'Bonjour, Chef {name}.',
    badgeVip: 'VIP',
    profileLabel: 'Profil :',
    profileTypes: {
      private: 'Chef Privé',
      residence: 'Chef Résidence',
      yacht: 'Chef Yacht',
      pastry: 'Chef Pâtissier',
    },
    seniority: {
      junior: 'Junior',
      confirmed: 'Confirmé',
      senior: 'Senior',
    },
    accountStatusLabel: 'Statut du compte',
    status: {
      pending_validation: 'En Attente',
      approved: 'Validé',
      active: 'Actif',
      paused: 'En Pause',
      draft: 'Brouillon',
    },
    onboardingTier: {
      ready: 'Profil prêt',
      almost: 'Presque prêt',
      progress: 'En progression',
      todo: 'À compléter',
    },
    profileCompletedLabel: 'Profil complété',
    checklistLabel: 'Checklist :',
    profileCompletionBody:
      'Complétez votre dossier pour être facilement proposé aux conciergeries.',
    profileCompletionGoal:
      "Objectif : 80%+ pour débloquer l'onboarding.",
    completeProfileCta: 'Compléter le profil',
    activationCardTitle: "Complétez votre profil pour l'activation",
    activationCardBody:
      "Atteignez 80% de complétion pour réserver votre session d'onboarding avec Thomas.",
    activationProgress: '{score}% / 80% requis',
    actionCardEdit: 'Modifier',
    actionCardComplete: 'Compléter',
    calendlyLabel: 'Prochaine étape',
    calendlyTitle: 'Votre profil est prêt — planifiez votre onboarding',
    calendlyDescription:
      'Un appel de 30 minutes avec Thomas pour valider votre profil, faire un point sur votre activité et activer votre accès aux missions.',
    calendlyCta: 'Réserver un créneau',
    vipMember: 'Membre Chef VIP',
    vipMemberDesc:
      'Profil boosté · Accès aux tips exclusifs · Priorité sur les missions',
    vipAccessTips: 'Accéder aux tips →',
    vipPriceLabel: 'Chef VIP — 49€/mois',
    vipTitle: 'Passez en tête de liste',
    vipBenefits: [
      'Profil boosté · Priorité sur les missions',
      'Tips exclusifs service privé',
      'Badge VIP visible par les conciergeries',
    ],
    vipCta: 'Devenir VIP',
    vipRedirecting: 'Redirection…',
    boostActiveLabel: 'Boost actif · {days}j restants',
    boostInactiveLabel: 'Boost de profil — 19€',
    boostActiveTitle: 'Votre profil est mis en avant',
    boostInactiveTitle: 'Soyez vu en premier',
    boostActiveDesc:
      'Vous apparaissez en priorité dans les sélections des conciergeries.',
    boostInactiveDesc:
      '7 jours de visibilité maximale · Badge "Disponible" · Priorité dans les sélections',
    boostCta: 'Booster',
    proposeNetwork: 'Réseau Chefs Talents',
    proposeTitle: 'Vous avez une demande à transmettre ?',
    proposeDesc:
      "Si vous ne pouvez pas honorer une mission, transmettez-la au réseau. Si elle aboutit, vous touchez une commission de 5%.",
    proposeCtaOpen: 'Proposer une mission',
    proposeCtaClose: 'Fermer',
    proposeFieldDestination: 'Destination *',
    proposeFieldDates: 'Dates *',
    proposeFieldGuests: 'Nombre de convives',
    proposeFieldBudget: 'Budget estimé',
    proposeFieldNotes: 'Notes (type de cuisine, allergies…)',
    proposePlaceholderDestination: 'Ibiza, Saint-Tropez, Mykonos…',
    proposePlaceholderDates: '15-22 juillet 2026',
    proposePlaceholderGuests: '8 personnes',
    proposePlaceholderBudget: '3 500€ / semaine',
    proposePlaceholderNotes:
      'Cuisine méditerranéenne, sans gluten, dîner en terrasse…',
    proposeCtaSubmit: 'Envoyer au réseau',
    proposeCtaSubmitting: 'Envoi…',
    proposeSuccess:
      'Mission transmise à Thomas — il revient vers vous sous 2h.',
    checks: {
      identity: {
        title: 'Identité & Coordonnées',
        desc: 'Nom, téléphone, ville…',
      },
      experience: {
        title: 'Expérience',
        desc: 'Bio + expérience',
      },
      portfolio: {
        title: 'Portfolio',
        descOk: 'OK ({count}/{min})',
        descMissing: 'Min. {min} photos ({count}/{min})',
      },
      pricing: {
        title: 'Tarifs',
        desc: 'Prix / jour ou prix / personne',
      },
      mobility: {
        title: 'Zone & Mobilité',
        desc: 'Zones, déplacements',
      },
      availability: {
        title: 'Disponibilités',
        desc: 'Ouverture des missions bientôt.',
      },
      preferences: {
        title: 'Préférences',
        desc: 'Cuisines + langues',
      },
    },
  },
  identity: {
    pageTitle: 'Identité & Classification',
    classificationTitle: 'Classification',
    profileTypeLabel: 'Type de Profil',
    profileTypes: {
      private: { label: 'Chef Privé', sub: 'Dîners & Événements' },
      residence: { label: 'Chef Résidence', sub: 'Séjours & Longue durée' },
      yacht: { label: 'Chef Yacht', sub: 'Saison ou Charter' },
    },
    seniorityLabel: "Niveau d'expérience (Déclaratif)",
    seniority: {
      junior: 'Junior (1-4 ans)',
      confirmed: 'Confirmé (5-10 ans)',
      senior: 'Senior (10+ ans)',
    },
    personalInfoTitle: 'Informations Personnelles',
    firstName: 'Prénom',
    lastName: 'Nom',
    emailLabel: 'Email (Identifiant)',
    phoneLabel: 'Téléphone mobile',
    phonePlaceholder: '+33 6...',
    photoLabel: 'Photo de profil',
    photoChange: 'Changer la photo',
    photoUpload: 'Uploader une photo',
    photoConstraints: 'JPG/PNG/WebP • max 6MB',
    photoHint: 'Portrait professionnel recommandé (fond neutre, visage visible).',
    alertSelectImage: 'Veuillez sélectionner une image.',
    alertImageTooLarge: 'Image trop lourde (max {max}MB).',
    uploadError: "Erreur lors de l'upload",
  },
  experience: {
    pageTitle: 'Expérience & Parcours',
    yearsLabel: "Années d'expérience (Cuisine)",
    environmentsLabel: 'Environnements Maîtrisés',
    environments: {
      restaurant: 'Restaurant Gastronomique',
      hotel: 'Hôtellerie de Luxe',
      private_villa: 'Villa Privée',
      yacht: 'Yachting (>30m)',
      chalet: 'Chalet Montagne',
      events: 'Traiteur / Événementiel',
    },
    certificationsLabel: 'Diplômes & certifications',
    certs: {
      HACCP: { label: 'HACCP', hint: 'Hygiène alimentaire' },
      foodSafety: { label: 'Food Safety', hint: 'Certification hygiène (UK/Int.)' },
      STCW: { label: 'STCW', hint: 'Obligatoire pour de nombreux yachts' },
      ENG1: { label: 'ENG1', hint: 'Certificat médical maritime' },
      firstAid: { label: 'Premiers secours', hint: 'PSC1 / équivalent' },
      fireSafety: { label: 'Sécurité incendie', hint: 'Formation incendie' },
      lifeguard: { label: 'Sauvetage / Lifeguard', hint: 'Utile yacht / beach / pool' },
      security: { label: 'Sécurité', hint: 'Formation sécurité / sûreté (optionnel)' },
    },
    certsNotesLabel: 'Autres / précisions (optionnel)',
    certsNotesPlaceholder: 'Ex: Permis B, Permis bateau, etc.',
    certsNotesHint: 'Ces infos nous aident à mieux vous matcher (yacht, sécurité, conformité).',
    bioLabel: 'Bio Professionnelle',
    bioPlaceholder: 'Décrivez votre parcours, votre philosophie et vos expériences marquantes...',
    bioHint: 'Ce texte sera visible par les clients. Soyez précis et professionnel.',
    sessionExpired: 'Session expirée. Reconnecte-toi.',
  },
  portfolio: {
    pageLabel: 'Visuel',
    pageTitle: 'Portfolio',
    importantTitle: '📸 Important',
    importantBody1:
      'Ces photos servent à mettre en avant votre profil auprès des clients. Choisissez des plats bien dressés, bien éclairés, sans filtres excessifs.',
    importantBody2: 'Minimum 5 photos pour valider votre portfolio.',
    linksLabel: 'Liens (optionnel)',
    instagramLabel: 'Instagram',
    websiteLabel: 'Site web',
    instagramPlaceholder: 'https://instagram.com/tonprofil',
    websitePlaceholder: 'https://tonsite.com',
    linksHint: 'Facultatif — mais utile pour renforcer la crédibilité du profil.',
    saveLinksCta: 'Enregistrer les liens',
    invalidInstagram: 'Lien Instagram invalide. Exemple: https://instagram.com/tonprofil',
    invalidWebsite: 'Lien site web invalide. Exemple: https://tonsite.com',
    saveLinksError: 'Erreur lors de la sauvegarde des liens',
    addPhotosLabel: 'Ajouter des photos (upload uniquement)',
    photoConstraints: 'JPG/PNG/WebP • max 8MB / image • idéal : 5 à 10 photos',
    portfolioValid: '✅ Portfolio validé (5 photos minimum).',
    portfolioMissing: '⚠️ Ajoute encore {n} photo(s) pour valider ton portfolio.',
    uploadCta: 'Upload photos',
    uploadSuccess: '✅ Enregistré',
    noImages: 'Aucune image ajoutée.',
    uploadFailed: "Aucune image n'a pu être uploadée (format/taille).",
    uploadError: "Erreur lors de l'upload",
    deleteError: 'Erreur lors de la suppression',
  },
  mobility: {
    pageLabel: 'Logistique',
    pageTitle: 'Zone & Mobilité',
    helpAriaLabel: 'Informations',
    helpTitle: 'Comment ça marche ?',
    helpModalTitle: 'Comment tu es positionné grâce à ta mobilité',
    helpModalSubtitle: 'Nous utilisons ces infos pour te proposer les missions les plus pertinentes.',
    helpStep1Title: '1) Ville de base',
    helpStep1Desc:
      'Elle sert de point de départ. On te propose en priorité des missions proches de cette zone.',
    helpStep2Title: '2) Rayon (km)',
    helpStep2Desc:
      'Plus ton rayon est grand, plus tu apparais sur des missions (ex: villas, chalets, résidences, event).',
    helpStep2Refs: 'Repères : 50km = local • 150km = régional • 300km+ = multi-zones',
    helpStep3Title: '3) Mobilité internationale',
    helpStep3Desc:
      'Active si tu es prêt à voyager (missions premium : yachts, saisons, résidences longues).',
    helpImportantTitle: '✅ Important',
    helpImportantBody: 'Tu restes libre d’accepter ou refuser une mission à tout moment.',
    helpImportantNote: 'Les "zones suggérées" ci-dessous sont une aide automatique (pas un engagement).',
    helpUnderstood: 'J’ai compris',
    positioningLabel: 'Positionnement actuel',
    positioning: {
      international: { label: 'International', desc: 'Très visible : missions premium + déplacements.' },
      large: { label: 'Large / multi-zones', desc: 'Très visible : résidences/saisons et missions multi-destinations.' },
      regional: { label: 'Régional', desc: 'Visible : missions dans plusieurs zones autour de ta base.' },
      local: { label: 'Local', desc: 'Priorité : missions proches de ta ville de base.' },
    },
    baseCityLabel: 'Ville de base',
    baseCityPlaceholder: 'Ex: Paris, Nice, Genève...',
    baseCityHint: 'Cette ville sert à suggérer automatiquement des zones.',
    radiusLabel: 'Rayon de déplacement (km)',
    radiusPlaceholder: '50',
    radiusHint: 'Ex : 50 = local • 150 = régional • 300+ = multi-zones',
    intlLabel: 'Mobilité Internationale',
    intlDesc: 'Prêt à voyager pour des missions (passeport valide requis).',
    suggestedZonesLabel: 'Zones suggérées',
    suggestedZonesAuto: 'Auto',
    suggestedZonesEmpty: 'Indique une ville pour obtenir des suggestions.',
    suggestedZonesHint:
      'Les zones suggérées sont calculées automatiquement à partir de votre ville et de votre rayon.',
    saveError: 'Erreur lors de la sauvegarde',
  },
};

// ─────────────────────────────────────────────────────────────────────
// Dictionnaire EN
// ─────────────────────────────────────────────────────────────────────

const en: Dictionary = {
  switcher: { ariaLabel: 'Change language' },
  common: {
    loading: 'Loading…',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    submit: 'Submit',
    submitting: 'Sending…',
    close: 'Close',
    open: 'Open',
    edit: 'Edit',
    complete: 'Complete',
    optional: 'optional',
    required: 'required',
    savedSuccess: 'Changes saved.',
    saveError: 'Error while saving',
    sectionLabel: 'Profile',
  },
  nav: {
    portal: 'Portal',
    dashboard: 'Dashboard',
    missions: 'Missions',
    earnings: 'Earnings',
    pricing: 'Rates',
    identity: 'Identity',
    experience: 'Experience',
    portfolio: 'Portfolio',
    mobility: 'Area & Mobility',
    availability: 'Availability',
    preferences: 'Preferences',
    settings: 'Settings',
    terms: 'Terms',
    logout: 'Sign out',
    termsLabel: 'Terms:',
    termsAccepted: 'accepted',
    termsToValidate: 'to validate',
    loading: 'Loading…',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  termsModal: {
    tagline: 'Chef Talents · Chef Portal',
    title: 'Terms of collaboration',
    description:
      'To access the portal and receive missions, you must read and accept the terms of collaboration.',
    readTerms: 'Read the terms',
    accept: 'Accept and continue',
    accepting: 'Saving…',
    versionInForce: 'Current version: {version}',
    error: 'Unable to save your acceptance. Please retry.',
  },
  dashboard: {
    label: 'Dashboard',
    greeting: 'Hello, Chef {name}.',
    badgeVip: 'VIP',
    profileLabel: 'Profile:',
    profileTypes: {
      private: 'Private Chef',
      residence: 'Residence Chef',
      yacht: 'Yacht Chef',
      pastry: 'Pastry Chef',
    },
    seniority: {
      junior: 'Junior',
      confirmed: 'Confirmed',
      senior: 'Senior',
    },
    accountStatusLabel: 'Account status',
    status: {
      pending_validation: 'Pending',
      approved: 'Approved',
      active: 'Active',
      paused: 'Paused',
      draft: 'Draft',
    },
    onboardingTier: {
      ready: 'Profile ready',
      almost: 'Almost ready',
      progress: 'In progress',
      todo: 'To complete',
    },
    profileCompletedLabel: 'Profile complete',
    checklistLabel: 'Checklist:',
    profileCompletionBody:
      'Complete your profile to be easily presented to concierges.',
    profileCompletionGoal: 'Target: 80%+ to unlock onboarding.',
    completeProfileCta: 'Complete your profile',
    activationCardTitle: 'Complete your profile to activate your account',
    activationCardBody:
      'Reach 80% completion to book your onboarding session with Thomas.',
    activationProgress: '{score}% / 80% required',
    actionCardEdit: 'Edit',
    actionCardComplete: 'Complete',
    calendlyLabel: 'Next step',
    calendlyTitle: 'Your profile is ready — schedule your onboarding',
    calendlyDescription:
      'A 30-minute call with Thomas to validate your profile, review your activity and activate your access to missions.',
    calendlyCta: 'Book a slot',
    vipMember: 'VIP Chef Member',
    vipMemberDesc:
      'Boosted profile · Exclusive tips · Priority on missions',
    vipAccessTips: 'Access tips →',
    vipPriceLabel: 'VIP Chef — €49/month',
    vipTitle: 'Move to the top of the list',
    vipBenefits: [
      'Boosted profile · Mission priority',
      'Exclusive private-service tips',
      'VIP badge visible to concierges',
    ],
    vipCta: 'Become VIP',
    vipRedirecting: 'Redirecting…',
    boostActiveLabel: 'Boost active · {days}d remaining',
    boostInactiveLabel: 'Profile boost — €19',
    boostActiveTitle: 'Your profile is featured',
    boostInactiveTitle: 'Be seen first',
    boostActiveDesc:
      'You appear as a priority in concierge selections.',
    boostInactiveDesc:
      '7 days of maximum visibility · "Available" badge · Priority in selections',
    boostCta: 'Boost',
    proposeNetwork: 'Chefs Talents Network',
    proposeTitle: 'Have a request to forward?',
    proposeDesc:
      "If you can't take on a mission, share it with the network. If it converts, you receive a 5% commission.",
    proposeCtaOpen: 'Propose a mission',
    proposeCtaClose: 'Close',
    proposeFieldDestination: 'Destination *',
    proposeFieldDates: 'Dates *',
    proposeFieldGuests: 'Number of guests',
    proposeFieldBudget: 'Estimated budget',
    proposeFieldNotes: 'Notes (cuisine type, allergies…)',
    proposePlaceholderDestination: 'Ibiza, Saint-Tropez, Mykonos…',
    proposePlaceholderDates: 'July 15–22, 2026',
    proposePlaceholderGuests: '8 guests',
    proposePlaceholderBudget: '€3,500 / week',
    proposePlaceholderNotes:
      'Mediterranean cuisine, gluten-free, dinner on the terrace…',
    proposeCtaSubmit: 'Send to network',
    proposeCtaSubmitting: 'Sending…',
    proposeSuccess:
      'Mission forwarded to Thomas — he will get back to you within 2 hours.',
    checks: {
      identity: {
        title: 'Identity & Contact',
        desc: 'Name, phone, city…',
      },
      experience: {
        title: 'Experience',
        desc: 'Bio + experience',
      },
      portfolio: {
        title: 'Portfolio',
        descOk: 'OK ({count}/{min})',
        descMissing: 'Min. {min} photos ({count}/{min})',
      },
      pricing: {
        title: 'Rates',
        desc: 'Per day or per person',
      },
      mobility: {
        title: 'Area & Mobility',
        desc: 'Zones, travel',
      },
      availability: {
        title: 'Availability',
        desc: 'Mission booking opens soon.',
      },
      preferences: {
        title: 'Preferences',
        desc: 'Cuisines + languages',
      },
    },
  },
  identity: {
    pageTitle: 'Identity & Classification',
    classificationTitle: 'Classification',
    profileTypeLabel: 'Profile Type',
    profileTypes: {
      private: { label: 'Private Chef', sub: 'Dinners & Events' },
      residence: { label: 'Residence Chef', sub: 'Long stays' },
      yacht: { label: 'Yacht Chef', sub: 'Season or Charter' },
    },
    seniorityLabel: 'Experience level (declarative)',
    seniority: {
      junior: 'Junior (1-4 yrs)',
      confirmed: 'Confirmed (5-10 yrs)',
      senior: 'Senior (10+ yrs)',
    },
    personalInfoTitle: 'Personal Information',
    firstName: 'First name',
    lastName: 'Last name',
    emailLabel: 'Email (login)',
    phoneLabel: 'Mobile phone',
    phonePlaceholder: '+33 6...',
    photoLabel: 'Profile photo',
    photoChange: 'Change photo',
    photoUpload: 'Upload a photo',
    photoConstraints: 'JPG/PNG/WebP • max 6MB',
    photoHint: 'Professional portrait recommended (neutral background, face visible).',
    alertSelectImage: 'Please select an image.',
    alertImageTooLarge: 'Image too large (max {max}MB).',
    uploadError: 'Error during upload',
  },
  experience: {
    pageTitle: 'Experience & Background',
    yearsLabel: 'Years of experience (Cooking)',
    environmentsLabel: 'Mastered Environments',
    environments: {
      restaurant: 'Fine-dining Restaurant',
      hotel: 'Luxury Hotel',
      private_villa: 'Private Villa',
      yacht: 'Yachting (>30m)',
      chalet: 'Mountain Chalet',
      events: 'Catering / Events',
    },
    certificationsLabel: 'Diplomas & certifications',
    certs: {
      HACCP: { label: 'HACCP', hint: 'Food hygiene' },
      foodSafety: { label: 'Food Safety', hint: 'Hygiene certification (UK/Int.)' },
      STCW: { label: 'STCW', hint: 'Required on many yachts' },
      ENG1: { label: 'ENG1', hint: 'Maritime medical certificate' },
      firstAid: { label: 'First Aid', hint: 'PSC1 / equivalent' },
      fireSafety: { label: 'Fire Safety', hint: 'Fire training' },
      lifeguard: { label: 'Lifeguard', hint: 'Useful for yacht / beach / pool' },
      security: { label: 'Security', hint: 'Safety / security training (optional)' },
    },
    certsNotesLabel: 'Other / details (optional)',
    certsNotesPlaceholder: 'E.g. driving license, boat license, etc.',
    certsNotesHint: 'These details help us match you better (yacht, safety, compliance).',
    bioLabel: 'Professional Bio',
    bioPlaceholder: 'Describe your background, philosophy and notable experiences...',
    bioHint: 'This text is visible to clients. Be precise and professional.',
    sessionExpired: 'Session expired. Please log in again.',
  },
  portfolio: {
    pageLabel: 'Visual',
    pageTitle: 'Portfolio',
    importantTitle: '📸 Important',
    importantBody1:
      'These photos showcase your profile to clients. Choose well-plated, well-lit dishes without excessive filters.',
    importantBody2: 'Minimum 5 photos to validate your portfolio.',
    linksLabel: 'Links (optional)',
    instagramLabel: 'Instagram',
    websiteLabel: 'Website',
    instagramPlaceholder: 'https://instagram.com/yourprofile',
    websitePlaceholder: 'https://yoursite.com',
    linksHint: 'Optional — but useful to reinforce profile credibility.',
    saveLinksCta: 'Save links',
    invalidInstagram: 'Invalid Instagram link. Example: https://instagram.com/yourprofile',
    invalidWebsite: 'Invalid website link. Example: https://yoursite.com',
    saveLinksError: 'Error while saving links',
    addPhotosLabel: 'Add photos (upload only)',
    photoConstraints: 'JPG/PNG/WebP • max 8MB / image • ideal: 5 to 10 photos',
    portfolioValid: '✅ Portfolio validated (5 photos minimum).',
    portfolioMissing: '⚠️ Add {n} more photo(s) to validate your portfolio.',
    uploadCta: 'Upload photos',
    uploadSuccess: '✅ Saved',
    noImages: 'No image added.',
    uploadFailed: 'No image could be uploaded (format/size).',
    uploadError: 'Error during upload',
    deleteError: 'Error while deleting',
  },
  mobility: {
    pageLabel: 'Logistics',
    pageTitle: 'Area & Mobility',
    helpAriaLabel: 'Information',
    helpTitle: 'How does it work?',
    helpModalTitle: 'How your mobility positions you',
    helpModalSubtitle: 'We use this to suggest the most relevant missions.',
    helpStep1Title: '1) Base city',
    helpStep1Desc:
      'It serves as your starting point. We prioritise missions close to this area.',
    helpStep2Title: '2) Radius (km)',
    helpStep2Desc:
      'The wider your radius, the more missions you appear on (villas, chalets, residences, events).',
    helpStep2Refs: 'Reference: 50km = local • 150km = regional • 300km+ = multi-zone',
    helpStep3Title: '3) International mobility',
    helpStep3Desc:
      'Enable if you are willing to travel (premium missions: yachts, seasons, long-term residences).',
    helpImportantTitle: '✅ Important',
    helpImportantBody: 'You remain free to accept or decline a mission at any time.',
    helpImportantNote: 'The "suggested zones" below are an automatic helper (not a commitment).',
    helpUnderstood: 'Got it',
    positioningLabel: 'Current positioning',
    positioning: {
      international: { label: 'International', desc: 'Highly visible: premium missions + travel.' },
      large: { label: 'Wide / multi-zone', desc: 'Highly visible: residences/seasons and multi-destination missions.' },
      regional: { label: 'Regional', desc: 'Visible: missions in several zones around your base.' },
      local: { label: 'Local', desc: 'Priority: missions close to your base city.' },
    },
    baseCityLabel: 'Base city',
    baseCityPlaceholder: 'E.g. Paris, Nice, Geneva...',
    baseCityHint: 'This city is used to suggest zones automatically.',
    radiusLabel: 'Travel radius (km)',
    radiusPlaceholder: '50',
    radiusHint: 'E.g. 50 = local • 150 = regional • 300+ = multi-zone',
    intlLabel: 'International Mobility',
    intlDesc: 'Ready to travel for missions (valid passport required).',
    suggestedZonesLabel: 'Suggested zones',
    suggestedZonesAuto: 'Auto',
    suggestedZonesEmpty: 'Enter a city to get suggestions.',
    suggestedZonesHint:
      'Suggested zones are calculated automatically from your city and radius.',
    saveError: 'Error while saving',
  },
};

// ─────────────────────────────────────────────────────────────────────
// Dictionnaire ES
// ─────────────────────────────────────────────────────────────────────

const es: Dictionary = {
  switcher: { ariaLabel: 'Cambiar idioma' },
  common: {
    loading: 'Cargando…',
    save: 'Guardar',
    saving: 'Guardando…',
    cancel: 'Cancelar',
    submit: 'Enviar',
    submitting: 'Enviando…',
    close: 'Cerrar',
    open: 'Abrir',
    edit: 'Editar',
    complete: 'Completar',
    optional: 'opcional',
    required: 'requerido',
    savedSuccess: 'Cambios guardados.',
    saveError: 'Error al guardar',
    sectionLabel: 'Perfil',
  },
  nav: {
    portal: 'Portal',
    dashboard: 'Panel',
    missions: 'Misiones',
    earnings: 'Ingresos',
    pricing: 'Tarifas',
    identity: 'Identidad',
    experience: 'Experiencia',
    portfolio: 'Portafolio',
    mobility: 'Zona y Movilidad',
    availability: 'Disponibilidad',
    preferences: 'Preferencias',
    settings: 'Ajustes',
    terms: 'Condiciones',
    logout: 'Cerrar sesión',
    termsLabel: 'Condiciones:',
    termsAccepted: 'aceptadas',
    termsToValidate: 'por validar',
    loading: 'Cargando…',
    openMenu: 'Abrir el menú',
    closeMenu: 'Cerrar el menú',
  },
  termsModal: {
    tagline: 'Chef Talents · Portal Chef',
    title: 'Condiciones de colaboración',
    description:
      'Para acceder al portal y recibir misiones, debe leer y aceptar las condiciones de colaboración.',
    readTerms: 'Leer las condiciones',
    accept: 'Aceptar y continuar',
    accepting: 'Guardando…',
    versionInForce: 'Versión vigente: {version}',
    error: 'No se pudo registrar la aceptación. Inténtelo de nuevo.',
  },
  dashboard: {
    label: 'Panel',
    greeting: 'Hola, Chef {name}.',
    badgeVip: 'VIP',
    profileLabel: 'Perfil:',
    profileTypes: {
      private: 'Chef Privado',
      residence: 'Chef Residencia',
      yacht: 'Chef Yate',
      pastry: 'Chef Pastelero',
    },
    seniority: {
      junior: 'Junior',
      confirmed: 'Confirmado',
      senior: 'Senior',
    },
    accountStatusLabel: 'Estado de la cuenta',
    status: {
      pending_validation: 'Pendiente',
      approved: 'Validado',
      active: 'Activo',
      paused: 'En pausa',
      draft: 'Borrador',
    },
    onboardingTier: {
      ready: 'Perfil listo',
      almost: 'Casi listo',
      progress: 'En progreso',
      todo: 'Por completar',
    },
    profileCompletedLabel: 'Perfil completado',
    checklistLabel: 'Lista:',
    profileCompletionBody:
      'Complete su perfil para ser presentado fácilmente a las conciergeries.',
    profileCompletionGoal:
      'Objetivo: 80%+ para desbloquear el onboarding.',
    completeProfileCta: 'Completar el perfil',
    activationCardTitle: 'Complete su perfil para activar su cuenta',
    activationCardBody:
      'Alcance el 80% de finalización para reservar su sesión de onboarding con Thomas.',
    activationProgress: '{score}% / 80% requerido',
    actionCardEdit: 'Editar',
    actionCardComplete: 'Completar',
    calendlyLabel: 'Próximo paso',
    calendlyTitle: 'Su perfil está listo — programe su onboarding',
    calendlyDescription:
      'Una llamada de 30 minutos con Thomas para validar su perfil, hacer un balance de su actividad y activar su acceso a las misiones.',
    calendlyCta: 'Reservar un horario',
    vipMember: 'Miembro Chef VIP',
    vipMemberDesc:
      'Perfil potenciado · Acceso a tips exclusivos · Prioridad en misiones',
    vipAccessTips: 'Acceder a los tips →',
    vipPriceLabel: 'Chef VIP — 49€/mes',
    vipTitle: 'Pase al primer puesto',
    vipBenefits: [
      'Perfil potenciado · Prioridad en misiones',
      'Tips exclusivos de servicio privado',
      'Insignia VIP visible para conciergeries',
    ],
    vipCta: 'Hacerse VIP',
    vipRedirecting: 'Redirigiendo…',
    boostActiveLabel: 'Boost activo · {days}d restantes',
    boostInactiveLabel: 'Boost de perfil — 19€',
    boostActiveTitle: 'Su perfil está destacado',
    boostInactiveTitle: 'Sea visto primero',
    boostActiveDesc:
      'Aparece como prioridad en las selecciones de las conciergeries.',
    boostInactiveDesc:
      '7 días de visibilidad máxima · Insignia "Disponible" · Prioridad en las selecciones',
    boostCta: 'Potenciar',
    proposeNetwork: 'Red Chefs Talents',
    proposeTitle: '¿Tiene una solicitud para transmitir?',
    proposeDesc:
      'Si no puede atender una misión, transmítala a la red. Si se concreta, recibe una comisión del 5%.',
    proposeCtaOpen: 'Proponer una misión',
    proposeCtaClose: 'Cerrar',
    proposeFieldDestination: 'Destino *',
    proposeFieldDates: 'Fechas *',
    proposeFieldGuests: 'Número de invitados',
    proposeFieldBudget: 'Presupuesto estimado',
    proposeFieldNotes: 'Notas (tipo de cocina, alergias…)',
    proposePlaceholderDestination: 'Ibiza, Saint-Tropez, Mykonos…',
    proposePlaceholderDates: '15-22 julio 2026',
    proposePlaceholderGuests: '8 personas',
    proposePlaceholderBudget: '3 500€ / semana',
    proposePlaceholderNotes:
      'Cocina mediterránea, sin gluten, cena en la terraza…',
    proposeCtaSubmit: 'Enviar a la red',
    proposeCtaSubmitting: 'Enviando…',
    proposeSuccess:
      'Misión transmitida a Thomas — le responderá en 2 horas.',
    checks: {
      identity: {
        title: 'Identidad y Contacto',
        desc: 'Nombre, teléfono, ciudad…',
      },
      experience: {
        title: 'Experiencia',
        desc: 'Bio + experiencia',
      },
      portfolio: {
        title: 'Portafolio',
        descOk: 'OK ({count}/{min})',
        descMissing: 'Mín. {min} fotos ({count}/{min})',
      },
      pricing: {
        title: 'Tarifas',
        desc: 'Precio / día o precio / persona',
      },
      mobility: {
        title: 'Zona y Movilidad',
        desc: 'Zonas, desplazamientos',
      },
      availability: {
        title: 'Disponibilidad',
        desc: 'Apertura de las misiones próximamente.',
      },
      preferences: {
        title: 'Preferencias',
        desc: 'Cocinas + idiomas',
      },
    },
  },
  identity: {
    pageTitle: 'Identidad y Clasificación',
    classificationTitle: 'Clasificación',
    profileTypeLabel: 'Tipo de Perfil',
    profileTypes: {
      private: { label: 'Chef Privado', sub: 'Cenas y Eventos' },
      residence: { label: 'Chef Residencia', sub: 'Estancias largas' },
      yacht: { label: 'Chef Yate', sub: 'Temporada o Charter' },
    },
    seniorityLabel: 'Nivel de experiencia (declarativo)',
    seniority: {
      junior: 'Junior (1-4 años)',
      confirmed: 'Confirmado (5-10 años)',
      senior: 'Senior (10+ años)',
    },
    personalInfoTitle: 'Información Personal',
    firstName: 'Nombre',
    lastName: 'Apellido',
    emailLabel: 'Email (identificador)',
    phoneLabel: 'Teléfono móvil',
    phonePlaceholder: '+33 6...',
    photoLabel: 'Foto de perfil',
    photoChange: 'Cambiar foto',
    photoUpload: 'Subir una foto',
    photoConstraints: 'JPG/PNG/WebP • máx. 6MB',
    photoHint: 'Retrato profesional recomendado (fondo neutro, rostro visible).',
    alertSelectImage: 'Seleccione una imagen, por favor.',
    alertImageTooLarge: 'Imagen demasiado pesada (máx. {max}MB).',
    uploadError: 'Error durante la carga',
  },
  experience: {
    pageTitle: 'Experiencia y Trayectoria',
    yearsLabel: 'Años de experiencia (Cocina)',
    environmentsLabel: 'Entornos Dominados',
    environments: {
      restaurant: 'Restaurante Gastronómico',
      hotel: 'Hotelería de Lujo',
      private_villa: 'Villa Privada',
      yacht: 'Yatismo (>30m)',
      chalet: 'Chalet de Montaña',
      events: 'Catering / Eventos',
    },
    certificationsLabel: 'Diplomas y certificaciones',
    certs: {
      HACCP: { label: 'HACCP', hint: 'Higiene alimentaria' },
      foodSafety: { label: 'Food Safety', hint: 'Certificación de higiene (UK/Int.)' },
      STCW: { label: 'STCW', hint: 'Obligatorio en muchos yates' },
      ENG1: { label: 'ENG1', hint: 'Certificado médico marítimo' },
      firstAid: { label: 'Primeros auxilios', hint: 'PSC1 / equivalente' },
      fireSafety: { label: 'Seguridad contra incendios', hint: 'Formación contra incendios' },
      lifeguard: { label: 'Socorrista', hint: 'Útil yate / playa / piscina' },
      security: { label: 'Seguridad', hint: 'Formación de seguridad (opcional)' },
    },
    certsNotesLabel: 'Otros / detalles (opcional)',
    certsNotesPlaceholder: 'Ej.: Permiso de conducir, licencia náutica, etc.',
    certsNotesHint: 'Estos datos nos ayudan a hacer un mejor match (yate, seguridad, conformidad).',
    bioLabel: 'Bio Profesional',
    bioPlaceholder: 'Describa su trayectoria, filosofía y experiencias destacables...',
    bioHint: 'Este texto será visible para los clientes. Sea preciso y profesional.',
    sessionExpired: 'Sesión expirada. Vuelva a iniciar sesión.',
  },
  portfolio: {
    pageLabel: 'Visual',
    pageTitle: 'Portafolio',
    importantTitle: '📸 Importante',
    importantBody1:
      'Estas fotos sirven para destacar su perfil ante los clientes. Elija platos bien presentados, bien iluminados, sin filtros excesivos.',
    importantBody2: 'Mínimo 5 fotos para validar su portafolio.',
    linksLabel: 'Enlaces (opcional)',
    instagramLabel: 'Instagram',
    websiteLabel: 'Sitio web',
    instagramPlaceholder: 'https://instagram.com/tuperfil',
    websitePlaceholder: 'https://tusitio.com',
    linksHint: 'Opcional, pero útil para reforzar la credibilidad del perfil.',
    saveLinksCta: 'Guardar enlaces',
    invalidInstagram: 'Enlace de Instagram no válido. Ejemplo: https://instagram.com/tuperfil',
    invalidWebsite: 'Enlace de sitio web no válido. Ejemplo: https://tusitio.com',
    saveLinksError: 'Error al guardar los enlaces',
    addPhotosLabel: 'Añadir fotos (solo carga)',
    photoConstraints: 'JPG/PNG/WebP • máx. 8MB / imagen • ideal: 5 a 10 fotos',
    portfolioValid: '✅ Portafolio validado (5 fotos mínimo).',
    portfolioMissing: '⚠️ Añade {n} foto(s) más para validar tu portafolio.',
    uploadCta: 'Subir fotos',
    uploadSuccess: '✅ Guardado',
    noImages: 'No se han añadido imágenes.',
    uploadFailed: 'Ninguna imagen pudo ser cargada (formato/tamaño).',
    uploadError: 'Error durante la carga',
    deleteError: 'Error al eliminar',
  },
  mobility: {
    pageLabel: 'Logística',
    pageTitle: 'Zona y Movilidad',
    helpAriaLabel: 'Información',
    helpTitle: '¿Cómo funciona?',
    helpModalTitle: 'Cómo te posicionas gracias a tu movilidad',
    helpModalSubtitle: 'Usamos estos datos para proponerte las misiones más relevantes.',
    helpStep1Title: '1) Ciudad de base',
    helpStep1Desc:
      'Sirve como punto de partida. Te proponemos prioritariamente misiones cercanas a esta zona.',
    helpStep2Title: '2) Radio (km)',
    helpStep2Desc:
      'Cuanto mayor es tu radio, más misiones aparecerán para ti (villas, chalets, residencias, eventos).',
    helpStep2Refs: 'Referencia: 50km = local • 150km = regional • 300km+ = multi-zona',
    helpStep3Title: '3) Movilidad internacional',
    helpStep3Desc:
      'Activa si estás dispuesto a viajar (misiones premium: yates, temporadas, residencias largas).',
    helpImportantTitle: '✅ Importante',
    helpImportantBody: 'Sigues siendo libre de aceptar o rechazar una misión en cualquier momento.',
    helpImportantNote: 'Las "zonas sugeridas" abajo son una ayuda automática (no un compromiso).',
    helpUnderstood: 'Entendido',
    positioningLabel: 'Posicionamiento actual',
    positioning: {
      international: { label: 'Internacional', desc: 'Muy visible: misiones premium + desplazamientos.' },
      large: { label: 'Amplio / multi-zona', desc: 'Muy visible: residencias/temporadas y misiones multi-destino.' },
      regional: { label: 'Regional', desc: 'Visible: misiones en varias zonas alrededor de tu base.' },
      local: { label: 'Local', desc: 'Prioridad: misiones cercanas a tu ciudad de base.' },
    },
    baseCityLabel: 'Ciudad de base',
    baseCityPlaceholder: 'Ej.: París, Niza, Ginebra...',
    baseCityHint: 'Esta ciudad sirve para sugerir zonas automáticamente.',
    radiusLabel: 'Radio de desplazamiento (km)',
    radiusPlaceholder: '50',
    radiusHint: 'Ej.: 50 = local • 150 = regional • 300+ = multi-zona',
    intlLabel: 'Movilidad Internacional',
    intlDesc: 'Listo para viajar para misiones (pasaporte válido requerido).',
    suggestedZonesLabel: 'Zonas sugeridas',
    suggestedZonesAuto: 'Auto',
    suggestedZonesEmpty: 'Indique una ciudad para obtener sugerencias.',
    suggestedZonesHint:
      'Las zonas sugeridas se calculan automáticamente a partir de su ciudad y radio.',
    saveError: 'Error al guardar',
  },
};

export const dictionaries: Record<Locale, Dictionary> = { fr, en, es };
