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

  availability: {
    pageLabel: string;
    pageTitle: string;
    dateLocale: string; // 'fr-FR' | 'en-US' | 'es-ES'
    weekdays: [string, string, string, string, string, string, string]; // Mon-Sun
    availableNowLabel: string;
    availableNowDesc: string;
    nextAvailableLabel: string;
    nextAvailableHint: string;
    preferredPeriodsLabel: string;
    periods: {
      weekdays: string;
      weekends: string;
      evenings: string;
      season_winter: string;
      season_summer: string;
    };
    calendarHelp1: string; // "Par défaut, vous êtes considéré comme {available}..."
    calendarHelpAvailable: string; // "disponible"
    calendarHelpUnavailable: string; // "indisponible"
    prevMonth: string;
    nextMonth: string;
    backToToday: string;
    todayBadge: string;
    available: string;
    unavailable: string;
    saved: string;
  };

  preferences: {
    pageLabel: string;
    pageTitle: string;
    missionTypesLabel: string;
    missionTypes: {
      one_shot: string;
      residence: string;
      yacht: string;
      event_catering: string;
    };
    selected: string;
    clickToSelect: string;
    missionTypesEmpty: string;
    cuisinesLabel: string;
    cuisinesPreset: string[]; // 8 items
    addCuisinePlaceholder: string;
    languagesLabel: string;
    languagesPreset: string[]; // 6 items
    addLanguagePlaceholder: string;
    specialtiesLabel: string;
    specialtiesPreset: string[]; // 8 items
    addSpecialtyPlaceholder: string;
    addCta: string;
    checklistLabel: string;
    checklistOk: string;
    checklistMissing: string;
    saved: string;
    saveError: string;
  };

  missions: {
    pageLabel: string;
    pageTitle: string;
    bannerSeason: string;
    bannerHeadline: string;
    bannerDesc: string;
    completeProfile: string;
    refresh: string;
    tabs: { proposals: string; active: string; history: string };
    cardYourFee: string;
    cardGuests: string; // "{n} guests"
    cardAccept: string;
    cardDecline: string;
    cardViewContract: string;
    cardContactClient: string;
    waMessage: string; // template with {date} and {location}
    status: {
      offered: string;
      accepted: string;
      confirmed: string;
      completed: string;
      declined: string;
      cancelled: string;
    };
    emptyOffered: string;
    emptyActive: string;
    emptyHistory: string;
  };

  earnings: {
    pageLabel: string;
    pageTitle: string;
    kpis: {
      totalLabel: string;
      totalDesc: string;
      last30Label: string;
      last30Desc: string;
      missionsLabel: string;
      missionsDesc: string;
      averageLabel: string;
      averageDesc: string;
    };
    detailsTitle: string;
    tableDate: string;
    tableMission: string;
    tableLocation: string;
    tableAmount: string;
    empty: string;
  };

  settings: {
    pageLabel: string;
    pageTitle: string;
    subtitle: string;
    launchStatus: string;
    tier: {
      priorityMax: string;
      priority: string;
      progress: string;
      todo: string;
    };
    founderPill: string;
    completionLabel: string; // "Complétion profil : {pct}% ({ok}/{total})"
    completionRule: string;
    saveCta: string;
    saved: string;
    saveError: string;
    founderSectionTitle: string;
    founderSectionDesc: string;
    founderActivated: string;
    founderActivateCta: string;
    founderConditionMet: string;
    founderConditionUnmet: string;
    checklistTitle: string;
    checklistSubtitle: string;
    checklistOk: string;
    checklistOpen: string;
    items: {
      identity: { label: string; hint: string };
      experience: { label: string; hint: string };
      portfolio: { label: string; hint: string }; // "5 photos minimum ({n}/{min})"
      mobility: { label: string; hint: string };
      pricing: { label: string; hint: string };
      availability: { label: string; hint: string };
      preferences: { label: string; hint: string };
    };
    hubTitle: string;
    hubSubtitle: string;
    hubProfileLabel: string;
    hubAdvice: string;
    sections: {
      identity: { title: string; desc: string };
      experience: { title: string; desc: string };
      portfolio: { title: string; desc: string };
      mobility: { title: string; desc: string };
      availability: { title: string; desc: string };
      preferences: { title: string; desc: string };
      pricing: { title: string; desc: string };
    };
    sectionOk: string;
    sectionTodo: string;
    password: {
      label: string;
      desc: string;
      newLabel: string;
      newPlaceholder: string;
      confirmLabel: string;
      confirmPlaceholder: string;
      tooShort: string;
      mismatch: string;
      success: string;
      error: string;
      cta: string;
      ctaLoading: string;
    };
    footerNote: string;
  };

  auth: {
    sectionLabel: string;
    loginTitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    loginCta: string;
    loginLoading: string;
    noAccount: string;
    createAccountLink: string;
    errEmailMissing: string;
    errPasswordMissing: string;
    errSessionMissing: string;
    errLogin: string;

    signupSidebarLabel: string;
    signupSidebarTitle: string;
    signupSidebarDesc: string;
    signupBenefit1: string;
    signupBenefit2: string;
    signupBenefit3: string;
    signupSidebarFooter: string;
    signupCandidateLabel: string;
    signupTitle: string;
    signupSubtitle: string;
    firstNameLabel: string;
    firstNamePlaceholder: string;
    lastNameLabel: string;
    lastNamePlaceholder: string;
    emailSignupPlaceholder: string;
    passwordSignupPlaceholder: string;
    privateNote: string;
    errEmailMissingSignup: string;
    errPasswordTooShort: string;
    errSignup: string;
    signupCta: string;
    haveAccount: string;
    signupLegalNote: string;

    forgotTitle: string;
    forgotDesc: string;
    forgotEmailPlaceholder: string;
    forgotCta: string;
    forgotSent: string;
  };

  pricing: {
    pageLabel: string;
    pageTitle: string;
    positionLabel: string;
    tierHelp: string;
    tiers: {
      essential: { title: string; subtitle: string };
      premium:   { title: string; subtitle: string };
      luxury:    { title: string; subtitle: string };
      ultra:     { title: string; subtitle: string };
    };
    suggestionsTitle: string; // "Suggestions ({tier})"
    suggestionsBaseMarket: string; // "Base marché: Résidence {rmin}–{rmax} €/jour • Événementiel {emin}–{emax} €/pers"
    suggestionsAdjustment: string; // "Ajustement options: x{m}"
    applySuggestions: string;
    resetCta: string;
    modeSimple: string;
    modeTarget: string;
    targetNetLabel: string;
    targetNetPlaceholder: string;
    estimatedCostsLabel: string;
    estimatedCostsPlaceholder: string;
    suggestedRateLabel: string;
    suggestedRateUnit: string; // "€/jour"
    applyToDailyCta: string;
    indicativeNote: string;
    residenceLabel: string;
    dailyRateLabel: string;
    dailyRatePlaceholder: string;
    dailyRateHint: string;
    chooseTierFirst: string;
    rangeEmpty: string;
    rangeLow: string; // "Plutôt bas (marché: {min}–{max})"
    rangeHigh: string; // "Plutôt haut (marché: {min}–{max})"
    rangeOk: string; // "Dans le marché ({min}–{max})"
    minDaysLabel: string;
    minDaysPlaceholder: string;
    minDaysHint: string;
    eventLabel: string;
    eventPriceLabel: string;
    eventPricePlaceholder: string;
    minGuestsLabel: string;
    minGuestsPlaceholder: string;
    eventEmpty: string;
    flagsLabel: string;
    flags: {
      highSeason: string;
      international: string;
      yacht: string;
      brigade: string;
    };
    summaryLabel: string;
    summaryTier: string; // "Tier: {tier}"
    summaryResidence: string;
    summaryEvent: string;
    summaryDailyUnit: string; // "€/jour"
    summaryPerPersonUnit: string; // "€/pers"
    summaryMinDays: string; // "min {n} jours"
    summaryMinGuests: string; // "min {n} pers"
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
  availability: {
    pageLabel: 'Planning',
    pageTitle: 'Disponibilités',
    dateLocale: 'fr-FR',
    weekdays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    availableNowLabel: 'Disponible immédiatement',
    availableNowDesc: 'Active si tu peux accepter une mission maintenant.',
    nextAvailableLabel: 'Prochaine disponibilité',
    nextAvailableHint: 'Laisse vide si tu es flexible.',
    preferredPeriodsLabel: 'Périodes préférées',
    periods: {
      weekdays: 'Semaine',
      weekends: 'Week-ends',
      evenings: 'Soirs',
      season_winter: 'Saison hiver',
      season_summer: 'Saison été',
    },
    calendarHelp1:
      'Par défaut, vous êtes considéré comme {available}. Cliquez sur une date pour la marquer comme {unavailable}.',
    calendarHelpAvailable: 'disponible',
    calendarHelpUnavailable: 'indisponible',
    prevMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    backToToday: 'Revenir à aujourd’hui',
    todayBadge: 'Aujourd’hui',
    available: 'Disponible',
    unavailable: 'Indisponible',
    saved: 'Enregistré ✅',
  },
  preferences: {
    pageLabel: 'Préférences',
    pageTitle: 'Matching',
    missionTypesLabel: 'Types de missions souhaitées',
    missionTypes: {
      one_shot: 'Ponctuelle ( déjeuner / dîner )',
      residence: 'Résidence (villa / chalet )',
      yacht: 'Yacht',
      event_catering: 'Event / catering',
    },
    selected: 'Sélectionné',
    clickToSelect: 'Cliquer',
    missionTypesEmpty: 'Choisis ce que tu veux recevoir (utilisé pour le matching).',
    cuisinesLabel: 'Cuisines (min. 1)',
    cuisinesPreset: [
      'Française', 'Italienne', 'Japonaise', 'Méditerranéenne',
      'Asiatique', 'Végétarienne', 'Healthy', 'Fusion',
    ],
    addCuisinePlaceholder: 'Ajouter une cuisine…',
    languagesLabel: 'Langues (min. 1)',
    languagesPreset: ['Français', 'Anglais', 'Espagnol', 'Italien', 'Allemand', 'Arabe'],
    addLanguagePlaceholder: 'Ajouter une langue…',
    specialtiesLabel: 'Spécialités (optionnel)',
    specialtiesPreset: [
      'Fine dining', 'Family style', 'Brunch', 'Private villa',
      'Yacht', 'Chalet', 'Event / catering', 'Menu dégustation',
    ],
    addSpecialtyPlaceholder: 'Ajouter une spécialité…',
    addCta: 'Ajouter',
    checklistLabel: 'Checklist :',
    checklistOk: 'OK ✅',
    checklistMissing: 'Il faut 1 mission + 1 cuisine + 1 langue',
    saved: 'Enregistré ✅',
    saveError: "Erreur d’enregistrement (check console)",
  },
  pricing: {
    pageLabel: 'Tarifs',
    pageTitle: 'Positionnement & Pricing',
    positionLabel: 'Votre positionnement',
    tierHelp: 'Ce choix sert à positionner votre offre (pas à vous noter).',
    tiers: {
      essential: { title: 'Essential', subtitle: 'Déjeuners / dîners privés, familles, petits groupes' },
      premium:   { title: 'Premium',   subtitle: 'Villas, conciergeries, expériences soignées' },
      luxury:    { title: 'Luxury',    subtitle: 'Chalets, yachts, UHNW, exigences élevées' },
      ultra:     { title: 'Ultra',     subtitle: 'Résidences longues, yachts >40m, brigade possible' },
    },
    suggestionsTitle: 'Suggestions ({tier})',
    suggestionsBaseMarket:
      'Base marché: Résidence {rmin}–{rmax} €/jour • Événementiel {emin}–{emax} €/pers',
    suggestionsAdjustment: 'Ajustement options: x{m}',
    applySuggestions: 'Appliquer suggestions',
    resetCta: 'Réinitialiser',
    modeSimple: 'Mode simple',
    modeTarget: 'Objectif de revenu',
    targetNetLabel: 'Objectif net / jour (€)',
    targetNetPlaceholder: 'ex: 600',
    estimatedCostsLabel: 'Coûts estimés / jour (€)',
    estimatedCostsPlaceholder: 'ex: 120',
    suggestedRateLabel: 'Tarif conseillé',
    suggestedRateUnit: '€/jour',
    applyToDailyCta: 'Appliquer au tarif journalier',
    indicativeNote: '*Indicatif. Ça sert à aider le matching et à éviter l’inconnu pour concierges/clients.',
    residenceLabel: 'Résidence privée',
    dailyRateLabel: 'Tarif journalier (€/jour)',
    dailyRatePlaceholder: 'ex: 500',
    dailyRateHint: 'Indiquez votre base hors achats matière première si besoin.',
    chooseTierFirst: 'Choisissez un positionnement pour voir la référence marché.',
    rangeEmpty: 'Non renseigné',
    rangeLow: 'Plutôt bas (marché: {min}–{max})',
    rangeHigh: 'Plutôt haut (marché: {min}–{max})',
    rangeOk: 'Dans le marché ({min}–{max})',
    minDaysLabel: 'Minimum de jours (optionnel)',
    minDaysPlaceholder: 'ex: 3',
    minDaysHint: 'Ex: 2 jours minimum pour déplacement.',
    eventLabel: 'Événementiel',
    eventPriceLabel: 'Prix par personne (€/pers)',
    eventPricePlaceholder: 'ex: 120',
    minGuestsLabel: 'Minimum de convives (optionnel)',
    minGuestsPlaceholder: 'ex: 12',
    eventEmpty: 'Si vous ne faites pas d’événementiel, laissez vide.',
    flagsLabel: 'Options',
    flags: {
      highSeason: 'Haute saison',
      international: 'International',
      yacht: 'Yacht',
      brigade: 'Brigade possible',
    },
    summaryLabel: 'Résumé (visible concierge)',
    summaryTier: 'Tier: {tier}',
    summaryResidence: 'Résidence',
    summaryEvent: 'Événementiel',
    summaryDailyUnit: '€/jour',
    summaryPerPersonUnit: '€/pers',
    summaryMinDays: 'min {n} jours',
    summaryMinGuests: 'min {n} pers',
  },
  missions: {
    pageLabel: 'Opérations',
    pageTitle: 'Vos missions',
    bannerSeason: 'Été 2026',
    bannerHeadline: 'Missions ouvertes — Ibiza, Saint-Tropez, Mykonos',
    bannerDesc:
      'Complétez votre profil pour être proposé aux demandes clients. Les profils les plus complets passent en priorité.',
    completeProfile: 'Compléter le profil',
    refresh: 'Rafraîchir',
    tabs: { proposals: 'Propositions', active: 'En cours', history: 'Historique' },
    cardYourFee: 'Votre rémunération',
    cardGuests: '{n} convives',
    cardAccept: 'Accepter',
    cardDecline: 'Refuser',
    cardViewContract: 'Voir le contrat',
    cardContactClient: 'Contacter le client',
    waMessage:
      "Bonjour, je suis votre chef privé via Chefs Talents pour la mission du {date} à {location}. N'hésitez pas si vous avez des questions.",
    status: {
      offered: 'Proposition',
      accepted: 'Acceptée',
      confirmed: 'Confirmée',
      completed: 'Terminée',
      declined: 'Refusée',
      cancelled: 'Annulée',
    },
    emptyOffered: 'Aucune proposition de mission pour l’instant.',
    emptyActive: 'Aucune mission en cours ou à venir.',
    emptyHistory: 'Aucun historique pour l’instant.',
  },
  earnings: {
    pageLabel: 'Performance',
    pageTitle: 'Revenus & Activité',
    kpis: {
      totalLabel: 'CA Total',
      totalDesc: 'Missions réalisées',
      last30Label: '30 derniers jours',
      last30Desc: 'Revenus glissants',
      missionsLabel: 'Missions',
      missionsDesc: 'Complétées',
      averageLabel: 'Panier moyen',
      averageDesc: 'Par mission',
    },
    detailsTitle: 'Détail des revenus',
    tableDate: 'Date',
    tableMission: 'Mission',
    tableLocation: 'Lieu',
    tableAmount: 'Montant',
    empty: 'Aucune donnée de revenu disponible.',
  },
  settings: {
    pageLabel: 'Paramètres',
    pageTitle: 'Votre profil Chef',
    subtitle:
      'Plateforme en lancement : les missions arrivent bientôt. Compléter votre profil vous place en priorité lors du matching.',
    launchStatus: 'Statut de lancement',
    tier: {
      priorityMax: 'Priorité MAX',
      priority: 'Prioritaire',
      progress: 'En progression',
      todo: 'À compléter',
    },
    founderPill: 'Chef Fondateur',
    completionLabel: 'Complétion profil : {pct}% ({ok}/{total})',
    completionRule:
      'Règle simple : plus ton profil est complet, plus tu remontes en priorité sur les demandes (fast & standard).',
    saveCta: 'Enregistrer',
    saved: 'Enregistré ✅',
    saveError: 'Erreur d’enregistrement',
    founderSectionTitle: 'Chef Fondateur',
    founderSectionDesc:
      'Badge réservé aux premiers chefs : visibilité renforcée au lancement + accès prioritaire aux premières missions.',
    founderActivated: 'Activé',
    founderActivateCta: 'Activer',
    founderConditionMet: '✅ OK',
    founderConditionUnmet: 'Complète encore 2–3 sections.',
    checklistTitle: 'Checklist (Priorité)',
    checklistSubtitle: 'Atteins 70% pour être prioritaire.',
    checklistOk: 'OK',
    checklistOpen: 'Ouvrir →',
    items: {
      identity:    { label: 'Identité',         hint: 'Nom, téléphone, ville…' },
      experience:  { label: 'Expérience',       hint: 'Bio + expérience' },
      portfolio:   { label: 'Portfolio',        hint: '5 photos minimum ({n}/{min})' },
      mobility:    { label: 'Zone & mobilité',  hint: 'Zones, déplacements' },
      pricing:     { label: 'Tarifs',           hint: 'Prix / jour ou prix / personne' },
      availability:{ label: 'Disponibilités',   hint: 'Calendrier, périodes' },
      preferences: { label: 'Préférences',      hint: 'Cuisines, langues…' },
    },
    hubTitle: 'Gérer votre profil',
    hubSubtitle:
      'Les informations se remplissent dans les pages dédiées (Identité, Expérience, Portfolio…). Ici, on centralise tout.',
    hubProfileLabel: 'Profil',
    hubAdvice:
      'Astuce : vise 70%+ pour être prioritaire dès l’ouverture des missions.',
    sections: {
      identity:     { title: 'Identité',           desc: 'Nom, téléphone, ville…' },
      experience:   { title: 'Expérience',         desc: 'Bio, années, style…' },
      portfolio:    { title: 'Portfolio',          desc: 'Photos, Instagram, site…' },
      mobility:     { title: 'Zone & Mobilité',    desc: 'Zones, déplacements…' },
      availability: { title: 'Disponibilités',     desc: 'Périodes, calendrier…' },
      preferences:  { title: 'Préférences',        desc: 'Cuisines, langues…' },
      pricing:      { title: 'Tarifs',             desc: 'Positionnement & prix' },
    },
    sectionOk: 'OK',
    sectionTodo: 'À compléter',
    password: {
      label: 'Mot de passe',
      desc:
        'Après votre première connexion via lien magique, vous pouvez définir un mot de passe pour vous reconnecter plus facilement.',
      newLabel: 'Nouveau mot de passe',
      newPlaceholder: '8+ caractères',
      confirmLabel: 'Confirmer',
      confirmPlaceholder: 'Répéter',
      tooShort: 'Mot de passe trop court (8+ caractères).',
      mismatch: 'Les mots de passe ne correspondent pas.',
      success: '✅ Mot de passe mis à jour.',
      error: 'Erreur lors de la mise à jour.',
      cta: 'Mettre à jour le mot de passe',
      ctaLoading: 'Mise à jour…',
    },
    footerNote:
      'Note : pendant le lancement, Chef Talents se réserve le droit de prioriser les profils complets et réactifs (réponse rapide).',
  },
  auth: {
    sectionLabel: 'Espace Chef',
    loginTitle: 'Connexion',
    emailLabel: 'Email',
    emailPlaceholder: 'ex : chef@exemple.com',
    passwordLabel: 'Mot de passe',
    passwordPlaceholder: 'Votre mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    loginCta: 'Se connecter',
    loginLoading: 'Connexion…',
    noAccount: 'Pas encore de compte ?',
    createAccountLink: 'Créer un compte',
    errEmailMissing: 'Veuillez entrer un email.',
    errPasswordMissing: 'Veuillez entrer votre mot de passe.',
    errSessionMissing: 'Session non créée.',
    errLogin: 'Erreur de connexion.',

    signupSidebarLabel: 'Chef Talents • Accès privé',
    signupSidebarTitle: 'Un réseau discret,\nDes missions premium.',
    signupSidebarDesc:
      'Villas, résidences et yachts. Matching selon vos disponibilités, demandes qualifiées.',
    signupBenefit1: 'Accès aux missions au cas par cas',
    signupBenefit2: 'Profil non public • données protégées',
    signupBenefit3: 'Inscription en 2 minutes (profil à compléter ensuite)',
    signupSidebarFooter: 'Ce lien est réservé aux chefs invités.',
    signupCandidateLabel: 'Candidature Chef',
    signupTitle: 'Créer votre compte',
    signupSubtitle:
      'Créez votre accès, puis complétez votre profil depuis votre Dashboard.',
    firstNameLabel: 'Prénom',
    firstNamePlaceholder: 'ex : Jean',
    lastNameLabel: 'Nom',
    lastNamePlaceholder: 'ex : Dupont',
    emailSignupPlaceholder: 'ex : chef@domaine.com',
    passwordSignupPlaceholder: '8+ caractères',
    privateNote: '🔒 Accès privé • votre profil ne sera pas public.',
    errEmailMissingSignup: 'Email manquant.',
    errPasswordTooShort: 'Mot de passe : 8+ caractères.',
    errSignup: 'Erreur lors de la création du compte.',
    signupCta: 'Commencer mon inscription',
    haveAccount: 'J’ai déjà un compte',
    signupLegalNote:
      'En créant un compte, vous confirmez que ce lien vous a été partagé par Chef Talents.',

    forgotTitle: 'Mot de passe oublié',
    forgotDesc: 'Entrez votre email pour recevoir un lien de réinitialisation.',
    forgotEmailPlaceholder: 'email@exemple.com',
    forgotCta: 'Envoyer le lien',
    forgotSent: 'Si l’email existe, un lien vient d’être envoyé.',
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
  availability: {
    pageLabel: 'Schedule',
    pageTitle: 'Availability',
    dateLocale: 'en-US',
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableNowLabel: 'Available now',
    availableNowDesc: 'Enable if you can accept a mission immediately.',
    nextAvailableLabel: 'Next available date',
    nextAvailableHint: 'Leave empty if flexible.',
    preferredPeriodsLabel: 'Preferred periods',
    periods: {
      weekdays: 'Weekdays',
      weekends: 'Weekends',
      evenings: 'Evenings',
      season_winter: 'Winter season',
      season_summer: 'Summer season',
    },
    calendarHelp1:
      'By default you are considered {available}. Click a date to mark it as {unavailable}.',
    calendarHelpAvailable: 'available',
    calendarHelpUnavailable: 'unavailable',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    backToToday: 'Back to today',
    todayBadge: 'Today',
    available: 'Available',
    unavailable: 'Unavailable',
    saved: 'Saved ✅',
  },
  preferences: {
    pageLabel: 'Preferences',
    pageTitle: 'Matching',
    missionTypesLabel: 'Desired mission types',
    missionTypes: {
      one_shot: 'One-off (lunch / dinner)',
      residence: 'Residence (villa / chalet)',
      yacht: 'Yacht',
      event_catering: 'Event / catering',
    },
    selected: 'Selected',
    clickToSelect: 'Click',
    missionTypesEmpty: 'Pick what you want to receive (used for matching).',
    cuisinesLabel: 'Cuisines (min. 1)',
    cuisinesPreset: [
      'French', 'Italian', 'Japanese', 'Mediterranean',
      'Asian', 'Vegetarian', 'Healthy', 'Fusion',
    ],
    addCuisinePlaceholder: 'Add a cuisine…',
    languagesLabel: 'Languages (min. 1)',
    languagesPreset: ['French', 'English', 'Spanish', 'Italian', 'German', 'Arabic'],
    addLanguagePlaceholder: 'Add a language…',
    specialtiesLabel: 'Specialties (optional)',
    specialtiesPreset: [
      'Fine dining', 'Family style', 'Brunch', 'Private villa',
      'Yacht', 'Chalet', 'Event / catering', 'Tasting menu',
    ],
    addSpecialtyPlaceholder: 'Add a specialty…',
    addCta: 'Add',
    checklistLabel: 'Checklist:',
    checklistOk: 'OK ✅',
    checklistMissing: 'Need 1 mission + 1 cuisine + 1 language',
    saved: 'Saved ✅',
    saveError: 'Save error (check console)',
  },
  pricing: {
    pageLabel: 'Rates',
    pageTitle: 'Positioning & Pricing',
    positionLabel: 'Your positioning',
    tierHelp: 'This positions your offer (not a rating).',
    tiers: {
      essential: { title: 'Essential', subtitle: 'Private lunches/dinners, families, small groups' },
      premium:   { title: 'Premium',   subtitle: 'Villas, concierges, refined experiences' },
      luxury:    { title: 'Luxury',    subtitle: 'Chalets, yachts, UHNW, high standards' },
      ultra:     { title: 'Ultra',     subtitle: 'Long residences, yachts >40m, brigade option' },
    },
    suggestionsTitle: 'Suggestions ({tier})',
    suggestionsBaseMarket:
      'Market base: Residence {rmin}–{rmax} €/day • Events {emin}–{emax} €/pp',
    suggestionsAdjustment: 'Options adjustment: x{m}',
    applySuggestions: 'Apply suggestions',
    resetCta: 'Reset',
    modeSimple: 'Simple mode',
    modeTarget: 'Income target',
    targetNetLabel: 'Target net / day (€)',
    targetNetPlaceholder: 'e.g. 600',
    estimatedCostsLabel: 'Estimated costs / day (€)',
    estimatedCostsPlaceholder: 'e.g. 120',
    suggestedRateLabel: 'Suggested rate',
    suggestedRateUnit: '€/day',
    applyToDailyCta: 'Apply to daily rate',
    indicativeNote: '*Indicative. Helps matching and gives clarity to concierges/clients.',
    residenceLabel: 'Private residence',
    dailyRateLabel: 'Daily rate (€/day)',
    dailyRatePlaceholder: 'e.g. 500',
    dailyRateHint: 'Set your base, excluding ingredient purchases if needed.',
    chooseTierFirst: 'Choose a positioning to see market reference.',
    rangeEmpty: 'Not set',
    rangeLow: 'Low side (market: {min}–{max})',
    rangeHigh: 'High side (market: {min}–{max})',
    rangeOk: 'Within market ({min}–{max})',
    minDaysLabel: 'Minimum days (optional)',
    minDaysPlaceholder: 'e.g. 3',
    minDaysHint: 'E.g. 2-day minimum for travel.',
    eventLabel: 'Events',
    eventPriceLabel: 'Price per person (€/pp)',
    eventPricePlaceholder: 'e.g. 120',
    minGuestsLabel: 'Minimum guests (optional)',
    minGuestsPlaceholder: 'e.g. 12',
    eventEmpty: "If you don't do events, leave empty.",
    flagsLabel: 'Options',
    flags: {
      highSeason: 'High season',
      international: 'International',
      yacht: 'Yacht',
      brigade: 'Brigade option',
    },
    summaryLabel: 'Summary (visible to concierge)',
    summaryTier: 'Tier: {tier}',
    summaryResidence: 'Residence',
    summaryEvent: 'Events',
    summaryDailyUnit: '€/day',
    summaryPerPersonUnit: '€/pp',
    summaryMinDays: 'min {n} days',
    summaryMinGuests: 'min {n} guests',
  },
  missions: {
    pageLabel: 'Operations',
    pageTitle: 'Your missions',
    bannerSeason: 'Summer 2026',
    bannerHeadline: 'Missions opening — Ibiza, Saint-Tropez, Mykonos',
    bannerDesc:
      'Complete your profile to be matched with incoming requests. The most complete profiles get placed first.',
    completeProfile: 'Complete profile',
    refresh: 'Refresh',
    tabs: { proposals: 'Proposals', active: 'Active', history: 'History' },
    cardYourFee: 'Your fee',
    cardGuests: '{n} guests',
    cardAccept: 'Accept',
    cardDecline: 'Decline',
    cardViewContract: 'View contract',
    cardContactClient: 'Contact client',
    waMessage:
      "Hello, I'm your private chef via Chefs Talents for the mission on {date} in {location}. Please let me know if you have any questions.",
    status: {
      offered: 'Proposal',
      accepted: 'Accepted',
      confirmed: 'Confirmed',
      completed: 'Completed',
      declined: 'Declined',
      cancelled: 'Cancelled',
    },
    emptyOffered: 'No mission proposals yet.',
    emptyActive: 'No active or upcoming missions.',
    emptyHistory: 'No history yet.',
  },
  earnings: {
    pageLabel: 'Performance',
    pageTitle: 'Earnings & Activity',
    kpis: {
      totalLabel: 'Total revenue',
      totalDesc: 'Completed missions',
      last30Label: 'Last 30 days',
      last30Desc: 'Rolling revenue',
      missionsLabel: 'Missions',
      missionsDesc: 'Completed',
      averageLabel: 'Average ticket',
      averageDesc: 'Per mission',
    },
    detailsTitle: 'Revenue details',
    tableDate: 'Date',
    tableMission: 'Mission',
    tableLocation: 'Location',
    tableAmount: 'Amount',
    empty: 'No revenue data available.',
  },
  settings: {
    pageLabel: 'Settings',
    pageTitle: 'Your Chef profile',
    subtitle:
      'Platform launching: missions are coming soon. A complete profile gives you priority during matching.',
    launchStatus: 'Launch status',
    tier: {
      priorityMax: 'MAX priority',
      priority: 'Priority',
      progress: 'In progress',
      todo: 'To complete',
    },
    founderPill: 'Founding Chef',
    completionLabel: 'Profile completion: {pct}% ({ok}/{total})',
    completionRule:
      'Simple rule: the more complete your profile, the higher you rank on requests (fast & standard).',
    saveCta: 'Save',
    saved: 'Saved ✅',
    saveError: 'Save error',
    founderSectionTitle: 'Founding Chef',
    founderSectionDesc:
      'Badge reserved for early chefs: enhanced visibility at launch + priority access to first missions.',
    founderActivated: 'Activated',
    founderActivateCta: 'Activate',
    founderConditionMet: '✅ OK',
    founderConditionUnmet: 'Complete 2–3 more sections.',
    checklistTitle: 'Checklist (Priority)',
    checklistSubtitle: 'Reach 70% to gain priority.',
    checklistOk: 'OK',
    checklistOpen: 'Open →',
    items: {
      identity:    { label: 'Identity',          hint: 'Name, phone, city…' },
      experience:  { label: 'Experience',        hint: 'Bio + experience' },
      portfolio:   { label: 'Portfolio',         hint: '5 photos minimum ({n}/{min})' },
      mobility:    { label: 'Area & mobility',   hint: 'Zones, travel' },
      pricing:     { label: 'Rates',             hint: 'Per day or per person' },
      availability:{ label: 'Availability',      hint: 'Calendar, periods' },
      preferences: { label: 'Preferences',       hint: 'Cuisines, languages…' },
    },
    hubTitle: 'Manage your profile',
    hubSubtitle:
      'Information is filled in dedicated pages (Identity, Experience, Portfolio…). Here we centralise everything.',
    hubProfileLabel: 'Profile',
    hubAdvice: 'Tip: aim for 70%+ to get priority when missions open.',
    sections: {
      identity:     { title: 'Identity',          desc: 'Name, phone, city…' },
      experience:   { title: 'Experience',        desc: 'Bio, years, style…' },
      portfolio:    { title: 'Portfolio',         desc: 'Photos, Instagram, website…' },
      mobility:     { title: 'Area & Mobility',   desc: 'Zones, travel…' },
      availability: { title: 'Availability',      desc: 'Periods, calendar…' },
      preferences:  { title: 'Preferences',       desc: 'Cuisines, languages…' },
      pricing:      { title: 'Rates',             desc: 'Positioning & pricing' },
    },
    sectionOk: 'OK',
    sectionTodo: 'To complete',
    password: {
      label: 'Password',
      desc:
        'After your first magic-link login, you can set a password for easier future logins.',
      newLabel: 'New password',
      newPlaceholder: '8+ characters',
      confirmLabel: 'Confirm',
      confirmPlaceholder: 'Repeat',
      tooShort: 'Password too short (8+ characters).',
      mismatch: 'Passwords do not match.',
      success: '✅ Password updated.',
      error: 'Error during update.',
      cta: 'Update password',
      ctaLoading: 'Updating…',
    },
    footerNote:
      'Note: during launch, Chef Talents reserves the right to prioritise complete and responsive profiles (fast reply).',
  },
  auth: {
    sectionLabel: 'Chef Portal',
    loginTitle: 'Sign in',
    emailLabel: 'Email',
    emailPlaceholder: 'e.g. chef@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Your password',
    forgotPassword: 'Forgot your password?',
    loginCta: 'Sign in',
    loginLoading: 'Signing in…',
    noAccount: 'No account yet?',
    createAccountLink: 'Create an account',
    errEmailMissing: 'Please enter an email.',
    errPasswordMissing: 'Please enter your password.',
    errSessionMissing: 'Session not created.',
    errLogin: 'Login error.',

    signupSidebarLabel: 'Chef Talents • Private access',
    signupSidebarTitle: 'A discreet network,\npremium missions.',
    signupSidebarDesc:
      'Villas, residences and yachts. Matching based on your availability, qualified requests.',
    signupBenefit1: 'Mission access on a case-by-case basis',
    signupBenefit2: 'Non-public profile • protected data',
    signupBenefit3: 'Sign up in 2 minutes (complete your profile afterwards)',
    signupSidebarFooter: 'This link is reserved for invited chefs.',
    signupCandidateLabel: 'Chef application',
    signupTitle: 'Create your account',
    signupSubtitle:
      'Create your access, then complete your profile from your Dashboard.',
    firstNameLabel: 'First name',
    firstNamePlaceholder: 'e.g. John',
    lastNameLabel: 'Last name',
    lastNamePlaceholder: 'e.g. Smith',
    emailSignupPlaceholder: 'e.g. chef@domain.com',
    passwordSignupPlaceholder: '8+ characters',
    privateNote: '🔒 Private access • your profile will not be public.',
    errEmailMissingSignup: 'Missing email.',
    errPasswordTooShort: 'Password: 8+ characters.',
    errSignup: 'Error creating the account.',
    signupCta: 'Start my registration',
    haveAccount: 'I already have an account',
    signupLegalNote:
      'By creating an account, you confirm this link was shared with you by Chef Talents.',

    forgotTitle: 'Forgot your password',
    forgotDesc: 'Enter your email to receive a reset link.',
    forgotEmailPlaceholder: 'email@example.com',
    forgotCta: 'Send the link',
    forgotSent: 'If the email exists, a link has just been sent.',
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
  availability: {
    pageLabel: 'Calendario',
    pageTitle: 'Disponibilidad',
    dateLocale: 'es-ES',
    weekdays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    availableNowLabel: 'Disponible ahora',
    availableNowDesc: 'Activa si puedes aceptar una misión inmediatamente.',
    nextAvailableLabel: 'Próxima disponibilidad',
    nextAvailableHint: 'Deja vacío si eres flexible.',
    preferredPeriodsLabel: 'Periodos preferidos',
    periods: {
      weekdays: 'Entre semana',
      weekends: 'Fines de semana',
      evenings: 'Noches',
      season_winter: 'Temporada invierno',
      season_summer: 'Temporada verano',
    },
    calendarHelp1:
      'Por defecto, eres considerado {available}. Haz clic en una fecha para marcarla como {unavailable}.',
    calendarHelpAvailable: 'disponible',
    calendarHelpUnavailable: 'no disponible',
    prevMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    backToToday: 'Volver a hoy',
    todayBadge: 'Hoy',
    available: 'Disponible',
    unavailable: 'No disponible',
    saved: 'Guardado ✅',
  },
  preferences: {
    pageLabel: 'Preferencias',
    pageTitle: 'Matching',
    missionTypesLabel: 'Tipos de misión deseados',
    missionTypes: {
      one_shot: 'Puntual (almuerzo / cena)',
      residence: 'Residencia (villa / chalet)',
      yacht: 'Yate',
      event_catering: 'Evento / catering',
    },
    selected: 'Seleccionado',
    clickToSelect: 'Haz clic',
    missionTypesEmpty: 'Elige lo que quieres recibir (usado para el matching).',
    cuisinesLabel: 'Cocinas (mín. 1)',
    cuisinesPreset: [
      'Francesa', 'Italiana', 'Japonesa', 'Mediterránea',
      'Asiática', 'Vegetariana', 'Healthy', 'Fusión',
    ],
    addCuisinePlaceholder: 'Añadir una cocina…',
    languagesLabel: 'Idiomas (mín. 1)',
    languagesPreset: ['Francés', 'Inglés', 'Español', 'Italiano', 'Alemán', 'Árabe'],
    addLanguagePlaceholder: 'Añadir un idioma…',
    specialtiesLabel: 'Especialidades (opcional)',
    specialtiesPreset: [
      'Fine dining', 'Family style', 'Brunch', 'Villa privada',
      'Yate', 'Chalet', 'Evento / catering', 'Menú degustación',
    ],
    addSpecialtyPlaceholder: 'Añadir una especialidad…',
    addCta: 'Añadir',
    checklistLabel: 'Lista:',
    checklistOk: 'OK ✅',
    checklistMissing: 'Necesitas 1 misión + 1 cocina + 1 idioma',
    saved: 'Guardado ✅',
    saveError: 'Error al guardar (revisa la consola)',
  },
  pricing: {
    pageLabel: 'Tarifas',
    pageTitle: 'Posicionamiento y Precios',
    positionLabel: 'Su posicionamiento',
    tierHelp: 'Esta elección sirve para posicionar su oferta (no para calificarle).',
    tiers: {
      essential: { title: 'Essential', subtitle: 'Almuerzos / cenas privadas, familias, grupos pequeños' },
      premium:   { title: 'Premium',   subtitle: 'Villas, conciergeries, experiencias cuidadas' },
      luxury:    { title: 'Luxury',    subtitle: 'Chalets, yates, UHNW, altas exigencias' },
      ultra:     { title: 'Ultra',     subtitle: 'Residencias largas, yates >40m, brigada posible' },
    },
    suggestionsTitle: 'Sugerencias ({tier})',
    suggestionsBaseMarket:
      'Base de mercado: Residencia {rmin}–{rmax} €/día • Eventos {emin}–{emax} €/pers',
    suggestionsAdjustment: 'Ajuste de opciones: x{m}',
    applySuggestions: 'Aplicar sugerencias',
    resetCta: 'Restablecer',
    modeSimple: 'Modo simple',
    modeTarget: 'Objetivo de ingresos',
    targetNetLabel: 'Objetivo neto / día (€)',
    targetNetPlaceholder: 'ej.: 600',
    estimatedCostsLabel: 'Costos estimados / día (€)',
    estimatedCostsPlaceholder: 'ej.: 120',
    suggestedRateLabel: 'Tarifa sugerida',
    suggestedRateUnit: '€/día',
    applyToDailyCta: 'Aplicar a la tarifa diaria',
    indicativeNote: '*Indicativo. Ayuda al matching y aclara la oferta para conciergeries/clientes.',
    residenceLabel: 'Residencia privada',
    dailyRateLabel: 'Tarifa diaria (€/día)',
    dailyRatePlaceholder: 'ej.: 500',
    dailyRateHint: 'Indique su base sin compras de materia prima si es necesario.',
    chooseTierFirst: 'Elija un posicionamiento para ver la referencia de mercado.',
    rangeEmpty: 'Sin indicar',
    rangeLow: 'Más bien bajo (mercado: {min}–{max})',
    rangeHigh: 'Más bien alto (mercado: {min}–{max})',
    rangeOk: 'Dentro del mercado ({min}–{max})',
    minDaysLabel: 'Mínimo de días (opcional)',
    minDaysPlaceholder: 'ej.: 3',
    minDaysHint: 'Ej.: 2 días mínimo por desplazamiento.',
    eventLabel: 'Eventos',
    eventPriceLabel: 'Precio por persona (€/pers)',
    eventPricePlaceholder: 'ej.: 120',
    minGuestsLabel: 'Mínimo de invitados (opcional)',
    minGuestsPlaceholder: 'ej.: 12',
    eventEmpty: 'Si no hace eventos, deje vacío.',
    flagsLabel: 'Opciones',
    flags: {
      highSeason: 'Temporada alta',
      international: 'Internacional',
      yacht: 'Yate',
      brigade: 'Brigada posible',
    },
    summaryLabel: 'Resumen (visible para conciergerie)',
    summaryTier: 'Tier: {tier}',
    summaryResidence: 'Residencia',
    summaryEvent: 'Eventos',
    summaryDailyUnit: '€/día',
    summaryPerPersonUnit: '€/pers',
    summaryMinDays: 'mín. {n} días',
    summaryMinGuests: 'mín. {n} invitados',
  },
  missions: {
    pageLabel: 'Operaciones',
    pageTitle: 'Sus misiones',
    bannerSeason: 'Verano 2026',
    bannerHeadline: 'Misiones abiertas — Ibiza, Saint-Tropez, Mykonos',
    bannerDesc:
      'Complete su perfil para ser propuesto a las solicitudes de clientes. Los perfiles más completos pasan primero.',
    completeProfile: 'Completar el perfil',
    refresh: 'Actualizar',
    tabs: { proposals: 'Propuestas', active: 'En curso', history: 'Historial' },
    cardYourFee: 'Su remuneración',
    cardGuests: '{n} invitados',
    cardAccept: 'Aceptar',
    cardDecline: 'Rechazar',
    cardViewContract: 'Ver el contrato',
    cardContactClient: 'Contactar al cliente',
    waMessage:
      'Hola, soy su chef privado a través de Chefs Talents para la misión del {date} en {location}. Avíseme si tiene preguntas.',
    status: {
      offered: 'Propuesta',
      accepted: 'Aceptada',
      confirmed: 'Confirmada',
      completed: 'Completada',
      declined: 'Rechazada',
      cancelled: 'Cancelada',
    },
    emptyOffered: 'Aún no hay propuestas de misión.',
    emptyActive: 'No hay misiones activas o próximas.',
    emptyHistory: 'Aún no hay historial.',
  },
  earnings: {
    pageLabel: 'Rendimiento',
    pageTitle: 'Ingresos y Actividad',
    kpis: {
      totalLabel: 'Facturación total',
      totalDesc: 'Misiones realizadas',
      last30Label: 'Últimos 30 días',
      last30Desc: 'Ingresos móviles',
      missionsLabel: 'Misiones',
      missionsDesc: 'Completadas',
      averageLabel: 'Ticket medio',
      averageDesc: 'Por misión',
    },
    detailsTitle: 'Detalle de ingresos',
    tableDate: 'Fecha',
    tableMission: 'Misión',
    tableLocation: 'Lugar',
    tableAmount: 'Importe',
    empty: 'No hay datos de ingresos disponibles.',
  },
  settings: {
    pageLabel: 'Ajustes',
    pageTitle: 'Su perfil Chef',
    subtitle:
      'Plataforma en lanzamiento: las misiones llegan pronto. Completar su perfil le da prioridad en el matching.',
    launchStatus: 'Estado del lanzamiento',
    tier: {
      priorityMax: 'Prioridad MÁX',
      priority: 'Prioritario',
      progress: 'En progreso',
      todo: 'Por completar',
    },
    founderPill: 'Chef Fundador',
    completionLabel: 'Perfil completado: {pct}% ({ok}/{total})',
    completionRule:
      'Regla simple: cuanto más completo el perfil, más alto en las solicitudes (fast & standard).',
    saveCta: 'Guardar',
    saved: 'Guardado ✅',
    saveError: 'Error al guardar',
    founderSectionTitle: 'Chef Fundador',
    founderSectionDesc:
      'Insignia reservada a los primeros chefs: visibilidad reforzada al lanzamiento + acceso prioritario a las primeras misiones.',
    founderActivated: 'Activado',
    founderActivateCta: 'Activar',
    founderConditionMet: '✅ OK',
    founderConditionUnmet: 'Completa 2–3 secciones más.',
    checklistTitle: 'Lista (Prioridad)',
    checklistSubtitle: 'Alcanza 70% para tener prioridad.',
    checklistOk: 'OK',
    checklistOpen: 'Abrir →',
    items: {
      identity:    { label: 'Identidad',         hint: 'Nombre, teléfono, ciudad…' },
      experience:  { label: 'Experiencia',       hint: 'Bio + experiencia' },
      portfolio:   { label: 'Portafolio',        hint: '5 fotos mínimo ({n}/{min})' },
      mobility:    { label: 'Zona y movilidad',  hint: 'Zonas, desplazamientos' },
      pricing:     { label: 'Tarifas',           hint: 'Precio / día o precio / persona' },
      availability:{ label: 'Disponibilidad',    hint: 'Calendario, periodos' },
      preferences: { label: 'Preferencias',      hint: 'Cocinas, idiomas…' },
    },
    hubTitle: 'Gestionar su perfil',
    hubSubtitle:
      'La información se rellena en las páginas dedicadas (Identidad, Experiencia, Portafolio…). Aquí se centraliza todo.',
    hubProfileLabel: 'Perfil',
    hubAdvice:
      'Consejo: apunte al 70%+ para tener prioridad en cuanto se abran las misiones.',
    sections: {
      identity:     { title: 'Identidad',          desc: 'Nombre, teléfono, ciudad…' },
      experience:   { title: 'Experiencia',        desc: 'Bio, años, estilo…' },
      portfolio:    { title: 'Portafolio',         desc: 'Fotos, Instagram, sitio…' },
      mobility:     { title: 'Zona y Movilidad',   desc: 'Zonas, desplazamientos…' },
      availability: { title: 'Disponibilidad',     desc: 'Periodos, calendario…' },
      preferences:  { title: 'Preferencias',       desc: 'Cocinas, idiomas…' },
      pricing:      { title: 'Tarifas',            desc: 'Posicionamiento y precio' },
    },
    sectionOk: 'OK',
    sectionTodo: 'Por completar',
    password: {
      label: 'Contraseña',
      desc:
        'Tras su primer inicio de sesión por enlace mágico, puede definir una contraseña para reconectarse más fácilmente.',
      newLabel: 'Nueva contraseña',
      newPlaceholder: '8+ caracteres',
      confirmLabel: 'Confirmar',
      confirmPlaceholder: 'Repetir',
      tooShort: 'Contraseña demasiado corta (8+ caracteres).',
      mismatch: 'Las contraseñas no coinciden.',
      success: '✅ Contraseña actualizada.',
      error: 'Error en la actualización.',
      cta: 'Actualizar contraseña',
      ctaLoading: 'Actualizando…',
    },
    footerNote:
      'Nota: durante el lanzamiento, Chef Talents se reserva el derecho de priorizar perfiles completos y reactivos (respuesta rápida).',
  },
  auth: {
    sectionLabel: 'Portal Chef',
    loginTitle: 'Iniciar sesión',
    emailLabel: 'Email',
    emailPlaceholder: 'ej.: chef@ejemplo.com',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Su contraseña',
    forgotPassword: '¿Olvidó su contraseña?',
    loginCta: 'Iniciar sesión',
    loginLoading: 'Iniciando sesión…',
    noAccount: '¿Aún no tiene cuenta?',
    createAccountLink: 'Crear una cuenta',
    errEmailMissing: 'Introduzca un email.',
    errPasswordMissing: 'Introduzca su contraseña.',
    errSessionMissing: 'Sesión no creada.',
    errLogin: 'Error de conexión.',

    signupSidebarLabel: 'Chef Talents • Acceso privado',
    signupSidebarTitle: 'Una red discreta,\nmisiones premium.',
    signupSidebarDesc:
      'Villas, residencias y yates. Matching según su disponibilidad, solicitudes cualificadas.',
    signupBenefit1: 'Acceso a misiones caso por caso',
    signupBenefit2: 'Perfil no público • datos protegidos',
    signupBenefit3: 'Registro en 2 minutos (perfil a completar después)',
    signupSidebarFooter: 'Este enlace está reservado a chefs invitados.',
    signupCandidateLabel: 'Candidatura Chef',
    signupTitle: 'Crear su cuenta',
    signupSubtitle:
      'Cree su acceso, después complete su perfil desde su Panel.',
    firstNameLabel: 'Nombre',
    firstNamePlaceholder: 'ej.: Juan',
    lastNameLabel: 'Apellido',
    lastNamePlaceholder: 'ej.: García',
    emailSignupPlaceholder: 'ej.: chef@dominio.com',
    passwordSignupPlaceholder: '8+ caracteres',
    privateNote: '🔒 Acceso privado • su perfil no será público.',
    errEmailMissingSignup: 'Falta el email.',
    errPasswordTooShort: 'Contraseña: 8+ caracteres.',
    errSignup: 'Error al crear la cuenta.',
    signupCta: 'Comenzar mi registro',
    haveAccount: 'Ya tengo cuenta',
    signupLegalNote:
      'Al crear una cuenta, confirma que este enlace le fue compartido por Chef Talents.',

    forgotTitle: 'Contraseña olvidada',
    forgotDesc: 'Introduzca su email para recibir un enlace de restablecimiento.',
    forgotEmailPlaceholder: 'email@ejemplo.com',
    forgotCta: 'Enviar el enlace',
    forgotSent: 'Si el email existe, se acaba de enviar un enlace.',
  },
};

export const dictionaries: Record<Locale, Dictionary> = { fr, en, es };
