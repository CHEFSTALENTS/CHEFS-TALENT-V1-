'use client';

// MarkSentManuallyChip — Petit bouton compact pour marquer manuellement
// un envoi comme effectué hors plateforme (qualification request OU
// brief mission). Évite à Thomas de devoir passer par la modal +
// recopier ce qu'il a envoyé.
//
// Usage :
//   <MarkSentManuallyChip
//     endpoint="/api/admin/requests/abc/send-qualification"
//     label="Déjà envoyé"
//     onMarked={() => refresh()}
//   />
//
// Flow : clic → popover avec 2 boutons (Email / WhatsApp) → POST → refresh.

import { useState } from 'react';
import { Check, ChevronDown, Loader2, Mail, MessageCircle, X } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

export default function MarkSentManuallyChip({
  endpoint,
  onMarked,
  label = 'Déjà envoyé',
  buttonClassName,
}: {
  endpoint: string;
  onMarked: () => void;
  label?: string;
  /** Optionnel : surcharge le style du bouton trigger */
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMark = async (channel: 'email' | 'whatsapp') => {
    setSaving(true);
    setError(null);
    try {
      const json = await adminFetch<{ ok: boolean; error?: string }>(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          channel,
          manual: true,
          // pas de content : l'endpoint stocke "(Marqué envoyé manuellement hors plateforme)"
        }),
      });
      if (!json.ok) throw new Error(json.error || 'Erreur');
      setOpen(false);
      onMarked();
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ||
          'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-xs text-white/85 hover:bg-white/10 transition'
        }
      >
        <Check className="w-3.5 h-3.5" />
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop pour fermer au clic extérieur */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => !saving && setOpen(false)}
          />
          {/* Popover */}
          <div className="absolute z-40 mt-1.5 right-0 min-w-[220px] rounded-xl border border-white/10 bg-[#0e1116] shadow-2xl p-2">
            <div className="text-[10px] uppercase tracking-wider text-white/45 px-2 py-1.5 flex items-center justify-between">
              Canal utilisé
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                className="p-0.5 rounded hover:bg-white/10 text-white/45"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => handleMark('email')}
              disabled={saving}
              className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5 text-sky-300" />
              Email
            </button>
            <button
              onClick={() => handleMark('whatsapp')}
              disabled={saving}
              className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 disabled:opacity-50"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
              WhatsApp
            </button>
            {saving && (
              <div className="px-3 py-2 text-[11px] text-white/55 inline-flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Marquage en cours…
              </div>
            )}
            {error && (
              <div className="px-3 py-1.5 text-[11px] text-red-300 italic">
                {error}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
