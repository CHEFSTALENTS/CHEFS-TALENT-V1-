'use client';

// ChefBriefModal — Génère + édite + marque envoyé le brief chef.
// Sortie : brief formaté + WhatsApp d'accompagnement + liste des manques
// à compléter par Thomas avant envoi.

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sparkles, Send, MessageCircle, RefreshCw, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';
import { AdminModal } from '@/app/admin/_components/AdminModal';

type Tab = 'brief' | 'whatsapp' | 'check';

export default function ChefBriefModal({
  missionId,
  chefName,
  chefEmail,
  chefPhone,
  onClose,
  onSaved,
}: {
  missionId: string;
  chefName: string | null;
  chefEmail: string | null;
  chefPhone: string | null;
  onClose: () => void;
  onSaved: (mission: any) => void;
}) {
  const [tab, setTab] = useState<Tab>('brief');
  const [briefDraft, setBriefDraft] = useState('');
  const [whatsappDraft, setWhatsappDraft] = useState('');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [originalBrief, setOriginalBrief] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ channel: 'email' | 'whatsapp'; whatsappLink?: string } | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetch<{
        ok: boolean; brief: string; whatsapp: string; missingFields: string[]; error?: string;
      }>(`/api/admin/missions/${missionId}/brief-draft`);
      if (!json.ok) throw new Error(json.error || 'Erreur génération');
      setBriefDraft(json.brief);
      setOriginalBrief(json.brief);
      setWhatsappDraft(json.whatsapp);
      setMissingFields(json.missingFields || []);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => { generate(); }, [generate]);

  const briefEdited = briefDraft.trim() !== originalBrief.trim();

  const handleMarkSent = async (channel: 'email' | 'whatsapp') => {
    if (!briefDraft.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const r = await adminFetchRaw(
        `/api/admin/missions/${missionId}/brief-sent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            channel,
            content: briefDraft,
            edited: briefEdited,
          }),
        },
      );
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);

      // Pour WhatsApp : on prépare aussi un deeplink avec le brief + message d'accompagnement
      let whatsappLink: string | undefined;
      if (channel === 'whatsapp' && chefPhone) {
        const digits = chefPhone.replace(/[^0-9]/g, '');
        // Texte WhatsApp = message d'accompagnement + le brief
        const fullText = `${whatsappDraft}\n\n${briefDraft}`;
        whatsappLink = `https://wa.me/${digits}?text=${encodeURIComponent(fullText)}`;
        window.open(whatsappLink, '_blank', 'noopener,noreferrer');
      }

      setSent({ channel, whatsappLink });
      onSaved(json.mission);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const footerContent = sent ? (
    <button onClick={onClose} className="px-4 py-2.5 text-sm text-white/75 hover:text-white">
      Fermer
    </button>
  ) : !loading ? (
    <div className="flex items-center justify-between gap-2 w-full">
      <div className="text-[11px] text-white/45">
        {missingFields.length > 0 && (
          <span className="text-amber-300">⚠ {missingFields.length} champ{missingFields.length > 1 ? 's' : ''} à compléter</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onClose} disabled={saving} className="px-4 py-2.5 text-sm text-white/75 hover:text-white">
          Annuler
        </button>
        <button
          onClick={() => handleMarkSent('email')}
          disabled={saving || !briefDraft.trim() || !chefEmail}
          title={!chefEmail ? "Pas d'email chef enregistré" : undefined}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-400 text-sky-950 text-sm font-medium hover:bg-sky-300 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          Marquer envoyé (email)
        </button>
        <button
          onClick={() => handleMarkSent('whatsapp')}
          disabled={saving || !briefDraft.trim() || !chefPhone}
          title={!chefPhone ? "Pas de téléphone chef enregistré" : undefined}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-400 text-emerald-950 text-sm font-medium hover:bg-emerald-300 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <MessageCircle className="w-3.5 h-3.5" />
          Envoyer via WhatsApp
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <AdminModal
      title={`Brief chef — ${chefName || 'chef non renseigné'}`}
      subtitle="Généré depuis le contrat. Relis avant d'envoyer — n'invente rien."
      size="lg"
      onClose={onClose}
      footer={footerContent}
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="-mt-1">
          <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5">
            <TabBtn active={tab === 'brief'} onClick={() => setTab('brief')} icon={FileText} label="Brief" />
            <TabBtn active={tab === 'whatsapp'} onClick={() => setTab('whatsapp')} icon={MessageCircle} label="WhatsApp" />
            <TabBtn active={tab === 'check'} onClick={() => setTab('check')} icon={AlertTriangle} label={`À vérifier${missingFields.length > 0 ? ` (${missingFields.length})` : ''}`} tone={missingFields.length > 0 ? 'warn' : 'default'} />
          </div>
        </div>

        {/* Body */}
        <div>
          {loading ? (
            <div className="py-10 text-center text-sm text-white/55">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Claude rédige le brief depuis le contrat…
            </div>
          ) : sent ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
              <p className="text-sm text-white">
                Brief marqué envoyé via {sent.channel === 'whatsapp' ? 'WhatsApp' : 'email'}.
              </p>
              <p className="text-[11px] text-white/45 mt-2">
                Le bandeau de rappel passe au vert sur la fiche mission.
              </p>
            </div>
          ) : (
            <>
              {tab === 'brief' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-white/55">Brief chef (éditable)</label>
                    <button onClick={generate} className="inline-flex items-center gap-1 text-[11px] text-white/55 hover:text-white">
                      <RefreshCw className="w-3 h-3" /> Régénérer
                    </button>
                  </div>
                  <textarea
                    value={briefDraft}
                    onChange={(e) => setBriefDraft(e.target.value)}
                    rows={20}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-[13px] text-white font-mono leading-relaxed"
                  />
                  {briefEdited && (
                    <p className="text-[11px] text-amber-300/85 mt-1.5 italic">
                      Édité par rapport à la version Claude.
                    </p>
                  )}
                </div>
              )}

              {tab === 'whatsapp' && (
                <div>
                  <label className="text-xs text-white/55 block mb-2">Message d'accompagnement WhatsApp</label>
                  <textarea
                    value={whatsappDraft}
                    onChange={(e) => setWhatsappDraft(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
                  />
                  <p className="text-[11px] text-white/45 mt-2">
                    Quand tu cliques "Envoyer via WhatsApp", on ouvre WhatsApp avec ce message + le brief complet collé en dessous.
                  </p>
                </div>
              )}

              {tab === 'check' && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                    À vérifier / compléter avant d'envoyer
                  </h4>
                  {missingFields.length === 0 ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200 inline-flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Aucun champ marqué [À PRÉCISER]. Tu peux envoyer.
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-white/55 mb-3">
                        Les champs suivants sont marqués <code className="text-amber-300">[À PRÉCISER PAR THOMAS]</code> dans le brief. Édite le brief pour les compléter (notamment le menu) avant envoi :
                      </p>
                      <ul className="space-y-2">
                        {missingFields.map((field, i) => (
                          <li key={i} className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100 inline-flex items-center gap-2">
                            <span className="text-amber-300">⚠</span>
                            {field}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-white/45 mt-4 italic">
                        Astuce anti-oubli "fromage" : compare avec le contrat avant d'envoyer. Si une prestation est mentionnée au contrat mais absente du brief, ajoute-la.
                      </p>
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminModal>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, tone = 'default' }: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileText;
  label: string;
  tone?: 'default' | 'warn';
}) {
  const base = active
    ? tone === 'warn'
      ? 'bg-amber-400/20 text-amber-100 font-medium'
      : 'bg-white/10 text-white font-medium'
    : 'text-white/55 hover:text-white/85';
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition ${base}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
