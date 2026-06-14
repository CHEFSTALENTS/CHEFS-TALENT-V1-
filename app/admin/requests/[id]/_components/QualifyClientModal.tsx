'use client';

// QualifyClientModal — Génère + envoie un message court de qualification
// au client (email OU WhatsApp), pré-rédigé par Claude depuis le contexte
// de la demande. Thomas peut éditer avant envoi.

import { useCallback, useEffect, useState } from 'react';
import { Loader2, X, Mail, MessageCircle, Send, RefreshCw, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';

type Tab = 'email' | 'whatsapp';

export default function QualifyClientModal({
  requestId,
  clientHasEmail,
  clientHasPhone,
  onClose,
  onSent,
}: {
  requestId: string;
  clientHasEmail: boolean;
  clientHasPhone: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [tab, setTab] = useState<Tab>(clientHasEmail ? 'email' : 'whatsapp');
  const [emailDraft, setEmailDraft] = useState<string>('');
  const [whatsappDraft, setWhatsappDraft] = useState<string>('');
  const [originalEmail, setOriginalEmail] = useState<string>('');
  const [originalWhatsapp, setOriginalWhatsapp] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentChannel, setSentChannel] = useState<Tab | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetch<{ ok: boolean; email: string; whatsapp: string; error?: string }>(
        `/api/admin/requests/${requestId}/qualification-message`,
      );
      if (!json.ok) throw new Error(json.error || 'Erreur génération');
      setEmailDraft(json.email);
      setWhatsappDraft(json.whatsapp);
      setOriginalEmail(json.email);
      setOriginalWhatsapp(json.whatsapp);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { generate(); }, [generate]);

  const currentContent = tab === 'email' ? emailDraft : whatsappDraft;
  const originalContent = tab === 'email' ? originalEmail : originalWhatsapp;
  const wasEdited = currentContent.trim() !== originalContent.trim();

  const handleSend = async () => {
    if (!currentContent.trim()) return;
    setSending(true);
    setError(null);
    try {
      const r = await adminFetchRaw(
        `/api/admin/requests/${requestId}/send-qualification`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            channel: tab,
            content: currentContent,
            edited: wasEdited,
          }),
        },
      );
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);

      setSentChannel(tab);
      if (tab === 'whatsapp' && json.whatsappDeeplink) {
        setWhatsappLink(json.whatsappDeeplink);
        // Ouvre directement WhatsApp dans un nouvel onglet
        window.open(json.whatsappDeeplink, '_blank', 'noopener,noreferrer');
      }
      // Notifie le parent pour qu'il refresh
      onSent();
    } catch (e: any) {
      setError(e?.message || 'Envoi échoué');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0e1116] shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Qualifier ce client en 1 clic
            </h3>
            <p className="text-[11px] text-white/45">Message court rédigé par Claude, éditable, envoi direct</p>
          </div>
          <button onClick={onClose} disabled={sending} className="p-1.5 rounded-lg hover:bg-white/10 text-white/55">
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Tabs Email / WhatsApp */}
        <div className="px-5 pt-4 shrink-0">
          <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5">
            <button
              onClick={() => setTab('email')}
              disabled={!clientHasEmail}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition ${
                tab === 'email'
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/55 hover:text-white/85'
              } ${!clientHasEmail ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={!clientHasEmail ? "Le client n'a pas d'email" : undefined}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>
            <button
              onClick={() => setTab('whatsapp')}
              disabled={!clientHasPhone}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition ${
                tab === 'whatsapp'
                  ? 'bg-emerald-500/15 text-emerald-200 font-medium'
                  : 'text-white/55 hover:text-white/85'
              } ${!clientHasPhone ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={!clientHasPhone ? "Le client n'a pas de téléphone" : undefined}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-10 text-center text-sm text-white/55">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Claude rédige ton message…
            </div>
          ) : sentChannel ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
              <p className="text-sm text-white">
                {sentChannel === 'email' ? 'Email envoyé.' : 'WhatsApp ouvert dans un nouvel onglet.'}
              </p>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-200 hover:text-emerald-100"
                >
                  Ré-ouvrir WhatsApp <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <p className="text-[11px] text-white/45 mt-3">
                La demande passe en « in_review » automatiquement.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/55">
                  {tab === 'email' ? 'Message email (objet sur la 1ère ligne)' : 'Message WhatsApp'}
                </label>
                <button
                  onClick={generate}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-[11px] text-white/55 hover:text-white"
                  title="Régénérer avec Claude"
                >
                  <RefreshCw className="w-3 h-3" />
                  Régénérer
                </button>
              </div>
              <textarea
                value={currentContent}
                onChange={(e) => {
                  if (tab === 'email') setEmailDraft(e.target.value);
                  else setWhatsappDraft(e.target.value);
                }}
                rows={tab === 'email' ? 12 : 6}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white font-mono leading-relaxed"
              />
              {wasEdited && (
                <p className="text-[11px] text-amber-300/85 mt-1.5 italic">
                  Édité par rapport à la version Claude — bonne nouvelle, ton style nourrit l'apprentissage.
                </p>
              )}

              {error && (
                <div className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!sentChannel && (
          <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 shrink-0">
            <button onClick={onClose} disabled={sending} className="px-4 py-2.5 text-sm text-white/75 hover:text-white">
              Annuler
            </button>
            <button
              onClick={handleSend}
              disabled={sending || loading || !currentContent.trim()}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                tab === 'email'
                  ? 'bg-sky-400 text-sky-950 hover:bg-sky-300'
                  : 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300'
              }`}
            >
              {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {tab === 'email' ? (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Envoyer l'email
                </>
              ) : (
                <>
                  <MessageCircle className="w-3.5 h-3.5" />
                  Ouvrir dans WhatsApp
                </>
              )}
            </button>
          </footer>
        )}

        {sentChannel && (
          <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 shrink-0">
            <button onClick={onClose} className="px-4 py-2.5 text-sm text-white/75 hover:text-white">
              Fermer
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
