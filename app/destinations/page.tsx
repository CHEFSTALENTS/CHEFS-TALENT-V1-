import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { destinations, getDestinationBySlug, getAllDestinationSlugs } from "@/lib/destinations";

export async function generateStaticParams() {
  return getAllDestinationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dest = getDestinationBySlug(params.slug);
  if (!dest) return {};
  return {
    title: dest.metaTitle,
    description: dest.metaDescription,
    alternates: { canonical: `https://chefstalents.com/destinations/${dest.slug}` },
    openGraph: {
      title: dest.metaTitle,
      description: dest.metaDescription,
      url: `https://chefstalents.com/destinations/${dest.slug}`,
      images: [{ url: dest.image, width: 1200, height: 630, alt: dest.heroTitle }],
    },
  };
}

export default function DestinationPage({ params }: { params: { slug: string } }) {
  const dest = getDestinationBySlug(params.slug);
  if (!dest) notFound();

  const related = destinations
    .filter((d) => d.slug !== dest.slug && d.country === dest.country)
    .slice(0, 3);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: dest.heroTitle,
    description: dest.description,
    url: `https://chefstalents.com/destinations/${dest.slug}`,
    provider: {
      "@type": "Organization",
      name: "Chefs Talents",
      url: "https://chefstalents.com",
    },
    areaServed: {
      "@type": "Place",
      name: dest.name,
      containedInPlace: {
        "@type": "Place",
        name: dest.country,
      },
    },
    offers: {
      "@type": "Offer",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "EUR",
        description: dest.rateRange,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main style={{ fontFamily: "'DM Sans', sans-serif", background: "#0c0c0c", color: "#f0ede8", minHeight: "100vh" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap');
          * { box-sizing: border-box; }

          .cta-main {
            display: inline-block;
            background: #e8842a;
            color: #fff;
            padding: 18px 36px;
            font-family: "DM Sans", sans-serif;
            font-size: 16px;
            font-weight: 700;
            text-decoration: none;
            border-radius: 12px;
            transition: all 0.2s;
          }
          .cta-main:hover { background: #f09040; transform: translateY(-2px); }

          .badge {
            display: inline-block;
            background: rgba(232,132,42,0.15);
            color: #e8842a;
            padding: 5px 14px;
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
            padding: 24px;
          }

          @media (max-width: 768px) {
            .grid-2 { grid-template-columns: 1fr !important; }
            .grid-3 { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* NAV */}
        <nav style={{ padding: "20px clamp(20px, 6vw, 80px)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1a1a" }}>
          <Link href="/" style={{ color: "#f0ede8", textDecoration: "none", fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em" }}>
            CHEFS TALENTS
          </Link>
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link href="/insights" style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}>Journal</Link>
            <a href="/request" style={{ background: "#e8842a", color: "#fff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: 700 }}>
              Soumettre une demande
            </a>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <img
              src={dest.image}
              alt={dest.heroTitle}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.35)" }}
            />
          </div>
          <div style={{ position: "relative", zIndex: 1, padding: "clamp(80px, 12vw, 140px) clamp(20px, 6vw, 80px)", maxWidth: "860px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              <span className="badge">{dest.country}</span>
              <span className="badge">{dest.region}</span>
            </div>
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.05, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "20px" }}>
              {dest.heroTitle.toUpperCase()}
            </h1>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(20px, 3vw, 28px)", fontStyle: "italic", color: "#e8842a", marginBottom: "16px" }}>
              {dest.heroSubtitle}
            </p>
            <p style={{ fontSize: "17px", color: "#aaa", lineHeight: 1.7, maxWidth: "560px", marginBottom: "40px", fontWeight: 300 }}>
              {dest.description}
            </p>
            <a href="/request" className="cta-main">
              Soumettre une demande →
            </a>
          </div>
        </section>

        {/* INFOS CLÉS */}
        <section style={{ padding: "clamp(60px, 8vw, 80px) clamp(20px, 6vw, 80px)", borderBottom: "1px solid #1a1a1a" }}>
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", maxWidth: "1000px" }}>
            <div className="card">
              <p style={{ fontSize: "12px", color: "#e8842a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Saison</p>
              <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>{dest.season}</p>
            </div>
            <div className="card">
              <p style={{ fontSize: "12px", color: "#e8842a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Tarifs</p>
              <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>{dest.rateRange}</p>
              <p style={{ fontSize: "13px", color: "#555" }}>{dest.rateDetail}</p>
            </div>
            <div className="card" style={{ background: "rgba(232,132,42,0.08)", border: "1px solid rgba(232,132,42,0.2)" }}>
              <p style={{ fontSize: "12px", color: "#e8842a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Délai de réservation</p>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#f0ede8" }}>{dest.bookingDelay}</p>
            </div>
          </div>
        </section>

        {/* HIGHLIGHTS + MISSIONS */}
        <section style={{ padding: "clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px)" }}>
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", maxWidth: "1000px" }}>
            <div>
              <span className="badge" style={{ marginBottom: "20px", display: "inline-block" }}>Notre sélection</span>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 3.5vw, 40px)", marginBottom: "24px", lineHeight: 1.1 }}>
                Ce que nos chefs<br />
                <em style={{ color: "#e8842a" }}>apportent à {dest.name}.</em>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {dest.highlights.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "14px 16px", background: "#111", borderRadius: "10px", border: "1px solid #1e1e1e" }}>
                    <span style={{ color: "#e8842a", fontWeight: 800, flexShrink: 0 }}>→</span>
                    <p style={{ fontSize: "15px", color: "#bbb", lineHeight: 1.5 }}>{h}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="badge" style={{ marginBottom: "20px", display: "inline-block" }}>Types de missions</span>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 3.5vw, 40px)", marginBottom: "24px", lineHeight: 1.1 }}>
                Missions disponibles<br />
                <em style={{ color: "#e8842a" }}>à {dest.name}.</em>
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px" }}>
                {dest.missionTypes.map((m, i) => (
                  <span key={i} style={{ background: "#161616", border: "1px solid #222", borderRadius: "100px", padding: "8px 16px", fontSize: "14px", color: "#aaa" }}>
                    {m}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div style={{ background: "#161616", border: "1px solid #222", borderRadius: "16px", padding: "28px" }}>
                <p style={{ fontSize: "13px", color: "#e8842a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                  Prêt à démarrer ?
                </p>
                <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
                  Décrivez votre mission en 2 minutes.
                </p>
                <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px", lineHeight: 1.6 }}>
                  Lieu, dates, nombre de convives, budget indicatif. Notre équipe identifie le bon profil.
                </p>
                <a href="/request" className="cta-main" style={{ display: "block", textAlign: "center" }}>
                  Soumettre une demande
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* DESTINATIONS LIÉES */}
        {related.length > 0 && (
          <section style={{ padding: "clamp(60px, 8vw, 80px) clamp(20px, 6vw, 80px)", borderTop: "1px solid #1a1a1a" }}>
            <p style={{ fontSize: "12px", color: "#e8842a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "24px" }}>
              Destinations proches
            </p>
            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", maxWidth: "1000px" }}>
              {related.map((d) => (
                <Link key={d.slug} href={`/destinations/${d.slug}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ transition: "border-color 0.2s", cursor: "pointer" }}>
                    <div style={{ height: "120px", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
                      <img src={d.image} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6)" }} />
                    </div>
                    <p style={{ fontSize: "11px", color: "#e8842a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{d.country}</p>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#f0ede8", marginBottom: "6px" }}>{d.name}</h3>
                    <p style={{ fontSize: "13px", color: "#555" }}>{d.rateRange} / semaine</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer style={{ padding: "32px clamp(20px, 6vw, 80px)", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontSize: "13px", color: "#333" }}>2026 Chefs Talents</p>
          <Link href="/insights" style={{ fontSize: "13px", color: "#444", textDecoration: "none" }}>Voir tous nos guides →</Link>
        </footer>
      </main>
    </>
  );
}
