'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from './ui';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/conciergeries', label: 'Conciergeries' },
    { href: '/private-clients', label: 'Clients Privés' },
    { href: '/insights', label: 'Journal' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen flex flex-col font-sans text-stone-900 bg-paper transition-colors duration-500">
      {/* Header - Translucent Warmth */}
      <header className="fixed top-0 z-50 w-full border-b border-stone-200/50 bg-paper/80 backdrop-blur-md transition-all duration-300">
        <div className="max-w-[100rem] mx-auto flex h-24 items-center justify-between px-6 md:px-12">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-serif text-lg tracking-tight font-medium text-stone-900">CHEF TALENTS</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300 hover:text-stone-900 ${
                  isActive(link.href) ? 'text-stone-900 border-b border-stone-900 pb-1' : 'text-stone-500 border-b border-transparent pb-1'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block pl-8">
             <Link href="/request">
              <Button size="sm" className="bg-stone-900 text-paper hover:bg-stone-800">
                Soumettre une demande
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-stone-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-24 left-0 w-full bg-paper border-b border-stone-200 p-6 flex flex-col gap-6 animate-in slide-in-from-top-4 shadow-xl h-screen">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-3xl font-serif py-4 text-stone-800 border-b border-stone-200"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/chefs" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif py-4 text-stone-500">
              Espace Chefs
            </Link>
            <Link href="/request" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full h-16 text-lg mt-4">Soumettre une demande</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-0">
        {children}
      </main>

      {/* Footer - Warm Graphite */}
      <footer className="bg-stone-900 text-stone-400 py-32 border-t border-stone-800">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="space-y-8">
            <span className="font-serif text-2xl text-paper">CHEFS TALENTS</span>
            <p className="text-sm leading-relaxed max-w-xs font-light text-stone-500">
              La référence pour l'expérience culinaire privée en Europe. <br/>
              Service sur-mesure pour villas, yachts et résidences privées.
            </p>
          </div>

          <div>
            <h4 className="text-stone-300 font-medium mb-8 uppercase text-[10px] tracking-[0.2em]">Plateforme</h4>
            <ul className="space-y-4 text-sm font-light">
              <li><Link href="/conciergeries" className="hover:text-paper transition-colors">Conciergeries</Link></li>
              <li><Link href="/private-clients" className="hover:text-paper transition-colors">Clients Privés</Link></li>
              <li><Link href="/chefs" className="hover:text-paper transition-colors">Espace chef</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-stone-300 font-medium mb-8 uppercase text-[10px] tracking-[0.2em]">Légal</h4>
            <ul className="space-y-4 text-sm font-light">
              <li><Link href="/terms" className="hover:text-paper transition-colors">CGU & CGV</Link></li>
              <li><Link href="/privacy" className="hover:text-paper transition-colors">Confidentialité</Link></li>
              <li><Link href="/legal" className="hover:text-paper transition-colors">Mentions Légales</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-stone-300 font-medium mb-8 uppercase text-[10px] tracking-[0.2em]">Contact</h4>
            <ul className="space-y-4 text-sm font-light">
              <li>Bordeaux, France</li>
              <li>contact@chefstalents.com</li>
              <li className="pt-12 text-xs text-stone-600">
                © {new Date().getFullYear()} Chef Talents. Tous droits réservés.
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};
