'use client';

// FloatingCTA — Barre d'action flottante en bas d'écran (mobile only),
// qui apparaît après que l'utilisateur ait scrollé hors du hero.
// Permet à Thomas de récupérer les clients qui scrollent longtemps sans
// jamais avoir à remonter chercher un CTA.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';

export default function FloatingCTA({ whatsappHref }: { whatsappHref: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Apparaît après 600px de scroll (= sortie du hero)
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3 bg-gradient-to-t from-[#f4efe8] via-[#f4efe8]/95 to-transparent transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex gap-2">
        <Link
          href="/request"
          className="flex-1 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#161616] px-5 text-sm font-medium text-white shadow-lg shadow-black/20"
        >
          Décrire mon besoin <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp Thomas"
          className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
