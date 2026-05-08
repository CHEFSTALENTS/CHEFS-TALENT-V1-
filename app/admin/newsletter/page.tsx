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

export default function AdminNewsletterPage() {
  // Form state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
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

  const handleSend = async () => {
    setError(null);
    setSending(true);
    setResult(null);
    setConfirming(false);
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': ADMIN_EMAIL,
        },
        body: JSON.stringify({
          subject,
          body,
          cta:
            ctaLabel.trim() && ctaUrl.trim()
              ? { label: ctaLabel.trim(), url: ctaUrl.trim() }
              : undefined,
          segments: activeSegments,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.detail || json?.error || `HTTP ${res.status}`);
      } else {
        setResult({
          ok: true,
          sent: Number(json.sent || 0),
          failed: Number(json.failed || 0),
          total: Number(json.total || 0),
        });
      }
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

          {result && (
            <div className="border border-green-200 bg-green-50 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-green-900">
                <div className="font-semibold mb-1">Newsletter envoyée</div>
                <div className="text-xs">
                  {result.sent} envoyé{result.sent > 1 ? 's' : ''} ·{' '}
                  {result.failed} échec{result.failed > 1 ? 's' : ''} ·{' '}
                  {result.total} ciblé{result.total > 1 ? 's' : ''}
                </div>
              </div>
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
