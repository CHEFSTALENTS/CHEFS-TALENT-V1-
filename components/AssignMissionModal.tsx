'use client';

import React, { useState } from 'react';
import { X, Send, MessageCircle, Loader2 } from 'lucide-react';
import type { RequestEntity } from '@/types';
import { buildWhatsappBriefForChef, openWhatsappWithText, calcTarif } from '@/lib/whatsappBrief';

interface AssignMissionModalProps {
  request: RequestEntity;
  chefId: string;
  chefEmail: string;
  chefName: string;
  chefPhone?: string | null;
  onClose: () => void;
  onSuccess: (missionId: string) => void;
}

export default function AssignMissionModal({
  request,
  chefId,
  chefEmail,
  chefName,
  chefPhone,
  onClose,
  onSuccess,
}: AssignMissionModalProps) {
  const tarif = calcTarif(request);
  const firstName = chefName.split(' ')[0] || chefName;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    chefAmount: String(tarif.chefTotalMin),
    clientAmount: String(tarif.clientTotalMin),
    contractUrl: '',
    notes: (request as any).notes || '',
  });

  const set = (patch: Partial<typeof form>) => setForm(prev => ({ ...prev, ...patch }));

  const commission = form.chefAmount && form.clientAmount
    ? Number(form.clientAmount) - Number(form.chefAmount)
    : tarif.ctFeesMin;

  // Brief WhatsApp personnalisé avec le prénom du chef
  const buildPersonalizedBrief = () => {
    const baseBrief = buildWhatsappBriefForChef(request);
    const greeting = `Bonjour ${firstName} 👋\n\nNous avons une mission qui correspond à votre profil :\n\n`;
    // Remplace le montant calculé automatiquement par le montant saisi si différent
    let brief = greeting + baseBrief;
    if (form.chefAmount && Number(form.chefAmount) !== tarif.chefTotalMin) {
      const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
      brief = brief.replace(
        /💰 Rémunération proposée[\s\S]*?\(Base.*?\)/,
        `💰 Rémunération proposée :\n   ${fmt(Number(form.chefAmount))} net${tarif.days > 1 ? ` pour ${tarif.days} jours` : ''}`
      );
    }
    return brief;
  };

  const handleWhatsApp = () => {
    const brief = buildPersonalizedBrief();
    openWhatsappWithText(brief, chefPhone);
  };

  const handleEmail = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          chefId,
          chefEmail,
          chefName,
          title: `Mission — ${request.location || ''}`,
          location: request.location,
          startDate: request.dates?.start,
          endDate: request.dates?.end,
          guestCount: request.guestCount,
          serviceLevel: request.serviceLevel,
          notes: form.notes,
          chefAmount: form.chefAmount ? Number(form.chefAmount) : tarif.chefTotalMin,
          clientAmount: form.clientAmount ? Number(form.clientAmount) : tarif.clientTotalMin,
          contractUrl: form.contractUrl || null,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        onSuccess(json.missionId);
      } else {
        alert(json.error || 'Erreur');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 border border-white/10 bg-white/5 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30 transition";
  const labelCls = "text-xs text-white/50 uppercase tracking-widest mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-white">Proposer la mission</h2>
            <p className="text-xs text-white/50 mt-0.5">
              {chefName} · {chefEmail}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Résumé mission — lecture seule */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-sm">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Résumé mission</p>
            <div className="flex justify-between">
              <span className="text-white/55">Lieu</span>
              <span className="text-white">{request.location || '—'}</span>
            </div>
            {request.dates?.start && (
              <div className="flex justify-between">
                <span className="text-white/55">Dates</span>
                <span className="text-white">
                  {new Date(request.dates.start).toLocaleDateString('fr-FR')}
                  {request.dates?.end && ` → ${new Date(request.dates.end).toLocaleDateString('fr-FR')}`}
                </span>
              </div>
            )}
            {request.guestCount && (
              <div className="flex justify-between">
                <span className="text-white/55">Convives</span>
                <span className="text-white">{request.guestCount} pers.</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/55">Durée estimée</span>
              <span className="text-white">{tarif.days} jour{tarif.days > 1 ? 's' : ''} · {tarif.hoursPerDay}h/j</span>
            </div>
          </div>

          {/* Financials */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Financier</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Rémunération chef (€)</label>
                <input
                  type="number"
                  value={form.chefAmount}
                  onChange={e => set({ chefAmount: e.target.value })}
                  className={inputCls}
                />
                <p className="text-[10px] text-white/30 mt-1">
                  Auto : {tarif.chefTotalMin}–{tarif.chefTotalMax}€
                </p>
              </div>
              <div>
                <label className={labelCls}>Prix client (€)</label>
                <input
                  type="number"
                  value={form.clientAmount}
                  onChange={e => set({ clientAmount: e.target.value })}
                  className={inputCls}
                />
                <p className="text-[10px] text-white/30 mt-1">
                  Auto : {tarif.clientTotalMin}–{tarif.clientTotalMax}€
                </p>
              </div>
            </div>
            {commission > 0 && (
              <div className="flex justify-between text-xs pt-1 border-t border-white/10">
                <span className="text-white/50">Commission CT</span>
                <span className="text-amber-300 font-medium">{commission.toLocaleString('fr-FR')} €</span>
              </div>
            )}
          </div>

          {/* Contrat */}
          <div>
            <label className={labelCls}>Lien contrat Google Drive (optionnel)</label>
            <input
              type="text"
              value={form.contractUrl}
              onChange={e => set({ contractUrl: e.target.value })}
              placeholder="https://drive.google.com/..."
              className={inputCls}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes pour le chef (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={e => set({ notes: e.target.value })}
              rows={2}
              placeholder="Infos complémentaires..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            {/* WhatsApp — envoie le brief sans créer la mission en DB */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1fb85a] text-white text-sm font-semibold transition"
            >
              <MessageCircle className="w-4 h-4" />
              Envoyer via WhatsApp
            </button>

            {/* Email — crée la mission en Supabase + envoie email Resend */}
            <button
              type="button"
              onClick={handleEmail}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#161616] text-sm font-semibold hover:bg-white/90 transition disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Envoi...' : 'Envoyer par email + enregistrer'}
            </button>

            <p className="text-[10px] text-white/30 text-center">
              WhatsApp = message direct · Email = enregistré dans Supabase + notification chef
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full px-5 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
