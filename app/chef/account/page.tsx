'use client';

// Page de gestion du compte chef : changement d'email avec vérification.
// Extensible plus tard pour changement mot de passe, suppression compte, etc.
//
// Flow change email :
//   1. Chef saisit nouvel email + clique « Envoyer le lien »
//   2. Email envoyé au NOUVEL email avec un token HMAC (24h)
//   3. Chef clique sur le lien → confirm-change update auth.users.email
//   4. Redirection vers /chef/dashboard?email-changed=1

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Mail, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { chefFetchRaw } from '@/lib/chefFetch';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import { format } from '@/lib/chef-i18n';

export default function ChefAccountPage() {
  const { t, locale } = useChefLocale();
  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingRequestedAt, setPendingRequestedAt] = useState<string | null>(null);

  // form state
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function loadAccount() {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setCurrentEmail(user.email);

      // Lit le profile pour récupérer pendingEmail
      const r = await chefFetchRaw('/api/chef/profile', { cache: 'no-store' });
      if (r.ok) {
        const json = await r.json();
        const profile = json?.profile?.profile || json?.profile || {};
        setPendingEmail(profile.pendingEmail || null);
        setPendingRequestedAt(profile.pendingEmailRequestedAt || null);
      }
    } catch (e: any) {
      console.error('[account] load error', e?.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAccount(); }, []);

  async function submitChange() {
    setError(null);
    setSuccess(null);
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError(t.account.errorInvalidFormat);
      return;
    }
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setError(t.account.errorSameEmail);
      return;
    }
    setSubmitting(true);
    try {
      const r = await chefFetchRaw('/api/chef/email/request-change', {
        method: 'POST',
        // Locale du chef — utilisée par le serveur pour l'email de vérif (FR/EN/ES)
        body: JSON.stringify({ newEmail: newEmail.trim(), locale }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${r.status}`);
      }
      setSuccess(json.message || t.account.successDefault);
      setPendingEmail(json.pendingEmail);
      setPendingRequestedAt(new Date().toISOString());
      setNewEmail('');
    } catch (e: any) {
      setError(e?.message || t.account.errorSendFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelChange() {
    if (!confirm(t.account.confirmCancelChange)) return;
    setCancelling(true);
    try {
      const r = await chefFetchRaw('/api/chef/email/cancel-change', { method: 'POST' });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setPendingEmail(null);
      setPendingRequestedAt(null);
      setSuccess(t.account.successCanceled);
    } catch (e: any) {
      setError(e?.message || t.account.errorCancelFailed);
    } finally {
      setCancelling(false);
    }
  }

  // Format date selon la locale du chef (FR/EN/ES)
  const dateLocale = locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'fr-FR';

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/chef/dashboard"
          className="inline-flex items-center text-sm text-stone-500 hover:text-stone-900 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.account.backToDashboard}
        </Link>

        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-2">{t.account.pageLabel}</p>
          <h1 className="text-3xl font-serif text-stone-900">{t.account.pageTitle}</h1>
          <p className="text-sm text-stone-600 mt-2 font-light">{t.account.pageSubtitle}</p>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-stone-300" />
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">{t.account.currentEmailLabel}</div>
              <div className="flex items-center gap-2 text-stone-900">
                <Mail className="w-4 h-4 text-stone-400" />
                <span className="font-medium">{currentEmail || '—'}</span>
              </div>
            </div>

            {/* État : changement en cours */}
            {pendingEmail && (
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-900">{t.account.pendingTitle}</div>
                    <p className="text-sm text-stone-700 mt-1">
                      {(() => {
                        // Split la chaîne autour de {email} pour insérer le <strong> au milieu
                        const parts = t.account.pendingDescription.split('{email}');
                        return (
                          <>
                            {parts[0]}
                            <strong className="font-mono break-all">{pendingEmail}</strong>
                            {parts[1] ?? ''}
                          </>
                        );
                      })()}
                    </p>
                    {pendingRequestedAt && (
                      <p className="text-xs text-stone-500 mt-1">
                        {format(t.account.pendingSentAt, {
                          date: new Date(pendingRequestedAt).toLocaleString(dateLocale, { dateStyle: 'short', timeStyle: 'short' }),
                        })}
                      </p>
                    )}
                    <button
                      onClick={cancelChange}
                      disabled={cancelling}
                      className="mt-3 inline-flex items-center text-xs text-amber-700 hover:text-amber-900 underline disabled:opacity-50"
                    >
                      {cancelling ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      {cancelling ? t.account.pendingCancelling : t.account.pendingCancel}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Form changement */}
            {!pendingEmail && (
              <div>
                <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">{t.account.newEmailLabel}</div>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t.account.newEmailPlaceholder}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                <p className="text-xs text-stone-500 mt-2">{t.account.newEmailHint}</p>
                <button
                  onClick={submitChange}
                  disabled={submitting || !newEmail}
                  className="mt-4 inline-flex items-center px-5 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  {submitting ? t.account.submitting : t.account.submitChange}
                </button>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="border border-red-200 bg-red-50 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-3 text-sm text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
