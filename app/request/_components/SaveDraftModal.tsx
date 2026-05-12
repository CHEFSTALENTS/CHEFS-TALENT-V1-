'use client';

import { useState } from 'react';
import { X, Loader2, Mail, BookmarkPlus, CheckCircle2 } from 'lucide-react';
import { trackEvent, REQUEST_EVENTS } from '@/lib/analytics/posthog';

type Lang = 'fr' | 'en' | 'es';

interface Props {
  open: boolean;
  trigger: 'exit-intent' | 'manual';
  lang: Lang;
  state: any;
  lastStep: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const I18N: Record<
  Lang,
  {
    title: string;
    titleManual: string;
    subtitle: string;
    subtitleManual: string;
    emailLabel: string;
    emailPlaceholder: string;
    cta: string;
    submitting: string;
    successTitle: string;
    successSub: string;
    successCta: string;
    autoSavedNote: string;
    cancel: string;
  }
> = {
  fr: {
    title: 'Vous partez ?',
    titleManual: 'Sauvegarder ma demande',
    subtitle: "Pas de souci. Laissez-nous votre email — on garde votre demande en mémoire et vous pourrez la finir quand vous voulez.",
    subtitleManual: "On vous envoie un lien par email pour reprendre votre demande quand vous voulez.",
    emailLabel: 'Votre email',
    emailPlaceholder: 'vous@exemple.com',
    cta: 'Recevoir mon lien de reprise',
    submitting: 'Envoi…',
    successTitle: 'Email envoyé ✓',
    successSub: 'Vérifiez votre boîte de réception. Le lien est valide 7 jours.',
    successCta: 'Fermer',
    autoSavedNote: 'Votre progression est déjà sauvegardée localement sur cet appareil.',
    cancel: 'Continuer sans sauvegarder',
  },
  en: {
    title: 'Leaving already?',
    titleManual: 'Save my request',
    subtitle: "No problem. Drop your email — we'll save your request so you can finish it whenever.",
    subtitleManual: "We'll email you a link to resume your request whenever you're ready.",
    emailLabel: 'Your email',
    emailPlaceholder: 'you@example.com',
    cta: 'Send me my resume link',
    submitting: 'Sending…',
    successTitle: 'Email sent ✓',
    successSub: 'Check your inbox. The link is valid for 7 days.',
    successCta: 'Close',
    autoSavedNote: 'Your progress is already saved locally on this device.',
    cancel: 'Continue without saving',
  },
  es: {
    title: '¿Se va ya?',
    titleManual: 'Guardar mi solicitud',
    subtitle: 'Sin problema. Déjenos su email — guardaremos su solicitud y podrá terminarla cuando quiera.',
    subtitleManual: 'Le enviamos un enlace por email para retomar su solicitud cuando quiera.',
    emailLabel: 'Su email',
    emailPlaceholder: 'usted@ejemplo.com',
    cta: 'Recibir mi enlace de reanudación',
    submitting: 'Enviando…',
    successTitle: 'Email enviado ✓',
    successSub: 'Revise su bandeja de entrada. El enlace es válido durante 7 días.',
    successCta: 'Cerrar',
    autoSavedNote: 'Su progreso ya está guardado localmente en este dispositivo.',
    cancel: 'Continuar sin guardar',
  },
};

export default function SaveDraftModal({
  open,
  trigger,
  lang,
  state,
  lastStep,
  onClose,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState(state?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const t = I18N[lang];

  if (!open) return null;

  const canSubmit =
    !submitting && /\S+@\S+\.\S+/.test(email.trim().toLowerCase());

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch('/api/request/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          state,
          lastStep,
          lang,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      trackEvent(REQUEST_EVENTS.EMAIL_REMINDER_REQUESTED, {
        trigger,
        lastStep,
        emailSent: json.emailSent,
      });
      setDone(true);
      onSuccess?.();
    } catch (e: any) {
      console.error('[SaveDraftModal] submit failed', e);
      setError(e?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/85 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 transition z-10"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-stone-500" />
        </button>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-serif text-stone-900 mb-2">
              {t.successTitle}
            </h2>
            <p className="text-sm text-stone-500 font-light leading-relaxed mb-6">
              {t.successSub}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-full bg-stone-900 text-white text-xs uppercase tracking-widest font-semibold hover:bg-stone-800 transition"
            >
              {t.successCta}
            </button>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex items-center gap-2 mb-3">
              <BookmarkPlus className="w-4 h-4 text-stone-700" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold">
                {trigger === 'exit-intent' ? 'CHEFS TALENTS' : 'CHEFS TALENTS'}
              </span>
            </div>

            <h2 className="text-3xl font-serif text-stone-900 mb-3 leading-tight">
              {trigger === 'exit-intent' ? t.title : t.titleManual}
            </h2>
            <p className="text-sm text-stone-500 font-light leading-relaxed mb-6">
              {trigger === 'exit-intent' ? t.subtitle : t.subtitleManual}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold mb-1.5 block flex items-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-2xl text-stone-900 placeholder-stone-300 text-sm focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 px-2">{error}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full px-5 py-3.5 rounded-full bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-semibold hover:bg-stone-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  t.cta
                )}
              </button>

              <p className="text-[11px] text-stone-400 text-center mt-3 leading-relaxed">
                {t.autoSavedNote}
              </p>

              <button
                onClick={onClose}
                disabled={submitting}
                className="w-full text-xs text-stone-400 hover:text-stone-600 transition pt-2"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
