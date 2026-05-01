'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, Loader2, UserCheck } from 'lucide-react';
import type { ChefUser, RequestEntity } from '@/types';

interface SendProfilesPanelProps {
  req: RequestEntity;
  matchedChefs: ChefUser[];
  onSuccess: () => void;
}

export default function SendProfilesPanel({ req, matchedChefs, onSuccess }: SendProfilesPanelProps) {
  const [nccSigned, setNccSigned] = useState(false);
  const [nccUrl, setNccUrl] = useState('');
  const [selectedChefIds, setSelectedChefIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleChef = (id: string) => {
    setSelectedChefIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  const handleSend = async () => {
    if (!nccSigned || selectedChefIds.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/send-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: req.id,
          clientEmail: req.contact?.email,
          clientName: req.contact?.name || req.contact?.company,
          chefIds: selectedChefIds,
          nccUrl,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSent(true);
        onSuccess();
      } else {
        alert(json.error || 'Erreur');
      }
    } catch (e) {
      alert('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-emerald-200">Profils envoyés au client ✅</p>
        <p className="text-xs text-white/50 mt-1">Email envoyé à {req.contact?.email}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <UserCheck className="w-4 h-4 text-white/60" />
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Envoyer les profils au client</p>
      </div>

      {/* Étape 1 — NCC */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNccSigned(v => !v)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${nccSigned ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}
          >
            {nccSigned && <CheckCircle className="w-3 h-3 text-white" />}
          </button>
          <span className="text-sm text-white/80">NCC signé par le client</span>
        </div>
        {nccSigned && (
          <input
            type="text"
            value={nccUrl}
            onChange={e => setNccUrl(e.target.value)}
            placeholder="Lien DocuSign / Google Drive..."
            className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-lg text-white text-xs placeholder-white/30 focus:outline-none focus:border-white/30"
          />
        )}
      </div>

      {/* Étape 2 — Sélection chefs */}
      <div className="space-y-2">
        <p className="text-xs text-white/50">Sélectionnez 2 ou 3 chefs à présenter <span className="text-white/30">({selectedChefIds.length}/3)</span></p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {matchedChefs.slice(0, 10).map((chef) => {
            const p: any = chef.profile ?? {};
            const id = p.id || chef.id;
            const name = `${chef.firstName || p.firstName || ''} ${chef.lastName || p.lastName || ''}`.trim() || 'Chef';
            const city = p.baseCity || p.city || '—';
            const selected = selectedChefIds.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleChef(id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                  selected
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}>
                  {selected && <span className="text-white text-[8px] font-bold">✓</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate">{name}</p>
                  <p className="text-xs text-white/45 truncate">{city} · {p.years_experience || p.yearsExperience || '—'} ans exp.</p>
                </div>
                {selected && (
                  <span className="text-xs text-emerald-300 font-bold shrink-0">
                    #{selectedChefIds.indexOf(id) + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bouton envoi */}
      <button
        onClick={handleSend}
        disabled={!nccSigned || selectedChefIds.length < 2 || loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#161616] text-sm font-semibold hover:bg-white/90 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? 'Envoi...' : `Envoyer ${selectedChefIds.length} profil${selectedChefIds.length > 1 ? 's' : ''} au client`}
      </button>

      {!nccSigned && (
        <p className="text-xs text-white/30 text-center">Cochez "NCC signé" pour débloquer l'envoi</p>
      )}
      {nccSigned && selectedChefIds.length < 2 && (
        <p className="text-xs text-white/30 text-center">Sélectionnez au moins 2 chefs</p>
      )}
    </div>
  );
}
