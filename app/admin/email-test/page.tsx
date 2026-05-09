'use client';


import React, { useState } from 'react';
import { Marker, Label, Button, Input } from '@/components/ui';
import { Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

type Kind =
  | 'vip_welcome'
  | 'boost_welcome'
  | 'boost_ending_soon'
  | 'chef_activated';
type Locale = 'fr' | 'en' | 'es';

const KIND_LABELS: Record<Kind, string> = {
  chef_activated: 'Profil activé (approved → active)',
  vip_welcome: 'VIP welcome (achat / grant)',
  boost_welcome: 'Boost welcome (achat boost)',
  boost_ending_soon: 'Boost ending soon (rappel J-7)',
};

export default function AdminEmailTestPage() {
  const [to, setTo] = useState('');
  const [firstName, setFirstName] = useState('Chef Test');
  const [kind, setKind] = useState<Kind>('chef_activated');
  const [locale, setLocale] = useState<Locale>('fr');
  const [sending, setSending] = useState(false);

  // États séparés : évite le narrowing fragile des union discriminées en
  // mode TS non-strict (Vercel le force).
  const [success, setSuccess] = useState<
    { sent_to: string; kind: string } | null
  >(null);
  const [error, setError] = useState<
    { error: string; detail?: string } | null
  >(null);

  const handleSend = async () => {
    setSuccess(null);
    setError(null);
    setSending(true);
    try {
      const res = await adminFetchRaw('/api/admin/test-email', {
        method: 'POST',
        body: JSON.stringify({ to, firstName, kind, locale }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError({
          error: json?.error || 'UNKNOWN_ERROR',
          detail: json?.detail || `HTTP ${res.status}`,
        });
      } else {
        setSuccess({ sent_to: json.sent_to, kind: json.kind });
      }
    } catch (e: any) {
      setError({
        error: 'NETWORK_ERROR',
        detail: String(e?.message ?? e),
      });
    } finally {
      setSending(false);
    }
  };

  const canSend = !!to && to.includes('@') && !sending;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Marker />
        <Label>Outils admin</Label>
        <h1 className="text-3xl font-serif text-stone-900">
          Test délivrabilité email
        </h1>
        <p className="text-stone-500 mt-2 max-w-xl">
          Envoie un email de test (VIP welcome, boost welcome, boost ending) à
          n’importe quelle adresse. Utile pour mail-tester.com, GlockApps,
          ou pour vérifier le rendu sur Gmail/Outlook/Yahoo.
        </p>
      </div>

      <div className="border border-stone-200 bg-white p-6 md:p-8 space-y-5">
        <div className="space-y-2">
          <Label>Adresse de destination</Label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="test-xxxx@srv1.mail-tester.com"
            type="email"
          />
          <p className="text-xs text-stone-400">
            Pour mail-tester : copie l’adresse aléatoire affichée sur la page
            d’accueil de mail-tester.com.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Prénom (utilisé dans le corps de l’email)</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Chef Test"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type d’email</Label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
              className="w-full px-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:border-stone-900 bg-white"
            >
              {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Langue</Label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="w-full px-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:border-stone-900 bg-white"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
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
                Envoyer le test
              </>
            )}
          </Button>
        </div>

        {success && (
          <div className="border border-green-200 bg-green-50 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <div className="font-semibold mb-1">Email envoyé</div>
              <div className="text-xs">
                Type : {success.kind} · Destinataire : {success.sent_to}
              </div>
              <div className="text-xs text-green-700 mt-2">
                Vérifie l’arrivée dans la boîte cible (peut prendre 30 s à 2 min).
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <div className="font-semibold mb-1">Erreur : {error.error}</div>
              {error.detail && (
                <div className="text-xs">{error.detail}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-stone-500 leading-relaxed border-l-2 border-stone-300 pl-4">
        <strong>Procédure mail-tester :</strong> ouvre{' '}
        <a
          className="underline"
          href="https://www.mail-tester.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          mail-tester.com
        </a>{' '}
        dans un onglet, copie l’adresse aléatoire qu’ils affichent, colle-la
        ici, choisis le type d’email à tester, clique <em>Envoyer le test</em>,
        retourne sur mail-tester et clique <em>Then check your score</em>.
      </div>
    </div>
  );
}
