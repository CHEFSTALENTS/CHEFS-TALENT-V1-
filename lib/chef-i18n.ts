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
    cancel: string;
    submit: string;
    submitting: string;
    close: string;
    open: string;
    edit: string;
    complete: string;
    optional: string;
    required: string;
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
};

// ─────────────────────────────────────────────────────────────────────
// Dictionnaire FR
// ─────────────────────────────────────────────────────────────────────

const fr: Dictionary = {
  switcher: { ariaLabel: 'Changer de langue' },
  common: {
    loading: 'Chargement…',
    save: 'Enregistrer',
    cancel: 'Annuler',
    submit: 'Envoyer',
    submitting: 'Envoi…',
    close: 'Fermer',
    open: 'Ouvrir',
    edit: 'Modifier',
    complete: 'Compléter',
    optional: 'optionnel',
    required: 'requis',
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
};

// ─────────────────────────────────────────────────────────────────────
// Dictionnaire EN
// ─────────────────────────────────────────────────────────────────────

const en: Dictionary = {
  switcher: { ariaLabel: 'Change language' },
  common: {
    loading: 'Loading…',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    submitting: 'Sending…',
    close: 'Close',
    open: 'Open',
    edit: 'Edit',
    complete: 'Complete',
    optional: 'optional',
    required: 'required',
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
};

// ─────────────────────────────────────────────────────────────────────
// Dictionnaire ES
// ─────────────────────────────────────────────────────────────────────

const es: Dictionary = {
  switcher: { ariaLabel: 'Cambiar idioma' },
  common: {
    loading: 'Cargando…',
    save: 'Guardar',
    cancel: 'Cancelar',
    submit: 'Enviar',
    submitting: 'Enviando…',
    close: 'Cerrar',
    open: 'Abrir',
    edit: 'Editar',
    complete: 'Completar',
    optional: 'opcional',
    required: 'requerido',
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
};

export const dictionaries: Record<Locale, Dictionary> = { fr, en, es };
