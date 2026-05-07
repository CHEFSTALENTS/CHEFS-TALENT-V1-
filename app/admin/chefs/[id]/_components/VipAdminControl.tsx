'use client';

import { useState } from 'react';
import { Crown, Loader2, X } from 'lucide-react';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

type Props = {
  chefId: string;
  initialProfile: any;
};

const MONTHS_OPTIONS: Array<{ months: 3 | 6 | 12; label: string }> = [
  { months: 3, label: '3 mois' },
  { months: 6, label: '6 mois' },
  { months: 12, label: '12 mois' },
];

export default function VipAdminControl({ chefId, initialProfile }: Props) {
  const [profile, setProfile] = useState<any>(initialProfile ?? {});
  const [busy, setBusy] = useState<null | 'grant-3' | 'grant-6' | 'grant-12' | 'revoke'>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isVipActive =
    profile?.plan === 'pro' && profile?.planStatus === 'active';
  const isComplimentary = !!profile?.complimentary;
  const isPaidVip = isVipActive && !isComplimentary;
  const planKey = profile?.planKey as string | undefined;

  const planMonths =
    planKey === 'vip_3m' ? 3 :
    planKey === 'vip_6m' ? 6 :
    planKey === 'vip_12m' ? 12 :
    0;

  const endsAtStr = profile?.planEndsAt
    ? new Date(profile.planEndsAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const grantVip = async (months: 3 | 6 | 12) => {
    setBusy(`grant-${months}` as any);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/chefs/${chefId}/grant-vip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': ADMIN_EMAIL,
        },
        body: JSON.stringify({ months }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || json?.error || 'Erreur');

      setProfile((p: any) => ({
        ...p,
        plan: 'pro',
        planStatus: 'active',
        planKey: json.planKey,
        planEndsAt: json.planEndsAt,
        complimentary: true,
      }));
      setMessage(`VIP ${months} mois offert ✓`);
    } catch (e: any) {
      setMessage(`Erreur : ${e?.message || 'inconnue'}`);
    } finally {
      setBusy(null);
    }
  };

  const revokeVip = async () => {
    if (!confirm('Révoquer le VIP offert pour ce chef ?')) return;
    setBusy('revoke');
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/chefs/${chefId}/grant-vip`, {
        method: 'DELETE',
        headers: { 'x-admin-email': ADMIN_EMAIL },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || json?.error || 'Erreur');

      setProfile((p: any) => ({
        ...p,
        plan: 'free',
        planStatus: 'cancelled',
        complimentary: false,
      }));
      setMessage('VIP révoqué ✓');
    } catch (e: any) {
      setMessage(`Erreur : ${e?.message || 'inconnue'}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/90 space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="w-4 h-4 text-amber-300" />
        <h3 className="text-sm font-semibold tracking-wide">Plan VIP</h3>
      </div>

      {/* État actuel */}
      {isPaidVip && (
        <div className="text-sm border border-amber-500/30 bg-amber-500/10 rounded-xl p-3 space-y-1">
          <div className="font-medium text-amber-200">
            VIP payant · {planMonths} mois
          </div>
          <div className="text-xs text-amber-200/80">
            Géré par Stripe — utilisez le Billing Portal pour annuler.
          </div>
          <div className="text-xs text-white/60">Engagement jusqu'au {endsAtStr}</div>
        </div>
      )}

      {isComplimentary && isVipActive && (
        <div className="text-sm border border-emerald-500/30 bg-emerald-500/10 rounded-xl p-3 space-y-1">
          <div className="font-medium text-emerald-200">
            ★ VIP offert · {planMonths} mois
          </div>
          <div className="text-xs text-white/70">Jusqu'au {endsAtStr}</div>
        </div>
      )}

      {!isVipActive && (
        <div className="text-sm text-white/60">
          Aucun VIP actif. Vous pouvez offrir un accès gratuit ci-dessous.
        </div>
      )}

      {/* Actions */}
      {!isPaidVip && (
        <div className="flex flex-wrap gap-2">
          {!isVipActive &&
            MONTHS_OPTIONS.map(({ months, label }) => (
              <button
                key={months}
                type="button"
                onClick={() => grantVip(months)}
                disabled={busy !== null}
                className="px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs font-medium hover:bg-amber-500/20 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {busy === `grant-${months}` ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Crown className="w-3 h-3" />
                )}
                Offrir {label}
              </button>
            ))}

          {isComplimentary && isVipActive && (
            <button
              type="button"
              onClick={revokeVip}
              disabled={busy !== null}
              className="px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs font-medium hover:bg-rose-500/20 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {busy === 'revoke' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
              Révoquer
            </button>
          )}
        </div>
      )}

      {message && (
        <div
          className={`text-xs ${
            message.startsWith('Erreur')
              ? 'text-rose-300'
              : 'text-emerald-300'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
