'use client';

// Modal d'édition des données client (full name, email, phone, company)
// depuis la page mission /admin/missions/[id]. PATCH sur
// /api/admin/client-requests/[id].

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

type ClientLike = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  companyName: string | null;
  clientType: string | null;
};

export default function ClientEditor({
  client,
  onClose,
  onSaved,
}: {
  client: ClientLike;
  onClose: () => void;
  onSaved: (next: ClientLike) => void;
}) {
  const [form, setForm] = useState({
    fullName: client.fullName ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    companyName: client.companyName ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      fullName: client.fullName ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      companyName: client.companyName ?? '',
    });
  }, [client]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
        throw new Error('Email invalide');
      }

      const r = await adminFetchRaw(
        `/api/admin/client-requests/${encodeURIComponent(client.id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            fullName: form.fullName.trim() || null,
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            companyName: form.companyName.trim() || null,
          }),
        },
      );

      const json = await r.json().catch(() => ({} as any));
      if (!r.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }

      onSaved(json.client);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950 p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <div className="text-sm font-semibold text-white">Modifier le client</div>
            <div className="text-xs text-white/45 mt-0.5">
              Demande #{client.id.slice(0, 8)}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 rounded-lg text-white/55 hover:bg-white/10 transition disabled:opacity-40"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Nom complet">
            <input
              value={form.fullName}
              onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
              placeholder="Prénom Nom"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              placeholder="client@exemple.com"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </Field>

          <Field label="Téléphone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              placeholder="+33 6 12 34 56 78"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </Field>

          <Field label="Entreprise (si applicable)">
            <input
              value={form.companyName}
              onChange={(e) => setForm((s) => ({ ...s, companyName: e.target.value }))}
              placeholder="Nom de la conciergerie / société"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </Field>

          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 rounded-xl border border-white/10 bg-white text-sm font-medium text-[#161616] hover:bg-white/90 transition disabled:opacity-40"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-white/45 mb-1">{label}</div>
      {children}
    </div>
  );
}
