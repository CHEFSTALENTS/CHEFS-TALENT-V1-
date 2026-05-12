'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch';

type Category = 'integration' | 'formation' | 'autre';

type Entry = {
  id: string;
  occurred_at: string;
  category: Category;
  label: string;
  client_name: string | null;
  chef_id: string | null;
  amount_ht_cents: number;
  vat_rate: number;
  amount_ttc_cents: number;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const CATEGORY_LABEL: Record<Category, string> = {
  integration: 'Intégration',
  formation: 'Formation',
  autre: 'Autre',
};

function money(eur: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(eur || 0);
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function AdminRevenuePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<Category | ''>('');
  const [filterFrom, setFilterFrom] = useState<string>(startOfMonthIso());
  const [filterTo, setFilterTo] = useState<string>('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (filterCategory) qs.set('category', filterCategory);
      if (filterFrom) qs.set('from', filterFrom);
      if (filterTo) qs.set('to', filterTo);
      const url = `/api/admin/revenue/entries${qs.toString() ? `?${qs}` : ''}`;
      const json = await adminFetch<{ entries: Entry[] }>(url);
      setEntries(json.entries || []);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterFrom, filterTo]);

  const totals = useMemo(() => {
    let ht = 0;
    let ttc = 0;
    const byCat: Record<Category, { ht: number; count: number }> = {
      integration: { ht: 0, count: 0 },
      formation: { ht: 0, count: 0 },
      autre: { ht: 0, count: 0 },
    };
    for (const e of entries) {
      ht += e.amount_ht_cents;
      ttc += e.amount_ttc_cents;
      const cat = (e.category in byCat ? e.category : 'autre') as Category;
      byCat[cat].ht += e.amount_ht_cents;
      byCat[cat].count++;
    }
    return {
      htEur: ht / 100,
      vatEur: (ttc - ht) / 100,
      ttcEur: ttc / 100,
      count: entries.length,
      byCategory: byCat,
    };
  }, [entries]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Ventes manuelles</h1>
          <div className="text-xs text-white/45 mt-1">
            Intégrations, formations, autres ventes hors Stripe (virement bancaire).
          </div>
        </div>
        <Link
          href="/admin"
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
        >
          ← Dashboard
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi title="Total HT (filtré)" value={money(totals.htEur)} subtitle={`${totals.count} entrée${totals.count > 1 ? 's' : ''}`} />
        <Kpi title="TVA collectée" value={money(totals.vatEur)} subtitle="État" />
        <Kpi title="Intégration" value={money(totals.byCategory.integration.ht / 100)} subtitle={`${totals.byCategory.integration.count} entrée${totals.byCategory.integration.count > 1 ? 's' : ''}`} />
        <Kpi title="Formation" value={money(totals.byCategory.formation.ht / 100)} subtitle={`${totals.byCategory.formation.count} entrée${totals.byCategory.formation.count > 1 ? 's' : ''}`} />
      </div>

      {/* Saisie */}
      <EntryForm onSaved={load} />

      {/* Filtres + liste */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <div className="text-xs text-white/45 mb-1">Catégorie</div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as Category | '')}
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            >
              <option value="">Toutes</option>
              <option value="integration">Intégration</option>
              <option value="formation">Formation</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-white/45 mb-1">Depuis</div>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </div>
          <div>
            <div className="text-xs text-white/45 mb-1">Jusqu'à</div>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </div>
          <button
            onClick={() => { setFilterCategory(''); setFilterFrom(''); setFilterTo(''); }}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/10 transition"
          >
            Reset filtres
          </button>
        </div>

        {error ? (
          <div className="text-sm text-rose-300">{error}</div>
        ) : loading ? (
          <div className="text-sm text-white/50">Chargement…</div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-white/50">Aucune entrée sur la période.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/45 border-b border-white/10">
                  <th className="p-2">Date</th>
                  <th className="p-2">Catégorie</th>
                  <th className="p-2">Libellé</th>
                  <th className="p-2">Client</th>
                  <th className="p-2 text-right">HT</th>
                  <th className="p-2 text-right">TVA</th>
                  <th className="p-2 text-right">TTC</th>
                  <th className="p-2">Facture</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-2 text-white/75">{fmtDate(e.occurred_at)}</td>
                    <td className="p-2"><CategoryBadge category={e.category} /></td>
                    <td className="p-2 text-white">{e.label}</td>
                    <td className="p-2 text-white/70">{e.client_name || '—'}</td>
                    <td className="p-2 text-right text-white font-medium">{money(e.amount_ht_cents / 100)}</td>
                    <td className="p-2 text-right text-white/60">{e.vat_rate}%</td>
                    <td className="p-2 text-right text-white/85">{money(e.amount_ttc_cents / 100)}</td>
                    <td className="p-2 text-white/50 font-mono text-xs">{e.invoice_number || '—'}</td>
                    <td className="p-2 text-right">
                      <DeleteButton id={e.id} onDeleted={load} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  const map: Record<Category, string> = {
    integration: 'bg-amber-500/15 text-amber-200 border-amber-500/20',
    formation: 'bg-sky-500/15 text-sky-200 border-sky-500/20',
    autre: 'bg-white/10 text-white/70 border-white/10',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${map[category]}`}>
      {CATEGORY_LABEL[category]}
    </span>
  );
}

function Kpi({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/55">{title}</div>
      <div className="text-2xl font-semibold text-white mt-1">{value}</div>
      {subtitle ? <div className="text-xs text-white/40 mt-1">{subtitle}</div> : null}
    </div>
  );
}

function EntryForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    occurred_at: todayIso(),
    category: 'integration' as Category,
    label: '',
    client_name: '',
    chef_id: '',
    amount_ht_eur: '',
    vat_rate: '20' as '0' | '20',
    invoice_number: '',
    notes: '',
  });

  function reset() {
    setForm({
      occurred_at: todayIso(),
      category: 'integration',
      label: '',
      client_name: '',
      chef_id: '',
      amount_ht_eur: '',
      vat_rate: '20',
      invoice_number: '',
      notes: '',
    });
  }

  const amountHtNum = Number(form.amount_ht_eur);
  const vatNum = Number(form.vat_rate);
  const previewTtc = Number.isFinite(amountHtNum) && amountHtNum > 0
    ? amountHtNum * (1 + vatNum / 100)
    : null;

  async function handleSave() {
    setSaving(true);
    try {
      if (!form.label.trim()) throw new Error('Libellé requis');
      if (!Number.isFinite(amountHtNum) || amountHtNum <= 0) throw new Error('Montant HT invalide');

      await adminFetch('/api/admin/revenue/entries', {
        method: 'POST',
        body: JSON.stringify({
          occurred_at: form.occurred_at,
          category: form.category,
          label: form.label.trim(),
          client_name: form.client_name.trim() || null,
          chef_id: form.chef_id.trim() || null,
          amount_ht_cents: Math.round(amountHtNum * 100),
          vat_rate: vatNum,
          invoice_number: form.invoice_number.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      reset();
      setOpen(false);
      onSaved();
    } catch (e: any) {
      alert(e?.message || 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">Ajouter une vente</div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
        >
          {open ? 'Fermer' : '+ Nouvelle entrée'}
        </button>
      </div>

      {open ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Date du virement">
            <input
              type="date"
              value={form.occurred_at}
              onChange={(e) => setForm((s) => ({ ...s, occurred_at: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </Field>

          <Field label="Catégorie">
            <select
              value={form.category}
              onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as Category }))}
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            >
              <option value="integration">Intégration (avant création compte chef)</option>
              <option value="formation">Formation (chef du réseau)</option>
              <option value="autre">Autre</option>
            </select>
          </Field>

          <Field label="Libellé">
            <input
              value={form.label}
              onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
              placeholder="ex: Programme d'intégration — Chef X"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </Field>

          <Field label="Client (nom)">
            <input
              value={form.client_name}
              onChange={(e) => setForm((s) => ({ ...s, client_name: e.target.value }))}
              placeholder="Nom du client / particulier / entreprise"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </Field>

          <Field label="Montant HT (€)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount_ht_eur}
              onChange={(e) => setForm((s) => ({ ...s, amount_ht_eur: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </Field>

          <Field label="TVA">
            <select
              value={form.vat_rate}
              onChange={(e) => setForm((s) => ({ ...s, vat_rate: e.target.value as '0' | '20' }))}
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            >
              <option value="20">20% (France standard)</option>
              <option value="0">0% (exonéré / hors UE / auto-liquidation)</option>
            </select>
          </Field>

          <Field label="Numéro de facture (optionnel)">
            <input
              value={form.invoice_number}
              onChange={(e) => setForm((s) => ({ ...s, invoice_number: e.target.value }))}
              placeholder="ex: 2026-042"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
            />
          </Field>

          <Field label="Chef ID (optionnel)">
            <input
              value={form.chef_id}
              onChange={(e) => setForm((s) => ({ ...s, chef_id: e.target.value }))}
              placeholder="uuid chef du réseau si applicable"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white font-mono text-xs"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Notes (optionnel)">
              <textarea
                value={form.notes}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
              />
            </Field>
          </div>

          <div className="md:col-span-2 flex items-center justify-between mt-2">
            <div className="text-xs text-white/55">
              {previewTtc !== null ? (
                <>TTC = <span className="text-white font-medium">{money(previewTtc)}</span> (HT + {vatNum}%)</>
              ) : (
                'Saisis un montant HT pour voir le TTC.'
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      ) : null}
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

function DeleteButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!confirm('Supprimer cette entrée ?')) return;
        setBusy(true);
        try {
          await adminFetch(`/api/admin/revenue/entries/${id}`, { method: 'DELETE' });
          onDeleted();
        } catch (e: any) {
          alert(e?.message || 'Erreur suppression');
        } finally {
          setBusy(false);
        }
      }}
      className="text-xs text-rose-300 hover:text-rose-200 transition disabled:opacity-50"
      title="Supprimer"
    >
      Supprimer
    </button>
  );
}
