'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { Marker, Label, Button, Input, Textarea } from '@/components/ui';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  Users,
  TestTube2,
  X,
} from 'lucide-react';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

type Status = 'pending_validation' | 'approved' | 'active' | 'paused';

const STATUS_LABELS: Record<Status, string> = {
  pending_validation: 'En attente de validation',
  approved: 'Approuvés',
  active: 'Actifs',
  paused: 'En pause',
};

type RecipientsInfo = {
  total: number;
  breakdown: Record<string, number>;
};

type SendResult =
  | { ok: true; sent: number; failed: number; total: number }
  | null;

type SendProgress = {
  current: number;
  total: number;
  sent: number;
  failed: number;
  errors: { email: string; error: string }[];
} | null;

// Throttling : 600 ms entre chaque email (~1,66 req/s, sous la limite
// Resend Free 2 req/s). Pour Resend Pro (10 req/s) on pourrait baisser
// à 150 ms, mais 600 ms reste conservateur et lisible pour l'utilisateur.
const SEND_INTERVAL_MS = 600;

export default function AdminNewsletterPage() {
  // Form state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [excludeEmails, setExcludeEmails] = useState('');
  const [segments, setSegments] = useState<Record<Status, boolean>>({
    pending_validation: false,
    approved: false,
    active: true,
    paused: false,
  });

  // UI state
  const [recipients, setRecipients] = useState<RecipientsInfo | null>(null);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<SendProgress>(null);
  const [testSending, setTestSending] = useState(false);
  const [result, setResult] = useState<SendResult>(null);
  const [error, setError] = useState<string | null>(null);

  // Active segments comme array (pour query params)
  const activeSegments = useMemo(
    () =>
      (Object.keys(segments) as Status[]).filter((s) => segments[s]),
    [segments],
  );

  // Refresh count debouncé quand les segments changent.
  useEffect(() => {
    let alive = true;
    if (activeSegments.length === 0) {
      setRecipients({ total: 0, breakdown: {} });
      return;
    }
    setRecipientsLoading(true);
    const url = `/api/admin/newsletter?segments=${activeSegments.join(',')}`;
    fetch(url, { headers: { 'x-admin-email': ADMIN_EMAIL } })
      .then((res) => res.json())
      .then((json) => {
        if (!alive) return;
        if (json?.ok) {
          setRecipients({
            total: Number(json.total || 0),
            breakdown: json.breakdown || {},
          });
        }
      })
      .catch(() => {
        if (alive) setRecipients({ total: 0, breakdown: {} });
      })
      .finally(() => {
        if (alive) setRecipientsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [activeSegments]);

  const subjectValid = subject.trim().length >= 3;
  const bodyValid = body.trim().length >= 10;
  const ctaValid =
    !ctaLabel.trim() || (ctaLabel.trim() && /^https?:\/\/|^\//.test(ctaUrl.trim()));
  const formValid = subjectValid && bodyValid && ctaValid;

  const canSend =
    formValid && activeSegments.length > 0 && (recipients?.total || 0) > 0;
  const canTest = formValid;

  const handleSendTest = async () => {
    setError(null);
    setTestSending(true);
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': ADMIN_EMAIL,
        },
        body: JSON.stringify({
          test: true,
          to: 'contact@chefstalents.com',
          subject,
          body,
          cta:
            ctaLabel.trim() && ctaUrl.trim()
              ? { label: ctaLabel.trim(), url: ctaUrl.trim() }
              : undefined,
          firstName: 'Thomas',
          locale: 'fr',
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.detail || json?.error || `HTTP ${res.status}`);
      } else {
        setError(null);
        alert('Email de test envoyé à contact@chefstalents.com');
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setTestSending(false);
    }
  };

  // Boucle d'envoi côté front : 1 email = 1 requête API.
  // Évite le timeout serverless Vercel (10 s sur Hobby) qui tuait les
  // broadcasts > 30 destinataires en mode legacy. Throttling 600 ms entre
  // chaque envoi pour rester sous la limite Resend Free (2 req/s).
  const handleSend = async () => {
    setError(null);
    setSending(true);
    setResult(null);
    setProgress(null);
    setConfirming(false);

    try {
      // 1) Récupérer la liste complète des destinataires (avec exclusions)
      const params = new URLSearchParams({ segments: activeSegments.join(',') });
      const exclude = excludeEmails.trim();
      if (exclude) params.set('exclude', exclude);

      const recRes = await fetch(`/api/admin/newsletter/recipients?${params.toString()}`, {
        headers: { 'x-admin-email': ADMIN_EMAIL },
      });
      const recJson = await recRes.json();
      if (!recRes.ok || !recJson?.ok) {
        throw new Error(
          recJson?.detail || recJson?.error || `HTTP ${recRes.status}`,
        );
      }

      const list: Array<{
        email: string;
        firstName: string | null;
        locale: 'fr' | 'en' | 'es';
      }> = recJson.recipients || [];

      if (list.length === 0) {
        setError('Aucun destinataire après exclusion. Vérifie tes segments et la liste exclue.');
        return;
      }

      const ctaPayload =
        ctaLabel.trim() && ctaUrl.trim()
          ? { label: ctaLabel.trim(), url: ctaUrl.trim() }
          : undefined;

      let sent = 0;
      let failed = 0;
      const errors: { email: string; error: string }[] = [];

      setProgress({ current: 0, total: list.length, sent: 0, failed: 0, errors: [] });

      // 2) Envoi un par un avec throttling
      for (let i = 0; i < list.length; i++) {
        const r = list[i];
        try {
          const res = await fetch('/api/admin/newsletter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-email': ADMIN_EMAIL,
            },
            body: JSON.stringify({
              single: {
                email: r.email,
                firstName: r.firstName,
                locale: r.locale,
              },
              subject,
              body,
              cta: ctaPayload,
            }),
          });
          const json = await res.json().catch(() => null);
          if (!res.ok || !json?.ok) {
            failed++;
            errors.push({
              email: r.email,
              error: json?.detail || json?.error || `HTTP ${res.status}`,
            });
          } else {
            sent++;
          }
        } catch (e: any) {
          failed++;
          errors.push({ email: r.email, error: String(e?.message ?? e) });
        }

        setProgress({
          current: i + 1,
          total: list.length,
          sent,
          failed,
          errors: [...errors],
        });

        // Throttling : pause entre chaque email (sauf après le dernier)
        if (i < list.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS));
        }
      }

      setResult({ ok: true, sent, failed, total: list.length });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSending(false);
    }
  };

  // Réessaie uniquement les emails en erreur
  const handleRetryFailed = async () => {
    if (!progress?.errors.length) return;

    setError(null);
    setSending(true);
    setResult(null);

    const failedEmails = progress.errors.map((e) => e.email);
    const ctaPayload =
      ctaLabel.trim() && ctaUrl.trim()
        ? { label: ctaLabel.trim(), url: ctaUrl.trim() }
        : undefined;

    // Récupérer les recipients pour avoir firstName/locale
    try {
      const params = new URLSearchParams({ segments: activeSegments.join(',') });
      const recRes = await fetch(`/api/admin/newsletter/recipients?${params.toString()}`, {
        headers: { 'x-admin-email': ADMIN_EMAIL },
      });
      const recJson = await recRes.json();
      if (!recRes.ok || !recJson?.ok) {
        throw new Error(recJson?.detail || `HTTP ${recRes.status}`);
      }

      const allMap = new Map<
        string,
        { email: string; firstName: string | null; locale: 'fr' | 'en' | 'es' }
      >(
        (recJson.recipients || []).map((r: any) => [r.email.toLowerCase(), r]),
      );

      const retryList = failedEmails
        .map((e) => allMap.get(e.toLowerCase()))
        .filter((r): r is NonNullable<typeof r> => Boolean(r));

      if (retryList.length === 0) {
        setError('Aucun destinataire à réessayer (les emails ne sont plus dans le segment).');
        return;
      }

      let sent = 0;
      let failed = 0;
      const errors: { email: string; error: string }[] = [];

      setProgress({ current: 0, total: retryList.length, sent: 0, failed: 0, errors: [] });

      for (let i = 0; i < retryList.length; i++) {
        const r = retryList[i];
        try {
          const res = await fetch('/api/admin/newsletter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-email': ADMIN_EMAIL,
            },
            body: JSON.stringify({
              single: { email: r.email, firstName: r.firstName, locale: r.locale },
              subject,
              body,
              cta: ctaPayload,
            }),
          });
          const json = await res.json().catch(() => null);
          if (!res.ok || !json?.ok) {
            failed++;
            errors.push({
              email: r.email,
              error: json?.detail || json?.error || `HTTP ${res.status}`,
            });
          } else {
            sent++;
          }
        } catch (e: any) {
          failed++;
          errors.push({ email: r.email, error: String(e?.message ?? e) });
        }

        setProgress({
          current: i + 1,
          total: retryList.length,
          sent,
          failed,
          errors: [...errors],
        });

        if (i < retryList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS));
        }
      }

      setResult({ ok: true, sent, failed, total: retryList.length });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSending(false);
    }
  };

  const toggleSeg = (s: Status) =>
    setSegments((prev) => ({ ...prev, [s]: !prev[s] }));

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <Marker />
        <Label>Marketing</Label>
        <h1 className="text-3xl font-serif text-stone-900">
          Newsletter aux chefs
        </h1>
        <p className="text-stone-500 mt-2 max-w-2xl">
          Envoyez un message à un segment de chefs (en attente, approuvés,
          actifs, ou en pause). Les chefs désinscrits du marketing sont
          automatiquement exclus.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-stone-200 bg-white p-6 md:p-8 space-y-5">
            <div className="space-y-2">
              <Label>Sujet</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Nouveautés Chefs Talents — Mai 2026"
              />
              <p className="text-xs text-stone-400">
                Court et précis. Évitez les majuscules excessives et les
                points d’exclamation multiples (filtres anti-spam).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Corps du message</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Bonjour [prénom],&#10;&#10;Je vous écris pour partager les nouveautés du programme...&#10;&#10;Premier point...&#10;&#10;Bien à vous,"
                className="min-h-[260px]"
              />
              <p className="text-xs text-stone-400">
                Le greeting <em>« Bonjour [prénom], »</em> est ajouté
                automatiquement, ne le tapez pas. Séparez les paragraphes par
                une ligne vide.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Bouton CTA — texte{' '}
                  <span className="text-stone-400 font-normal normal-case">
                    (optionnel)
                  </span>
                </Label>
                <Input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="Découvrir le nouveau guide"
                />
              </div>
              <div className="space-y-2">
                <Label>Bouton CTA — URL</Label>
                <Input
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="/chef/vip ou https://..."
                />
              </div>
            </div>
            {!ctaValid && (
              <p className="text-xs text-red-700">
                Si vous mettez un texte de bouton, l’URL doit commencer par
                <code className="mx-1">/</code> ou{' '}
                <code className="mx-1">https://</code>.
              </p>
            )}

            <div className="space-y-2 pt-4 border-t border-stone-100">
              <Label>
                Emails à exclure{' '}
                <span className="text-stone-400 font-normal normal-case">
                  (optionnel — déjà destinataires d’un envoi précédent)
                </span>
              </Label>
              <Textarea
                value={excludeEmails}
                onChange={(e) => setExcludeEmails(e.target.value)}
                placeholder="email1@exemple.com, email2@exemple.com&#10;email3@exemple.com"
                className="min-h-[80px] text-xs font-mono"
              />
              <p className="text-xs text-stone-400">
                Sépare par virgules, points-virgules ou retours à la ligne.
                Utile pour relancer un broadcast sans renvoyer aux chefs déjà
                contactés.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSendTest}
              disabled={!canTest || testSending}
            >
              {testSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi du test…
                </>
              ) : (
                <>
                  <TestTube2 className="w-4 h-4 mr-2" />
                  M’envoyer un test
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!canSend || sending}
              className="bg-stone-900 hover:bg-stone-800"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer la newsletter
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">{error}</div>
            </div>
          )}

          {/* Progress bar pendant l'envoi */}
          {sending && progress && (
            <div className="border border-stone-200 bg-stone-50 p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-widest text-stone-500">
                  Envoi en cours
                </span>
                <span className="text-2xl font-serif text-stone-900 tabular-nums">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-900 transition-all duration-200 ease-out"
                  style={{
                    width: `${progress.total === 0 ? 0 : (progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-stone-600">
                <span>
                  <span className="text-green-700 font-semibold">{progress.sent}</span>{' '}
                  envoyé{progress.sent > 1 ? 's' : ''}
                </span>
                {progress.failed > 0 && (
                  <span>
                    <span className="text-red-700 font-semibold">{progress.failed}</span>{' '}
                    échec{progress.failed > 1 ? 's' : ''}
                  </span>
                )}
                <span className="text-stone-400">
                  ETA ~{Math.ceil(((progress.total - progress.current) * SEND_INTERVAL_MS) / 1000)} s
                </span>
              </div>
              <p className="text-xs text-stone-400 italic">
                Garde cet onglet ouvert. L'envoi se fait un par un avec une pause
                de {SEND_INTERVAL_MS} ms entre chaque pour respecter les limites de Resend.
              </p>
            </div>
          )}

          {/* Résultat final */}
          {result && !sending && (
            <div className="border border-stone-200 bg-white p-5 space-y-3">
              <div className="flex items-start gap-3">
                {result.failed === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="text-sm text-stone-900 flex-1">
                  <div className="font-semibold mb-1">
                    {result.failed === 0 ? 'Broadcast terminé' : 'Broadcast terminé avec échecs'}
                  </div>
                  <div className="text-xs text-stone-600">
                    <span className="text-green-700 font-semibold">{result.sent}</span> envoyé{result.sent > 1 ? 's' : ''}
                    {' · '}
                    <span className={result.failed > 0 ? 'text-red-700 font-semibold' : ''}>
                      {result.failed}
                    </span>{' '}
                    échec{result.failed > 1 ? 's' : ''}
                    {' · '}
                    {result.total} ciblé{result.total > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {progress?.errors && progress.errors.length > 0 && (
                <div className="border-t border-stone-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-widest text-stone-500">
                      Détail des échecs
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRetryFailed}
                      disabled={sending}
                      className="text-xs"
                    >
                      Réessayer les échecs
                    </Button>
                  </div>
                  <ul className="text-xs text-stone-600 space-y-1 max-h-48 overflow-auto bg-stone-50 p-3 font-mono">
                    {progress.errors.map((e, i) => (
                      <li key={`${e.email}-${i}`} className="flex gap-2">
                        <span className="text-stone-900">{e.email}</span>
                        <span className="text-red-700">→ {e.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Segments + count */}
        <div className="space-y-6">
          <div className="border border-stone-200 bg-white p-6 space-y-4 sticky top-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-700" />
              <Label className="mb-0">Destinataires</Label>
            </div>

            <div className="space-y-2">
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-3 cursor-pointer text-sm group"
                >
                  <input
                    type="checkbox"
                    checked={segments[s]}
                    onChange={() => toggleSeg(s)}
                    className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <span className="flex-1 text-stone-700 group-hover:text-stone-900">
                    {STATUS_LABELS[s]}
                  </span>
                  {recipients?.breakdown[s] != null && segments[s] && (
                    <span className="text-xs text-stone-400 tabular-nums">
                      {recipients.breakdown[s] || 0}
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-widest text-stone-400">
                  Total ciblé
                </span>
                <span className="text-2xl font-serif text-stone-900 tabular-nums">
                  {recipientsLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-stone-300 inline" />
                  ) : (
                    recipients?.total ?? 0
                  )}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-2">
                Les chefs désinscrits du marketing sont exclus.
              </p>
            </div>
          </div>

          <div className="text-xs text-stone-500 leading-relaxed border-l-2 border-stone-300 pl-4">
            <strong>Bonnes pratiques.</strong> Évitez le spam-trigger :
            sujets trop commerciaux (« GRATUIT », « URGENT »), trop de
            majuscules, trop de points d’exclamation. Restez sur un ton
            éditorial sobre — c’est ce qui passe en boîte de réception.
          </div>
        </div>
      </div>

      {/* Modale de confirmation */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40">
          <div className="bg-white border border-stone-200 max-w-md w-full p-6 md:p-8 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-serif text-stone-900">
                Confirmer l’envoi
              </h2>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-stone-400 hover:text-stone-700"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              Vous êtes sur le point d’envoyer cette newsletter à{' '}
              <strong className="text-stone-900">
                {recipients?.total ?? 0} chef
                {(recipients?.total ?? 0) > 1 ? 's' : ''}
              </strong>{' '}
              dans les segments :{' '}
              {activeSegments.map((s) => STATUS_LABELS[s]).join(', ')}.
            </p>
            <p className="text-sm text-stone-500">
              Cette action est immédiate et irréversible.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={sending}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="bg-stone-900 hover:bg-stone-800"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Confirmer et envoyer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
