'use client';

// AddInteractionModal — Logger une interaction passée OU présente avec
// un apporteur. C'est ce qui permet de reconstituer l'historique
// rétroactivement.

import { useState } from 'react';
import { Loader2, X, Phone, MessageCircle, Mail, Coffee, Gift, Share2, ArrowRightLeft, StickyNote } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

type Kind = 'call' | 'whatsapp' | 'email' | 'meeting_irl' | 'gift' | 'social' | 'lead_received' | 'note';

const KIND_OPTIONS: { value: Kind; label: string; icon: typeof Phone }[] = [
  { value: 'call', label: 'Appel téléphonique', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting_irl', label: 'Rencontre / déjeuner / dîner', icon: Coffee },
  { value: 'gift', label: 'Cadeau / attention', icon: Gift },
  { value: 'social', label: 'Repost / réseaux', icon: Share2 },
  { value: 'lead_received', label: 'Lead reçu de leur part', icon: ArrowRightLeft },
  { value: 'note', label: 'Note libre', icon: StickyNote },
];

export default function AddInteractionModal({
  partnerId,
  partnerName,
  onClose,
  onCreated,
}: {
  partnerId: string;
  partnerName: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [kind, setKind] = useState<Kind>('call');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = summary.trim() !== '' && !saving;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const json = await adminFetch<{ ok: boolean; error?: string }>(
        `/api/admin/partners/${partnerId}/interactions`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            kind,
            occurred_at: new Date(occurredAt).toISOString(),
            summary,
          }),
        },
      );
      if (!json.ok) throw new Error(json.error || 'Erreur');
      onCreated();
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e1116] shadow-2xl">
        <header className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-semibold text-white">Logger une interaction</h3>
            <p className="text-[11px] text-white/45">Avec {partnerName}. Peut être saisi rétroactivement.</p>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1 rounded-lg hover:bg-white/10 text-white/55">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-white/55 mb-2">Type d'interaction</label>
            <div className="grid grid-cols-2 gap-2">
              {KIND_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = kind === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setKind(opt.value)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                      active
                        ? 'border-indigo-400/50 bg-indigo-400/15 text-indigo-100'
                        : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/55 mb-1.5">Date de l'interaction</label>
            <input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
            />
            <p className="text-[10px] text-white/40 mt-1">
              Tu peux mettre une date passée pour reconstituer un historique.
            </p>
          </div>

          <div>
            <label className="block text-xs text-white/55 mb-1.5">Note / contexte *</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Ex: A confirmé qu'il aurait 3 demandes pour villas Saint-Tropez en juillet. À relancer fin juin."
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10">
          <button onClick={onClose} disabled={saving} className="px-4 py-2.5 text-sm text-white/75 hover:text-white">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-indigo-400 text-indigo-950 text-sm font-medium hover:bg-indigo-300 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Enregistrer
          </button>
        </footer>
      </div>
    </div>
  );
}
