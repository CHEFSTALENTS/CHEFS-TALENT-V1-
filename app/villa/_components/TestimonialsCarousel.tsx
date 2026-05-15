'use client';

// Carousel témoignages auto-défilant en boucle infinie.
// Pure CSS animation (translate3d), pas de JS. Pause au hover.
//
// Trick : on duplique la liste 2× pour donner l'illusion d'une boucle
// infinie. L'animation translate de -50% fait défiler exactement la
// première moitié, puis recommence sans saut visible.

import { Quote } from 'lucide-react';

type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

export default function TestimonialsCarousel({
  testimonials,
  accent = '#7f1d1d',
}: {
  testimonials: Testimonial[];
  accent?: string;
}) {
  // Duplique pour la boucle infinie sans saut
  const list = [...testimonials, ...testimonials];

  return (
    <div className="testimonial-marquee group relative">
      <div className="testimonial-marquee-track">
        {list.map((t, i) => (
          <article
            key={`${t.author}-${i}`}
            className="testimonial-card"
          >
            <Quote
              className="h-7 w-7 shrink-0 opacity-60"
              style={{ color: accent }}
              strokeWidth={1.5}
            />
            <blockquote className="mt-4 text-[16px] font-light leading-7 text-[#161616]">
              « {t.quote} »
            </blockquote>
            <figcaption className="mt-5 text-[13px]">
              <span className="font-medium text-[#161616]">{t.author}</span>
              <span className="text-[#7d756a]"> — {t.role}</span>
            </figcaption>
          </article>
        ))}
      </div>

      {/* Fade left/right pour adoucir les bords */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-24 bg-gradient-to-r from-[#fef2f2] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-24 bg-gradient-to-l from-[#fef2f2] to-transparent" />

      <style jsx>{`
        .testimonial-marquee {
          width: 100%;
          overflow: hidden;
        }

        .testimonial-marquee-track {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          animation: marquee 60s linear infinite;
        }

        .testimonial-marquee:hover .testimonial-marquee-track {
          animation-play-state: paused;
        }

        .testimonial-card {
          flex: 0 0 auto;
          width: 320px;
          max-width: 85vw;
          background: #ffffff;
          border: 1px solid #e7e5e4;
          border-radius: 24px;
          padding: 1.75rem;
          box-shadow: 0 12px 32px -18px rgba(127, 29, 29, 0.18);
        }

        @media (min-width: 768px) {
          .testimonial-card {
            width: 380px;
            padding: 2rem;
          }
        }

        @keyframes marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .testimonial-marquee-track {
            animation: none;
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
