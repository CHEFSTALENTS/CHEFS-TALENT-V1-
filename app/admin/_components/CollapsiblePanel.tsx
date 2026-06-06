'use client';

// CollapsiblePanel — panel admin pliable/dépliable avec persistance localStorage.
//
// Drop-in remplacement des Panel existants : signature compatible.
// L'état ouvert/fermé est mémorisé par `persistKey` (ou par `title` si non
// fourni) pour qu'on retrouve l'état précédent entre navigations.

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const STORAGE_PREFIX = 'admin-panel-open:';

export function CollapsiblePanel({
  title,
  subtitle,
  right,
  children,
  className = '',
  /** Ouvert par défaut au premier mount (avant restauration localStorage). */
  defaultOpen = true,
  /**
   * Clé unique pour persister l'état ouvert/fermé dans localStorage.
   * Si omis, dérive du `title`.
   * Mets `null` explicitement pour DÉSACTIVER la persistance.
   */
  persistKey,
  /**
   * Si true, le panel n'est PAS pliable (mode legacy compatible).
   */
  alwaysOpen = false,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  persistKey?: string | null;
  alwaysOpen?: boolean;
}) {
  const storageKey =
    persistKey === null
      ? null
      : STORAGE_PREFIX + (persistKey || title.toLowerCase().replace(/\s+/g, '-'));

  // SSR-safe : on commence avec defaultOpen, puis on hydrate depuis localStorage.
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') {
      setHydrated(true);
      return;
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === 'true' || stored === 'false') {
        setOpen(stored === 'true');
      }
    } catch {
      // localStorage indisponible (private mode, etc.) — on garde defaultOpen
    }
    setHydrated(true);
  }, [storageKey]);

  function toggle() {
    if (alwaysOpen) return;
    const next = !open;
    setOpen(next);
    if (storageKey && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className={`border border-white/10 rounded-2xl bg-white/5 backdrop-blur overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={alwaysOpen}
        className={`w-full p-4 border-b border-white/10 flex items-start justify-between gap-3 text-left ${
          alwaysOpen ? '' : 'hover:bg-white/[0.02] transition-colors cursor-pointer'
        }`}
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            {!alwaysOpen && (
              <ChevronDown
                className={`w-4 h-4 text-white/55 shrink-0 transition-transform duration-200 ${
                  open ? '' : '-rotate-90'
                }`}
              />
            )}
            <span>{title}</span>
          </div>
          {subtitle ? <div className="text-xs text-white/45 mt-0.5">{subtitle}</div> : null}
        </div>
        {right && (
          // stopPropagation pour que les contrôles interactifs (boutons,
          // badges cliquables) du `right` ne déclenchent pas le toggle.
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {right}
          </div>
        )}
      </button>
      {/* On garde le contenu dans le DOM même fermé pour préserver l'état
          des sous-composants (formulaires en cours, etc.), juste masqué. */}
      <div
        className={`overflow-hidden transition-all ${open && hydrated ? '' : 'max-h-0'}`}
        aria-hidden={!open}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
