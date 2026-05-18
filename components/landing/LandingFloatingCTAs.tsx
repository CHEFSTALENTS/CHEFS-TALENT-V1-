'use client';

// Bulles flottantes (sticky) sur les pages landing :
//   - WhatsApp (vert officiel) : ouvre wa.me avec message pré-rempli i18n
//   - Formulaire (stone, marque) : redirige vers /request
//
// Position : fixed bottom-right, stack vertical (formulaire au-dessus).
// Mobile-first, accessible, animation pulse subtile au mount.
//
// Affichage conditionnel : caché sur les routes back-office et le formulaire
// lui-même (pour éviter la redondance).

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

// Numéro WhatsApp Chefs Talents — format wa.me (sans +, sans espaces)
const WHATSAPP_NUMBER = '33756827612';

// Routes où on N'AFFICHE PAS les CTAs flottantes (pour ne pas perturber l'UX
// ou créer des redondances)
const HIDDEN_ON_PREFIXES = [
  '/admin',
  '/chef',
  '/request',
  '/api',
  '/login',
];

type Locale = 'fr' | 'en' | 'es';

function detectLocale(pathname: string): Locale {
  if (pathname.startsWith('/en')) return 'en';
  if (pathname.startsWith('/es')) return 'es';
  return 'fr';
}

const COPY: Record<Locale, {
  whatsappLabel: string;
  whatsappPrefill: string;
  formLabel: string;
}> = {
  fr: {
    whatsappLabel: 'Échanger sur WhatsApp',
    whatsappPrefill: 'Bonjour, je viens du site Chefs Talents — j\'aimerais des renseignements pour un chef privé.',
    formLabel: 'Décrire ma demande',
  },
  en: {
    whatsappLabel: 'Chat on WhatsApp',
    whatsappPrefill: 'Hello, I\'m visiting Chefs Talents — I\'d like more information about hiring a private chef.',
    formLabel: 'Describe my need',
  },
  es: {
    whatsappLabel: 'Hablar por WhatsApp',
    whatsappPrefill: 'Hola, visito el sitio Chefs Talents — me gustaría obtener información sobre la contratación de un chef privado.',
    formLabel: 'Describir mi solicitud',
  },
};

export default function LandingFloatingCTAs() {
  const pathname = usePathname() || '/';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Petit délai pour éviter le flash au montage SSR/CSR
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Hide sur back-office, espace chef, formulaire request, API
  const hidden = HIDDEN_ON_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (hidden) return null;

  const locale = detectLocale(pathname);
  const t = COPY[locale];

  // Lang prefix pour /request (en/es)
  const requestHref =
    locale === 'en' ? '/request?lang=en'
    : locale === 'es' ? '/request?lang=es'
    : '/request';

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.whatsappPrefill)}`;

  return (
    <div
      className={[
        'fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[60]',
        'flex flex-col items-end gap-3',
        'transition-all duration-500 ease-out',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none',
      ].join(' ')}
      aria-hidden={!mounted}
    >
      {/* 1. Bulle Formulaire (au-dessus) */}
      <Link
        href={requestHref}
        aria-label={t.formLabel}
        className={[
          'group relative flex items-center gap-2',
          'h-12 sm:h-14 px-4 sm:pl-4 sm:pr-5 rounded-full',
          'bg-stone-900 text-white hover:bg-stone-800',
          'shadow-[0_8px_30px_-4px_rgba(0,0,0,0.35)] hover:shadow-[0_14px_40px_-4px_rgba(0,0,0,0.45)]',
          'transition-all duration-200 ease-out hover:-translate-y-0.5',
          'ring-1 ring-stone-700/40',
        ].join(' ')}
      >
        <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </span>
        <span className="text-sm font-medium tracking-wide pr-1 hidden sm:inline">
          {t.formLabel}
        </span>
      </Link>

      {/* 2. Bulle WhatsApp (en bas) */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.whatsappLabel}
        className={[
          'group relative flex items-center gap-2',
          'h-12 sm:h-14 px-4 sm:pl-4 sm:pr-5 rounded-full',
          'bg-[#25D366] text-white hover:bg-[#1ebe5d]',
          'shadow-[0_8px_30px_-4px_rgba(37,211,102,0.45)] hover:shadow-[0_14px_40px_-4px_rgba(37,211,102,0.55)]',
          'transition-all duration-200 ease-out hover:-translate-y-0.5',
          'ring-1 ring-emerald-600/30',
        ].join(' ')}
      >
        {/* Pulse subtil pour attirer l'attention au scroll initial */}
        <span aria-hidden className="absolute inset-0 rounded-full bg-[#25D366] opacity-50 animate-ping pointer-events-none" style={{ animationDuration: '2.5s', animationIterationCount: 3 }} />
        <span className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15">
          {/* Icône WhatsApp officielle (SVG inline pour ne pas dépendre d'une lib) */}
          <svg
            viewBox="0 0 32 32"
            className="w-5 h-5 sm:w-6 sm:h-6 fill-white"
            aria-hidden="true"
          >
            <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.55-1.347.116-.243.247-.612.247-.875 0-.272-1.917-1.39-2.59-1.39zm-2.626 7.275c-1.39 0-2.78-.366-3.97-1.06l-4.7 1.49 1.516-4.504a8.347 8.347 0 0 1-1.18-4.302c0-4.612 3.756-8.367 8.367-8.367 4.612 0 8.367 3.755 8.367 8.367 0 4.612-3.755 8.367-8.367 8.367-.01 0-.02.01-.03.01zm0-18.474c-5.583 0-10.117 4.534-10.117 10.117 0 1.706.43 3.39 1.245 4.892L6 32l8.293-2.292a10.146 10.146 0 0 0 4.856 1.245C24.717 30.953 30 26.42 30 20.836S24.733 6.005 16.484 6.005z" />
          </svg>
        </span>
        <span className="text-sm font-medium tracking-wide pr-1 hidden sm:inline">
          WhatsApp
        </span>
      </a>
    </div>
  );
}
