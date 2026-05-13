'use client';

// Formulaire 3 étapes intégré pour la landing /villa (campagnes Google Ads).
// Post sur /api/request avec matchType='fast' + clientType='private' + source.
// Friction minimale : seul l'email est obligatoire côté backend.

import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

type MissionType = 'villa' | 'yacht' | 'residence' | 'event';
type ServiceLevel = 'standard' | 'premium' | 'uhnw' | 'unsure';

type Step1 = {
  missionType: MissionType | '';
  location: string;
  startDate: string;
  endDate: string;
};

type Step2 = {
  guestCount: string;
  serviceLevel: ServiceLevel | '';
  message: string;
};

type Step3 = {
  fullName: string;
  email: string;
  phone: string;
};

const MISSION_OPTIONS: { value: MissionType; label: string; sub: string }[] = [
  { value: 'villa', label: 'Villa', sub: 'Résidence privée, location saisonnière' },
  { value: 'yacht', label: 'Yacht', sub: 'Charter ou propriété, navigation Méditerranée' },
  { value: 'residence', label: 'Résidence principale', sub: 'Famille, chef récurrent' },
  { value: 'event', label: 'Événement', sub: 'Dîner, anniversaire, célébration' },
];

const SERVICE_OPTIONS: { value: ServiceLevel; label: string; sub: string }[] = [
  { value: 'standard', label: 'Standard', sub: 'Cuisine soignée quotidienne' },
  { value: 'premium', label: 'Premium', sub: 'Profils expérimentés, gastronomie' },
  { value: 'uhnw', label: 'UHNW', sub: 'Ex-étoilés, brigade possible' },
  { value: 'unsure', label: 'Je ne sais pas', sub: 'À cadrer ensemble' },
];

export default function InlineRequestForm({ source }: { source: string }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [s1, setS1] = useState<Step1>({
    missionType: '',
    location: '',
    startDate: '',
    endDate: '',
  });
  const [s2, setS2] = useState<Step2>({
    guestCount: '',
    serviceLevel: '',
    message: '',
  });
  const [s3, setS3] = useState<Step3>({
    fullName: '',
    email: '',
    phone: '',
  });

  const canNext1 = !!s1.missionType && s1.location.trim().length > 0;
  const canNext2 = true; // étape 2 entièrement optionnelle
  const canSubmit = s3.email.trim().length > 0 && /\S+@\S+\.\S+/.test(s3.email);

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        matchType: 'fast',
        clientType: 'private',
        source,
        // Step 1
        missionCategory: s1.missionType || null,
        assignmentType: s1.missionType || null,
        location: s1.location || null,
        startDate: s1.startDate || null,
        endDate: s1.endDate || null,
        // Step 2
        guestCount: s2.guestCount ? Number(s2.guestCount) : null,
        serviceExpectations: s2.serviceLevel || null,
        message: s2.message || null,
        // Step 3
        fullName: s3.fullName || null,
        email: s3.email,
        phone: s3.phone || null,
      };

      const res = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      // Google Ads conversion + Meta Pixel.
      // ⚠️ À configurer côté Thomas : remplacer 'AW-18111694917/...' par
      // l'ID de conversion exact dans Google Ads → Outils → Conversions.
      try {
        (window as any).gtag?.('event', 'conversion', {
          send_to: 'AW-18111694917/landing_villa_submit',
          value: 1,
          currency: 'EUR',
        });
      } catch {}
      try {
        (window as any).fbq?.('track', 'Lead', { source });
      } catch {}

      setStep(4);
    } catch (e: any) {
      setError(e?.message || 'Erreur, réessaie dans un instant.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/12 bg-white/[0.04] p-6 backdrop-blur-sm md:p-10">
      {/* Stepper */}
      {step < 4 ? (
        <div className="mb-8 flex items-center gap-3 text-xs text-white/55">
          <StepDot active={step >= 1} label="Projet" />
          <DotDivider />
          <StepDot active={step >= 2} label="Détails" />
          <DotDivider />
          <StepDot active={step >= 3} label="Contact" />
        </div>
      ) : null}

      {/* STEP 1 */}
      {step === 1 ? (
        <div className="space-y-6">
          <Field label="Type de mission">
            <div className="grid gap-2 md:grid-cols-2">
              {MISSION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setS1({ ...s1, missionType: opt.value })}
                  className={[
                    'rounded-2xl border px-4 py-3 text-left transition',
                    s1.missionType === opt.value
                      ? 'border-white bg-white/15 text-white'
                      : 'border-white/15 bg-white/[0.03] text-white/75 hover:bg-white/[0.08]',
                  ].join(' ')}
                >
                  <div className="text-[15px] font-medium">{opt.label}</div>
                  <div className="mt-1 text-[12px] text-white/55">{opt.sub}</div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Destination">
            <Input
              value={s1.location}
              placeholder="ex: Saint-Tropez, Ibiza, Cap Ferrat…"
              onChange={(v) => setS1({ ...s1, location: v })}
            />
          </Field>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Date d'arrivée (optionnel)">
              <Input
                type="date"
                value={s1.startDate}
                onChange={(v) => setS1({ ...s1, startDate: v })}
              />
            </Field>
            <Field label="Date de départ (optionnel)">
              <Input
                type="date"
                value={s1.endDate}
                onChange={(v) => setS1({ ...s1, endDate: v })}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              disabled={!canNext1}
              onClick={() => setStep(2)}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium text-[#161616] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuer <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* STEP 2 */}
      {step === 2 ? (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre de couverts (par repas)">
              <Input
                type="number"
                min="1"
                value={s2.guestCount}
                placeholder="ex: 6"
                onChange={(v) => setS2({ ...s2, guestCount: v })}
              />
            </Field>
            <Field label="Niveau de service">
              <select
                value={s2.serviceLevel}
                onChange={(e) => setS2({ ...s2, serviceLevel: e.target.value as ServiceLevel })}
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
              >
                <option value="" className="bg-[#161616]">Choisir…</option>
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#161616]">
                    {opt.label} — {opt.sub}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Précisions (optionnel)">
            <textarea
              value={s2.message}
              onChange={(e) => setS2({ ...s2, message: e.target.value })}
              rows={4}
              placeholder="Contraintes alimentaires, formats attendus, équipe en place, équipement…"
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none"
            />
          </Field>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium text-[#161616] transition hover:bg-white/90"
            >
              Continuer <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* STEP 3 */}
      {step === 3 ? (
        <div className="space-y-6">
          <Field label="Nom complet (optionnel)">
            <Input
              value={s3.fullName}
              placeholder="Prénom Nom"
              onChange={(v) => setS3({ ...s3, fullName: v })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={s3.email}
              placeholder="vous@exemple.com"
              onChange={(v) => setS3({ ...s3, email: v })}
            />
          </Field>
          <Field label="Téléphone (optionnel)">
            <Input
              type="tel"
              value={s3.phone}
              placeholder="+33 6 12 34 56 78"
              onChange={(v) => setS3({ ...s3, phone: v })}
            />
          </Field>

          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <p className="text-[11px] text-white/45">
            Vos informations restent confidentielles. Aucune référence n'est publiée. Voir notre <a href="/privacy" className="underline underline-offset-2">politique de confidentialité</a>.
          </p>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={submitting}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 disabled:opacity-40"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </button>
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={submit}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-medium text-[#161616] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi…
                </>
              ) : (
                <>Envoyer ma demande <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {/* STEP 4 — Confirmation */}
      {step === 4 ? (
        <div className="text-center py-6">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-300" />
          <h3 className="mt-6 text-2xl font-serif text-white">Demande reçue.</h3>
          <p className="mt-4 max-w-md mx-auto text-[16px] leading-7 text-white/75">
            Nous revenons vers vous sous 6 heures avec un profil ciblé.
          </p>
          <p className="mt-2 text-[14px] text-white/55">
            Un email de confirmation vient d'être envoyé à <span className="text-white/85">{s3.email}</span>.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-white/55 mb-2">{label}</div>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none"
    />
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${active ? 'text-white' : 'text-white/40'}`}>
      <span
        className={`h-2 w-2 rounded-full ${active ? 'bg-white' : 'bg-white/30'}`}
      />
      <span className="text-[11px] uppercase tracking-[0.2em]">{label}</span>
    </span>
  );
}

function DotDivider() {
  return <span className="h-px flex-1 bg-white/15" />;
}
