"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button, Input, Textarea, Reveal, Marker } from "../../components/ui";
import { submitRequest } from "../../services/actions";
import type { RequestForm } from "../../types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type UnifiedRequestFormState = RequestForm & {
  endDate?: string;
  budgetAmount?: number | null;
  budgetUnit?: "per_person" | "per_day" | "total";
  missionCategory?: "single_replacement" | "single_service" | "residence" | "yacht";
  mealPlan?: "breakfast" | "lunch" | "dinner" | "breakfast_lunch" | "lunch_dinner" | "full_time";
  replacementNeeded?: "yes" | "no";
};

// ─────────────────────────────────────────────
// Témoignages clients (anonymisés)
// ─────────────────────────────────────────────
const clientReviews = [
  {
    text: "Demande soumise le matin, chef confirmé l'après-midi. Deux semaines à Saint-Tropez, 10 personnes, zéro friction. Je ne passerai plus jamais par une autre voie.",
    author: "S.M.",
    context: "Villa · Saint-Tropez · Juillet",
    missionType: ["residence", "single_service"],
  },
  {
    text: "On avait besoin d'un chef pour le Grand Prix de Monaco en dernière minute. En 4 heures, profil validé, brief envoyé. Niveau palace.",
    author: "A.D.",
    context: "Événement privé · Monaco · Mai",
    missionType: ["single_service", "single_replacement"],
  },
  {
    text: "Notre conciergerie travaille avec Chefs Talents depuis 6 mois. Chaque demande est traitée avec la même rigueur. C'est devenu un partenaire incontournable.",
    author: "Directrice · Conciergerie Côte d'Azur",
    context: "Partenariat B2B · Récurrent",
    missionType: ["residence", "yacht"],
  },
  {
    text: "Chef à bord pendant 3 semaines en Méditerranée. Sélectionné pour son expérience superyacht, ses langues et sa discrétion. Exactement ce qu'on attendait.",
    author: "P.L.",
    context: "Yacht · Méditerranée · Août",
    missionType: ["yacht"],
  },
  {
    text: "Villa à Ibiza, juillet et août fully booked. Même chef les deux mois — une vraie continuité. Famille ravie, on rereserve pour l'année prochaine.",
    author: "L.K.",
    context: "Villa · Ibiza · Été",
    missionType: ["residence"],
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function parseNumberOrNull(raw: string): number | null {
  const cleaned = String(raw ?? "").replace(",", ".").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatMoney(v?: number) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${Math.round(v)} €`;
  }
}

function daysBetweenInclusive(start?: string, end?: string) {
  if (!start || !end) return 1;
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  return Math.max(1, Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}

function deriveDateMode(category?: UnifiedRequestFormState["missionCategory"]): "single" | "multi" {
  return category === "residence" || category === "yacht" ? "multi" : "single";
}

function makeEmptyForm(): UnifiedRequestFormState {
  return {
    mode: "concierge", clientType: "private", location: "", dateMode: "single",
    startDate: "", endDate: "", assignmentType: "event", guestCount: 2,
    serviceExpectations: "chef_only", cuisinePreferences: "", dietaryRestrictions: "",
    preferredLanguage: "", budgetRange: "", notes: "", fullName: "", email: "", phone: "",
    companyName: "", serviceRhythm: "daily", accommodationProvided: "yes", sailingArea: "",
    crewSize: 0, budgetAmount: null, budgetUnit: "total", missionCategory: "single_service",
    mealPlan: "dinner", replacementNeeded: "no",
  };
}

function humanMissionCategory(v?: UnifiedRequestFormState["missionCategory"]) {
  if (v === "single_replacement") return "Remplacement ponctuel";
  if (v === "single_service") return "Prestation ponctuelle";
  if (v === "residence") return "Séjour / résidence";
  if (v === "yacht") return "Mission yacht";
  return "—";
}

function humanMealPlan(v?: UnifiedRequestFormState["mealPlan"]) {
  const map: Record<string, string> = {
    breakfast: "Petit-déjeuner", lunch: "Déjeuner", dinner: "Dîner",
    breakfast_lunch: "Petit-déjeuner + déjeuner", lunch_dinner: "Déjeuner + dîner", full_time: "Full time",
  };
  return v ? map[v] ?? "—" : "—";
}

function buildBudgetRange(f: UnifiedRequestFormState) {
  const amount = Number(f.budgetAmount || 0);
  if (!amount) return "";
  if (f.budgetUnit === "per_person") return `${formatMoney(amount)} / pers`;
  if (f.budgetUnit === "per_day") return `${formatMoney(amount)} / jour`;
  return `${formatMoney(amount)} total`;
}

function getAssignmentType(f: UnifiedRequestFormState) {
  if (f.missionCategory === "yacht") return "yacht";
  if (f.missionCategory === "residence") return "daily";
  if (f.missionCategory === "single_replacement") return "event";
  if (f.mealPlan === "dinner") return "dinner";
  return "event";
}

function buildStructuredNotes(f: UnifiedRequestFormState) {
  return [
    `Type: ${humanMissionCategory(f.missionCategory)}`,
    `Remplacement: ${f.replacementNeeded === "yes" ? "Oui" : "Non"}`,
    `Service: ${humanMealPlan(f.mealPlan)}`,
    `Dates: ${f.startDate || "—"}${deriveDateMode(f.missionCategory) === "multi" ? ` → ${f.endDate || "—"}` : ""}`,
    `Convives: ${f.guestCount ?? "—"}`,
    `Budget: ${buildBudgetRange(f) || "—"}`,
    f.notes ? `Notes: ${f.notes}` : "",
  ].filter(Boolean).join("\n");
}

function computeEstimate(f: UnifiedRequestFormState) {
  const amount = Number(f.budgetAmount || 0);
  if (!amount) return null;
  if (f.budgetUnit === "per_person") {
    const pax = Number(f.guestCount || 0);
    return pax ? amount * pax : null;
  }
  if (f.budgetUnit === "per_day") {
    const days = deriveDateMode(f.missionCategory) === "multi" ? daysBetweenInclusive(f.startDate, f.endDate) : 1;
    return amount * days;
  }
  return amount;
}

// ─────────────────────────────────────────────
// Composants UI
// ─────────────────────────────────────────────
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600" role="alert">{message}</p>;
}

function Req() {
  return <span className="ml-0.5 text-red-400" aria-hidden="true">*</span>;
}

function ChoiceCard({ active, title, subtitle, icon, onClick }: {
  active: boolean; title: string; subtitle?: string; icon?: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full rounded-xl border-2 p-5 text-left transition-all duration-200 ${
        active
          ? "border-stone-900 bg-stone-900 text-white shadow-lg"
          : "border-stone-200 bg-white text-stone-800 hover:border-stone-400 hover:shadow-md"
      }`}
    >
      {icon && <span className="text-2xl mb-3 block">{icon}</span>}
      <div className="text-sm font-semibold tracking-wide">{title}</div>
      {subtitle && <div className={`mt-1 text-xs font-light ${active ? "text-stone-300" : "text-stone-500"}`}>{subtitle}</div>}
    </button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <span className="text-xs text-stone-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-stone-900 text-right font-medium">{value || "—"}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────
function RequestFormContent() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; referenceId?: string } | null>(null);
  const [formData, setFormData] = useState<UnifiedRequestFormState>(() => makeEmptyForm());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reviewIndex, setReviewIndex] = useState(0);

  const totalSteps = 3;
  const stepLabels = ["Contexte", "Service", "Contact"];

  const clearError = (field: string) =>
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const summaryBudget = useMemo(() => buildBudgetRange(formData), [formData]);
  const estimatedTotal = useMemo(() => computeEstimate(formData), [formData]);
  const dateMode = deriveDateMode(formData.missionCategory);

  // Témoignage adapté au type de mission
  const relevantReview = useMemo(() => {
    if (!formData.missionCategory) return clientReviews[reviewIndex % clientReviews.length];
    const filtered = clientReviews.filter(r => r.missionType.includes(formData.missionCategory!));
    return filtered.length > 0 ? filtered[reviewIndex % filtered.length] : clientReviews[0];
  }, [formData.missionCategory, reviewIndex]);

  const handleContinue = () => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (String(formData.location || "").trim().length < 2) errors.location = "Veuillez indiquer le lieu.";
      if (String(formData.startDate || "").trim().length < 8) errors.startDate = "Veuillez sélectionner une date.";
      if (dateMode === "multi" && String(formData.endDate || "").trim().length < 8) errors.endDate = "Veuillez sélectionner la date de fin.";
    }
    if (step === 2) {
      if (!formData.mealPlan) errors.mealPlan = "Veuillez sélectionner un rythme.";
      if (!Number(formData.guestCount || 0)) errors.guestCount = "Veuillez indiquer le nombre de convives.";
      if (!Number(formData.budgetAmount || 0)) errors.budgetAmount = "Veuillez indiquer un budget indicatif.";
    }
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setStep(s => Math.min(s + 1, totalSteps));
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (String(formData.fullName || "").trim().length < 2) errors.fullName = "Veuillez indiquer votre nom.";
    if (!String(formData.email || "").includes("@")) errors.email = "Email invalide.";
    if (String(formData.phone || "").trim().length < 6) errors.phone = "Numéro requis.";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setIsSubmitting(true);
    try {
      const payload: any = {
        ...formData, mode: "concierge", dateMode,
        assignmentType: getAssignmentType(formData),
        serviceRhythm: "daily",
        serviceExpectations: formData.mealPlan === "full_time" ? "full_team" : "chef_only",
        budgetRange: buildBudgetRange(formData),
        notes: buildStructuredNotes(formData),
        endDate: dateMode === "multi" ? formData.endDate : "",
        guestCount: Number(formData.guestCount || 0),
      };
      const response = await submitRequest(payload);
      if (response?.success) setResult(response);
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  // ── Succès ──
  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-stone-900 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-4xl font-serif font-normal mb-4 text-stone-900">Demande enregistrée.</h2>
          <p className="text-stone-500 font-light text-lg leading-relaxed mb-4">
            Un membre de notre équipe analyse votre dossier et vous recontacte <strong className="text-stone-800 font-medium">dans les 6 heures</strong>.
          </p>
          {result.referenceId && (
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-10">Réf. {result.referenceId}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-[0.15em] text-stone-400 mb-10">
            <span>NDA disponible</span>
            <span className="w-1 h-1 bg-stone-300 rounded-full" />
            <span>Discrétion garantie</span>
            <span className="w-1 h-1 bg-stone-300 rounded-full" />
            <span>400+ chefs</span>
          </div>
          <Link href="/" className="text-sm uppercase tracking-[0.15em] text-stone-500 hover:text-stone-900 border-b border-stone-300 pb-0.5 transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // ── Formulaire ──
  return (
    <div className="min-h-screen bg-stone-50">

      {/* HERO */}
      <section className="bg-stone-900 text-white pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-6">Chefs Talents · Europe</p>
              <h1 className="text-5xl md:text-6xl font-serif font-normal leading-[1.05] mb-6">
                Votre chef privé.<br />
                <span className="text-stone-400">En moins de 6h.</span>
              </h1>
              <p className="text-stone-400 font-light text-lg leading-relaxed max-w-md">
                Décrivez votre mission. Un membre de notre équipe prend en charge votre dossier et vous propose une sélection de profils adaptés.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { n: "400+", label: "Chefs en Europe" },
                { n: "< 6h", label: "Délai de réponse" },
                { n: "1", label: "Personne dédiée" },
              ].map((s, i) => (
                <div key={i} className="bg-stone-800 rounded-xl p-5 text-center border border-stone-700">
                  <p className="text-3xl font-serif text-white mb-2">{s.n}</p>
                  <p className="text-xs text-stone-400 font-light leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROGRESS BAR */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-4">
          <div className="flex items-center gap-0">
            {stepLabels.map((label, i) => {
              const n = i + 1;
              const done = n < step;
              const active = n === step;
              return (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      done ? "bg-stone-900 text-white" : active ? "bg-stone-900 text-white ring-4 ring-stone-200" : "bg-stone-200 text-stone-400"
                    }`}>
                      {done ? "✓" : n}
                    </div>
                    <span className={`text-xs font-medium ${active ? "text-stone-900" : "text-stone-400"}`}>{label}</span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`flex-1 h-px mx-3 transition-colors ${done ? "bg-stone-900" : "bg-stone-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <div className="grid lg:grid-cols-[1fr_360px] gap-10">

          {/* ── FORMULAIRE ── */}
          <div>

            {/* ÉTAPE 1 */}
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-serif text-stone-900 mb-1">Le cadre de la mission</h2>
                  <p className="text-stone-500 font-light">Lieu, dates et nature du besoin.</p>
                </div>

                {/* Vous êtes */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                  <label className="block text-sm font-medium text-stone-700 mb-4">Vous êtes</label>
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceCard icon="👤" active={formData.clientType === "private"} title="Client privé" subtitle="Villa, yacht, résidence" onClick={() => setFormData(p => ({ ...p, clientType: "private" }))} />
                    <ChoiceCard icon="🏢" active={formData.clientType === "concierge"} title="Conciergerie" subtitle="Partenaire B2B" onClick={() => setFormData(p => ({ ...p, clientType: "concierge" }))} />
                  </div>
                  {formData.clientType === "concierge" && (
                    <div className="mt-4">
                      <Input value={formData.companyName} onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))} placeholder="Nom de la structure" />
                    </div>
                  )}
                </div>

                {/* Type de mission */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                  <label className="block text-sm font-medium text-stone-700 mb-4">Type de mission <Req /></label>
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceCard icon="🍽" active={formData.missionCategory === "single_service"} title="Prestation" subtitle="Dîner, déjeuner — date unique" onClick={() => { clearError("missionCategory"); setFormData(p => ({ ...p, missionCategory: "single_service", dateMode: "single", replacementNeeded: "no", endDate: "" })); }} />
                    <ChoiceCard icon="🔄" active={formData.missionCategory === "single_replacement"} title="Remplacement" subtitle="Chef absent — urgence" onClick={() => { clearError("missionCategory"); setFormData(p => ({ ...p, missionCategory: "single_replacement", dateMode: "single", replacementNeeded: "yes", endDate: "" })); }} />
                    <ChoiceCard icon="🏝" active={formData.missionCategory === "residence"} title="Séjour / résidence" subtitle="Villa, chalet — plusieurs jours" onClick={() => { clearError("missionCategory"); setFormData(p => ({ ...p, missionCategory: "residence", dateMode: "multi", replacementNeeded: "no" })); }} />
                    <ChoiceCard icon="⛵" active={formData.missionCategory === "yacht"} title="Mission yacht" subtitle="Navigation — mission dédiée" onClick={() => { clearError("missionCategory"); setFormData(p => ({ ...p, missionCategory: "yacht", dateMode: "multi", replacementNeeded: "no" })); }} />
                  </div>
                  <FieldError id="missionCategory" message={fieldErrors.missionCategory} />
                </div>

                {/* Lieu + Dates */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-stone-700 mb-2">Lieu de la mission <Req /></label>
                    <Input id="location" value={formData.location} onChange={e => { clearError("location"); setFormData(p => ({ ...p, location: e.target.value })); }} placeholder="Saint-Tropez, Ibiza, Mykonos, Monaco…" autoFocus />
                    <FieldError id="location" message={fieldErrors.location} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-stone-700 mb-2">{dateMode === "multi" ? "Date de début" : "Date"} <Req /></label>
                      <Input id="startDate" type="date" value={formData.startDate} onChange={e => { clearError("startDate"); setFormData(p => ({ ...p, startDate: e.target.value })); }} />
                      <FieldError id="startDate" message={fieldErrors.startDate} />
                    </div>
                    {dateMode === "multi" && (
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-stone-700 mb-2">Date de fin <Req /></label>
                        <Input id="endDate" type="date" value={formData.endDate || ""} onChange={e => { clearError("endDate"); setFormData(p => ({ ...p, endDate: e.target.value })); }} />
                        <FieldError id="endDate" message={fieldErrors.endDate} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-serif text-stone-900 mb-1">Le service attendu</h2>
                  <p className="text-stone-500 font-light">Rythme, volume et préférences culinaires.</p>
                </div>

                {/* Rythme */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                  <label className="block text-sm font-medium text-stone-700 mb-4">Rythme de service <Req /></label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {([["breakfast", "🌅", "Petit-déjeuner"], ["lunch", "☀️", "Déjeuner"], ["dinner", "🌙", "Dîner"], ["breakfast_lunch", "🌄", "PDJ + Déjeuner"], ["lunch_dinner", "🌆", "Déjeuner + Dîner"], ["full_time", "⭐", "Full time"]] as const).map(([val, icon, label]) => (
                      <ChoiceCard key={val} icon={icon} active={formData.mealPlan === val} title={label} onClick={() => { clearError("mealPlan"); setFormData(p => ({ ...p, mealPlan: val })); }} />
                    ))}
                  </div>
                  <FieldError id="mealPlan" message={fieldErrors.mealPlan} />
                </div>

                {/* Convives + Budget */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="guestCount" className="block text-sm font-medium text-stone-700 mb-2">Nombre de convives <Req /></label>
                      <Input id="guestCount" type="number" min={1} value={formData.guestCount ?? 0} onChange={e => { clearError("guestCount"); const n = parseNumberOrNull(e.target.value); setFormData(p => ({ ...p, guestCount: n ? Math.max(1, Math.floor(n)) : 0 })); }} />
                      <FieldError id="guestCount" message={fieldErrors.guestCount} />
                    </div>
                    <div>
                      <label htmlFor="preferredLanguage" className="block text-sm font-medium text-stone-700 mb-2">Langues souhaitées</label>
                      <Input id="preferredLanguage" value={formData.preferredLanguage} onChange={e => setFormData(p => ({ ...p, preferredLanguage: e.target.value }))} placeholder="FR, EN, IT…" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Budget indicatif <Req /></label>
                    <div className="grid grid-cols-[1fr_130px] gap-3">
                      <div className="relative">
                        <Input id="budgetAmount" type="number" min={0} placeholder="Ex : 5 000" value={formData.budgetAmount ?? ""} onChange={e => { clearError("budgetAmount"); const n = parseNumberOrNull(e.target.value); setFormData(p => ({ ...p, budgetAmount: n === null ? null : Math.max(0, n) })); }} className="pr-8" />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">€</span>
                      </div>
                      <select value={formData.budgetUnit} onChange={e => setFormData(p => ({ ...p, budgetUnit: e.target.value as any }))} className="h-14 w-full rounded-xl border border-stone-200 bg-white px-4 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-colors">
                        <option value="total">Total</option>
                        <option value="per_person">/ pers</option>
                        <option value="per_day">/ jour</option>
                      </select>
                    </div>
                    <FieldError id="budgetAmount" message={fieldErrors.budgetAmount} />
                    <p className="mt-2 text-xs text-stone-400">Hors matières premières. Nous adaptons la sélection à votre budget.</p>
                  </div>
                </div>

                {/* Préférences */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
                  <div>
                    <label htmlFor="cuisinePreferences" className="block text-sm font-medium text-stone-700 mb-2">Style culinaire <span className="text-stone-400 font-normal">(optionnel)</span></label>
                    <Textarea id="cuisinePreferences" value={formData.cuisinePreferences} onChange={e => setFormData(p => ({ ...p, cuisinePreferences: e.target.value }))} className="min-h-[100px]" placeholder="Méditerranéenne, gastronomique, healthy, cuisine du monde…" />
                  </div>
                  <div>
                    <label htmlFor="dietaryRestrictions" className="block text-sm font-medium text-stone-700 mb-2">Allergies / restrictions <span className="text-stone-400 font-normal">(optionnel)</span></label>
                    <Input id="dietaryRestrictions" value={formData.dietaryRestrictions} onChange={e => setFormData(p => ({ ...p, dietaryRestrictions: e.target.value }))} placeholder="Sans gluten, végétarien, halal…" />
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 */}
            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-serif text-stone-900 mb-1">Vos coordonnées</h2>
                  <p className="text-stone-500 font-light">Dernière étape. Un membre de notre équipe vous recontacte sous 6h.</p>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-stone-700 mb-2">Nom complet <Req /></label>
                    <Input id="fullName" value={formData.fullName} onChange={e => { clearError("fullName"); setFormData(p => ({ ...p, fullName: e.target.value })); }} placeholder="Prénom Nom" autoFocus autoComplete="name" />
                    <FieldError id="fullName" message={fieldErrors.fullName} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">Email <Req /></label>
                      <Input id="email" type="email" value={formData.email} onChange={e => { clearError("email"); setFormData(p => ({ ...p, email: e.target.value })); }} placeholder="prenom@exemple.com" autoComplete="email" />
                      <FieldError id="email" message={fieldErrors.email} />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-2">Téléphone <Req /></label>
                      <Input id="phone" type="tel" value={formData.phone} onChange={e => { clearError("phone"); setFormData(p => ({ ...p, phone: e.target.value })); }} placeholder="+33 6 XX XX XX XX" autoComplete="tel" />
                      <FieldError id="phone" message={fieldErrors.phone} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-stone-700 mb-2">Notes complémentaires <span className="text-stone-400 font-normal">(optionnel)</span></label>
                    <Textarea id="notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} className="min-h-[120px]" placeholder="Contraintes particulières, contexte, niveau d'autonomie attendu…" />
                  </div>
                </div>

                {/* Réassurances finales */}
                <div className="bg-stone-900 rounded-2xl p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-4">Ce qui se passe ensuite</p>
                  <div className="space-y-3">
                    {[
                      { n: "1", t: "Analyse de votre dossier", s: "Notre équipe étudie votre brief complet." },
                      { n: "2", t: "Sélection des profils", s: "On identifie les chefs disponibles et adaptés." },
                      { n: "3", t: "Retour sous 6 heures", s: "Une personne dédiée vous présente la sélection." },
                    ].map(item => (
                      <div key={item.n} className="flex items-start gap-4">
                        <div className="w-7 h-7 rounded-full bg-stone-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">{item.n}</div>
                        <div>
                          <p className="text-sm font-medium text-white">{item.t}</p>
                          <p className="text-xs text-stone-400 font-light">{item.s}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* NAVIGATION */}
            <div className="flex items-center justify-between mt-8">
              {step > 1 ? (
                <button type="button" onClick={() => { setFieldErrors({}); setStep(s => s - 1); }} className="text-sm text-stone-500 hover:text-stone-900 border border-stone-300 px-6 py-3 rounded-xl hover:border-stone-500 transition-colors">
                  ← Retour
                </button>
              ) : <div />}

              <div className="flex flex-col items-end gap-2">
                {step < totalSteps ? (
                  <button type="button" onClick={handleContinue} className="bg-stone-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-black transition-colors text-sm">
                    Continuer →
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={isSubmitting} className={`px-8 py-4 rounded-xl font-medium text-sm transition-colors ${isSubmitting ? "bg-stone-400 text-white cursor-not-allowed" : "bg-stone-900 text-white hover:bg-black"}`}>
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline" />Envoi…</> : "Recevoir ma sélection de chefs →"}
                  </button>
                )}
                {step === totalSteps && (
                  <p className="text-xs text-stone-400 text-right max-w-xs">
                    En soumettant, vous acceptez notre{" "}
                    <Link href="/privacy" className="underline hover:text-stone-600">politique de confidentialité</Link>.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-4">

            {/* Récapitulatif */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-1">Votre dossier</p>
              <p className="text-lg font-serif text-stone-900 mb-5">{humanMissionCategory(formData.missionCategory)}</p>

              {/* Progression visuelle */}
              <div className="flex gap-1.5 mb-5">
                {[1, 2, 3].map(n => (
                  <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= step ? "bg-stone-900" : "bg-stone-200"}`} />
                ))}
              </div>

              <div className="space-y-0">
                <SummaryItem label="Client" value={formData.clientType === "concierge" ? "Conciergerie" : "Client privé"} />
                <SummaryItem label="Lieu" value={formData.location || "—"} />
                <SummaryItem label="Dates" value={formData.startDate ? `${formData.startDate}${dateMode === "multi" && formData.endDate ? ` → ${formData.endDate}` : ""}` : "—"} />
                <SummaryItem label="Service" value={humanMealPlan(formData.mealPlan)} />
                <SummaryItem label="Convives" value={formData.guestCount ? String(formData.guestCount) : "—"} />
                <SummaryItem label="Budget" value={summaryBudget ? `${summaryBudget}${estimatedTotal ? ` · env. ${formatMoney(estimatedTotal)}` : ""}` : "—"} />
              </div>
            </div>

            {/* Témoignage client */}
            <div className="bg-stone-900 rounded-2xl p-6 text-white">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-4">Retour client</p>
              <p className="text-sm font-light leading-relaxed text-stone-300 italic mb-4">
                "{relevantReview.text}"
              </p>
              <div className="border-t border-stone-700 pt-4">
                <p className="text-sm font-medium text-white">{relevantReview.author}</p>
                <p className="text-xs text-stone-500 mt-1">{relevantReview.context}</p>
              </div>
              {clientReviews.length > 1 && (
                <button type="button" onClick={() => setReviewIndex(i => (i + 1) % clientReviews.length)} className="mt-4 text-xs text-stone-500 hover:text-stone-300 transition-colors">
                  Témoignage suivant →
                </button>
              )}
            </div>

            {/* Garanties */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="space-y-3">
                {[
                  { icon: "⏱", text: "Réponse en moins de 6 heures" },
                  { icon: "👤", text: "1 concierge dédiée à votre dossier" },
                  { icon: "🔒", text: "NDA disponible sur demande" },
                  { icon: "🌍", text: "400+ chefs en Europe" },
                ].map((g, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg">{g.icon}</span>
                    <p className="text-sm text-stone-600 font-light">{g.text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-stone-400" /></div>}>
      <RequestFormContent />
    </Suspense>
  );
}
