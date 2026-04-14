'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

const testimonials = [
  {
    text: "Juillet fully booked. On a signé à 17k€ sur le mois avec le client US. Logé directement sur place.",
    result: "17 000€ / juillet",
    tag: "Mission villa USA"
  },
  {
    text: "J'ai trouvé mon yacht pavillon rif enfin!! Je rentre dans le game !!",
    result: "Mission yacht signée",
    tag: "Chef yacht"
  },
  {
    text: "Je viens de fermer un client d'un mois pour Brunch à 7K€ le mois!!!",
    result: "7 000€ / mois",
    tag: "Mission brunch"
  }
];

const missionExample = {
  lieu: "Saint-Tropez — Ramatuelle",
  dates: "11 juillet → 1er août 2026",
  convives: "10–12 personnes",
  mission: "Full time (PDJ / Déj / Dîner)",
  budget: "11 000 €",
  style: "Méditerranéenne premium / gastronomique",
  langues: "FR-EN obligatoire"
};

function CountUp({ end, duration = 2000, prefix = "", suffix = "" }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const timer = setInterval(() => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * end));
          if (progress === 1) clearInterval(timer);
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString('fr-FR')}{suffix}</span>;
}

export default function AccompagnementPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: '#0a0a08', color: '#f5f0e8', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Outfit:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cta-btn {
          display: inline-block;
          background: #c9a96e;
          color: #0a0a08;
          padding: 18px 40px;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-decoration: none;
          text-transform: uppercase;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
        }
        .cta-btn:hover { background: #e8c47a; transform: translateY(-2px); }

        .cta-btn-outline {
          display: inline-block;
          background: transparent;
          color: #c9a96e;
          padding: 16px 40px;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-decoration: none;
          text-transform: uppercase;
          border: 1px solid #c9a96e;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .cta-btn-outline:hover { background: #c9a96e; color: #0a0a08; }

        .fade-in { animation: fadeIn 0.8s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .divider { width: 40px; height: 1px; background: #c9a96e; margin: 24px 0; }
        .divider-center { width: 40px; height: 1px; background: #c9a96e; margin: 24px auto; }

        .testimonial-card {
          background: #141410;
          border: 1px solid #2a2820;
          padding: 32px;
          transition: border-color 0.3s;
        }
        .testimonial-card:hover { border-color: #c9a96e44; }

        .stat-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 8vw, 80px);
          font-weight: 300;
          color: #c9a96e;
          line-height: 1;
        }

        .section-label {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #c9a96e;
        }

        .offer-card {
          border: 1px solid #2a2820;
          padding: 40px 32px;
          background: #0f0f0c;
          transition: all 0.3s;
          position: relative;
        }
        .offer-card:hover { border-color: #c9a96e66; }
        .offer-card.featured { border-color: #c9a96e; background: #141410; }
        .offer-card.featured::before {
          content: 'RECOMMANDÉ';
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #c9a96e;
          color: #0a0a08;
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          padding: 4px 16px;
        }

        .mission-card {
          background: #141410;
          border: 1px solid #2a2820;
          padding: 32px;
        }

        .step-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 72px;
          font-weight: 300;
          color: #2a2820;
          line-height: 1;
          position: absolute;
          top: -20px;
          left: 0;
        }

        @media (max-width: 768px) {
          .hero-title { font-size: clamp(42px, 10vw, 72px) !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, #0a0a08, transparent)' }}>
        <Link href="/" style={{ color: '#f5f0e8', textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Chefs Talents
        </Link>
        <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer" className="cta-btn" style={{ padding: '12px 24px', fontSize: '12px' }}>
          Réserver un audit gratuit
        </a>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(100px, 15vw, 160px) clamp(24px, 8vw, 120px) 80px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, #c9a96e08 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div className="fade-in" style={{ maxWidth: '900px' }}>
          <p className="section-label" style={{ marginBottom: '32px' }}>Accompagnement · Chefs Privés</p>

          <h1 className="hero-title" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(48px, 7vw, 88px)', fontWeight: 300, lineHeight: 1.05, marginBottom: '32px', color: '#f5f0e8' }}>
            Arrêtez de chercher<br />
            des missions.<br />
            <em style={{ color: '#c9a96e' }}>Laissez-les venir à vous.</em>
          </h1>

          <div className="divider" />

          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 300, color: '#a09880', lineHeight: 1.7, maxWidth: '560px', marginBottom: '48px' }}>
            En moins de 2 mois, les chefs que j'accompagne signent leurs premières missions
            à 4 000–17 000€. Pas par chance. Par méthode.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer" className="cta-btn">
              Réserver mon audit gratuit — 30 min
            </a>
            <a href="#comment" className="cta-btn-outline">
              Voir comment ça marche
            </a>
          </div>

          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#605a4a', marginTop: '20px' }}>
            Gratuit · Sans engagement · 5 places disponibles ce mois
          </p>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(24px, 8vw, 120px)', borderTop: '1px solid #1a1a16', borderBottom: '1px solid #1a1a16' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '60px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          {[
            { num: 17000, suffix: '€', label: 'Mission signée en juillet', prefix: '' },
            { num: 30, suffix: '+', label: 'Chefs placés par mois', prefix: '' },
            { num: 3, suffix: ' mois', label: "Durée de l'accompagnement", prefix: 'jusqu\'à ' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="stat-number">
                <CountUp end={stat.num} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#706a58', marginTop: '12px', letterSpacing: '0.05em' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF — TÉMOIGNAGES */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(24px, 8vw, 120px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p className="section-label" style={{ marginBottom: '16px' }}>Résultats réels</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 300, marginBottom: '60px', maxWidth: '600px' }}>
            Ce que disent les chefs<br />après l'accompagnement.
          </h2>

          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#c9a96e', letterSpacing: '0.1em', marginBottom: '20px', textTransform: 'uppercase' }}>
                  {t.tag}
                </p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontStyle: 'italic', color: '#d4cfc4', lineHeight: 1.6, marginBottom: '24px' }}>
                  "{t.text}"
                </p>
                <div style={{ borderTop: '1px solid #2a2820', paddingTop: '20px' }}>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: 500, color: '#c9a96e' }}>
                    {t.result}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXEMPLE DE MISSION RÉELLE */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(24px, 8vw, 120px)', background: '#0d0d0a' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <p className="section-label" style={{ marginBottom: '16px' }}>Mission réelle — Juillet 2026</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 300, lineHeight: 1.1, marginBottom: '24px' }}>
                Voilà le type de missions<br />
                <em style={{ color: '#c9a96e' }}>que je place chaque mois.</em>
              </h2>
              <div className="divider" />
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', color: '#a09880', lineHeight: 1.8 }}>
                Cette mission a été soumise via chefstalents.com et proposée en priorité
                aux chefs du réseau. Budget : 11 000€ pour 3 semaines.
              </p>
            </div>

            <div className="mission-card">
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', letterSpacing: '0.2em', color: '#c9a96e', textTransform: 'uppercase', marginBottom: '24px' }}>
                Brief mission confidentiel
              </p>
              {Object.entries(missionExample).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1a16', gap: '16px' }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#605a4a', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', color: '#d4cfc4', textAlign: 'right' }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop: '24px', padding: '16px', background: '#1a1a10', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#706a58' }}>Budget mission</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', color: '#c9a96e' }}>11 000 €</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment" style={{ padding: 'clamp(80px, 10vw, 120px) clamp(24px, 8vw, 120px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p className="section-label" style={{ marginBottom: '16px' }}>Le processus</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 300, marginBottom: '80px', maxWidth: '500px' }}>
            De l'audit à votre<br />première mission signée.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '60px' }}>
            {[
              { n: '01', title: 'Audit gratuit 30 min', desc: "On analyse votre situation actuelle : niveau, tarifs, visibilité, blocages. Je vous dis exactement ce qui vous empêche de signer des missions à haute valeur." },
              { n: '02', title: 'Repositionnement', desc: "On affine votre offre, votre pricing, votre présence en ligne. Les clients comprennent immédiatement votre valeur. Vous arrêtez de sous-facturer." },
              { n: '03', title: 'Système d\'acquisition', desc: "Je vous donne le système qui amène les missions à vous. Réseaux sociaux, réseau Chefs Talents, stratégie proactive. Pas passive." },
              { n: '04', title: 'Accès au réseau', desc: "Vous accédez en priorité aux missions que je place chaque mois. 30 à 50 chefs placés. Les profils dans le programme passent en premier." },
            ].map((step, i) => (
              <div key={i} style={{ position: 'relative', paddingTop: '40px' }}>
                <span className="step-number">{step.n}</span>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 400, marginBottom: '16px', marginTop: '8px' }}>{step.title}</h3>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', color: '#706a58', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFFRES */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(24px, 8vw, 120px)', background: '#0d0d0a' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p className="section-label" style={{ marginBottom: '16px', textAlign: 'center' }}>L'investissement</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 300, marginBottom: '16px', textAlign: 'center' }}>
            Choisissez votre format.
          </h2>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', color: '#706a58', textAlign: 'center', marginBottom: '60px' }}>
            Chaque accompagnement est sur-mesure. On définit ensemble le format adapté à votre situation.
          </p>

          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
            {[
              {
                name: 'Starter',
                duration: '1 mois',
                price: '1 800€',
                subtitle: 'Pour démarrer sur les bonnes bases',
                features: ['2 sessions mentorat/semaine', 'Support WhatsApp quotidien', 'Repositionnement + pricing', 'Stratégie réseaux sociaux', 'Accès réseau fin de programme'],
                featured: false
              },
              {
                name: 'Accélération',
                duration: '2 mois',
                price: '1 800€/mois',
                subtitle: 'Pour ceux qui veulent aller vite',
                features: ['Tout le Starter', 'Système acquisition complet', 'Stratégie multi-réseaux', 'Mise en relation prioritaire dès le mois 2', 'Suivi jusqu\'aux premières missions'],
                featured: true
              },
              {
                name: 'Transformation',
                duration: '3 mois',
                price: '1 800€/mois',
                subtitle: 'Pour faire de cet été votre meilleur',
                features: ['Tout l\'Accélération', 'Accès réseau prioritaire dès le mois 1', 'Placement missions été 2026', 'Suivi jusqu\'aux missions signées', 'Accompagnement personnalisé total'],
                featured: false
              }
            ].map((offer, i) => (
              <div key={i} className={`offer-card ${offer.featured ? 'featured' : ''}`}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', letterSpacing: '0.2em', color: '#c9a96e', textTransform: 'uppercase', marginBottom: '16px' }}>
                  {offer.duration}
                </p>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 400, marginBottom: '8px' }}>{offer.name}</h3>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', color: '#706a58', marginBottom: '24px' }}>{offer.subtitle}</p>
                <div style={{ borderTop: '1px solid #2a2820', borderBottom: '1px solid #2a2820', padding: '20px 0', marginBottom: '24px' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '36px', color: '#c9a96e' }}>{offer.price}</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#605a4a' }}> HT</span>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: '32px' }}>
                  {offer.features.map((f, j) => (
                    <li key={j} style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', color: '#a09880', padding: '8px 0', borderBottom: '1px solid #1a1a16', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#c9a96e', marginTop: '2px' }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer" className={offer.featured ? 'cta-btn' : 'cta-btn-outline'} style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                  Réserver un audit
                </a>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', color: '#605a4a', textAlign: 'center' }}>
            Pas sûr du format ? L'audit gratuit de 30 min vous aide à décider.
          </p>
        </div>
      </section>

      {/* QUI JE SUIS */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(24px, 8vw, 120px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div style={{ aspectRatio: '3/4', overflow: 'hidden', border: '1px solid #2a2820' }}>
  <img
    src="/images/thomas-delcroix.jpg"
    alt="Thomas Delcroix — Fondateur Chefs Talents"
    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'grayscale(20%)' }}
  />
</div>
            <div>
              <p className="section-label" style={{ marginBottom: '16px' }}>Thomas Delcroix</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 300, lineHeight: 1.1, marginBottom: '24px' }}>
                Fondateur Chefs Talents.<br />
                <em style={{ color: '#c9a96e' }}>Chef et entrepreneur.</em>
              </h2>
              <div className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  "Formé à l'École Ferrandi Paris.",
                  "Fondateur de La Cantine de Thomas à Bordeaux.",
                  "Je place 30 à 50 chefs avec des clients chaque mois.",
                  "Missions courtes en villas et yachts : 4 000–17 000€/semaine.",
                  "+10 restaurants accompagnés via Consult'in Food.",
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#c9a96e', fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', lineHeight: 1, marginTop: '2px' }}>—</span>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', color: '#a09880', lineHeight: 1.6 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(24px, 8vw, 120px)', background: '#0d0d0a' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p className="section-label" style={{ marginBottom: '16px', textAlign: 'center' }}>Questions fréquentes</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 300, marginBottom: '60px', textAlign: 'center' }}>
            Ce que vous voulez savoir.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { q: "C'est quoi l'audit gratuit ?", a: "Un appel de 30 minutes où on analyse votre situation : niveau, tarifs actuels, visibilité, blocages. Je vous dis exactement ce qui vous empêche de signer des missions à haute valeur. Sans engagement." },
              { q: "Je suis débutant. Est-ce que c'est pour moi ?", a: "L'accompagnement est ouvert à tous les niveaux. Ce qui compte, c'est votre sérieux et votre motivation. L'audit permet de définir le format le plus adapté à votre situation." },
              { q: "Est-ce que vous garantissez des missions ?", a: "Je ne peux pas garantir de missions — ça dépend de votre profil, votre disponibilité et la demande du moment. Ce que je garantis, c'est de vous donner le système et l'accès au réseau pour maximiser vos chances." },
              { q: "Comment se passe l'accompagnement au quotidien ?", a: "2 à 3 sessions par semaine en visio ou téléphone, support WhatsApp quotidien pour les questions urgentes, et accès prioritaire aux missions du réseau Chefs Talents." },
              { q: "Quel est le meilleur moment pour démarrer ?", a: "Maintenant. Juin et juillet arrivent dans quelques semaines. Les conciergeries bookent leurs chefs maintenant. Si vous n'êtes pas dans le réseau avant mai, vous ratez la saison." },
            ].map((faq, i) => (
              <div
                key={i}
                style={{ borderTop: '1px solid #1a1a16', padding: '24px 0', cursor: 'pointer' }}
                onClick={() => setActiveTab(activeTab === i ? -1 : i)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 400 }}>{faq.q}</h3>
                  <span style={{ color: '#c9a96e', fontSize: '24px', fontWeight: 300, lineHeight: 1 }}>{activeTab === i ? '−' : '+'}</span>
                </div>
                {activeTab === i && (
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', color: '#706a58', lineHeight: 1.7, marginTop: '16px', maxWidth: '680px' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: 'clamp(100px, 12vw, 160px) clamp(24px, 8vw, 120px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, #c9a96e0a 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="section-label" style={{ marginBottom: '24px' }}>3 places disponibles ce mois</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 300, lineHeight: 1.05, marginBottom: '32px', maxWidth: '800px', margin: '0 auto 32px' }}>
            Juin et juillet arrivent.<br />
            <em style={{ color: '#c9a96e' }}>Votre calendrier aussi.</em>
          </h2>
          <div className="divider-center" />
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', color: '#706a58', marginBottom: '48px', maxWidth: '500px', margin: '0 auto 48px', lineHeight: 1.7 }}>
            Réservez votre audit gratuit de 30 minutes.<br />
            On analyse votre situation. Vous repartez avec un plan.
          </p>
          <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer" className="cta-btn" style={{ fontSize: '16px', padding: '22px 56px' }}>
            Réserver mon audit gratuit →
          </a>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#403c30', marginTop: '24px' }}>
            Gratuit · 30 minutes · Sans engagement
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px clamp(24px, 8vw, 120px)', borderTop: '1px solid #1a1a16', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#403c30' }}>
          © 2026 Chefs Talents — Thomas Delcroix
        </p>
        <Link href="/" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: '#605a4a', textDecoration: 'none' }}>
          chefstalents.com
        </Link>
      </footer>

    </div>
  );
}
