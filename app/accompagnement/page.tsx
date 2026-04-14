‘use client’;

import Link from ‘next/link’;
import { useState, useEffect, useRef } from ‘react’;

function CountUp({ end, duration = 2000, prefix = “”, suffix = “” }: {
end: number; duration?: number; prefix?: string; suffix?: string;
}) {
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

return <span ref={ref}>{prefix}{count.toLocaleString(‘fr-FR’)}{suffix}</span>;
}

const testimonials = [
{
text: “Depuis qu’on a commencé j’ai signé 8 000€ sur mai, 7 500€ sur avril et 5 800€ déjà confirmé en août.”,
name: “Chef accompagné”,
tag: “Résidence privée”,
amount: “21 300€”,
period: “3 mois”
},
{
text: “Juillet fully booked. On a signé à 17k€ sur le mois avec le client US. Logé directement sur place.”,
name: “Chef accompagné”,
tag: “Villa USA”,
amount: “17 000€”,
period: “juillet”
},
{
text: “Grand Prix Monaco, validé à 4 500€ pour le week-end. 12 personnes sur deux jours.”,
name: “Chef accompagné”,
tag: “Monaco — Grand Prix”,
amount: “4 500€”,
period: “week-end”
},
{
text: “Juin - Juillet complètement full à Ibiza.”,
name: “Chef accompagné”,
tag: “Ibiza”,
amount: “2 mois”,
period: “fully booked”
},
{
text: “Je viens de fermer un client d’un mois pour Brunch à 7K€ le mois!!!”,
name: “Chef accompagné”,
tag: “Mission brunch”,
amount: “7 000€”,
period: “/mois”
},
];

const missionTypes = [
{ icon: “🏝”, title: “Villas privées”, desc: “Côte d’Azur · Ibiza · Sardaigne · Grèce”, range: “4 000 – 15 000€” },
{ icon: “🛥”, title: “Yachts”, desc: “Méditerranée · Atlantique · Superyachts”, range: “5 000 – 17 000€” },
{ icon: “🏔”, title: “Chalets de luxe”, desc: “Courchevel · Megève · Val d’Isère”, range: “3 500 – 12 000€” },
{ icon: “🏎”, title: “Événements privés”, desc: “Grand Prix · Soirées · Anniversaires”, range: “2 000 – 8 000€” },
{ icon: “🏠”, title: “Résidences longue durée”, desc: “Familles UHNW · 1 semaine à plusieurs mois”, range: “6 000 – 18 000€” },
{ icon: “🌍”, title: “Missions internationales”, desc: “Monaco · Dubaï · Marrakech · Portugal”, range: “4 000 – 20 000€” },
];

export default function AccompagnementPage() {
const [openFaq, setOpenFaq] = useState<number | null>(null);

return (
<div style={{
fontFamily: “‘DM Sans’, ‘Outfit’, sans-serif”,
background: ‘#0c0c0c’,
color: ‘#f0ede8’,
minHeight: ‘100vh’,
overflowX: ‘hidden’
}}>
<style>{`
@import url(‘https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap’);
* { box-sizing: border-box; margin: 0; padding: 0; }

```
    .cta-main {
      display: inline-block;
      background: #e8842a;
      color: #fff;
      padding: 20px 40px;
      font-family: 'DM Sans', sans-serif;
      font-size: 16px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
      width: 100%;
      text-align: center;
    }
    .cta-main:hover { background: #f09040; transform: translateY(-2px); box-shadow: 0 8px 30px #e8842a44; }

    .cta-secondary {
      display: inline-block;
      background: transparent;
      color: #f0ede8;
      padding: 18px 40px;
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 500;
      text-decoration: none;
      border-radius: 12px;
      border: 1px solid #333;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .cta-secondary:hover { border-color: #e8842a; color: #e8842a; }

    .orange { color: #e8842a; }
    .orange-italic { color: #e8842a; font-style: italic; }

    .card {
      background: #161616;
      border: 1px solid #222;
      border-radius: 16px;
      padding: 28px;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: #e8842a44; }

    .badge {
      display: inline-block;
      background: #e8842a22;
      color: #e8842a;
      padding: 6px 14px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .tag {
      display: inline-block;
      background: #1e1e1e;
      color: #888;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 500;
    }

    .stat-big {
      font-family: 'DM Serif Display', serif;
      font-size: clamp(52px, 8vw, 80px);
      color: #e8842a;
      line-height: 1;
    }

    .section-title {
      font-family: 'DM Serif Display', serif;
      font-size: clamp(32px, 5vw, 56px);
      font-weight: 400;
      line-height: 1.1;
    }

    .hero-title {
      font-family: 'DM Sans', sans-serif;
      font-size: clamp(36px, 6vw, 68px);
      font-weight: 900;
      line-height: 1.05;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }

    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr !important; }
      .grid-3 { grid-template-columns: 1fr !important; }
      .grid-2-3 { grid-template-columns: 1fr !important; }
      .hide-mobile { display: none !important; }
      .px-page { padding-left: 20px !important; padding-right: 20px !important; }
    }
  `}</style>

  {/* NAV */}
  <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0c0c0cee', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1a1a' }}>
    <Link href="/" style={{ color: '#f0ede8', textDecoration: 'none', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>
      CHEFS TALENTS
    </Link>
    <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer" style={{ background: '#e8842a', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
      Audit gratuit →
    </a>
  </nav>

  {/* HERO */}
  <section className="px-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(120px, 15vw, 160px) clamp(20px, 8vw, 100px) 80px', position: 'relative' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 60%, #e8842a0c 0%, transparent 50%)', pointerEvents: 'none' }} />

    <div style={{ maxWidth: '900px', position: 'relative' }}>
      <span className="badge" style={{ marginBottom: '32px', display: 'inline-block' }}>Accompagnement · Chefs Privés</span>

      <h1 className="hero-title" style={{ marginBottom: '24px' }}>
        DÉCOUVREZ COMMENT<br />
        <span className="orange-italic" style={{ fontFamily: "'DM Serif Display', serif", textTransform: 'none', fontWeight: 400 }}>signer vos premières missions</span><br />
        À HAUTE VALEUR
      </h1>

      <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#888', lineHeight: 1.7, maxWidth: '580px', marginBottom: '16px', fontWeight: 300 }}>
        Pour les chefs privés qui savent qu'ils valent plus que ce qu'ils facturent,
        mais qui ne savent pas comment accéder aux bonnes missions.
      </p>

      <p style={{ fontSize: '16px', color: '#666', marginBottom: '48px' }}>
        Les chefs que j'accompagne génèrent en moyenne{' '}
        <strong style={{ color: '#e8842a' }}>8 000 à 14 000€/mois</strong>.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px' }}>
        <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer" className="cta-main">
          Réserver mon audit gratuit — 30 min
        </a>
        <p style={{ fontSize: '13px', color: '#555', textAlign: 'center' }}>
          Gratuit · Sans engagement · Places limitées
        </p>
      </div>
    </div>
  </section>

  {/* STATS */}
  <section className="px-page" style={{ padding: 'clamp(60px, 8vw, 80px) clamp(20px, 8vw, 100px)', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '48px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      {[
        { num: 300, suffix: '+', label: 'Chefs placés depuis 2023' },
        { num: 14000, suffix: '€', label: 'CA moyen/mois généré', prefix: 'jusqu\'à ' },
        { num: 200, suffix: '+', label: 'Missions ponctuelles réalisées' },
        { num: 4, suffix: ' ans', label: 'Chef privé & yachting' },
      ].map((s, i) => (
        <div key={i}>
          <div className="stat-big">
            <CountUp end={s.num} prefix={s.prefix ?? ''} suffix={s.suffix} />
          </div>
          <p style={{ fontSize: '13px', color: '#555', marginTop: '8px', fontWeight: 400 }}>{s.label}</p>
        </div>
      ))}
    </div>
  </section>

  {/* QUI EST THOMAS */}
  <section className="px-page" style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 8vw, 100px)' }}>
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px', alignItems: 'center' }}>

        {/* Photo */}
        <div style={{ position: 'relative' }}>
          <div style={{ borderRadius: '20px', overflow: 'hidden', aspectRatio: '4/5' }}>
            <img
              src="/images/thomas-delcroix.jpg"
              alt="Thomas Delcroix — Fondateur Chefs Talents"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            />
          </div>
          {/* Badge flottant */}
          <div style={{ position: 'absolute', bottom: '24px', left: '-24px', background: '#e8842a', borderRadius: '12px', padding: '16px 20px' }} className="hide-mobile">
            <p style={{ fontSize: '11px', color: '#fff9', marginBottom: '4px', fontWeight: 500 }}>Depuis 2023</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>+300 chefs placés</p>
          </div>
        </div>

        {/* Texte */}
        <div>
          <span className="badge" style={{ marginBottom: '24px', display: 'inline-block' }}>Thomas Delcroix</span>
          <h2 className="section-title" style={{ marginBottom: '24px' }}>
            Je connais<br />
            <em className="orange">cette industrie</em><br />
            de l'intérieur.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              "Chef privé depuis 2020 — j'ai exercé dans l'industrie avant de la structurer.",
              "Plusieurs mois de yachting privé en Méditerranée — je sais ce que les armateurs et conciergeries attendent vraiment.",
              "+200 missions ponctuelles réalisées dans des villas, chalets et résidences privées en Europe.",
              "Une dizaine de familles accompagnées sur des périodes longues — de une semaine à plusieurs mois.",
              "Depuis 2023 — j'ai placé plus de 300 chefs sur des missions à haute valeur via Chefs Talents.",
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px', background: '#111', borderRadius: '12px', border: '1px solid #1e1e1e' }}>
                <span style={{ color: '#e8842a', fontWeight: 800, fontSize: '18px', lineHeight: 1, marginTop: '1px', flexShrink: 0 }}>→</span>
                <p style={{ fontSize: '15px', color: '#bbb', lineHeight: 1.6, fontWeight: 400 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* TÉMOIGNAGES */}
  <section className="px-page" style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 8vw, 100px)', background: '#0a0a0a' }}>
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <span className="badge" style={{ marginBottom: '16px', display: 'inline-block' }}>Résultats réels</span>
        <h2 className="section-title">
          Ce que disent les chefs<br />
          <em className="orange">après l'accompagnement.</em>
        </h2>
      </div>

      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
        {testimonials.slice(0, 3).map((t, i) => (
          <div key={i} className="card">
            <span className="tag" style={{ marginBottom: '16px', display: 'inline-block' }}>{t.tag}</span>
            <p style={{ fontSize: '16px', color: '#ccc', lineHeight: 1.6, marginBottom: '20px', fontStyle: 'italic' }}>
              "{t.text}"
            </p>
            <div style={{ borderTop: '1px solid #222', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#e8842a', fontFamily: "'DM Serif Display', serif" }}>{t.amount}</span>
              <span style={{ fontSize: '13px', color: '#555' }}>{t.period}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {testimonials.slice(3).map((t, i) => (
          <div key={i} className="card">
            <span className="tag" style={{ marginBottom: '16px', display: 'inline-block' }}>{t.tag}</span>
            <p style={{ fontSize: '16px', color: '#ccc', lineHeight: 1.6, marginBottom: '20px', fontStyle: 'italic' }}>
              "{t.text}"
            </p>
            <div style={{ borderTop: '1px solid #222', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#e8842a', fontFamily: "'DM Serif Display', serif" }}>{t.amount}</span>
              <span style={{ fontSize: '13px', color: '#555' }}>{t.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Moyenne */}
      <div style={{ marginTop: '40px', background: '#e8842a11', border: '1px solid #e8842a33', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#e8842a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Moyenne des chefs accompagnés
        </p>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5vw, 56px)', color: '#f0ede8' }}>
          8 000 → 14 000€ <span style={{ color: '#e8842a' }}>/mois</span>
        </p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
          de chiffre d'affaires généré après l'accompagnement
        </p>
      </div>
    </div>
  </section>

  {/* TYPES DE MISSIONS */}
  <section className="px-page" style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 8vw, 100px)' }}>
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '60px' }}>
        <span className="badge" style={{ marginBottom: '16px', display: 'inline-block' }}>Le réseau</span>
        <h2 className="section-title">
          Les missions auxquelles<br />
          <em className="orange">vous aurez accès.</em>
        </h2>
      </div>

      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {missionTypes.map((m, i) => (
          <div key={i} className="card">
            <span style={{ fontSize: '32px', marginBottom: '16px', display: 'block' }}>{m.icon}</span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{m.title}</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', lineHeight: 1.5 }}>{m.desc}</p>
            <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: '16px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#e8842a' }}>{m.range}</span>
              <span style={{ fontSize: '12px', color: '#555' }}> / mission</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* COMMENT ÇA MARCHE */}
  <section className="px-page" style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 8vw, 100px)', background: '#0a0a0a' }}>
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <span className="badge" style={{ marginBottom: '16px', display: 'inline-block' }}>Le processus</span>
        <h2 className="section-title">
          De l'audit à votre<br />
          <em className="orange">première mission signée.</em>
        </h2>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {[
          { n: '01', title: 'Audit gratuit 30 min', desc: "On analyse votre situation : niveau, tarifs actuels, visibilité, blocages. Je vous dis exactement ce qui vous empêche de signer des missions à haute valeur." },
          { n: '02', title: 'Repositionnement & pricing', desc: "On affine votre offre et vos tarifs. Les clients comprennent immédiatement votre valeur. Vous arrêtez de sous-facturer." },
          { n: '03', title: "Système d'acquisition", desc: "Je vous donne le système qui amène les missions à vous. Réseaux sociaux, réseau Chefs Talents, stratégie proactive — pas passive." },
          { n: '04', title: 'Accès prioritaire au réseau', desc: "Vous accédez en priorité aux missions que je place chaque mois. Les profils dans le programme passent en premier." },
        ].map((step, i) => (
          <div key={i} className="card" style={{ position: 'relative' }}>
            <span style={{ fontSize: '56px', fontFamily: "'DM Serif Display', serif", color: '#1e1e1e', position: 'absolute', top: '16px', right: '24px', fontWeight: 400, lineHeight: 1 }}>{step.n}</span>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', maxWidth: '80%' }}>{step.title}</h3>
            <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.7 }}>{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* OFFRES */}
  <section className="px-page" style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 8vw, 100px)' }}>
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <span className="badge" style={{ marginBottom: '16px', display: 'inline-block' }}>L'investissement</span>
        <h2 className="section-title">Choisissez votre format.</h2>
        <p style={{ fontSize: '16px', color: '#666', marginTop: '16px' }}>
          Chaque accompagnement est sur-mesure. On définit ensemble le format adapté à votre situation.
        </p>
      </div>

      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          {
            name: 'Starter',
            duration: '1 mois',
            price: 'Prix sur demande',
            sub: 'Pour démarrer sur les bonnes bases',
            features: ['2 sessions mentorat/semaine', 'Support WhatsApp quotidien', 'Repositionnement + pricing', 'Stratégie réseaux sociaux', 'Accès réseau fin de programme'],
            featured: false,
          },
          {
            name: 'Accélération',
            duration: '2 mois',
            price: 'Prix sur demande',
            sub: 'Pour ceux qui veulent aller vite',
            features: ['Tout le Starter inclus', 'Système acquisition complet', 'Stratégie multi-réseaux', 'Mise en relation prioritaire dès le mois 2', "Suivi jusqu'aux premières missions"],
            featured: true,
          },
          {
            name: 'Transformation',
            duration: '3 mois',
            price: 'Prix sur demande',
            sub: 'Pour faire de cet été votre meilleur',
            features: ["Tout l'Accélération inclus", 'Accès réseau prioritaire dès le mois 1', 'Placement missions été 2026', 'Missions signées avant fin de programme', 'Accompagnement personnalisé total'],
            featured: false,
          },
        ].map((offer, i) => (
          <div key={i} style={{
            background: offer.featured ? '#161616' : '#111',
            border: offer.featured ? '2px solid #e8842a' : '1px solid #1e1e1e',
            borderRadius: '20px',
            padding: '32px',
            position: 'relative',
            transition: 'border-color 0.2s'
          }}>
            {offer.featured && (
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#e8842a', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 16px', borderRadius: '100px', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                LE PLUS POPULAIRE
              </div>
            )}
            <p style={{ fontSize: '12px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>{offer.duration}</p>
            <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>{offer.name}</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>{offer.sub}</p>
            <div style={{ borderTop: '1px solid #222', borderBottom: '1px solid #222', padding: '20px 0', marginBottom: '24px' }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#e8842a' }}>{offer.price}</span>
              <span style={{ fontSize: '13px', color: '#555' }}> HT</span>
            </div>
            <ul style={{ listStyle: 'none', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {offer.features.map((f, j) => (
                <li key={j} style={{ fontSize: '14px', color: '#aaa', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#e8842a', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer" className="cta-main" style={{ background: offer.featured ? '#e8842a' : 'transparent', border: offer.featured ? 'none' : '1px solid #333', color: offer.featured ? '#fff' : '#f0ede8', borderRadius: '12px', padding: '16px', display: 'block', textAlign: 'center', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}>
              Réserver un audit
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* FAQ */}
  <section className="px-page" style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 8vw, 100px)', background: '#0a0a0a' }}>
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <span className="badge" style={{ marginBottom: '16px', display: 'inline-block' }}>FAQ</span>
        <h2 className="section-title">Questions fréquentes.</h2>
      </div>
      {[
        { q: "C'est quoi l'audit gratuit ?", a: "Un appel de 30 minutes où on analyse votre situation : niveau, tarifs actuels, visibilité, blocages. Je vous dis exactement ce qui vous empêche de signer des missions à haute valeur. Sans engagement." },
        { q: "Je suis débutant, est-ce que c'est pour moi ?", a: "L'accompagnement est ouvert à tous les niveaux. Ce qui compte, c'est votre sérieux et votre motivation. L'audit permet de définir le format le plus adapté." },
        { q: "Est-ce que vous garantissez des missions ?", a: "Je ne peux pas garantir de missions — ça dépend de votre profil et de votre disponibilité. Ce que je garantis, c'est de vous donner le système et l'accès au réseau pour maximiser vos chances." },
        { q: "Comment se passe l'accompagnement au quotidien ?", a: "2 à 3 sessions par semaine en visio, support WhatsApp quotidien, et accès prioritaire aux missions du réseau Chefs Talents." },
        { q: "Quel est le meilleur moment pour démarrer ?", a: "Maintenant. Juin et juillet arrivent dans quelques semaines. Les conciergeries bookent leurs chefs maintenant. Si vous n'êtes pas dans le réseau avant mai, vous ratez la saison." },
      ].map((faq, i) => (
        <div key={i} style={{ borderTop: '1px solid #1a1a1a', padding: '24px 0', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{faq.q}</h3>
            <span style={{ color: '#e8842a', fontSize: '24px', fontWeight: 300, flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
          </div>
          {openFaq === i && (
            <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.7, marginTop: '16px' }}>{faq.a}</p>
          )}
        </div>
      ))}
    </div>
  </section>

  {/* CTA FINAL */}
  <section className="px-page" style={{ padding: 'clamp(100px, 12vw, 160px) clamp(20px, 8vw, 100px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, #e8842a0a 0%, transparent 60%)', pointerEvents: 'none' }} />
    <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
      <span className="badge" style={{ marginBottom: '24px', display: 'inline-block' }}>3 places disponibles ce mois</span>
      <h2 className="hero-title" style={{ marginBottom: '24px', fontSize: 'clamp(36px, 5vw, 64px)' }}>
        JUIN ET JUILLET<br />
        <span className="orange-italic" style={{ fontFamily: "'DM Serif Display', serif", textTransform: 'none', fontWeight: 400, fontSize: 'clamp(40px, 5.5vw, 68px)' }}>arrivent vite.</span>
      </h2>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '48px', lineHeight: 1.7 }}>
        Réservez votre audit gratuit de 30 minutes.<br />
        On analyse votre situation. Vous repartez avec un plan.
      </p>
      <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer" className="cta-main" style={{ maxWidth: '420px', display: 'block', margin: '0 auto', fontSize: '17px', padding: '22px 40px', borderRadius: '14px' }}>
        Réserver mon audit gratuit →
      </a>
      <p style={{ fontSize: '13px', color: '#444', marginTop: '16px' }}>Gratuit · 30 minutes · Sans engagement</p>
    </div>
  </section>

  {/* FOOTER */}
  <footer style={{ padding: '32px clamp(20px, 8vw, 100px)', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
    <p style={{ fontSize: '13px', color: '#444' }}>© 2026 Chefs Talents — Thomas Delcroix</p>
    <Link href="/" style={{ fontSize: '13px', color: '#555', textDecoration: 'none' }}>chefstalents.com</Link>
  </footer>
</div>
```

);
}
