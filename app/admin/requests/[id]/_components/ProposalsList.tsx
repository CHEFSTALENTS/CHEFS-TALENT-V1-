'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminFetchRaw } from '@/lib/adminFetch';
import { Loader2, Check, X, Send, Trash2, Sparkles } from 'lucide-react';

type ProposalStatus =
  | 'shortlisted'
  | 'pitched'
  | 'accepted'
  | 'declined'
  | 'expired';

type Channel = 'email' | 'whatsapp' | 'manual' | null;

type Proposal = {
  id: string;
  request_id: string | null;
  chef_id: string;
  chef_email: string;
  chef_name: string | null;
  status: ProposalStatus;
  channel: Channel;
  pitched_at: string | null;
  email_sent_at: string | null;
  responded_at: string | null;
  promoted_to_mission_id: string | null;
  chef_amount: number | null;
  client_amount: number | null;
  created_at: string;
  notes?: string | null;
};

interface Props {
  requestId: string;
  /**
   * Appelé après chaque changement (création, status update, promote,
   * delete) pour permettre au parent de refetch les compteurs/states.
   */
  onChanged?: () => void;
}

export default function ProposalsList({ requestId, onChanged }: Props) {
  const [items, setItems] = useState<Proposal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const r = await adminFetchRaw(
        `/api/admin/proposals?requestId=${encodeURIComponent(requestId)}`,
      );
      const json = await r.json();
      if (!r.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setItems(json.items || []);
    } catch (e: any) {
      console.error('[ProposalsList] refresh failed', e);
      setError(e?.message || 'Erreur chargement');
      setItems([]);
    }
  }, [requestId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Met à jour le status d'une proposal (acceptée / déclinée / expirée)
  const updateStatus = async (id: string, status: ProposalStatus) => {
    setPendingId(id);
    setError(null);
    try {
      const r = await adminFetchRaw(`/api/admin/proposals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await refresh();
      onChanged?.();
    } catch (e: any) {
      setError(e?.message || 'Erreur mise à jour');
    } finally {
      setPendingId(null);
    }
  };

  // Convertit la proposal en mission confirmée (table missions)
  const promote = async (id: string) => {
    if (
      !confirm(
        'Promouvoir cette proposition en mission confirmée ?\nLes autres propositions de cette demande seront automatiquement déclinées.',
      )
    )
      return;
    setPendingId(id);
    setError(null);
    try {
      const r = await adminFetchRaw(
        `/api/admin/proposals/${id}/promote`,
        { method: 'POST' },
      );
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await refresh();
      onChanged?.();
    } catch (e: any) {
      setError(e?.message || 'Erreur promotion');
    } finally {
      setPendingId(null);
    }
  };

  // Supprime définitivement une proposal (créée par erreur)
  const remove = async (id: string) => {
    if (!confirm('Supprimer définitivement cette proposition ?')) return;
    setPendingId(id);
    setError(null);
    try {
      const r = await adminFetchRaw(`/api/admin/proposals/${id}`, {
        method: 'DELETE',
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await refresh();
      onChanged?.();
    } catch (e: any) {
      setError(e?.message || 'Erreur suppression');
    } finally {
      setPendingId(null);
    }
  };

  if (items === null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement des propositions…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
        <button
          onClick={refresh}
          className="ml-2 underline text-red-100 hover:text-white"
        >
          réessayer
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/55">
        Aucun chef présenté pour cette demande pour l'instant.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/45">
          {items.length} proposition{items.length > 1 ? 's' : ''} ·{' '}
          {countBy(items, 'pitched')} envoyée{countBy(items, 'pitched') > 1 ? 's' : ''} ·{' '}
          {countBy(items, 'accepted')} acceptée{countBy(items, 'accepted') > 1 ? 's' : ''}
        </p>
        <button
          onClick={refresh}
          className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
        >
          Rafraîchir
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3"
          >
            {/* Header chef */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {p.chef_name || p.chef_email}
                </div>
                <div className="text-xs text-white/45 truncate">
                  {p.chef_email}
                </div>
              </div>
              <StatusPill status={p.status} />
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
              {p.channel && <ChannelChip channel={p.channel} />}
              {p.pitched_at && (
                <span>Envoyée {fmtDate(p.pitched_at)}</span>
              )}
              {p.responded_at && (
                <span>· Réponse {fmtDate(p.responded_at)}</span>
              )}
              {p.chef_amount != null && (
                <span className="text-emerald-200">
                  · {Number(p.chef_amount).toLocaleString('fr-FR')}€ chef
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {/* Marquer accepté (sauf si déjà accepted ou expiré) */}
              {p.status !== 'accepted' && p.status !== 'expired' && (
                <ActionBtn
                  loading={pendingId === p.id}
                  onClick={() => updateStatus(p.id, 'accepted')}
                  variant="success"
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Marquer accepté
                </ActionBtn>
              )}

              {/* Marquer décliné */}
              {p.status !== 'declined' && p.status !== 'expired' && (
                <ActionBtn
                  loading={pendingId === p.id}
                  onClick={() => updateStatus(p.id, 'declined')}
                  variant="muted"
                  icon={<X className="w-3.5 h-3.5" />}
                >
                  Marquer décliné
                </ActionBtn>
              )}

              {/* Promote en mission (seulement si accepted, pas déjà promu) */}
              {p.status === 'accepted' && !p.promoted_to_mission_id && (
                <ActionBtn
                  loading={pendingId === p.id}
                  onClick={() => promote(p.id)}
                  variant="primary"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Promouvoir en mission
                </ActionBtn>
              )}

              {/* Lien vers la mission promue */}
              {p.promoted_to_mission_id && (
                <span className="px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-200">
                  ✓ Mission confirmée
                </span>
              )}

              {/* Supprimer (toujours dispo sauf si déjà promue) */}
              {!p.promoted_to_mission_id && (
                <ActionBtn
                  loading={pendingId === p.id}
                  onClick={() => remove(p.id)}
                  variant="danger"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Supprimer
                </ActionBtn>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- helpers ----------

function countBy(items: Proposal[], status: ProposalStatus): number {
  return items.filter((x) => x.status === status).length;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusPill({ status }: { status: ProposalStatus }) {
  const config: Record<
    ProposalStatus,
    { label: string; cls: string }
  > = {
    shortlisted: {
      label: 'Présélectionné',
      cls: 'bg-white/10 text-white/70 border-white/10',
    },
    pitched: {
      label: 'Envoyée',
      cls: 'bg-sky-500/15 text-sky-200 border-sky-500/20',
    },
    accepted: {
      label: 'Acceptée',
      cls: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20',
    },
    declined: {
      label: 'Déclinée',
      cls: 'bg-white/5 text-white/45 border-white/10',
    },
    expired: {
      label: 'Expirée',
      cls: 'bg-amber-500/15 text-amber-200 border-amber-500/20',
    },
  };
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs border whitespace-nowrap ${c.cls}`}
    >
      {c.label}
    </span>
  );
}

function ChannelChip({ channel }: { channel: Channel }) {
  if (!channel) return null;
  const map: Record<NonNullable<Channel>, { label: string; cls: string }> = {
    email: {
      label: '✉️ Email',
      cls: 'bg-white/5 text-white/65 border-white/10',
    },
    whatsapp: {
      label: '💬 WhatsApp',
      cls: 'bg-emerald-500/10 text-emerald-100 border-emerald-500/20',
    },
    manual: {
      label: '👤 Manuel',
      cls: 'bg-white/5 text-white/55 border-white/10',
    },
  };
  const c = map[channel];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${c.cls}`}
    >
      {c.label}
    </span>
  );
}

function ActionBtn({
  children,
  onClick,
  loading,
  variant,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  variant: 'primary' | 'success' | 'muted' | 'danger';
  icon?: React.ReactNode;
}) {
  const cls = {
    primary: 'border-white/15 bg-white text-[#161616] hover:bg-white/90',
    success:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20',
    muted:
      'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
    danger:
      'border-red-500/20 bg-red-500/5 text-red-200 hover:bg-red-500/10',
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition disabled:opacity-50 ${cls}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
}
