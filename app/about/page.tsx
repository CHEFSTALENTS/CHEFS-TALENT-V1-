import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'À propos — Thomas Delcroix | Chefs Talents',
  description: 'Chef privé depuis 2019, fondateur de Chefs Talents. Un réseau de 400 chefs sélectionnés pour des missions dans des villas, yachts et résidences privées en Europe.',
  alternates: { canonical: 'https://chefstalents.com/about' },
};

export default function AboutPage() {
  return (
    <main className="bg-[#f4efe8] text-[#161616]">

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#161616] pt-32 pb-20 px-6 md:px-12 lg:px-20">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/editorial/hero-chef-talents.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#161616]/60 to-[#161616]" />

        <div className="relative z-10 max-w-4xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 mb-6">
            Chefs Talents — Fondateur
          </p>
          <h1 className="text-[3rem] leading-[1.0] font-serif text-white md:text-7xl mb-6">
            Thomas Delcroix.
          </h1>
          <p className="text-[20px] font-light leading-8 text-white/75 max-w-2xl">
            Chef privé, fondateur de Chefs Talents. Un réseau construit sur le terrain,
            dans des cuisines étoilées et à bord de superyachts.
          </p>
        </div>
      </section>

      {/* PHOTO + INTRO */}
      <section className="px-6 py-24 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-16 items-start">

          {/* Photo */}
          <div className="lg:col-span-4">
            <div className="rounded-[28px] overflow-hidden aspect-[3/4]">
              <img
                src="images/editorial/IMG_8782.JPG"
                alt="Thomas Delcroix — Fondateur Chefs Talents"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="mt-6 space-y-3">
              <a
                href="https://wa.me/33756827612"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 min-h-[52px] rounded-full bg-[#161616] text-white text-sm font-medium px-6 hover:bg-black transition"
              >
                Me contacter — WhatsApp
              </a>
              <a
                href="mailto:contact@chefstalents.com"
                className="flex items-center justify-center gap-2 min-h-[52px] rounded-full border border-[#d4cdc2] text-[#3f3a34] text-sm font-medium px-6 hover:bg-[#ebe5db] transition"
              >
                contact@chefstalents.com
              </a>
            </div>
          </div>

          {/* Texte */}
          <div className="lg:col-span-8 space-y-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">
                Mon parcours
              </p>
              <p className="text-[20px] font-light leading-9 text-[#59544d]">
                J'ai commencé comme chef privé en 2020, en France, dans des résidences haut de gamme et en parallèle j'ai fait mes classes dans des tables étoilées. Ce qui m'a toujours attiré, c'est l'environnement privé : la relation directe avec le client, l'exigence du quotidien, la cuisine comme service et non comme spectacle.
              </p>
            </div>

            <div>
              <p className="text-[20px] font-light leading-9 text-[#59544d]">
                J'ai ensuite rejoint le monde du yachting privé, plusieurs mois en Méditerranée, à bord de motoryachts. Une école incomparable : l'espace contraint, les approvisionnements complexes, les clients internationaux, les standards UHNW. On apprend vite ce que signifie l'exigence sans compromis.
              </p>
            </div>

            <div>
              <p className="text-[20px] font-light leading-9 text-[#59544d]">
                En parallèle, j'ai accumulé plus de 200 missions ponctuelles : villas en Côte d'Azur, chalets dans les Alpes, résidences familiales en Espagne, événements privés à Monaco. À chaque mission, le même constat : les bons chefs existent, mais les clients ne savent pas comment les trouver, et les chefs ne savent pas comment accéder aux bonnes missions.
              </p>
            </div>

            <div>
              <p className="text-[20px] font-light leading-9 text-[#59544d]">
                C'est pour ça que j'ai créé Chefs Talents en 2023. Pas une marketplace. Pas un annuaire. Une mise en relation structurée, avec une vraie connaissance des deux côtés : le client qui cherche un niveau d'excellence, et le chef qui mérite des missions à la hauteur de son talent.
              </p>
            </div>

            {/* Chiffres clés */}
            <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
              {[
                { value: '2020', label: 'Début en chef privé' },
                { value: '200+', label: 'Missions réalisées' },
                { value: '400+', label: 'Chefs placés depuis 2023' },
                { value: '50+', label: 'Destinations couvertes' },
              ].map((s, i) => (
                <div key={i} className="rounded-[20px] border border-[#d8d1c7] bg-white px-5 py-6 text-center">
                  <p className="font-serif text-[2rem] leading-none text-[#161616]">{s.value}</p>
                  <p className="mt-2 text-[12px] font-light text-[#8a7f73]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CE QUE JE CHERCHE */}
      <section className="bg-[#161616] px-6 py-24 md:px-12 lg:px-20 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">
              Ma vision
            </p>
            <h2 className="text-[2.4rem] font-serif leading-[1.04] text-white md:text-5xl">
              Ce que
              <br />
              je construis.
            </h2>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <p className="text-[19px] font-light leading-9 text-white/80">
              Le monde du chef privé est opaque. Les clients ne comprennent pas les tarifs, les chefs sous-estiment leur valeur, et les mises en relation se font encore par bouche-à-oreille. Chefs Talents existe pour changer ça.
            </p>
            <p className="text-[19px] font-light leading-9 text-white/80">
              J'ai construit un réseau de chefs que je connais personnellement ou par recommandation directe. Des profils que j'ai croisés en cuisine, sur un yacht, ou dans une résidence privée. Des gens sérieux, discrets, qui savent ce que signifie intervenir dans un environnement privé de haut niveau.
            </p>
            <p className="text-[19px] font-light leading-9 text-white/80">
              Ce que je propose à mes clients, c'est ce que j'aurais voulu trouver quand j'étais chef : quelqu'un qui connaît le terrain, qui comprend les deux parties, et qui fait le lien sans friction.
            </p>
          </div>
        </div>
      </section>

      {/* LE RÉSEAU */}
      <section className="px-6 py-24 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">Le réseau</p>
          <h2 className="text-[2.4rem] font-serif leading-[1.04] text-[#161616] md:text-5xl mb-12 max-w-2xl">
            400 chefs.
            <br />
            Sélectionnés un par un.
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Rencontrés sur le terrain',
                text: 'La majorité des chefs du réseau ont été rencontrés directement : en cuisine, sur un yacht, dans une villa. Pas des inconnus filtrés par un algorithme.',
              },
              {
                title: 'Formés aux standards du luxe',
                text: 'Tables étoilées, palaces, superyachts : chaque profil a une expérience validée en environnement premium. L\'exigence est le critère d\'entrée, pas l\'exception.',
              },
              {
                title: 'Couvrant toute l\'Europe',
                text: 'France, Espagne, Grèce, Italie, Portugal, Suisse, Croatie : plus de 50 destinations couvertes par des chefs locaux ou mobiles capables d\'intervenir rapidement.',
              },
            ].map((card, i) => (
              <div key={i} className="rounded-[28px] border border-[#d8d1c7] bg-white px-7 py-8">
                <h3 className="text-[1.4rem] font-serif text-[#161616] mb-4">{card.title}</h3>
                <p className="text-[16px] font-light leading-7 text-[#59544d]">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-[#ebe4d9] px-6 py-24 md:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">
            Une question ? Un besoin ?
          </p>
          <h2 className="text-[2.4rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
            Contactez-moi directement.
          </h2>
          <p className="text-[18px] font-light leading-8 text-[#59544d] max-w-xl mx-auto">
            Je réponds personnellement à chaque demande. Si votre mission rentre dans le cadre de ce que nous faisons, je vous propose une sélection de profils adaptés dans les 6 heures.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="https://wa.me/33756827612"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[60px] items-center justify-center rounded-full bg-[#161616] px-10 text-sm font-medium text-white hover:bg-black transition gap-2"
            >
              WhatsApp — Thomas
            </a>
            <Link
              href="/request"
              className="inline-flex min-h-[60px] items-center justify-center rounded-full border border-[#d4cdc2] px-10 text-sm font-medium text-[#3f3a34] hover:bg-[#ebe5db] transition"
            >
              Soumettre une demande
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
