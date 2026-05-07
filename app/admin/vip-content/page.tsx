'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Marker, Label, Button, Input, Textarea } from '@/components/ui';
import type { VipContent, VipTip } from '@/lib/vip-content';
import { listGuides } from '@/lib/vip-guides';
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  BookOpen,
  MessageCircle,
  Phone,
  Crown,
  Eye,
  Send,
  Mail,
  Link2,
} from 'lucide-react';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

export default function AdminVipContentPage() {
  const [content, setContent] = useState<VipContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  // Initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/vip-content', {
          headers: { 'x-admin-email': ADMIN_EMAIL },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (alive) setContent(json.content ?? null);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Échec du chargement');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const update = (patch: Partial<VipContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
    setDirty(true);
    setSavedAt(null);
  };

  const updateTip = (id: string, patch: Partial<VipTip>) => {
    setContent((c) =>
      c
        ? {
            ...c,
            tips: c.tips.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          }
        : c,
    );
    setDirty(true);
    setSavedAt(null);
  };

  const addTip = () => {
    setContent((c) => {
      if (!c) return c;
      const id = `tip-${Date.now()}`;
      return { ...c, tips: [...c.tips, { id, title: '', desc: '', href: '' }] };
    });
    setDirty(true);
    setSavedAt(null);
  };

  const removeTip = (id: string) => {
    setContent((c) => (c ? { ...c, tips: c.tips.filter((t) => t.id !== id) } : c));
    setDirty(true);
    setSavedAt(null);
  };

  const moveTip = (id: string, direction: -1 | 1) => {
    setContent((c) => {
      if (!c) return c;
      const idx = c.tips.findIndex((t) => t.id === id);
      if (idx < 0) return c;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= c.tips.length) return c;
      const tips = [...c.tips];
      [tips[idx], tips[newIdx]] = [tips[newIdx], tips[idx]];
      return { ...c, tips };
    });
    setDirty(true);
    setSavedAt(null);
  };

  const save = async () => {
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/vip-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': ADMIN_EMAIL,
        },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP ${res.status}`);
      setContent(json.content);
      setSavedAt(Date.now());
      setDirty(false);
    } catch (e: any) {
      setError(e?.message || "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="py-20 text-center">
        <p className="text-stone-600 mb-2">Impossible de charger le contenu VIP.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={() => window.location.reload()} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Marker />
        <Label>Admin · VIP</Label>
        <h1 className="text-3xl font-serif text-stone-900">
          Contenu VIP éditable
        </h1>
        <p className="text-sm text-stone-500 mt-2 max-w-2xl">
          Modifiez ce que voient les chefs membres VIP sur leur page{' '}
          <code className="text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
            /chef/vip
          </code>
          . La preview à droite reflète vos modifications en direct.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ────── ÉDITEUR ────── */}
        <div className="space-y-6">
          {/* Liens */}
          <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-serif text-stone-900">Liens</h2>

            <div className="space-y-2">
              <Label>Groupe Last Minute (WhatsApp / Telegram)</Label>
              <Input
                value={content.groupUrl}
                onChange={(e) => update({ groupUrl: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
              />
              <p className="text-xs text-stone-400">
                Vide → la section affiche &laquo;&nbsp;lien envoyé par email
                sous 24h&nbsp;&raquo; (placeholder pédagogique).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Calendly — Call de positionnement (12 mois)</Label>
              <Input
                value={content.calendlyUrl}
                onChange={(e) => update({ calendlyUrl: e.target.value })}
                placeholder="https://calendly.com/..."
              />
              <p className="text-xs text-stone-400">
                Visible uniquement pour les chefs en engagement 12 mois.
              </p>
            </div>
          </section>

          {/* Tips */}
          <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-stone-900">
                Tips &amp; E-books
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addTip}
              >
                <Plus className="w-4 h-4 mr-2" /> Ajouter
              </Button>
            </div>

            <div className="space-y-4">
              {content.tips.map((tip, idx) => (
                <div
                  key={tip.id}
                  className="border border-stone-200 p-4 rounded-xl space-y-3 bg-stone-50/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-stone-400">
                      Tip {idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveTip(tip.id, -1)}
                        disabled={idx === 0}
                        className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1 disabled:opacity-30"
                        aria-label="Monter"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTip(tip.id, 1)}
                        disabled={idx === content.tips.length - 1}
                        className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1 disabled:opacity-30"
                        aria-label="Descendre"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTip(tip.id)}
                        className="text-xs text-red-600 hover:text-red-800 inline-flex items-center gap-1 px-2 py-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      value={tip.title}
                      onChange={(e) =>
                        updateTip(tip.id, { title: e.target.value })
                      }
                      placeholder="Ex: Comment négocier un séjour saisonnier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={tip.desc}
                      onChange={(e) =>
                        updateTip(tip.id, { desc: e.target.value })
                      }
                      placeholder="Une courte description du contenu (1-2 lignes)"
                      className="min-h-[70px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Lien — guide interne, PDF, Notion ou Google Doc{' '}
                      <span className="text-stone-400 font-normal normal-case">
                        (optionnel)
                      </span>
                    </Label>
                    <Input
                      value={tip.href || ''}
                      onChange={(e) =>
                        updateTip(tip.id, { href: e.target.value })
                      }
                      placeholder="/chef/vip/guides/slug ou https://..."
                    />
                    <p className="text-xs text-stone-400">
                      Si rempli, la card devient cliquable côté chef. Lien
                      interne (commence par /) → ouverture dans le même onglet.
                      Lien externe → nouvel onglet.
                    </p>

                    {/* Sélecteur de guides internes — 1 click → href rempli */}
                    {(() => {
                      const guides = listGuides();
                      if (guides.length === 0) return null;
                      return (
                        <div className="border border-stone-200 bg-white rounded-lg p-3 mt-2">
                          <div className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-2 inline-flex items-center gap-1.5">
                            <Link2 className="w-3 h-3" />
                            Guides internes disponibles
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {guides.map((g) => {
                              const path = `/chef/vip/guides/${g.slug}`;
                              const active = tip.href === path;
                              return (
                                <button
                                  key={g.slug}
                                  type="button"
                                  onClick={() =>
                                    updateTip(tip.id, {
                                      href: active ? '' : path,
                                      // Auto-remplit titre/desc si vides
                                      title: tip.title || g.fr.title,
                                      desc: tip.desc || g.fr.excerpt,
                                    })
                                  }
                                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                    active
                                      ? 'border-stone-900 bg-stone-900 text-white'
                                      : 'border-stone-200 text-stone-700 hover:border-stone-400'
                                  }`}
                                  title={g.fr.title}
                                >
                                  {g.slug}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-stone-400 mt-2">
                            Clique sur un slug pour lier ce tip à un guide
                            interne. Re-clic = délier.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}

              {content.tips.length === 0 && (
                <p className="text-sm text-stone-500 italic text-center py-6 border border-dashed border-stone-200 rounded-xl">
                  Aucun tip pour l&apos;instant. Cliquez sur &laquo;&nbsp;Ajouter&nbsp;&raquo; pour
                  en créer un.
                </p>
              )}
            </div>
          </section>

          {/* Save bar (sticky bottom) */}
          <div className="sticky bottom-4 bg-white border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg z-10">
            <div className="text-sm">
              {error ? (
                <span className="text-red-600">{error}</span>
              ) : savedAt ? (
                <span className="text-green-700">
                  Enregistré ✓ ({new Date(savedAt).toLocaleTimeString('fr-FR')})
                </span>
              ) : dirty ? (
                <span className="text-amber-700">
                  Modifications non sauvegardées
                </span>
              ) : (
                <span className="text-stone-400">
                  Aucune modification en attente
                </span>
              )}
            </div>
            <Button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="bg-stone-900 hover:bg-stone-800"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>

          {/* Broadcast custom aux VIP */}
          <BroadcastSection />
        </div>

        {/* ────── PREVIEW ────── */}
        <div className="lg:sticky lg:top-6 self-start">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 mb-3">
              <Eye className="w-3 h-3" />
              <span>Preview</span>
              <span className="text-stone-300">— ce que voit un chef VIP</span>
            </div>
            <VipPreview content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────── */
/* Broadcast custom — Notifier tous les VIP      */
/* ───────────────────────────────────────────── */

function BroadcastSection() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Sujet et message requis.');
      return;
    }
    if (
      !confirm(
        `Envoyer cet email à tous les chefs VIP actifs ? Cette action est irréversible.`,
      )
    ) {
      return;
    }

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/vip-content/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': ADMIN_EMAIL,
        },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || json?.error || 'Erreur');

      setResult({ sent: json.sent ?? 0, failed: json.failed ?? 0 });
      setSubject('');
      setBody('');
    } catch (e: any) {
      setError(e?.message || 'Erreur envoi');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-stone-700" />
        <h2 className="text-lg font-serif text-stone-900">
          Notifier tous les VIP
        </h2>
      </div>
      <p className="text-xs text-stone-500">
        Envoie un email à <b>tous les chefs VIP actifs</b> (payants + offerts).
        Pour les nouveaux tips, l&apos;email est envoyé automatiquement à
        l&apos;enregistrement.
      </p>

      <div className="space-y-2">
        <Label>Sujet</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex : Mise à jour importante des outils VIP"
        />
      </div>

      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Texte du message. Les sauts de ligne sont préservés."
          className="min-h-[180px]"
        />
        <p className="text-xs text-stone-400">
          Le greeting &laquo;&nbsp;Bonjour {'{firstName}'}&nbsp;&raquo; et le
          bouton &laquo;&nbsp;Accéder à mon espace VIP&nbsp;&raquo; sont ajoutés
          automatiquement.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : result ? (
            <span className="text-green-700">
              ✓ {result.sent} envoi(s) · {result.failed} échec(s)
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          onClick={send}
          disabled={sending || !subject.trim() || !body.trim()}
          className="bg-stone-900 hover:bg-stone-800"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Envoyer aux VIP
        </Button>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────── */
/* Preview component — réplique condensée /chef/vip */
/* ───────────────────────────────────────────── */

function VipPreview({ content }: { content: VipContent }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4 max-h-[80vh] overflow-y-auto">
      {/* Plan header */}
      <div className="border border-amber-200 bg-amber-50 p-3">
        <div className="text-[10px] uppercase tracking-widest text-amber-700 mb-0.5">
          Plan actif
        </div>
        <div className="text-base font-serif text-stone-900 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-600" />
          VIP 12 mois
        </div>
        <div className="text-xs text-stone-500 mt-1">
          Engagement jusqu&apos;au 15 mai 2027 · 365 jours restants
        </div>
      </div>

      {/* Group section */}
      <div className="border border-stone-200 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-stone-700" />
          <span className="text-[10px] uppercase tracking-widest text-stone-500">
            Réseau privé
          </span>
        </div>
        <h3 className="text-sm font-serif text-stone-900">
          Groupe Missions Last Minute
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed">
          Accès au groupe WhatsApp privé où sont partagées les missions urgentes.
        </p>
        {content.groupUrl ? (
          <div className="text-[11px] inline-flex items-center gap-1 bg-[#25D366] text-white px-2.5 py-1 rounded">
            <MessageCircle className="w-3 h-3" />
            Rejoindre le groupe →
          </div>
        ) : (
          <div className="text-[11px] text-stone-500 italic border-l-2 border-stone-300 pl-2">
            Lien envoyé par email sous 24h après la première souscription.
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="border border-stone-200 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-stone-700" />
          <span className="text-[10px] uppercase tracking-widest text-stone-500">
            Ressources
          </span>
        </div>
        <h3 className="text-sm font-serif text-stone-900">
          Tips &amp; E-books exclusifs
        </h3>
        <div className="space-y-2">
          {content.tips.length === 0 && (
            <p className="text-xs text-stone-400 italic">Aucun tip.</p>
          )}
          {content.tips.map((tip) => (
            <div
              key={tip.id}
              className={`border border-stone-200 bg-stone-50/50 p-2.5 ${
                tip.href ? 'cursor-pointer hover:border-stone-400' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <BookOpen className="w-3 h-3 text-stone-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-stone-900 truncate">
                    {tip.title || (
                      <span className="text-stone-400 italic">(sans titre)</span>
                    )}
                  </div>
                  {tip.desc && (
                    <div className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                      {tip.desc}
                    </div>
                  )}
                  {tip.href && (
                    <div className="text-[10px] text-blue-600 mt-1 inline-flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5" />
                      Cliquable
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendly */}
      <div className="border border-stone-200 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-stone-700" />
            <span className="text-[10px] uppercase tracking-widest text-stone-500">
              Coaching
            </span>
          </div>
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-700 border border-amber-300 bg-amber-50">
            12 mois inclus
          </span>
        </div>
        <h3 className="text-sm font-serif text-stone-900">
          Call de positionnement offert
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed">
          30 minutes en visio avec Thomas pour cadrer votre positionnement.
        </p>
        <div className="text-[10px] text-stone-400 truncate">
          {content.calendlyUrl || (
            <span className="text-amber-700 italic">URL Calendly non définie</span>
          )}
        </div>
      </div>
    </div>
  );
}
