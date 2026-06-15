'use client';

// MarkContractSignedModal — Marquer un contrat signé HORS YouSign
//
// 3 méthodes :
//   1. Lien externe (Google Drive, Dropbox, …)
//   2. Upload PDF (stocké dans Supabase Storage)
//   3. Juste marquer signé (cas "contrat physique scanné conservé ailleurs")
//
// Date personnalisable (par défaut aujourd'hui). Note libre.

import { useState } from 'react';
import { Loader2, FileSignature, Link as LinkIcon, FileUp, Check } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';
import { AdminModal } from '@/app/admin/_components/AdminModal';

type Method = 'external_link' | 'external_pdf' | 'manual';

export default function MarkContractSignedModal({
  missionId,
  onClose,
  onSaved,
}: {
  missionId: string;
  onClose: () => void;
  onSaved: (mission: any) => void;
}) {
  const [method, setMethod] = useState<Method>('external_link');
  const [signedAt, setSignedAt] = useState(new Date().toISOString().slice(0, 10));
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !saving && (
    (method === 'external_link' && /^https?:\/\/.+/i.test(url)) ||
    (method === 'external_pdf' && file !== null) ||
    method === 'manual'
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (method === 'external_pdf' && file) {
        const form = new FormData();
        form.append('file', file);
        form.append('signedAt', new Date(signedAt).toISOString());
        if (notes) form.append('notes', notes);
        const r = await adminFetchRaw(`/api/admin/missions/${missionId}/contract-signed/upload`, {
          method: 'POST',
          body: form,
        });
        const json = await r.json();
        if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
        onSaved(json.mission);
        return;
      }

      const json = await adminFetch<{ ok: boolean; mission: any; error?: string }>(
        `/api/admin/missions/${missionId}/contract-signed`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            method,
            signedAt: new Date(signedAt).toISOString(),
            url: method === 'external_link' ? url : undefined,
            notes: notes || undefined,
          }),
        },
      );
      if (!json.ok) throw new Error(json.error || 'Erreur');
      onSaved(json.mission);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      title="Marquer le contrat signé"
      subtitle="Pour les contrats signés hors YouSign"
      size="md"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} disabled={saving} className="px-3 py-1.5 text-xs text-white/75 hover:text-white">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center px-4 py-1.5 rounded-lg bg-emerald-400 text-emerald-950 text-xs font-medium hover:bg-emerald-300 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
            Confirmer signé
          </button>
        </>
      }
    >
      <div className="space-y-4">
          {/* Méthode */}
          <div>
            <label className="block text-xs text-white/55 mb-2">Méthode</label>
            <div className="space-y-1.5">
              <MethodOption
                value="external_link" active={method === 'external_link'} onSelect={setMethod}
                icon={LinkIcon} label="Lien externe"
                desc="Google Drive, Dropbox, OneDrive, etc."
              />
              <MethodOption
                value="external_pdf" active={method === 'external_pdf'} onSelect={setMethod}
                icon={FileUp} label="Upload du PDF"
                desc="Stocké côté Chefs Talents (max 20 MB)"
              />
              <MethodOption
                value="manual" active={method === 'manual'} onSelect={setMethod}
                icon={Check} label="Juste marquer signé"
                desc="Contrat conservé ailleurs, on coche juste"
              />
            </div>
          </div>

          {/* Champs selon méthode */}
          {method === 'external_link' && (
            <div>
              <label className="block text-xs text-white/55 mb-1.5">URL du contrat *</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Le lien sera ouvert dans un nouvel onglet depuis la fiche mission.
              </p>
            </div>
          )}

          {method === 'external_pdf' && (
            <div>
              <label className="block text-xs text-white/55 mb-1.5">PDF du contrat signé *</label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs text-white/85 file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-white/10 file:text-white/85 file:text-xs hover:file:bg-white/15"
              />
              {file && (
                <p className="text-[11px] text-emerald-300 mt-1.5 inline-flex items-center gap-1">
                  <FileUp className="w-3 h-3" /> {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs text-white/55 mb-1.5">Date de signature</label>
            <input
              type="date"
              value={signedAt}
              onChange={(e) => setSignedAt(e.target.value)}
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-white/55 mb-1.5">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Contexte du marquage, particularités du contrat…"
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
      </div>
    </AdminModal>
  );
}

function MethodOption({
  value, active, onSelect, icon: Icon, label, desc,
}: {
  value: Method;
  active: boolean;
  onSelect: (v: Method) => void;
  icon: typeof LinkIcon;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg border transition ${
        active
          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
          : 'border-white/10 bg-white/[0.02] text-white/75 hover:border-white/25'
      }`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] opacity-75">{desc}</div>
      </div>
    </button>
  );
}
