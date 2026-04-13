export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  dateModified?: string;
  image: string;
  readTime: number;
  lang: 'fr' | 'en';
  tags: string[];
  featured?: boolean;
  content: string;
}

export const articles: Article[] = [
  {
    slug: 'chef-prive-cote-azur-ete-2026',
    title: "Chef privé Côte d'Azur : guide complet été 2026",
    description: "Comment trouver et sécuriser un chef privé pour votre villa sur la Côte d'Azur. Tarifs, profils, logistique et conseils pour la saison estivale.",
    category: "Côte d'Azur", date: '2026-04-13', featured: true,
    image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=1200',
    readTime: 8, lang: 'fr',
    tags: ["chef privé", "Côte d'Azur", "villa été", "Saint-Tropez"],
    content: `<p>La saison estivale sur la Côte d'Azur représente la période la plus dense de l'année pour les chefs privés en Europe. Villas de Saint-Tropez, résidences de Cap Ferrat, propriétés de Mougins — la demande explose entre juin et septembre, et les meilleurs profils se réservent plusieurs mois à l'avance.</p><h2>Pourquoi la Côte d'Azur est un marché à part</h2><p>La Côte d'Azur concentre une densité exceptionnelle de résidences privées haut de gamme. Un chef qui excelle en résidence parisienne n'est pas nécessairement adapté à une villa avec piscine à Ramatuelle. La mobilité, l'autonomie et l'expérience du terrain sont des critères non négociables.</p><h2>Les zones les plus demandées</h2><h3>Saint-Tropez et le Var</h3><p>Saint-Tropez reste le point de concentration le plus fort. Les villas du golfe imposent des standards élevés — produits locaux, cuisine méditerranéenne maîtrisée, capacité à gérer des groupes festifs.</p><h3>Antibes, Cap d'Antibes</h3><p>Le Cap d'Antibes accueille des résidences plus discrètes, souvent occupées sur des durées plus longues. La régularité prime sur le spectaculaire.</p><h2>Tarifs 2026</h2><ul><li><strong>Mission ponctuelle (1–3 jours) :</strong> 500€ à 1 200€ par jour.</li><li><strong>Mission semaine :</strong> 2 500€ à 6 000€.</li><li><strong>Mission saisonnière :</strong> 6 000€ à 15 000€ par mois.</li></ul><h2>Comment sécuriser un bon chef</h2><p><strong>Les meilleurs chefs sont réservés dès février–mars.</strong> Soumettez votre demande avec lieu exact, dates, nombre de convives et budget indicatif.</p>`,
  },
  {
    slug: 'private-chef-french-riviera-guide',
    title: "Private chef French Riviera : the complete guide 2026",
    description: "Everything you need to know about hiring a private chef for your villa on the French Riviera. Profiles, rates, logistics and what to expect.",
    category: 'French Riviera', date: '2026-04-13', featured: true,
    image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=1200',
    readTime: 8, lang: 'en',
    tags: ['private chef', 'French Riviera', 'villa', 'luxury'],
    content: `<p>The French Riviera is one of the most competitive markets in Europe for private chefs. Demand peaks between June and September, and the best profiles are booked months in advance.</p><h2>Why hiring a private chef on the Riviera is different</h2><p>Short but intense stays, large rotating groups, outdoor dining in summer heat, fresh market logistics, and clients with extremely high standards. A chef who performs brilliantly in Paris may struggle with a 12-person villa dinner in Ramatuelle.</p><h2>Key areas</h2><h3>Saint-Tropez and the Var</h3><p>The most in-demand area. Villas in the Gulf of Saint-Tropez command the highest rates and the most experienced chefs.</p><h3>Antibes, Cap d'Antibes, Cannes</h3><p>Longer stays, more residential. Consistency matters more than showcase cooking.</p><h2>Rates 2026</h2><ul><li><strong>Short mission (1–3 days):</strong> €600 to €1,400 per day.</li><li><strong>Weekly mission:</strong> €3,000 to €7,000.</li><li><strong>Seasonal placement:</strong> €7,000 to €16,000 per month.</li></ul><h2>When to book</h2><p><strong>The best chefs are fully booked by March.</strong> Submit your brief with full details — location, exact dates, group size, cuisine preferences and budget.</p>`,
  },
  {
    slug: 'chef-prive-ibiza-2026',
    title: "Chef privé Ibiza 2026 : trouver le bon profil pour votre villa",
    description: "Guide complet pour engager un chef privé à Ibiza : saisonnalité, profils adaptés aux villas des Baléares, tarifs et logistique.",
    category: 'Ibiza', date: '2026-04-13',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1200',
    readTime: 7, lang: 'fr',
    tags: ['chef privé', 'Ibiza', 'Baléares', 'villa', 'été'],
    content: `<p>Ibiza s'est imposée comme l'une des destinations les plus demandées d'Europe pour les villas privées haut de gamme. De juin à septembre, l'île concentre une clientèle internationale exigeante.</p><h2>Une saison courte, une demande intense</h2><p>La saison active à Ibiza dure environ quatre mois. Les villas les plus importantes font venir leurs chefs depuis la France, l'Espagne ou l'Italie, souvent pour la saison entière.</p><h2>Spécificités culinaires</h2><p>La clientèle est souvent internationale. Les attentes reflètent cette diversité : cuisine méditerranéenne légère, végétarienne et végane fréquemment demandées, maîtrise des régimes alimentaires variés.</p><h2>Tarifs 2026</h2><ul><li><strong>Mission semaine :</strong> 3 500€ à 7 000€.</li><li><strong>Saison complète :</strong> 12 000€ à 20 000€ par mois.</li></ul>`,
  },
  {
    slug: 'combien-coute-chef-prive',
    title: "Combien coûte un chef privé à domicile ? Tarifs 2026",
    description: "Grille tarifaire complète d'un chef privé selon la mission, le niveau, la durée et la localisation.",
    category: 'Guide pratique', date: '2026-04-14', featured: true,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200',
    readTime: 7, lang: 'fr',
    tags: ['chef privé', 'tarifs', 'prix', 'budget'],
    content: `<p>Le coût d'un chef privé varie considérablement selon le profil, la durée, la localisation et le niveau de service attendu.</p><h2>Ce que comprend le tarif</h2><p>Le tarif couvre le temps et les compétences du chef — pas les ingrédients. La plupart des missions fonctionnent avec un budget matières premières séparé.</p><h2>Grille tarifaire 2026</h2><h3>Dîner privé ponctuel</h3><p>Entre <strong>300€ et 800€</strong> selon le niveau et le nombre de convives.</p><h3>Mission courte (2–5 jours)</h3><p>Entre <strong>400€ et 1 200€ par jour</strong>.</p><h3>Mission semaine</h3><p>Entre <strong>2 500€ et 6 000€</strong>.</p><h3>Mission mensuelle</h3><p>Entre <strong>5 000€ et 15 000€ par mois</strong>.</p><h3>Chef résident annuel</h3><p>Entre <strong>6 000€ et 18 000€ brut par mois</strong>.</p><h2>Facteurs qui font varier le tarif</h2><ul><li><strong>Le profil :</strong> expérience étoilée, formation internationale.</li><li><strong>La localisation :</strong> Côte d'Azur, Ibiza, Monaco en saison — majoration de 20 à 40%.</li><li><strong>Les langues :</strong> chef multilingue plus rare et plus cher.</li></ul>`,
  },
  {
    slug: 'chef-prive-saint-tropez',
    title: "Chef privé Saint-Tropez : standards, profils et tarifs",
    description: "Saint-Tropez impose des standards culinaires particuliers. Comment trouver un chef privé à la hauteur pour votre villa ou yacht dans le Var.",
    category: "Côte d'Azur", date: '2026-04-14',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200',
    readTime: 6, lang: 'fr',
    tags: ['chef privé', 'Saint-Tropez', 'Var', 'villa'],
    content: `<p>Saint-Tropez est l'un des marchés les plus exigeants d'Europe pour les chefs privés. La concentration de villas haut de gamme, de yachts et de clients internationaux crée une demande soutenue pour des profils d'exception.</p><h2>Le contexte culinaire</h2><p>Les villas du golfe de Saint-Tropez accueillent une clientèle habituée aux meilleures tables du monde. Le chef privé doit délivrer un niveau gastronomique constant, avec une maîtrise parfaite des produits méditerranéens locaux.</p><h2>Les profils les plus demandés</h2><ul><li><strong>Chef gastronomique mobile :</strong> formation haute cuisine, idéal pour séjours courts avec dîners d'exception.</li><li><strong>Chef résident saisonnier :</strong> s'installe pour la saison, gère l'intégralité de la cuisine. Profil rare, très recherché.</li><li><strong>Chef yacht :</strong> pour les propriétaires qui alternent entre villa et bateau.</li></ul><h2>Tarifs 2026</h2><ul><li><strong>Mission courte (3–7 jours) :</strong> 600€ à 1 400€ par jour.</li><li><strong>Saison complète :</strong> 8 000€ à 16 000€ par mois.</li></ul><h2>Quand réserver</h2><p>Juillet et août sont complets pour les meilleurs chefs dès mars. Soumettez votre demande maintenant.</p>`,
  },
  {
    slug: 'chef-prive-yacht',
    title: "Chef privé sur yacht : une opération de précision",
    description: "Pourquoi les chefs de yacht sont une catégorie à part dans l'hospitalité privée.",
    category: 'Yachting', date: '2023-09-01',
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7dd8d36?q=80&w=1200',
    readTime: 6, lang: 'fr',
    tags: ['chef privé', 'yacht', 'méditerranée'],
    content: `<p>Contenu existant.</p>`,
  },
  {
    slug: 'chef-prive-villa',
    title: "Chef privé pour villas privées : standards hôteliers à domicile",
    description: "L'importance de l'autonomie et de l'intégration dans des environnements privés non standardisés.",
    category: 'Villas', date: '2023-11-01',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200',
    readTime: 5, lang: 'fr',
    tags: ['chef privé', 'villa', 'haut de gamme'],
    content: `<p>Contenu existant.</p>`,
  },
  {
    slug: 'chef-prive-chalet-montagne',
    title: "Chef privé en chalet : la logistique d'altitude",
    description: "Naviguer entre les exigences caloriques de l'après-ski et la finesse gastronomique.",
    category: 'Montagne', date: '2023-12-01',
    image: 'https://images.unsplash.com/photo-1516571589254-46487e38c92a?q=80&w=1200',
    readTime: 5, lang: 'fr',
    tags: ['chef privé', 'chalet', 'ski'],
    content: `<p>Contenu existant.</p>`,
  },
  {
    slug: 'chef-prive-famille-uhnw',
    title: "Chef privé pour familles UHNW : intendance nutritionnelle",
    description: "Le rôle du chef dans la santé et le bien-être à long terme des foyers exigeants.",
    category: 'Famille & Santé', date: '2024-01-01', featured: true,
    image: 'https://images.unsplash.com/photo-1629272365287-43c220f121a2?q=80&w=1200',
    readTime: 7, lang: 'fr',
    tags: ['chef privé', 'UHNW', 'famille', 'nutrition'],
    content: `<p>Contenu existant.</p>`,
  },
  {
    slug: 'chef-prive-sejour-longue-duree',
    title: "Chef privé pour séjours longue durée : l'art de la constance",
    description: "Pourquoi la gestion d'une cuisine sur plusieurs semaines requiert une logistique hôtelière.",
    category: 'Longue Durée', date: '2023-10-01',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200',
    readTime: 6, lang: 'fr',
    tags: ['chef privé', 'longue durée', 'résidence privée'],
    content: `<p>Contenu existant.</p>`,
  },
];

export const getArticleBySlug = (slug: string) => articles.find(a => a.slug === slug);
export const getAllSlugs = () => articles.map(a => a.slug);
export const getFeaturedArticles = () => articles.filter(a => a.featured);
