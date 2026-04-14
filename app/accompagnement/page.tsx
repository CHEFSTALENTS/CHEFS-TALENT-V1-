"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

function CountUp({ end, duration = 2000, prefix = "", suffix = "" }: {
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

  return <span ref={ref}>{prefix}{count.toLocaleString("fr-FR")}{suffix}</span>;
}

const testimonials = [
  {
    text: "Depuis qu'on a commence j'ai signe 8 000 EUR sur mai, 7 500 EUR sur avril et 5 800 EUR deja confirme en aout.",
    tag: "Residence privee",
    amount: "21 300 EUR",
    period: "3 mois"
  },
  {
    text: "Juillet fully booked. On a signe a 17k EUR sur le mois avec le client US. Loge directement sur place.",
    tag: "Villa USA",
    amount: "17 000 EUR",
    period: "juillet"
  },
  {
    text: "Grand Prix Monaco, valide a 4 500 EUR pour le week-end. 12 personnes sur deux jours.",
    tag: "Monaco - Grand Prix",
    amount: "4 500 EUR",
    period: "week-end"
  },
  {
    text: "Juin - Juillet completement full a Ibiza.",
    tag: "Ibiza",
    amount: "2 mois",
    period: "fully booked"
  },
  {
    text: "Je viens de fermer un client d un mois pour Brunch a 7K EUR le mois!!!",
    tag: "Mission brunch",
    amount: "7 000 EUR",
    period: "/mois"
  },
];

export default function AccompagnementPage() {
  return (
    <div style={{
      fontFamily: "'DM Sans', 'Outfit', sans-serif",
      background: "#0c0c0c",
      color: "#f0ede8",
      minHeight: "100vh",
      overflowX: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cta-main {
          display: block;
          background: #e8842a;
          color: #fff;
          padding: 20px 40px;
          font-family: "DM Sans", sans-serif;
          font-size: 17px;
          font-weight: 700;
          text-decoration: none;
          border-radius: 14px;
          transition: all 0.2s ease;
          text-align: center;
        }
        .cta-main:hover {
          background: #f09040;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(232,132,42,0.3);
        }

        .badge {
          display: inline-block;
          background: rgba(232,132,42,0.15);
          color: #e8842a;
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .card {
          background: #161616;
          border: 1px solid #222;
          border-radius: 16px;
          padding: 28px;
          transition: border-color 0.2s;
        }
        .card:hover { border-color: rgba(232,132,42,0.3); }

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
          font-family: "DM Serif Display", serif;
          font-size: clamp(48px, 7vw, 72px);
          color: #e8842a;
          line-height: 1;
        }

        .hero-title {
          font-family: "DM Sans", sans-serif;
          font-size: clamp(36px, 6vw, 68px);
          font-weight: 900;
          line-height: 1.05;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .section-title {
          font-family: "DM Serif Display", serif;
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 400;
          line-height: 1.1;
        }

        @media (max-width: 768px) {
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .px-page { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "rgba(12,12,12,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1a1a1a"
      }}>
        <Link href="/" style={{ color: "#f0ede8", textDecoration: "none", fontWeight: 700, fontSize: "16px", letterSpacing: "-0.02em" }}>
          CHEFS TALENTS
        </Link>
        <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer"
          style={{ background: "#e8842a", color: "#fff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: 700 }}>
          Audit gratuit
        </a>
      </nav>

      {/* HERO */}
      <section className="px-page" style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "clamp(120px, 15vw, 160px) clamp(20px, 8vw, 100px) 80px",
        position: "relative"
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 60%, rgba(232,132,42,0.07) 0%, transparent 55%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: "860px", position: "relative" }}>
          <span className="badge" style={{ marginBottom: "32px", display: "inline-block" }}>
            Accompagnement Chef Prive
          </span>

          <h1 className="hero-title" style={{ marginBottom: "24px" }}>
            ARRETEZ DE CHERCHER<br />
            <span style={{ fontFamily: "'DM Serif Display', serif", textTransform: "none", fontWeight: 400, color: "#e8842a", fontStyle: "italic" }}>
              des missions.
            </span><br />
            LAISSEZ-LES VENIR.
          </h1>

          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#888", lineHeight: 1.7, maxWidth: "560px", marginBottom: "16px", fontWeight: 300 }}>
            Pour les chefs prives qui savent qu ils valent plus que ce qu ils facturent,
            mais qui ne savent pas comment acceder aux bonnes missions.
          </p>

          <p style={{ fontSize: "17px", color: "#aaa", marginBottom: "48px", fontWeight: 400 }}>
            Les chefs que j accompagne generent en moyenne{" "}
            <strong style={{ color: "#e8842a" }}>8 000 a 14 000 EUR/mois</strong>.
          </p>

          <div style={{ maxWidth: "420px" }}>
            <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer" className="cta-main">
              Reserver mon audit gratuit — 30 min
            </a>
            <p style={{ fontSize: "13px", color: "#444", textAlign: "center", marginTop: "12px" }}>
              Gratuit · Sans engagement · Places limitees
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-page" style={{
        padding: "clamp(60px, 8vw, 80px) clamp(20px, 8vw, 100px)",
        borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a"
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "48px", maxWidth: "900px", margin: "0 auto", textAlign: "center"
        }}>
          {[
            { num: 300, suffix: "+", label: "Chefs places depuis 2023" },
            { num: 14000, suffix: " EUR", label: "CA moyen genere par mois", prefix: "jusqu a " },
            { num: 200, suffix: "+", label: "Missions ponctuelles realisees" },
            { num: 4, suffix: " ans", label: "Experience chef prive" },
          ].map((s, i) => (
            <div key={i}>
              <div className="stat-big">
                <CountUp end={s.num} prefix={s.prefix ?? ""} suffix={s.suffix} />
              </div>
              <p style={{ fontSize: "13px", color: "#555", marginTop: "10px" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VIDEO */}
      <section className="px-page" style={{ padding: "clamp(80px, 10vw, 120px) clamp(20px, 8vw, 100px)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="badge" style={{ marginBottom: "16px", display: "inline-block" }}>
              Thomas Delcroix
            </span>
            <h2 className="section-title">
              Pourquoi ca marche.<br />
              <em style={{ color: "#e8842a" }}>En 2 minutes.</em>
            </h2>
          </div>

          {/* VIDEO PLAYER — remplacez le src par /videos/thomas-intro.mp4 une fois tourne */}
          <div style={{
            borderRadius: "20px", overflow: "hidden", background: "#111",
            border: "1px solid #222", position: "relative", aspectRatio: "16/9"
          }}>
            <video
              controls
              playsInline
              poster="/images/thomas-delcroix.jpg"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            >
              <source src="/videos/thomas-intro.mp4" type="video/mp4" />
            </video>

            {/* Overlay placeholder — disparait quand la video est chargee */}
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", background: "rgba(12,12,12,0.7)",
              borderRadius: "20px", pointerEvents: "none"
            }} id="video-placeholder">
              <div style={{
                width: "72px", height: "72px", background: "#e8842a", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px"
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#f0ede8" }}>Regarder la video</p>
              <p style={{ fontSize: "13px", color: "#666", marginTop: "6px" }}>2 minutes</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "24px" }} className="grid-3">
            {[
              { n: "200+", label: "Missions ponctuelles realisees" },
              { n: "Yacht", label: "Plusieurs mois en yachting prive" },
              { n: "300+", label: "Chefs places depuis 2023" },
            ].map((item, i) => (
              <div key={i} style={{ background: "#111", borderRadius: "12px", padding: "16px", textAlign: "center", border: "1px solid #1e1e1e" }}>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", color: "#e8842a", marginBottom: "6px" }}>{item.n}</p>
                <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.4 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMOIGNAGES */}
      <section className="px-page" style={{ padding: "clamp(80px, 10vw, 120px) clamp(20px, 8vw, 100px)", background: "#0a0a0a" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <span className="badge" style={{ marginBottom: "16px", display: "inline-block" }}>Resultats reels</span>
            <h2 className="section-title">
              Ce que disent les chefs<br />
              <em style={{ color: "#e8842a" }}>apres l accompagnement.</em>
            </h2>
          </div>

          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
            {testimonials.slice(0, 3).map((t, i) => (
              <div key={i} className="card">
                <span className="tag" style={{ marginBottom: "16px", display: "inline-block" }}>{t.tag}</span>
                <p style={{ fontSize: "16px", color: "#ccc", lineHeight: 1.6, marginBottom: "20px", fontStyle: "italic" }}>
                  "{t.text}"
                </p>
                <div style={{ borderTop: "1px solid #222", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "26px", color: "#e8842a", fontWeight: 400 }}>{t.amount}</span>
                  <span style={{ fontSize: "13px", color: "#555" }}>{t.period}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {testimonials.slice(3).map((t, i) => (
              <div key={i} className="card">
                <span className="tag" style={{ marginBottom: "16px", display: "inline-block" }}>{t.tag}</span>
                <p style={{ fontSize: "16px", color: "#ccc", lineHeight: 1.6, marginBottom: "20px", fontStyle: "italic" }}>
                  "{t.text}"
                </p>
                <div style={{ borderTop: "1px solid #222", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "26px", color: "#e8842a", fontWeight: 400 }}>{t.amount}</span>
                  <span style={{ fontSize: "13px", color: "#555" }}>{t.period}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Moyenne */}
          <div style={{
            marginTop: "40px", background: "rgba(232,132,42,0.07)",
            border: "1px solid rgba(232,132,42,0.2)", borderRadius: "16px",
            padding: "32px", textAlign: "center"
          }}>
            <p style={{ fontSize: "13px", color: "#e8842a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Moyenne des chefs accompagnes
            </p>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(36px, 5vw, 56px)", color: "#f0ede8" }}>
              8 000 <span style={{ color: "#555" }}>→</span> 14 000 EUR <span style={{ color: "#e8842a" }}>/mois</span>
            </p>
            <p style={{ fontSize: "14px", color: "#555", marginTop: "8px" }}>
              de chiffre d affaires genere apres l accompagnement
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-page" style={{
        padding: "clamp(100px, 12vw, 160px) clamp(20px, 8vw, 100px)",
        textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(232,132,42,0.07) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "640px", margin: "0 auto" }}>
          <span className="badge" style={{ marginBottom: "24px", display: "inline-block" }}>
            3 places disponibles ce mois
          </span>
          <h2 className="hero-title" style={{ marginBottom: "24px", fontSize: "clamp(36px, 5vw, 60px)" }}>
            JUIN ET JUILLET<br />
            <span style={{ fontFamily: "'DM Serif Display', serif", textTransform: "none", fontWeight: 400, color: "#e8842a", fontStyle: "italic", fontSize: "clamp(40px, 5.5vw, 66px)" }}>
              arrivent vite.
            </span>
          </h2>
          <p style={{ fontSize: "18px", color: "#666", marginBottom: "48px", lineHeight: 1.7 }}>
            30 minutes. On analyse votre situation.<br />
            Vous repartez avec un plan clair.
          </p>
          <a href="https://calendly.com/contact-chefstalents/30min" target="_blank" rel="noopener noreferrer" className="cta-main" style={{ maxWidth: "420px", margin: "0 auto", fontSize: "17px", padding: "22px 40px" }}>
            Reserver mon audit gratuit →
          </a>
          <p style={{ fontSize: "13px", color: "#333", marginTop: "16px" }}>
            Gratuit · 30 minutes · Sans engagement
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: "32px clamp(20px, 8vw, 100px)",
        borderTop: "1px solid #1a1a1a",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px"
      }}>
        <p style={{ fontSize: "13px", color: "#333" }}>2026 Chefs Talents — Thomas Delcroix</p>
        <Link href="/" style={{ fontSize: "13px", color: "#444", textDecoration: "none" }}>chefstalents.com</Link>
      </footer>
    </div>
  );
}
