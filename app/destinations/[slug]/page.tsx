"use client"
import type { Metadata } from "next";
import Link from "next/link";
import { destinations } from "@/lib/destinations";

export const metadata: Metadata = {
  title: "Nos Destinations | Chef Privé en Europe — Chefs Talents",
  description: "Trouvez un chef privé dans toutes les destinations premium d'Europe. Côte d'Azur, Ibiza, Mykonos, Courchevel, Monaco, Sardaigne et bien plus.",
  alternates: { canonical: "https://chefstalents.com/destinations" },
};

export default function DestinationsPage() {
  const france = destinations.filter((d) => d.country === "France");
  const europe = destinations.filter((d) => d.country !== "France");

  return (
    <main style={{ fontFamily: "'DM Sans', sans-serif", background: "#0c0c0c", color: "#f0ede8", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
        .dest-card { background: #161616; border: 1px solid #222; border-radius: 16px; overflow: hidden; text-decoration: none; color: #f0ede8; transition: border-color 0.2s; display: block; }
        .dest-card:hover { border-color: rgba(232,132,42,0.4); }
        .badge { display: inline-block; background: rgba(232,132,42,0.15); color: #e8842a; padding: 5px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* NAV */}
      <nav style={{ padding: "20px clamp(20px, 6vw, 80px)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1a1a" }}>
        <Link href="/" style={{ color: "#f0ede8", textDecoration: "none", fontWeight: 700, fontSize: "15px" }}>CHEFS TALENTS</Link>
        <a href="/request" style={{ background: "#e8842a", color: "#fff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: 700 }}>
          Soumettre une demande
        </a>
      </nav>

      {/* HERO */}
      <section style={{ padding: "clamp(80px, 10vw, 120px) clamp(20px, 6vw, 80px)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(232,132,42,0.07) 0%, transparent 55%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: "700px" }}>
          <span className="badge" style={{ marginBottom: "24px", display: "inline-block" }}>15 destinations</span>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "20px" }}>
            NOS DESTINATIONS<br />
            <span style={{ fontFamily: "'DM Serif Display', serif", textTransform: "none", fontWeight: 400, color: "#e8842a", fontStyle: "italic" }}>
              en Europe.
            </span>
          </h1>
          <p style={{ fontSize: "18px", color: "#888", lineHeight: 1.7, fontWeight: 300 }}>
            Chefs Talents couvre les destinations les plus prisées d'Europe. Trouvez un chef privé pour votre villa, yacht ou chalet — où que vous soyez.
          </p>
        </div>
      </section>

      {/* FRANCE */}
      <section style={{ padding: "0 clamp(20px, 6vw, 80px) clamp(60px, 8vw, 80px)" }}>
        <p style={{ fontSize: "12px", color: "#e8842a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "24px" }}>France</p>
        <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {france.map((d) => (
            <Link key={d.slug} href={`/destinations/${d.slug}`} className="dest-card">
              <div style={{ height: "160px", overflow: "hidden" }}>
                <img src={d.image} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5)", transition: "transform 0.4s" }} />
              </div>
              <div style={{ padding: "20px" }}>
                <p style={{ fontSize: "11px", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{d.region}</p>
                <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "6px" }}>{d.name}</h2>
                <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>{d.season}</p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#e8842a" }}>{d.rateRange} / sem.</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* EUROPE */}
      <section style={{ padding: "0 clamp(20px, 6vw, 80px) clamp(80px, 10vw, 120px)" }}>
        <p style={{ fontSize: "12px", color: "#e8842a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "24px" }}>Europe</p>
        <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {europe.map((d) => (
            <Link key={d.slug} href={`/destinations/${d.slug}`} className="dest-card">
              <div style={{ height: "160px", overflow: "hidden" }}>
                <img src={d.image} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5)" }} />
              </div>
              <div style={{ padding: "20px" }}>
                <p style={{ fontSize: "11px", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{d.country}</p>
                <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "6px" }}>{d.name}</h2>
                <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>{d.season}</p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#e8842a" }}>{d.rateRange} / sem.</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px)", textAlign: "center", borderTop: "1px solid #1a1a1a" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 4vw, 52px)", marginBottom: "16px" }}>
          Votre destination <em style={{ color: "#e8842a" }}>n'est pas listée ?</em>
        </h2>
        <p style={{ fontSize: "17px", color: "#666", marginBottom: "40px" }}>
          On couvre toute l'Europe. Soumettez votre demande — on trouve le bon profil.
        </p>
        <a href="/request" style={{ display: "inline-block", background: "#e8842a", color: "#fff", padding: "18px 40px", borderRadius: "12px", textDecoration: "none", fontSize: "16px", fontWeight: 700 }}>
          Soumettre une demande →
        </a>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px clamp(20px, 6vw, 80px)", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <p style={{ fontSize: "13px", color: "#333" }}>2026 Chefs Talents</p>
        <Link href="/" style={{ fontSize: "13px", color: "#444", textDecoration: "none" }}>chefstalents.com</Link>
      </footer>
    </main>
  );
}
