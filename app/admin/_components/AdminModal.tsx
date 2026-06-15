'use client';

// AdminModal — composant modale robuste pour tout l'admin.
//
// Pourquoi c'est nécessaire :
//   - Les modales `fixed inset-0` qui se contentent d'être un descendant
//     d'un parent avec `transform`, `backdrop-filter`, `perspective`,
//     `filter` ou `will-change` deviennent positionnées RELATIVEMENT à
//     ce parent au lieu du viewport (spec CSS). Résultat : modale coincée
//     dans une zone étroite, impossible à remplir.
//   - On contourne via React Portal : on rend DIRECTEMENT dans
//     document.body. Aucun parent ne peut plus contraindre la modale.
//
// Bonus :
//   - Footer sticky pour que les boutons "Enregistrer / Annuler" restent
//     visibles même si le contenu déborde.
//   - Header sticky pour ne pas perdre le titre.
//   - Body scrollable, ne déborde jamais du viewport.
//   - Échap + click hors modale = fermer (configurable).
//   - Body scroll lock (la page derrière ne scroll plus quand modale ouverte).

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type AdminModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_CLASS: Record<AdminModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw]',
};

export function AdminModal({
  title,
  subtitle,
  children,
  footer,
  onClose,
  size = 'lg',
  closeOnBackdrop = true,
  closeOnEscape = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Boutons d'action — affichés en footer sticky en bas. Optionnel. */
  footer?: ReactNode;
  onClose: () => void;
  size?: AdminModalSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}) {
  // Mount detection — required for SSR-safe createPortal
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Echap pour fermer
  useEffect(() => {
    if (!closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, closeOnEscape]);

  // Body scroll lock quand modale ouverte
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${SIZE_CLASS[size]} my-2 sm:my-6 rounded-2xl border border-white/10 bg-[#0e1116] shadow-2xl flex flex-col max-h-[96vh] sm:max-h-[92vh]`}
      >
        {/* Header sticky en haut du modale */}
        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white truncate">{title}</h3>
            {subtitle && <p className="text-[11px] text-white/55 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg text-white/65 hover:bg-white/10 hover:text-white transition"
            aria-label="Fermer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer sticky en bas (si fourni) — boutons d'action toujours visibles */}
        {footer && (
          <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 bg-[#0e1116] rounded-b-2xl shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );

  // Portal vers document.body → échappe à tout containing block parent
  return createPortal(content, document.body);
}
