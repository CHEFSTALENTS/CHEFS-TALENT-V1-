'use client';

// Panneau « Remplacement chef » sur la fiche mission.
//
// 2 zones :
//   1. Liste de l'historique chef_assignments (visible seulement si ≥ 1 row)
//   2. Bouton « Remplacer le chef » + modal avec preview du split tarifaire
//
// Workflow modal :
//   1. Admin choisit nouveau chef (input nom + email manuel pour MVP)
//   2. Saisit date du dernier jour de l'ancien chef
//   3. Modal preview : « Ancien chef : 3 jours × 200€ = 600€ »
//                       « Nouveau chef : 7 jours × 200€ = 1400€ »
//   4. Confirme → POST replace-chef → toast succès + refresh

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  UserCog,
  X,
} from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

type Assignment = {
  id: string;
  chefId: string;
  chefName: string | null;
  chefEmail: string | null;
  startDate: string;
  endDate: string;
  daysWorked: number;
  dailyRateEur: number;
  chefAmountEur: number;
  status: 'active' | 'replaced' | 'completed';
  replacementReason: string | null;
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

function daysBetween(start: string, end: string): number {
  const s = Date.parse(start);
  const e = Date.parse(end);
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
  return Math.round((e - s) / 86400_000) + 1;
}

export default function ChefReplacementPanel({
  missionId,
  currentChefName,
  currentChefEmail,
  missionStartDate,
  missionEndDate,
  chefAmount,
  onChefReplaced,
}: {
  missionId: string;
  currentChefName: string | null;
  currentChefEmail: string | null;
  missionStartDate: string | null;
  missionEndDate: string | null;
  chefAmount: number | null;
  onChefReplaced?: () => void;
}) {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetchRaw(`/api/admin/missions/${encodeURIComponent(missionId)}/chef-assignments`);
      const json = await r.json();
      if (r.ok && json.ok) setItems(json.items as Assignment[]);
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => { load(); }, [load]);

  const canReplace = !!missionStartDate && !!missionEndDate && chefAmount != null && chefAmount > 0 && !!currentChefName;

  return (
    <div className="space-y-3">
      {/* Historique si non vide */}
      {items.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
          <div className="text-xs uppercase tracking-wider text-white/55 font-semibold mb-2">
            Historique des chefs ({items.length})
          </div>
          {items.map((it) => (
            <AssignmentRow key={it.id} item={it} />
          ))}
        </div>
      )}

      {/* Bouton d'action */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] text-white/45 leading-relaxed">
          ⓘ Le chef actuel est <strong className="text-white/85">{currentChefName || '—'}</strong>.
          {' '}En cas d'indisponibilité, tu peux remplacer le chef en cours de mission — le calcul du split tarifaire au prorata est automatique.
        </div>
        <button
          onClick={() => setModalOpen(true)}
          disabled={!canReplace}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-400/40 bg-amber-400/15 text-sm font-medium text-amber-100 hover:bg-amber-400/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={!canReplace ? 'Mission incomplète : il faut chef, montant et dates pour remplacer' : 'Ouvre le modal de remplacement'}
        >
          <UserCog className="w-4 h-4" />
          Remplacer le chef
        </button>
      </div>

      {modalOpen && canReplace && (
        <ReplaceChefModal
          missionId={missionId}
          currentChefName={currentChefName!}
          missionStartDate={missionStartDate!}
          missionEndDate={missionEndDate!}
          chefAmount={chefAmount!}
          onClose={() => setModalOpen(false)}
          onSuccess={async () => {
            setModalOpen(false);
            await load();
            onChefReplaced?.();
          }}
        />
      )}
    </div>
  );
}

function AssignmentRow({ item }: { item: Assignment }) {
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-400/15 border-emerald-400/30 text-emerald-200',
    replaced: 'bg-amber-400/15 border-amber-400/30 text-amber-200',
    completed: 'bg-white/5 border-white/15 text-white/65',
  };
  const statusLabels: Record<string, string> = {
    active: 'Actif',
    replaced: 'Remplacé',
    completed: 'Terminé',
  };
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-2 py-2 rounded-lg bg-white/[0.02]">
      <div className="text-xs font-mono text-white/55 min-w-[110px]">
        {fmtDate(item.startDate)} → {fmtDate(item.endDate)}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-white truncate">{item.chefName || '—'}</div>
        <div className="text-[10px] text-white/40 truncate">
          {item.daysWorked}j × {fmtEur(item.dailyRateEur)}/j
          {item.replacementReason && ` · ${item.replacementReason}`}
        </div>
      </div>
      <div className="text-sm text-white font-semibold">{fmtEur(item.chefAmountEur)}</div>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${statusColors[item.status]}`}>
        {statusLabels[item.status]}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function ReplaceChefModal({
  missionId,
  currentChefName,
  missionStartDate,
  missionEndDate,
  chefAmount,
  onClose,
  onSuccess,
}: {
  missionId: string;
  currentChefName: string;
  missionStartDate: string;
  missionEndDate: string;
  chefAmount: number;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}) {
  const [newChefId, setNewChefId] = useState('');
  const [newChefName, setNewChefName] = useState('');
  const [newChefEmail, setNewChefEmail] = useState('');
  const [replacementDate, setReplacementDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcul preview du split (côté client, miroir du serveur)
  const totalDays = daysBetween(missionStartDate, missionEndDate);
  const dailyRate = totalDays > 0 ? Math.round((chefAmount / totalDays) * 100) / 100 : 0;
  const oldDays = replacementDate && replacementDate >= missionStartDate && replacementDate < missionEndDate
    ? daysBetween(missionStartDate, replacementDate)
    : 0;
  const newStart = (() => {
    if (!replacementDate) return '';
    const d = new Date(replacementDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const newDays = newStart && newStart <= missionEndDate ? daysBetween(newStart, missionEndDate) : 0;
  const oldAmount = Math.round(oldDays * dailyRate * 100) / 100;
  const newAmount = Math.round((chefAmount - oldAmount) * 100) / 100;

  const valid =
    !!newChefId.trim() && !!newChefName.trim() && !!newChefEmail.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newChefEmail.trim()) &&
    /^\d{4}-\d{2}-\d{2}$/.test(replacementDate) &&
    replacementDate >= missionStartDate && replacementDate < missionEndDate &&
    oldDays > 0 && newDays > 0;

  async function submit() {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await adminFetchRaw(`/api/admin/missions/${encodeURIComponent(missionId)}/replace-chef`, {
        method: 'POST',
        body: JSON.stringify({
          newChefId: newChefId.trim(),
          newChefName: newChefName.trim(),
          newChefEmail: newChefEmail.trim().toLowerCase(),
          replacementDate,
          reason: reason.trim() || null,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${r.status}`);
      }
      await onSuccess();
    } catch (e: any) {
      setError(e?.message || 'Erreur remplacement');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div className="w-full max-w-2xl bg-[#0f0f10] border border-white/10 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <h3 className="text-base font-semibold text-white inline-flex items-center gap-2">
            <UserCog className="w-5 h-5 text-amber-400" />
            Remplacer le chef en cours de mission
          </h3>
          <button onClick={onClose} disabled={submitting} className="p-1 rounded-lg hover:bg-white/10 text-white/55"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/65 leading-relaxed">
            Chef actuel : <strong className="text-white">{currentChefName}</strong>
            <br />Période mission : <strong className="text-white">{fmtDate(missionStartDate)} → {fmtDate(missionEndDate)}</strong> ({totalDays} jours)
            <br />Montant total chef : <strong className="text-white">{fmtEur(chefAmount)}</strong> ({fmtEur(dailyRate)}/jour)
          </div>

          {/* Nouveau chef */}
          <div>
            <div className="text-xs uppercase tracking-wider text-white/55 font-semibold mb-2">Nouveau chef remplaçant</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">User ID (Supabase) *</span>
                <input type="text" value={newChefId} onChange={(e) => setNewChefId(e.target.value)} placeholder="uuid du chef dans Supabase"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 font-mono" />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Nom complet *</span>
                <input type="text" value={newChefName} onChange={(e) => setNewChefName(e.target.value)} placeholder="Marie Durand"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25" />
              </label>
              <label className="block md:col-span-2">
                <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Email *</span>
                <input type="email" value={newChefEmail} onChange={(e) => setNewChefEmail(e.target.value)} placeholder="marie@chef.com"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25" />
              </label>
            </div>
            <div className="text-[10px] text-white/35 mt-1">Note : pour la V1, saisis manuellement les infos. Le picker chef sera ajouté plus tard.</div>
          </div>

          {/* Date du remplacement */}
          <div>
            <div className="text-xs uppercase tracking-wider text-white/55 font-semibold mb-2">Modalités du remplacement</div>
            <label className="block mb-2">
              <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">
                Dernier jour travaillé par l'ancien chef *
              </span>
              <input type="date" value={replacementDate} onChange={(e) => setReplacementDate(e.target.value)}
                min={missionStartDate} max={missionEndDate}
                className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white" />
              <span className="block text-[10px] text-white/40 mt-1">Le nouveau chef prend la suite à partir du lendemain.</span>
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Raison (optionnel)</span>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Indisponibilité, maladie, raison personnelle..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25" />
            </label>
          </div>

          {/* Preview du split */}
          {valid && (
            <div className="border border-emerald-400/30 bg-emerald-400/[0.05] rounded-xl p-4 space-y-3">
              <div className="text-xs uppercase tracking-wider text-emerald-200/85 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aperçu du split tarifaire (au prorata)
              </div>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <div>
                    <div className="text-white"><strong>{currentChefName}</strong> · {fmtDate(missionStartDate)} → {fmtDate(replacementDate)}</div>
                    <div className="text-[11px] text-white/45">{oldDays} jour{oldDays > 1 ? 's' : ''} × {fmtEur(dailyRate)}/j</div>
                  </div>
                  <div className="text-emerald-200 font-semibold">{fmtEur(oldAmount)}</div>
                </div>
                <div className="border-t border-emerald-400/20 my-1" />
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <div>
                    <div className="text-white"><strong>{newChefName || 'Nouveau chef'}</strong> · {fmtDate(newStart)} → {fmtDate(missionEndDate)}</div>
                    <div className="text-[11px] text-white/45">{newDays} jour{newDays > 1 ? 's' : ''} × {fmtEur(dailyRate)}/j</div>
                  </div>
                  <div className="text-emerald-200 font-semibold">{fmtEur(newAmount)}</div>
                </div>
                <div className="border-t border-emerald-400/30 my-1" />
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center text-xs text-white/65">
                  <div>Total redistribué</div>
                  <div className="font-semibold">{fmtEur(chefAmount)}</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-white/[0.02]">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10">
            Annuler
          </button>
          <button onClick={submit} disabled={!valid || submitting}
            className="inline-flex items-center px-5 py-2 rounded-xl bg-amber-400 text-amber-950 font-medium hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
            Confirmer le remplacement
          </button>
        </div>
      </div>
    </div>
  );
}
