'use client';

import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';

interface AssignMissionModalProps {
  requestId: string;
  requestLocation?: string;
  requestStartDate?: string;
  requestEndDate?: string;
  requestGuestCount?: number;
  requestNotes?: string;
  onClose: () => void;
  onSuccess: (missionId: string) => void;
}

export default function AssignMissionModal({
  requestId,
  requestLocation,
  requestStartDate,
  requestEndDate,
  requestGuestCount,
  requestNotes,
  onClose,
  onSuccess,
}: AssignMissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    chefId: '',
    chefEmail: '',
    chefName: '',
    title: '',
    location: requestLocation || '',
    startDate: requestStartDate || '',
    endDate: requestEndDate || '',
    guestCount: requestGuestCount?.toString() || '',
    serviceLevel: '',
    notes: requestNotes || '',
    chefAmount: '',
    clientAmount: '',
    contractUrl: '',
  });

  const set = (patch: Partial<typeof form>) => setForm(prev => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.chefId || !form.chefEmail) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          chefId: form.chefId,
          chefEmail: form.chefEmail,
          chefName: form.chefName,
          title: form.title || `Mission — ${form.location}`,
          location: form.location,
          startDate: form.startDate,
          endDate: form.endDate,
          guestCount: form.guestCount ? Number(form.guestCount) : null,
          serviceLevel: form.serviceLevel,
          notes: form.notes,
          chefAmount: form.chefAmount ? Number(form.chefAmount) : null,
          clientAmount: form.clientAmount ? Number(form.clientAmount) : null,
          contractUrl: form.contractUrl,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        onSuccess(json.missionId);
      } else {
        alert(json.error || 'Error');
      }
    } catch (e) {
      console.error(e);
      alert('Server error');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 border border-white/10 bg-white/5 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30";
  const labelCls = "text-xs text-white/50 uppercase tracking-widest mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Assign a chef</h2>
            <p className="text-sm text-white/50 mt-1">The chef will receive an email with the mission details.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Chef info */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
            <p className="text-xs text-white/50 uppercase tracking-widest">Chef information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Chef ID (Supabase) *</label>
                <input required value={form.chefId} onChange={e => set({ chefId: e.target.value })}
                  placeholder="uuid..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Chef name</label>
                <input value={form.chefName} onChange={e => set({ chefName: e.target.value })}
                  placeholder="Thomas Dupont" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Chef email *</label>
              <input required type="email" value={form.chefEmail} onChange={e => set({ chefEmail: e.target.value })}
                placeholder="chef@example.com" className={inputCls} />
            </div>
          </div>

          {/* Mission details */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
            <p className="text-xs text-white/50 uppercase tracking-widest">Mission details</p>
            <div>
              <label className={labelCls}>Location</label>
              <input value={form.location} onChange={e => set({ location: e.target.value })}
                placeholder="Ibiza, Spain" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start date</label>
                <input type="date" value={form.startDate} onChange={e => set({ startDate: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End date</label>
                <input type="date" value={form.endDate} onChange={e => set({ endDate: e.target.value })}
                  className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Guests</label>
                <input type="number" value={form.guestCount} onChange={e => set({ guestCount: e.target.value })}
                  placeholder="8" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Service level</label>
                <input value={form.serviceLevel} onChange={e => set({ serviceLevel: e.target.value })}
                  placeholder="Full time / Dinner only..." className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes for the chef</label>
              <textarea value={form.notes} onChange={e => set({ notes: e.target.value })}
                rows={3} placeholder="Dietary restrictions, style preferences..." className={`${inputCls} resize-none`} />
            </div>
          </div>

          {/* Financials */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
            <p className="text-xs text-white/50 uppercase tracking-widest">Financials</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Chef fee (€)</label>
                <input type="number" value={form.chefAmount} onChange={e => set({ chefAmount: e.target.value })}
                  placeholder="3500" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Client price (€)</label>
                <input type="number" value={form.clientAmount} onChange={e => set({ clientAmount: e.target.value })}
                  placeholder="4200" className={inputCls} />
              </div>
            </div>
            {form.chefAmount && form.clientAmount && (
              <p className="text-xs text-white/40">
                Commission : <span className="text-white/70 font-medium">
                  {(Number(form.clientAmount) - Number(form.chefAmount)).toLocaleString('fr-FR')} €
                </span>
              </p>
            )}
          </div>

          {/* Contract */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <label className={labelCls}>Contract URL (Google Drive)</label>
            <input value={form.contractUrl} onChange={e => set({ contractUrl: e.target.value })}
              placeholder="https://drive.google.com/..." className={inputCls} />
            <p className="text-xs text-white/30 mt-2">Optional — you can add it later when confirming the mission.</p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading || !form.chefId || !form.chefEmail}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#161616] font-semibold text-sm hover:bg-white/90 transition disabled:opacity-40">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Sending...' : 'Assign & notify chef'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
