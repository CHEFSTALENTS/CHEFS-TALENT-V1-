'use client';

// Plan de paiement pour une mission — N échéances illimitées.
//
// Workflow :
//   1. Admin clique « + Ajouter une échéance » → form inline (date, montant, label)
//   2. Validation → POST /api/admin/missions/[id]/payments
//   3. Affiche tableau : Date | Montant | Status | Méthode | Réf | Actions
//   4. Actions par row : marquer payée, marquer relancée, éditer, supprimer
//   5. Récap en-tête : Total dû / Payé / Restant / En retard
//
// Status visuel :
//   🟢 paid     = vert
//   🔴 overdue  = rouge (status='pending' + due_date < today)
//   🟠 pending  = ambre
//   ⚪ cancelled = gris

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit2,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

type PaymentMethod = 'virement' | 'cb_link' | 'revolut' | 'stripe' | 'especes' | 'cheque' | 'autre';

type PaymentItem = {
  id: string;
  missionId: string;
  amountEur: number;
  dueDate: string;
  label: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  isOverdue: boolean;
  daysOverdue: number;
  paidAt: string | null;
  paidAmountEur: number | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  lastRemindedAt: string | null;
  reminderCount: number;
  notes: string | null;
};

type Totals = {
  totalDue: number;
  totalPaid: number;
  totalRemaining: number;
  totalOverdue: number;
  overdueCount: number;
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  virement: 'Virement',
  cb_link: 'Lien CB',
  revolut: 'Revolut',
  stripe: 'Stripe',
  especes: 'Espèces',
  cheque: 'Chèque',
  autre: 'Autre',
};

function fmtEur(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export default function PaymentPlanPanel({ missionId }: { missionId: string }) {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Form ajout
  const [showAdd, setShowAdd] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newLabel, setNewLabel] = useState('');

  // Modal mark-paid
  const [paymentBeingPaid, setPaymentBeingPaid] = useState<PaymentItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetchRaw(`/api/admin/missions/${encodeURIComponent(missionId)}/payments`);
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setItems(json.items as PaymentItem[]);
      setTotals(json.totals as Totals);
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => { load(); }, [load]);

  async function addPayment() {
    const amt = Number(newAmount);
    if (!Number.isFinite(amt) || amt <= 0) { alert('Montant invalide'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) { alert('Date invalide'); return; }
    setBusy(true);
    try {
      const r = await adminFetchRaw(`/api/admin/missions/${encodeURIComponent(missionId)}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amountEur: amt, dueDate: newDate, label: newLabel || null }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setShowAdd(false);
      setNewDate(''); setNewAmount(''); setNewLabel('');
      await load();
    } catch (e: any) {
      alert(`Erreur : ${e?.message || 'inconnue'}`);
    } finally { setBusy(false); }
  }

  async function action(paymentId: string, body: any) {
    setBusy(true);
    try {
      const r = await adminFetchRaw(`/api/admin/missions/${encodeURIComponent(missionId)}/payments/${encodeURIComponent(paymentId)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: any) {
      alert(`Erreur : ${e?.message || 'inconnue'}`);
    } finally { setBusy(false); }
  }

  async function del(paymentId: string) {
    if (!confirm('Supprimer cette échéance définitivement ?')) return;
    setBusy(true);
    try {
      const r = await adminFetchRaw(`/api/admin/missions/${encodeURIComponent(missionId)}/payments/${encodeURIComponent(paymentId)}`, {
        method: 'DELETE',
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: any) {
      alert(`Erreur : ${e?.message || 'inconnue'}`);
    } finally { setBusy(false); }
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-white/55 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement plan de paiement…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-sm text-red-300 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Récap totaux */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatCard label="Total dû" value={fmtEur(totals.totalDue)} icon={<Wallet className="w-3.5 h-3.5" />} tone="neutral" />
          <StatCard label="Encaissé" value={fmtEur(totals.totalPaid)} icon={<CheckCircle2 className="w-3.5 h-3.5" />} tone="success" />
          <StatCard label="Reste à recevoir" value={fmtEur(totals.totalRemaining)} icon={<Clock className="w-3.5 h-3.5" />} tone="warning" />
          <StatCard
            label={`En retard${totals.overdueCount > 0 ? ` (${totals.overdueCount})` : ''}`}
            value={fmtEur(totals.totalOverdue)}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            tone={totals.totalOverdue > 0 ? 'danger' : 'neutral'}
          />
        </div>
      )}

      {/* Tableau échéances */}
      {items.length === 0 ? (
        <div className="border border-dashed border-white/15 rounded-xl p-6 text-center text-sm text-white/50">
          Aucune échéance définie. Ajoute la première ci-dessous pour suivre le paiement échelonné.
        </div>
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr_1.2fr_1.5fr_auto] gap-2 px-3 py-2 bg-white/5 text-[10px] uppercase tracking-wider text-white/45 font-semibold">
            <div>Date</div>
            <div>Montant</div>
            <div>Statut</div>
            <div>Méthode</div>
            <div>Réf / Notes</div>
            <div className="text-right">Actions</div>
          </div>
          {items.map((it) => (
            <PaymentRow
              key={it.id}
              item={it}
              busy={busy}
              onMarkPaid={() => setPaymentBeingPaid(it)}
              onUnmarkPaid={() => action(it.id, { action: 'unmark-paid' })}
              onMarkReminded={() => action(it.id, { action: 'mark-reminded' })}
              onCancel={() => action(it.id, { action: 'cancel' })}
              onDelete={() => del(it.id)}
            />
          ))}
        </div>
      )}

      {/* Form ajout */}
      {showAdd ? (
        <div className="border border-white/15 bg-white/5 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Date échéance</span>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white" />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Montant (€)</span>
              <input type="number" min="0" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                placeholder="1800"
                className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25" />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Label (optionnel)</span>
              <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Acompte 30%, Versement 1/3..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => { setShowAdd(false); setNewDate(''); setNewAmount(''); setNewLabel(''); }}
              className="px-3 py-1.5 text-xs rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10">
              Annuler
            </button>
            <button onClick={addPayment} disabled={busy}
              className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-emerald-400 text-emerald-950 font-medium hover:bg-emerald-300 disabled:opacity-50">
              {busy ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              Créer l'échéance
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition">
          <Plus className="w-4 h-4" /> Ajouter une échéance
        </button>
      )}

      {/* Modal mark-paid */}
      {paymentBeingPaid && (
        <MarkPaidModal
          payment={paymentBeingPaid}
          busy={busy}
          onClose={() => setPaymentBeingPaid(null)}
          onConfirm={async (data) => {
            await action(paymentBeingPaid.id, { action: 'mark-paid', ...data });
            setPaymentBeingPaid(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, tone,
}: {
  label: string; value: string; icon: React.ReactNode;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const tones: Record<string, string> = {
    neutral: 'border-white/10 bg-white/5 text-white',
    success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
    warning: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
    danger: 'border-red-400/40 bg-red-400/10 text-red-100',
  };
  return (
    <div className={`rounded-xl border px-3 py-2 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-70">
        {icon} {label}
      </div>
      <div className="text-base font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function StatusBadge({ status, isOverdue }: { status: PaymentItem['status']; isOverdue: boolean }) {
  if (status === 'paid') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-400/15 border border-emerald-400/30 text-emerald-200"><CheckCircle2 className="w-3 h-3" /> Payée</span>;
  }
  if (status === 'cancelled') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-stone-400/15 border border-stone-400/30 text-stone-200"><X className="w-3 h-3" /> Annulée</span>;
  }
  if (isOverdue) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-400/15 border border-red-400/40 text-red-200"><AlertTriangle className="w-3 h-3" /> En retard</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-400/15 border border-amber-400/30 text-amber-200"><Clock className="w-3 h-3" /> À venir</span>;
}

function PaymentRow({
  item, busy,
  onMarkPaid, onUnmarkPaid, onMarkReminded, onCancel, onDelete,
}: {
  item: PaymentItem; busy: boolean;
  onMarkPaid: () => void;
  onUnmarkPaid: () => void;
  onMarkReminded: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid grid-cols-[1.2fr_1fr_0.8fr_1.2fr_1.5fr_auto] gap-2 items-center px-3 py-2.5 border-t border-white/10 text-sm">
      <div>
        <div className="text-white font-medium">{fmtDate(item.dueDate)}</div>
        {item.label && <div className="text-[11px] text-white/45 mt-0.5">{item.label}</div>}
      </div>
      <div className="text-white font-semibold">{fmtEur(item.amountEur)}</div>
      <div>
        <StatusBadge status={item.status} isOverdue={item.isOverdue} />
        {item.isOverdue && (
          <div className="text-[10px] text-red-300/80 mt-0.5">+{item.daysOverdue}j de retard</div>
        )}
      </div>
      <div className="text-xs text-white/65">
        {item.paymentMethod ? METHOD_LABELS[item.paymentMethod] : '—'}
        {item.paidAt && (
          <div className="text-[10px] text-white/40 mt-0.5">le {fmtDate(item.paidAt.slice(0, 10))}</div>
        )}
      </div>
      <div className="text-xs text-white/65 truncate" title={item.paymentReference || item.notes || ''}>
        {item.paymentReference || item.notes || '—'}
        {item.reminderCount > 0 && (
          <span className="ml-1 text-[10px] text-amber-300/70" title={`Dernière relance : ${item.lastRemindedAt ? fmtDate(item.lastRemindedAt.slice(0, 10)) : '—'}`}>
            · {item.reminderCount} relance{item.reminderCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 justify-end">
        {item.status === 'pending' && (
          <>
            <button onClick={onMarkPaid} disabled={busy}
              className="px-2 py-1 text-[11px] rounded-md border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15 disabled:opacity-50"
              title="Marquer comme payée">
              ✓ Payée
            </button>
            {item.isOverdue && (
              <button onClick={onMarkReminded} disabled={busy}
                className="px-2 py-1 text-[11px] rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15 disabled:opacity-50"
                title="Marquer comme relancée (incrémente le compteur de relances)">
                <RefreshCcw className="w-3 h-3 inline mr-0.5" />Relancé
              </button>
            )}
          </>
        )}
        {item.status === 'paid' && (
          <button onClick={onUnmarkPaid} disabled={busy}
            className="px-2 py-1 text-[11px] rounded-md border border-white/10 bg-white/5 text-white/65 hover:bg-white/10 disabled:opacity-50"
            title="Repasser en attente">
            ↩ Annuler paiement
          </button>
        )}
        {item.status === 'pending' && (
          <button onClick={onCancel} disabled={busy}
            className="p-1 text-white/40 hover:text-white/65 disabled:opacity-50"
            title="Annuler cette échéance (n'est plus comptée dans le total dû)">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={onDelete} disabled={busy}
          className="p-1 text-white/40 hover:text-red-300 disabled:opacity-50"
          title="Supprimer définitivement">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function MarkPaidModal({
  payment, busy,
  onClose, onConfirm,
}: {
  payment: PaymentItem;
  busy: boolean;
  onClose: () => void;
  onConfirm: (data: { paidAmountEur: number; paymentMethod: PaymentMethod; paymentReference?: string; paidAt: string }) => void;
}) {
  const [amount, setAmount] = useState(String(payment.amountEur));
  const [method, setMethod] = useState<PaymentMethod>('virement');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));

  const amt = Number(amount);
  const valid = Number.isFinite(amt) && amt > 0 && !!method && !!paidAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="w-full max-w-md bg-[#0f0f10] border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Marquer comme payée</h3>
          <button onClick={onClose} disabled={busy} className="p-1 text-white/55 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-white/55">
          Échéance du <strong className="text-white">{fmtDate(payment.dueDate)}</strong> — prévu : <strong className="text-white">{fmtEur(payment.amountEur)}</strong>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Montant reçu (€)</span>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white" />
          </label>
          <label className="block">
            <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Date</span>
            <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white" />
          </label>
        </div>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Méthode</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white">
            {Object.entries(METHOD_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="bg-neutral-900">{v}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Référence (optionnel)</span>
          <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
            placeholder="n° virement, ID Stripe, etc."
            className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25" />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={busy} className="px-3 py-1.5 text-sm rounded-lg border border-white/10 bg-white/5 text-white/85 hover:bg-white/10">
            Annuler
          </button>
          <button
            onClick={() => onConfirm({ paidAmountEur: amt, paymentMethod: method, paymentReference: reference || undefined, paidAt })}
            disabled={!valid || busy}
            className="inline-flex items-center px-4 py-1.5 text-sm rounded-lg bg-emerald-400 text-emerald-950 font-medium hover:bg-emerald-300 disabled:opacity-50">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
            Confirmer le paiement
          </button>
        </div>
      </div>
    </div>
  );
}
