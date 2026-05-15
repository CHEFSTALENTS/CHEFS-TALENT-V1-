// app/villa/_lib/copy.ts
//
// Copy partagé entre FR / EN / ES pour la landing /villa.
// Chaque langue a son propre objet avec exactement les mêmes clés,
// pour garantir qu'aucune n'oublie de string.

export type VillaCopy = {
  lang: 'fr' | 'en' | 'es';
  meta: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    sub: string;
    delay: string;
    ctaPrimary: string;
    ctaWhatsapp: string;
    whatsappPrefill: string;
    imageAlt: string;
  };
  stats: Array<{ value: string; label: string }>;
  forWho: {
    eyebrow: string;
    title: string;
    cards: Array<{ title: string; body: string }>;
  };
  imageBreak: {
    eyebrow: string;
    title: string;
    imageAlt: string;
  };
  orchestration: {
    eyebrow: string;
    titleLine1: string;
    titleAccent: string;
    p1: string;
    p2: string;
  };
  gallery: {
    eyebrow: string;
    title: string;
    items: Array<{ src: string; alt: string; label: string }>;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: Array<{ quote: string; author: string; role: string }>;
  };
  confidentiality: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    p1: string;
    p2: string;
  };
  method: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    steps: Array<{ number: string; title: string; text: string }>;
  };
  faq: {
    eyebrow: string;
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  ctaFinal: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    sub: string;
    ctaPrimary: string;
    ctaWhatsapp: string;
    footnote: string;
  };
};

const COMMON_GALLERY = [
  {
    src: '/images/editorial/IMG_1622.jpg',
    altKey: 'gallery1',
  },
  {
    src: '/images/editorial/IMG_1624.jpg',
    altKey: 'gallery2',
  },
  {
    src: '/images/editorial/IMG_1620.jpg',
    altKey: 'gallery3',
  },
  {
    src: '/images/editorial/IMG_1625.jpg',
    altKey: 'gallery4',
  },
];

// ─────────────────────────────────────────────────────────────
// FR
// ─────────────────────────────────────────────────────────────
export const frCopy: VillaCopy = {
  lang: 'fr',
  meta: {
    title: 'Chef privé pour villas, yachts et résidences — Chefs Talents',
    description:
      "Chef privé pour villas, yachts et résidences. D'un dîner à toute la saison. Réponse sous 6 à 24h, partout en Europe.",
  },
  hero: {
    eyebrow: 'Chefs Talents',
    titleLine1: 'Chefs privés pour vos villas,',
    titleLine2: 'yachts et résidences.',
    sub: "D'un dîner à toute la saison. Une orchestration sans friction, partout en Europe.",
    delay: 'Réponse sous 6 à 24h.',
    ctaPrimary: 'Décrire mon projet',
    ctaWhatsapp: 'WhatsApp — Thomas',
    whatsappPrefill: "Bonjour Thomas, j'ai un projet de chef privé.",
    imageAlt: 'Table dressée bord de piscine vue mer Méditerranée',
  },
  stats: [
    { value: '400', label: 'chefs' },
    { value: '400', label: 'missions' },
    { value: '50', label: 'destinations' },
    { value: '6-24h', label: 'délai' },
  ],
  forWho: {
    eyebrow: 'Pour qui',
    title: 'Trois profils, un même standard.',
    cards: [
      {
        title: 'Propriétaires et locataires de villas',
        body: "Saison estivale, long stay ou séjour court. Côte d'Azur, Ibiza, Mykonos, Sardaigne. Nos chefs s'installent chez vous le temps qu'il faut.",
      },
      {
        title: 'Yacht charters',
        body: 'Chefs habitués au yachting privé, expérience galley en mer, gestion logistique de bord. Mobilité internationale.',
      },
      {
        title: 'Conciergeries et house managers',
        body: 'Un interlocuteur dédié, un réseau exclusif, une fiabilité que vos clients vous reconnaîtront.',
      },
    ],
  },
  imageBreak: {
    eyebrow: 'Exécution',
    title: "Une présence discrète, une exécution constante, un niveau de service tenu.",
    imageAlt: 'Villa contemporaine avec piscine, vue collines et mer Méditerranée',
  },
  orchestration: {
    eyebrow: 'Orchestration',
    titleLine1: "Plus qu'une mise en relation.",
    titleAccent: 'Une orchestration.',
    p1: 'Nous ne livrons pas un chef : nous cadrons une mission. Qualification du besoin, sélection ciblée parmi 400 profils, coordination du brief, anticipation des imprévus.',
    p2: "Notre rôle n'est pas de servir. Il est de faire en sorte que rien ne dépasse, et que tout soit juste.",
  },
  gallery: {
    eyebrow: 'Décors',
    title: 'Là où nos chefs interviennent.',
    items: [
      {
        src: COMMON_GALLERY[0].src,
        alt: 'Terrasse de villa avec vue infinity sur la Méditerranée',
        label: 'Villa Méditerranée',
      },
      {
        src: COMMON_GALLERY[1].src,
        alt: "Table dressée à bord d'un yacht au mouillage",
        label: 'Yacht charter',
      },
      {
        src: COMMON_GALLERY[2].src,
        alt: "Table d'hôtes en extérieur au coucher de soleil",
        label: 'Dîner privé',
      },
      {
        src: COMMON_GALLERY[3].src,
        alt: "Service à bord d'un yacht en baie de Monaco",
        label: 'Service en mer',
      },
    ],
  },
  testimonials: {
    eyebrow: 'Témoignages',
    title: 'Ce que nos clients en disent.',
    items: [
      {
        quote: "Réactivité, qualité, discrétion. Exactement ce dont nous avions besoin pour nos clients de l'été.",
        author: 'Selma R.',
        role: 'Villa Manager, Cap Ferrat',
      },
      {
        quote: 'Chef proposé sous 6h, installé chez nous dans la semaine. Le séjour entier en a été transformé.',
        author: 'Alexandre P.',
        role: 'Locataire saison, Saint-Tropez',
      },
      {
        quote: 'Un partenaire fiable pour des demandes complexes. Discrétion totale, ce qui est non-négociable pour nous.',
        author: 'Constance L.',
        role: 'Conciergerie, Monaco',
      },
      {
        quote: "Le chef a tenu trois services par jour pendant deux semaines, sans une fausse note. Brigade en tête.",
        author: 'Karim B.',
        role: 'Charter manager, Antibes',
      },
      {
        quote: "Ils ont compris notre brief en cinq minutes au téléphone. Le profil envoyé matchait à 100 %.",
        author: 'Élise V.',
        role: 'Famille UHNW, Ibiza',
      },
      {
        quote: "Chef trouvé un week-end, en pleine saison. Personne d'autre n'aurait pu nous sortir de là.",
        author: 'Henri D.',
        role: 'Owner villa, Saint-Jean-Cap-Ferrat',
      },
      {
        quote: "Coordination impeccable avec notre house manager. Le chef s'est intégré comme s'il était là depuis toujours.",
        author: 'Béatrice M.',
        role: 'Conciergerie privée, Genève',
      },
    ],
  },
  confidentiality: {
    eyebrow: 'Confidentialité',
    titleLine1: 'La discrétion',
    titleLine2: "n'est pas une option.",
    p1: 'Nos chefs interviennent dans les villas, chalets, yachts et résidences privées à travers l\'Europe. Les lieux, les clients et les missions ne sont jamais rendus publics.',
    p2: 'Les références sont partagées de manière sélective. La confidentialité fait partie intégrante de notre manière de travailler.',
  },
  method: {
    eyebrow: 'Méthode',
    titleLine1: 'Une demande simple.',
    titleLine2: 'Un traitement structuré.',
    steps: [
      {
        number: '01',
        title: 'Qualification',
        text: 'Nous analysons le lieu, les dates, le niveau de service, le format de mission et le budget indicatif.',
      },
      {
        number: '02',
        title: 'Sélection',
        text: "Nous identifions les profils les plus pertinents selon la mission, l'environnement et les exigences exprimées.",
      },
      {
        number: '03',
        title: 'Coordination',
        text: 'Une fois le profil validé, nous cadrons la mission et restons le point de contact pour son bon déroulement.',
      },
    ],
  },
  faq: {
    eyebrow: 'Questions fréquentes',
    title: 'Avant de demander.',
    items: [
      {
        question: 'À partir de quelle durée acceptez-vous une mission ?',
        answer:
          "Nous acceptons les missions à partir de 3 jours. Notre savoir-faire prend tout son sens sur les séjours longs, d'une semaine à plusieurs mois.",
      },
      {
        question: 'Quels sont les ordres de grandeur tarifaires ?',
        answer:
          "Une prestation chef privé démarre à partir de 2 500 € par semaine selon le profil et le format. Les missions longue durée et yacht font l'objet d'une négociation dédiée.",
      },
      {
        question: 'Travaillez-vous avec les conciergeries ?',
        answer:
          'Oui. Nous avons un accès partenaire dédié, avec une grille adaptée et une priorité de traitement pour les conciergeries et house managers.',
      },
      {
        question: "Que se passe-t-il en cas d'imprévu (annulation, indisponibilité) ?",
        answer:
          'Nous prévoyons systématiquement un profil de remplacement pré-validé pour les missions longues. La continuité opérationnelle est notre engagement.',
      },
      {
        question: "Qui s'occupe des courses et de la logistique ?",
        answer:
          "Le chef gère intégralement le sourcing (marchés, producteurs locaux, livraisons spéciales). Vous n'avez rien à coordonner.",
      },
      {
        question: 'Comment garantissez-vous la confidentialité ?',
        answer:
          "Aucune référence n'est rendue publique. Les chefs sont contractualisés avec clause de confidentialité. La discrétion fait partie des critères de sélection.",
      },
    ],
  },
  ctaFinal: {
    eyebrow: 'Votre projet',
    titleLine1: 'Décrivez votre projet.',
    titleLine2: 'Réponse sous 6 à 24h.',
    sub: 'Thomas, votre interlocuteur, vous recontacte avec une sélection ciblée selon votre brief.',
    ctaPrimary: 'Décrire mon projet',
    ctaWhatsapp: 'WhatsApp — Thomas',
    footnote: 'Sans engagement · Aucune réservation sans votre validation',
  },
};

// ─────────────────────────────────────────────────────────────
// EN
// ─────────────────────────────────────────────────────────────
export const enCopy: VillaCopy = {
  lang: 'en',
  meta: {
    title: 'Private chef for villas, yachts and residences — Chefs Talents',
    description:
      'Private chef for villas, yachts and residences. From a single dinner to a full season. Reply within 6 to 24h, anywhere in Europe.',
  },
  hero: {
    eyebrow: 'Chefs Talents',
    titleLine1: 'Private chefs for your villas,',
    titleLine2: 'yachts and residences.',
    sub: 'From a single dinner to a full season. A frictionless orchestration, anywhere in Europe.',
    delay: 'Reply within 6 to 24h.',
    ctaPrimary: 'Describe my project',
    ctaWhatsapp: 'WhatsApp — Thomas',
    whatsappPrefill: 'Hello Thomas, I have a private chef project.',
    imageAlt: 'Poolside table set with Mediterranean sea view',
  },
  stats: [
    { value: '400', label: 'chefs' },
    { value: '400', label: 'missions' },
    { value: '50', label: 'destinations' },
    { value: '6-24h', label: 'response' },
  ],
  forWho: {
    eyebrow: 'For who',
    title: 'Three profiles, one standard.',
    cards: [
      {
        title: 'Villa owners and renters',
        body: "Summer season, long stay or short break. French Riviera, Ibiza, Mykonos, Sardinia. Our chefs settle in for as long as you need.",
      },
      {
        title: 'Yacht charters',
        body: 'Chefs experienced in private yachting, galley operations at sea, onboard logistics. International mobility.',
      },
      {
        title: 'Concierges and house managers',
        body: 'A dedicated point of contact, an exclusive network, a reliability your clients will credit you for.',
      },
    ],
  },
  imageBreak: {
    eyebrow: 'Execution',
    title: 'A discreet presence, a constant execution, a service level held.',
    imageAlt: 'Contemporary villa with pool, hills and Mediterranean sea view',
  },
  orchestration: {
    eyebrow: 'Orchestration',
    titleLine1: 'More than a connection.',
    titleAccent: 'An orchestration.',
    p1: 'We do not deliver a chef: we frame a mission. Needs qualification, targeted selection from 400 profiles, brief coordination, anticipation of contingencies.',
    p2: 'Our role is not to serve. It is to make sure nothing goes off track, and that everything is right.',
  },
  gallery: {
    eyebrow: 'Settings',
    title: 'Where our chefs operate.',
    items: [
      {
        src: COMMON_GALLERY[0].src,
        alt: 'Villa terrace with infinity view over the Mediterranean',
        label: 'Mediterranean villa',
      },
      {
        src: COMMON_GALLERY[1].src,
        alt: 'Table set onboard a yacht at anchor',
        label: 'Yacht charter',
      },
      {
        src: COMMON_GALLERY[2].src,
        alt: 'Outdoor dinner table at sunset',
        label: 'Private dinner',
      },
      {
        src: COMMON_GALLERY[3].src,
        alt: 'Service onboard a yacht in the bay of Monaco',
        label: 'Service at sea',
      },
    ],
  },
  testimonials: {
    eyebrow: 'Testimonials',
    title: 'What our clients say.',
    items: [
      {
        quote: 'Responsiveness, quality, discretion. Exactly what we needed for our summer clients.',
        author: 'Selma R.',
        role: 'Villa Manager, Cap Ferrat',
      },
      {
        quote: 'Chef proposed within 6h, on site within the week. Transformed the whole stay.',
        author: 'Alexandre P.',
        role: 'Seasonal renter, Saint-Tropez',
      },
      {
        quote: 'A reliable partner for complex requests. Total discretion, non-negotiable for us.',
        author: 'Constance L.',
        role: 'Concierge, Monaco',
      },
      {
        quote: 'The chef handled three services a day for two weeks, without missing a beat. Brigade head.',
        author: 'Karim B.',
        role: 'Charter manager, Antibes',
      },
      {
        quote: 'They understood our brief in five minutes on the phone. The profile sent was a 100% match.',
        author: 'Élise V.',
        role: 'UHNW family, Ibiza',
      },
      {
        quote: 'Chef found on a weekend, in peak season. No one else could have pulled us out of that.',
        author: 'Henri D.',
        role: 'Owner villa, Saint-Jean-Cap-Ferrat',
      },
      {
        quote: 'Impeccable coordination with our house manager. The chef integrated as if he had always been there.',
        author: 'Béatrice M.',
        role: 'Private concierge, Geneva',
      },
    ],
  },
  confidentiality: {
    eyebrow: 'Confidentiality',
    titleLine1: 'Discretion',
    titleLine2: 'is not an option.',
    p1: 'Our chefs operate in villas, chalets, yachts and private residences across Europe. Locations, clients and missions are never made public.',
    p2: 'References are shared selectively. Confidentiality is built into the way we work.',
  },
  method: {
    eyebrow: 'Method',
    titleLine1: 'A simple request.',
    titleLine2: 'A structured response.',
    steps: [
      {
        number: '01',
        title: 'Qualification',
        text: 'We analyse the location, dates, service level, mission format and indicative budget.',
      },
      {
        number: '02',
        title: 'Selection',
        text: 'We identify the most relevant profiles based on the mission, the environment and the requirements expressed.',
      },
      {
        number: '03',
        title: 'Coordination',
        text: 'Once the profile is validated, we frame the mission and remain the point of contact throughout.',
      },
    ],
  },
  faq: {
    eyebrow: 'Frequently asked',
    title: 'Before you ask.',
    items: [
      {
        question: 'What is the minimum mission duration?',
        answer:
          "We accept missions from 3 days onwards. Our expertise is most relevant on longer stays, from a week to several months.",
      },
      {
        question: 'What are the indicative pricing ranges?',
        answer:
          'A private chef service starts from €2,500 per week depending on the profile and the format. Long-term missions and yacht placements are negotiated separately.',
      },
      {
        question: 'Do you work with concierges?',
        answer:
          'Yes. We have a dedicated partner access with a tailored grid and priority handling for concierges and house managers.',
      },
      {
        question: 'What happens in case of an unforeseen event (cancellation, unavailability)?',
        answer:
          'We systematically pre-validate a replacement profile for long missions. Operational continuity is our commitment.',
      },
      {
        question: 'Who handles the shopping and logistics?',
        answer:
          'The chef handles the full sourcing (markets, local producers, specialty deliveries). You have nothing to coordinate.',
      },
      {
        question: 'How do you guarantee confidentiality?',
        answer:
          'No reference is made public. Chefs are contracted with a confidentiality clause. Discretion is part of our selection criteria.',
      },
    ],
  },
  ctaFinal: {
    eyebrow: 'Your project',
    titleLine1: 'Describe your project.',
    titleLine2: 'Reply within 6 to 24h.',
    sub: 'Thomas, your point of contact, will get back to you with a curated selection matching your brief.',
    ctaPrimary: 'Describe my project',
    ctaWhatsapp: 'WhatsApp — Thomas',
    footnote: 'No commitment · No booking without your validation',
  },
};

// ─────────────────────────────────────────────────────────────
// ES
// ─────────────────────────────────────────────────────────────
export const esCopy: VillaCopy = {
  lang: 'es',
  meta: {
    title: 'Chef privado para villas, yates y residencias — Chefs Talents',
    description:
      'Chef privado para villas, yates y residencias. De una cena a toda una temporada. Respuesta en 6 a 24h, en toda Europa.',
  },
  hero: {
    eyebrow: 'Chefs Talents',
    titleLine1: 'Chefs privados para sus villas,',
    titleLine2: 'yates y residencias.',
    sub: 'De una cena a toda una temporada. Una orquestación sin fricción, en toda Europa.',
    delay: 'Respuesta en 6 a 24h.',
    ctaPrimary: 'Describir mi proyecto',
    ctaWhatsapp: 'WhatsApp — Thomas',
    whatsappPrefill: 'Hola Thomas, tengo un proyecto de chef privado.',
    imageAlt: 'Mesa preparada junto a la piscina con vistas al Mediterráneo',
  },
  stats: [
    { value: '400', label: 'chefs' },
    { value: '400', label: 'misiones' },
    { value: '50', label: 'destinos' },
    { value: '6-24h', label: 'respuesta' },
  ],
  forWho: {
    eyebrow: 'Para quién',
    title: 'Tres perfiles, un mismo estándar.',
    cards: [
      {
        title: 'Propietarios y arrendatarios de villas',
        body: 'Temporada estival, larga estancia o estancia corta. Costa Azul, Ibiza, Mykonos, Cerdeña. Nuestros chefs se instalan en su casa el tiempo necesario.',
      },
      {
        title: 'Chárter de yates',
        body: 'Chefs acostumbrados al yachting privado, experiencia en galley en el mar, gestión logística de a bordo. Movilidad internacional.',
      },
      {
        title: 'Conserjerías y house managers',
        body: 'Un interlocutor dedicado, una red exclusiva, una fiabilidad que sus clientes le reconocerán.',
      },
    ],
  },
  imageBreak: {
    eyebrow: 'Ejecución',
    title: 'Una presencia discreta, una ejecución constante, un nivel de servicio mantenido.',
    imageAlt: 'Villa contemporánea con piscina, vistas a las colinas y al Mediterráneo',
  },
  orchestration: {
    eyebrow: 'Orquestación',
    titleLine1: 'Más que una puesta en contacto.',
    titleAccent: 'Una orquestación.',
    p1: 'No entregamos un chef: encuadramos una misión. Calificación de la necesidad, selección dirigida entre 400 perfiles, coordinación del brief, anticipación de imprevistos.',
    p2: 'Nuestro papel no es servir. Es hacer que nada se salga de su sitio y que todo esté justo.',
  },
  gallery: {
    eyebrow: 'Escenarios',
    title: 'Donde intervienen nuestros chefs.',
    items: [
      {
        src: COMMON_GALLERY[0].src,
        alt: 'Terraza de villa con vista infinity al Mediterráneo',
        label: 'Villa mediterránea',
      },
      {
        src: COMMON_GALLERY[1].src,
        alt: 'Mesa preparada a bordo de un yate fondeado',
        label: 'Chárter de yate',
      },
      {
        src: COMMON_GALLERY[2].src,
        alt: 'Mesa al aire libre al atardecer',
        label: 'Cena privada',
      },
      {
        src: COMMON_GALLERY[3].src,
        alt: 'Servicio a bordo de un yate en la bahía de Mónaco',
        label: 'Servicio en el mar',
      },
    ],
  },
  testimonials: {
    eyebrow: 'Testimonios',
    title: 'Lo que dicen nuestros clientes.',
    items: [
      {
        quote: 'Reactividad, calidad, discreción. Exactamente lo que necesitábamos para nuestros clientes del verano.',
        author: 'Selma R.',
        role: 'Villa Manager, Cap Ferrat',
      },
      {
        quote: 'Chef propuesto en 6h, instalado con nosotros en la semana. La estancia entera quedó transformada.',
        author: 'Alexandre P.',
        role: 'Inquilino de temporada, Saint-Tropez',
      },
      {
        quote: 'Un socio fiable para peticiones complejas. Discreción total, innegociable para nosotros.',
        author: 'Constance L.',
        role: 'Conserjería, Mónaco',
      },
      {
        quote: 'El chef sostuvo tres servicios al día durante dos semanas, sin una nota falsa. Brigada en cabeza.',
        author: 'Karim B.',
        role: 'Charter manager, Antibes',
      },
      {
        quote: 'Entendieron nuestro brief en cinco minutos por teléfono. El perfil enviado coincidía al 100 %.',
        author: 'Élise V.',
        role: 'Familia UHNW, Ibiza',
      },
      {
        quote: 'Chef encontrado un fin de semana, en plena temporada. Nadie más nos habría sacado de eso.',
        author: 'Henri D.',
        role: 'Propietario villa, Saint-Jean-Cap-Ferrat',
      },
      {
        quote: 'Coordinación impecable con nuestro house manager. El chef se integró como si llevara allí toda la vida.',
        author: 'Béatrice M.',
        role: 'Conserjería privada, Ginebra',
      },
    ],
  },
  confidentiality: {
    eyebrow: 'Confidencialidad',
    titleLine1: 'La discreción',
    titleLine2: 'no es una opción.',
    p1: 'Nuestros chefs intervienen en villas, chalets, yates y residencias privadas en toda Europa. Los lugares, los clientes y las misiones nunca se hacen públicos.',
    p2: 'Las referencias se comparten de forma selectiva. La confidencialidad forma parte integral de nuestra manera de trabajar.',
  },
  method: {
    eyebrow: 'Método',
    titleLine1: 'Una solicitud simple.',
    titleLine2: 'Una respuesta estructurada.',
    steps: [
      {
        number: '01',
        title: 'Calificación',
        text: 'Analizamos el lugar, las fechas, el nivel de servicio, el formato de la misión y el presupuesto indicativo.',
      },
      {
        number: '02',
        title: 'Selección',
        text: 'Identificamos los perfiles más pertinentes según la misión, el entorno y los requisitos expresados.',
      },
      {
        number: '03',
        title: 'Coordinación',
        text: 'Una vez validado el perfil, encuadramos la misión y seguimos siendo el punto de contacto durante todo el desarrollo.',
      },
    ],
  },
  faq: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Antes de preguntar.',
    items: [
      {
        question: '¿A partir de qué duración aceptan una misión?',
        answer:
          'Aceptamos misiones a partir de 3 días. Nuestra experiencia cobra todo su sentido en estancias largas, de una semana a varios meses.',
      },
      {
        question: '¿Cuáles son los órdenes de magnitud tarifarios?',
        answer:
          'Un servicio de chef privado comienza a partir de 2.500 € por semana según el perfil y el formato. Las misiones de larga duración y los yates se negocian de forma específica.',
      },
      {
        question: '¿Trabajan con conserjerías?',
        answer:
          'Sí. Disponemos de un acceso partner dedicado, con una tabla adaptada y una prioridad de tratamiento para conserjerías y house managers.',
      },
      {
        question: '¿Qué ocurre en caso de imprevisto (cancelación, indisponibilidad)?',
        answer:
          'Preparamos sistemáticamente un perfil de reemplazo prevalidado para las misiones largas. La continuidad operativa es nuestro compromiso.',
      },
      {
        question: '¿Quién se ocupa de las compras y la logística?',
        answer:
          'El chef gestiona integralmente el sourcing (mercados, productores locales, entregas especiales). Usted no tiene nada que coordinar.',
      },
      {
        question: '¿Cómo garantizan la confidencialidad?',
        answer:
          'Ninguna referencia se hace pública. Los chefs son contratados con cláusula de confidencialidad. La discreción forma parte de los criterios de selección.',
      },
    ],
  },
  ctaFinal: {
    eyebrow: 'Su proyecto',
    titleLine1: 'Describa su proyecto.',
    titleLine2: 'Respuesta en 6 a 24h.',
    sub: 'Thomas, su interlocutor, le responde con una selección dirigida según su brief.',
    ctaPrimary: 'Describir mi proyecto',
    ctaWhatsapp: 'WhatsApp — Thomas',
    footnote: 'Sin compromiso · Ninguna reserva sin su validación',
  },
};
