import { computeChefScore, type ChefProfile } from '@/lib/chefScore';

export type OnboardingAction = {
  key: string;
  title: string;
  route: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
};

export type OnboardingAgentResult = {
  shouldMessage: boolean;
  score: number;
  action?: OnboardingAction;
  message?: {
    body: string;
  };
};

/**
 * Règles globales anti-spam / anti-fuite
 */
const MIN_SCORE_TO_SILENCE = 85;
const MIN_SCORE_TO_SOFT_PUSH = 70;
const MAX_DAYS_BETWEEN_MESSAGES = 7;

/**
 * Actions possibles (catalogue)
 * ⚠️ L’agent NE crée PAS de règles → il traduit seulement
 */
const ACTIONS: Array<{
  match: (p: ChefProfile) => boolean;
  action: OnboardingAction;
}> = [
  {
    match: (p) => (p.images?.length ?? 0) < 5,
    action: {
      key: 'portfolio',
      title: 'Ajouter quelques photos de service',
      route: '/chef/portfolio',
      reason:
        'Les conciergeries se projettent beaucoup plus facilement avec des photos en situation réelle.',
      priority: 'high',
    },
  },
  {
    match: (p) => (p.bio?.length ?? 0) < 80,
    action: {
      key: 'bio',
      title: 'Enrichir la présentation',
      route: '/chef/identity',
      reason:
        'Une bio plus détaillée augmente la confiance et la perception premium.',
      priority: 'medium',
    },
  },
  {
    match: (p) => !(p.cuisines?.length && p.languages?.length),
    action: {
      key: 'preferences',
      title: 'Préciser cuisines & langues',
      route: '/chef/preferences',
      reason:
        'Cela facilite le matching rapide avec les demandes clients.',
      priority: 'medium',
    },
  },
  {
    match: (p) => !p.travelRadiusKm && !p.internationalMobility,
    action: {
      key: 'mobility',
      title: 'Clarifier la zone de déplacement',
      route: '/chef/mobility',
      reason:
        'Les clients ont besoin de savoir rapidement jusqu’où vous pouvez vous déplacer.',
      priority: 'low',
    },
  },
  {
    match: (p: any) =>
      !(
        p.pricing?.residence?.dailyRate ||
        p.pricing?.event?.pricePerPerson
      ),
    action: {
      key: 'pricing',
      title: 'Renseigner un tarif indicatif',
      route: '/chef/pricing',
      reason:
        'Un tarif, même indicatif, permet de déclencher plus de demandes.',
      priority: 'high',
    },
  },
];

/**
 * Génère le message humain (ton calme, premium, non pressant)
 */
function buildMessage(
  firstName: string | undefined,
  score: number,
  action: OnboardingAction
): string {
  const name = firstName ? ` ${firstName}` : '';

  return `Bonjour${name},

Ton profil est déjà bien positionné (${score}/100) 👍

Pour maximiser tes chances sur des missions premium, une amélioration possible :
👉 ${action.title}

${action.reason}

C’est optionnel, mais recommandé.

Belle journée,
Chef Talents`;
}

/**
 * AGENT PRINCIPAL
 */
export function onboardingAgent(params: {
  profile: ChefProfile;
  lastMessageAt?: string | null;
  status?: string;
  firstName?: string;
}): OnboardingAgentResult {
  const { profile, lastMessageAt, status, firstName } = params;

  const { score } = computeChefScore(profile);

  // 1️⃣ Conditions de silence absolu
  if (status === 'approved' || status === 'active') {
    return { shouldMessage: false, score };
  }

  if (score >= MIN_SCORE_TO_SILENCE) {
    return { shouldMessage: false, score };
  }

  if (lastMessageAt) {
    const last = new Date(lastMessageAt).getTime();
    const now = Date.now();
    const diffDays = (now - last) / (1000 * 60 * 60 * 24);
    if (diffDays < MAX_DAYS_BETWEEN_MESSAGES) {
      return { shouldMessage: false, score };
    }
  }

  // 2️⃣ Trouver UNE action pertinente
  const matched = ACTIONS.find((a) => a.match(profile));
  if (!matched) {
    return { shouldMessage: false, score };
  }

  // 3️⃣ Ralentir volontairement après 70
  if (score >= MIN_SCORE_TO_SOFT_PUSH && matched.action.priority === 'low') {
    return { shouldMessage: false, score };
  }

  // 4️⃣ Message final
  const message = buildMessage(firstName, score, matched.action);

  return {
    shouldMessage: true,
    score,
    action: matched.action,
    message: { body: message },
  };
}
