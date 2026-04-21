"use client";

import React, { Suspense, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { submitRequest } from "../../services/actions";
import type { RequestForm } from "../../types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type WizardState = RequestForm & {
  endDate?: string;
  budgetLevel?: "standard" | "premium" | "exclusive";
  missionCategory?: "single_service" | "single_replacement" | "residence" | "yacht";
  mealPlan?: "breakfast" | "lunch" | "dinner" | "breakfast_lunch" | "lunch_dinner" | "full_time";
  hasDietaryRestrictions?: boolean;
  adults?: number;
  children?: number;
  budgetAmount?: number | null;
  budgetUnit?: "per_person" | "per_day" | "total";
  replacementNeeded?: "yes" | "no";
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function deriveDateMode(cat?: WizardState["missionCategory"]): "single" | "multi" {
  return cat === "residence" || cat === "yacht" ? "multi" : "single";
}

function makeEmpty(): WizardState {
  return {
    mode: "concierge", clientType: "private", location: "", dateMode: "single",
    startDate: "", endDate: "", assignmentType: "event", guestCount: 2,
    serviceExpectations: "chef_only", cuisinePreferences: "", dietaryRestrictions: "",
    preferredLanguage: "", budgetRange: "", notes: "", fullName: "", email: "", phone: "",
    companyName: "", serviceRhythm: "daily", accommodationProvided: "yes", sailingArea: "",
    crewSize: 0, budgetAmount: null, budgetUnit: "total", missionCategory: undefined,
    mealPlan: undefined, replacementNeeded: "no", adults: 2, children: 0,
    hasDietaryRestrictions: false, budgetLevel: undefined,
  };
}

function buildPayload(s: WizardState) {
  const dm = deriveDateMode(s.missionCategory);
  const totalGuests = (s.adults ?? 0) + (s.children ?? 0);
  const budgetMap = { standard: "3000", premium: "6000", exclusive: "12000" };
  const notes = [
    `Type: ${s.missionCategory ?? "—"}`,
    `Service: ${s.mealPlan ?? "—"}`,
    `Dates: ${s.startDate}${dm === "multi" ? ` → ${s.endDate ?? "—"}` : ""}`,
    `Adultes: ${s.adults ?? 0}, Enfants: ${s.children ?? 0}`,
    `Budget: ${s.budgetLevel ?? "—"}`,
    `Restrictions: ${s.hasDietaryRestrictions ? "Oui" : "Non"}`,
    s.notes ? `Notes: ${s.notes}` : "",
    s.cuisinePreferences ? `Cuisine: ${s.cuisinePreferences}` : "",
  ].filter(Boolean).join("\n");

  return {
    ...s, dateMode: dm, guestCount: totalGuests || 2,
    budgetRange: s.budgetLevel ? budgetMap[s.budgetLevel] : "",
    assignmentType: s.missionCategory === "yacht" ? "yacht" : s.missionCategory === "residence" ? "daily" : "event",
    serviceRhythm: "daily",
    serviceExpectations: s.mealPlan === "full_time" ? "full_team" : "chef_only",
    endDate: dm === "multi" ? s.endDate : "",
    notes, replacementNeeded: s.missionCategory === "single_replacement" ? "yes" : "no",
  };
}

// ─────────────────────────────────────────────
// Mini composants
// ─────────────────────────────────────────────
function OptionCard({ active, icon, title, subtitle, onClick }: {
  active: boolean; icon?: string; title: string; subtitle?: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
        active
          ? "border-stone-900 bg-stone-900 text-white shadow-xl scale-[1.02]"
          : "border-stone-200 bg-white text-stone-800 hover:border-stone-400 hover:shadow-lg hover:scale-[1.01]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          {icon && <span className="text-3xl mb-3 block">{icon}</span>}
          <p className={`font-semibold text-base tracking-wide ${active ? "text-white" : "text-stone-900"}`}>{title}</p>
          {subtitle && <p className={`text-sm font-light mt-1 ${active ? "text-stone-300" : "text-stone-500"}`}>{subtitle}</p>}
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${active ? "border-white bg-white" : "border-stone-300"}`}>
          {active && <div className="w-2.5 h-2.5 rounded-full bg-stone-900" />}
        </div>
      </div>
    </button>
  );
}

function Counter({ label, sublabel, value, min = 0, onChange }: {
  label: string; sublabel?: string; value: number; min?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-5 px-6 bg-white rounded-2xl border border-stone-200 hover:border-stone-300 transition-colors">
      <div>
        <p className="font-semibold text-stone-900 text-base">{label}</p>
        {sublabel && <p className="text-sm text-stone-400 font-light">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-full border-2 border-stone-200 flex items-center justify-center text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all text-lg font-light"
        >
          −
        </button>
        <span className="text-2xl font-serif w-8 text-center text-stone-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-full border-2 border-stone-200 flex items-center justify-center text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all text-lg font-light"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Wizard principal
// ─────────────────────────────────────────────
const TOTAL_STEPS = 9;

function WizardContent() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>(makeEmpty);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; referenceId?: string } | null>(null);

  const set = useCallback((patch: Partial<WizardState>) => {
    setData(prev => ({ ...prev, ...patch }));
    setError("");
  }, []);

  const dateMode = deriveDateMode(data.missionCategory);

  const canContinue = () => {
    switch (step) {
      case 1: return !!data.missionCategory;
      case 2: return !!data.location?.trim();
      case 3: return !!data.startDate && (dateMode === "single" || !!data.endDate);
      case 4: return !!data.mealPlan;
      case 5: return (data.adults ?? 0) > 0;
      case 6: return !!data.budgetLevel;
      case 7: return data.hasDietaryRestrictions !== undefined;
      case 8: return true;
      case 9: return !!data.fullName?.trim() && !!data.email?.includes("@") && (data.phone?.trim().length ?? 0) >= 6;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!canContinue()) { setError("Veuillez compléter ce champ pour continuer."); return; }
    setError("");
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleSubmit = async () => {
    if (!canContinue()) { setError("Veuillez compléter tous les champs requis."); return; }
    setIsSubmitting(true);
    try {
      const response = await submitRequest(buildPayload(data) as any);
      if (response?.success) setResult(response);
    } catch (e) { console.error(e); setError("Une erreur est survenue. Veuillez réessayer."); }
    finally { setIsSubmitting(false); }
  };

  // ── Succès ──
  if (result) {
    return (
      <div className="fixed inset-0 bg-stone-900 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-8">
          <CheckCircle2 className="w-10 h-10 text-stone-900" strokeWidth={1.5} />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-4">Chefs Talents</p>
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-white mb-4">Votre dossier est entre de bonnes mains.</h1>
        <p className="text-stone-400 font-light text-lg leading-relaxed max-w-md mb-4">
          Un membre de notre équipe analyse votre brief et vous recontacte <strong className="text-white font-medium">dans les 6 heures</strong>.
        </p>
        {result.referenceId && <p className="text-xs uppercase tracking-[0.2em] text-stone-600 mb-10">Réf. {result.referenceId}</p>}
        <div className="flex items-center gap-6 text-xs uppercase tracking-[0.15em] text-stone-500 mb-12">
          <span>NDA disponible</span>
          <span className="w-px h-3 bg-stone-700" />
          <span>Discrétion garantie</span>
          <span className="w-px h-3 bg-stone-700" />
          <span>400+ chefs</span>
        </div>
        <Link href="/" className="text-sm uppercase tracking-[0.2em] text-stone-500 hover:text-white transition-colors border-b border-stone-700 pb-0.5">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-stone-50 flex flex-col">

      {/* HEADER */}
      <header className="flex items-center justify-between px-6 md:px-10 py-5 bg-white border-b border-stone-200 shrink-0">
        <Link href="/" className="font-serif text-base font-medium text-stone-900 tracking-tight">CHEFS TALENTS</Link>
        <div className="flex items-center gap-6 text-xs uppercase tracking-[0.15em] text-stone-400">
          <span className="flex items-center gap-2"><span className="text-stone-600">✓</span> Réponse en 6h</span>
          <span className="hidden md:flex items-center gap-2"><span className="text-stone-600">✓</span> Sans engagement</span>
        </div>
        <Link href="/" className="text-stone-400 hover:text-stone-900 transition-colors">
          <span className="text-xl">×</span>
        </Link>
      </header>

      {/* PROGRESS */}
      <div className="h-0.5 bg-stone-200 shrink-0">
        <div className="h-full bg-stone-900 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">

          {/* ÉTAPE 1 — Type de mission */}
          {step === 1 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">Étape 1 sur {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 text-center mb-2">De quelle mission s'agit-il ?</h1>
              <p className="text-stone-500 font-light text-center mb-10">Cela nous aide à identifier les profils les plus adaptés.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <OptionCard icon="🍽" active={data.missionCategory === "single_service"} title="Prestation ponctuelle" subtitle="Dîner, déjeuner — date unique" onClick={() => set({ missionCategory: "single_service" })} />
                <OptionCard icon="🔄" active={data.missionCategory === "single_replacement"} title="Remplacement" subtitle="Chef indisponible — besoin urgent" onClick={() => set({ missionCategory: "single_replacement" })} />
                <OptionCard icon="🏝" active={data.missionCategory === "residence"} title="Séjour / résidence" subtitle="Villa, chalet — plusieurs jours" onClick={() => set({ missionCategory: "residence" })} />
                <OptionCard icon="⛵" active={data.missionCategory === "yacht"} title="Mission yacht" subtitle="Navigation — mission dédiée" onClick={() => set({ missionCategory: "yacht" })} />
              </div>
            </div>
          )}

          {/* ÉTAPE 2 — Lieu */}
          {step === 2 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">Étape 2 sur {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 text-center mb-2">Où a lieu la mission ?</h1>
              <p className="text-stone-500 font-light text-center mb-10">Ville, destination, port ou région.</p>
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  autoFocus
                  value={data.location}
                  onChange={e => set({ location: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && handleNext()}
                  placeholder="Saint-Tropez, Ibiza, Mykonos, Monaco…"
                  className="w-full pl-14 pr-6 py-5 text-lg border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 transition-colors text-stone-900 placeholder-stone-300"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Saint-Tropez", "Ibiza", "Mykonos", "Monaco", "Courchevel", "Sardaigne"].map(dest => (
                  <button key={dest} type="button" onClick={() => set({ location: dest })}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${data.location === dest ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400 bg-white"}`}>
                    {dest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 3 — Dates */}
          {step === 3 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">Étape 3 sur {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 text-center mb-2">
                {dateMode === "multi" ? "Quelles sont les dates ?" : "Quelle est la date ?"}
              </h1>
              <p className="text-stone-500 font-light text-center mb-10">
                {dateMode === "multi" ? "Sélectionnez le début et la fin du séjour." : "Date de la prestation."}
              </p>
              <div className={`grid ${dateMode === "multi" ? "md:grid-cols-2" : "grid-cols-1 max-w-sm mx-auto"} gap-4`}>
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-400 mb-2 ml-1">
                    {dateMode === "multi" ? "Date de début" : "Date"}
                  </label>
                  <input
                    type="date"
                    value={data.startDate}
                    onChange={e => set({ startDate: e.target.value })}
                    className="w-full px-5 py-4 text-base border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 transition-colors text-stone-900"
                  />
                </div>
                {dateMode === "multi" && (
                  <div>
                    <label className="block text-xs uppercase tracking-[0.15em] text-stone-400 mb-2 ml-1">Date de fin</label>
                    <input
                      type="date"
                      value={data.endDate ?? ""}
                      onChange={e => set({ endDate: e.target.value })}
                      className="w-full px-5 py-4 text-base border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 transition-colors text-stone-900"
                    />
                  </div>
                )}
              </div>
              {data.startDate && data.endDate && dateMode === "multi" && (
                <div className="mt-5 p-4 bg-stone-900 rounded-xl text-center">
                  <p className="text-white text-sm font-light">
                    <span className="font-medium">{Math.max(1, Math.floor((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000) + 1)}</span> jours · {data.location || "destination à définir"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 4 — Rythme de service */}
          {step === 4 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">Étape 4 sur {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 text-center mb-2">Quel service attendez-vous ?</h1>
              <p className="text-stone-500 font-light text-center mb-10">Le chef sera présent pour ces repas.</p>
              <div className="grid md:grid-cols-2 gap-3">
                {([
                  ["breakfast", "🌅", "Petit-déjeuner", "Matin uniquement"],
                  ["lunch", "☀️", "Déjeuner", "Midi uniquement"],
                  ["dinner", "🌙", "Dîner", "Soir uniquement"],
                  ["breakfast_lunch", "🌄", "PDJ + Déjeuner", "Matin et midi"],
                  ["lunch_dinner", "🌆", "Déjeuner + Dîner", "Midi et soir"],
                  ["full_time", "⭐", "Full time", "Tous les repas de la journée"],
                ] as const).map(([val, icon, title, sub]) => (
                  <OptionCard key={val} icon={icon} active={data.mealPlan === val} title={title} subtitle={sub} onClick={() => set({ mealPlan: val })} />
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 5 — Convives */}
          {step === 5 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">Étape 5 sur {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 text-center mb-2">Vous êtes combien ?</h1>
              <p className="text-stone-500 font-light text-center mb-10">Le chef adapte les quantités et la logistique.</p>
              <div className="space-y-3 max-w-md mx-auto">
                <Counter label="Adultes" sublabel="16 ans et plus" value={data.adults ?? 0} min={1} onChange={v => set({ adults: v })} />
                <Counter label="Enfants" sublabel="2 à 15 ans" value={data.children ?? 0} min={0} onChange={v => set({ children: v })} />
              </div>
              {((data.adults ?? 0) + (data.children ?? 0)) > 0 && (
                <p className="text-center text-stone-500 text-sm mt-6 font-light">
                  Total : <strong className="text-stone-900">{(data.adults ?? 0) + (data.children ?? 0)} personnes</strong>
                </p>
              )}
            </div>
          )}

          {/* ÉTAPE 6 — Budget */}
          {step === 6 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">Étape 6 sur {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 text-center mb-2">Quel est votre budget ?</h1>
              <p className="text-stone-500 font-light text-center mb-10">Cela nous permet de sélectionner les profils adaptés.</p>
              <div className="grid md:grid-cols-3 gap-4">
                {([
                  ["standard", "✦", "Essentiel", "Chef expérimenté, cuisine de qualité", "À partir de 2 500€ / semaine"],
                  ["premium", "✦✦", "Premium", "Chef gastronomique, profil senior", "À partir de 5 000€ / semaine"],
                  ["exclusive", "✦✦✦", "Exclusif", "Profil d'exception, standards UHNW", "Sur devis — disponibilités limitées"],
                ] as const).map(([val, stars, title, sub, price]) => (
                  <button key={val} type="button" onClick={() => set({ budgetLevel: val })}
                    className={`relative w-full text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
                      data.budgetLevel === val
                        ? "border-stone-900 bg-stone-900 text-white shadow-xl scale-[1.02]"
                        : "border-stone-200 bg-white text-stone-800 hover:border-stone-400 hover:shadow-lg"
                    }`}>
                    {val === "premium" && (
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.1em] px-3 py-1 rounded-full font-semibold ${data.budgetLevel === "premium" ? "bg-white text-stone-900" : "bg-stone-900 text-white"}`}>
                        Le plus demandé
                      </div>
                    )}
                    <p className={`text-sm mb-3 ${data.budgetLevel === val ? "text-stone-400" : "text-stone-400"}`}>{stars}</p>
                    <p className={`font-semibold text-lg mb-1 ${data.budgetLevel === val ? "text-white" : "text-stone-900"}`}>{title}</p>
                    <p className={`text-sm font-light mb-4 ${data.budgetLevel === val ? "text-stone-300" : "text-stone-500"}`}>{sub}</p>
                    <p className={`text-xs font-medium border-t pt-3 ${data.budgetLevel === val ? "border-stone-700 text-stone-300" : "border-stone-100 text-stone-600"}`}>{price}</p>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-stone-400 mt-5 font-light">
                Hors matières premières · NDA disponible sur demande
              </p>
            </div>
          )}

          {/* ÉTAPE 7 — Restrictions */}
          {step === 7 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">Étape 7 sur {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 text-center mb-2">Des restrictions alimentaires ?</h1>
              <p className="text-stone-500 font-light text-center mb-10">Allergies, régimes, préférences — le chef s'adapte.</p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <OptionCard active={data.hasDietaryRestrictions === false} title="Aucune" subtitle="Pas de contrainte particulière" onClick={() => set({ hasDietaryRestrictions: false, dietaryRestrictions: "" })} />
                <OptionCard active={data.hasDietaryRestrictions === true} title="Oui" subtitle="Je préciserai dans les notes" onClick={() => set({ hasDietaryRestrictions: true })} />
              </div>
              {data.hasDietaryRestrictions && (
                <div className="mt-5 max-w-md mx-auto">
                  <input
                    type="text"
                    autoFocus
                    value={data.dietaryRestrictions}
                    onChange={e => set({ dietaryRestrictions: e.target.value })}
                    placeholder="Sans gluten, végétarien, halal, allergie aux noix…"
                    className="w-full px-5 py-4 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 transition-colors text-stone-900 placeholder-stone-300"
                  />
                </div>
              )}
              <p className="text-center text-xs text-stone-400 mt-6">Pas sûr ? Vous pourrez le préciser plus tard lors de l'échange avec notre équipe.</p>
            </div>
          )}

          {/* ÉTAPE 8 — Notes */}
          {step === 8 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">Étape 8 sur {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 text-center mb-2">Quelque chose à ajouter ?</h1>
              <p className="text-stone-500 font-light text-center mb-10">Style culinaire, contraintes particulières, niveau d'autonomie souhaité.</p>
              <textarea
                autoFocus
                value={data.notes}
                onChange={e => set({ notes: e.target.value })}
                placeholder="Ex : cuisine méditerranéenne, dîners en terrasse, chef discret qui s'intègre facilement, enfants à table…"
                rows={6}
                className="w-full px-6 py-5 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 transition-colors text-stone-900 placeholder-stone-300 resize-none text-base font-light leading-relaxed"
              />
              <p className="text-center text-xs text-stone-400 mt-3">Optionnel · Plus vous nous en dites, plus la sélection sera précise.</p>
            </div>
          )}

          {/* ÉTAPE 9 — Contact */}
          {step === 9 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">Dernière étape</p>
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 text-center mb-2">C'est presque fini.</h1>
              <p className="text-stone-500 font-light text-center mb-10">
                Un membre de notre équipe vous recontacte <strong className="text-stone-900">dans les 6 heures</strong>.
              </p>
              <div className="space-y-4 max-w-md mx-auto">
                {data.clientType === "concierge" && (
                  <input
                    type="text"
                    value={data.companyName}
                    onChange={e => set({ companyName: e.target.value })}
                    placeholder="Nom de la conciergerie / structure"
                    className="w-full px-5 py-4 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 transition-colors text-stone-900 placeholder-stone-300"
                  />
                )}
                <input
                  type="text"
                  autoFocus
                  value={data.fullName}
                  onChange={e => set({ fullName: e.target.value })}
                  placeholder="Votre nom complet *"
                  autoComplete="name"
                  className="w-full px-5 py-4 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 transition-colors text-stone-900 placeholder-stone-300"
                />
                <input
                  type="email"
                  value={data.email}
                  onChange={e => set({ email: e.target.value })}
                  placeholder="Email *"
                  autoComplete="email"
                  className="w-full px-5 py-4 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 transition-colors text-stone-900 placeholder-stone-300"
                />
                <input
                  type="tel"
                  value={data.phone}
                  onChange={e => set({ phone: e.target.value })}
                  placeholder="Téléphone * (+33 6 XX XX XX XX)"
                  autoComplete="tel"
                  className="w-full px-5 py-4 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 transition-colors text-stone-900 placeholder-stone-300"
                />
                {/* Résumé compact */}
                <div className="bg-stone-900 rounded-2xl p-5 mt-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-3">Votre demande</p>
                  <div className="space-y-1.5 text-sm">
                    {[
                      data.missionCategory && ["Mission", { single_service: "Prestation ponctuelle", single_replacement: "Remplacement", residence: "Séjour / résidence", yacht: "Mission yacht" }[data.missionCategory]],
                      data.location && ["Lieu", data.location],
                      data.startDate && ["Dates", `${data.startDate}${data.endDate ? ` → ${data.endDate}` : ""}`],
                      ((data.adults ?? 0) + (data.children ?? 0)) > 0 && ["Convives", `${(data.adults ?? 0) + (data.children ?? 0)} personnes`],
                      data.budgetLevel && ["Budget", { standard: "Essentiel", premium: "Premium", exclusive: "Exclusif" }[data.budgetLevel]],
                    ].filter(Boolean).map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-stone-500">{(item as string[])[0]}</span>
                        <span className="text-white font-medium">{(item as string[])[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-stone-400 mt-5">
                En soumettant, vous acceptez notre{" "}
                <Link href="/privacy" className="underline hover:text-stone-600">politique de confidentialité</Link>.
                Aucun engagement.
              </p>
            </div>
          )}

          {/* ERREUR */}
          {error && (
            <p className="text-center text-red-500 text-sm mt-4 font-light">{error}</p>
          )}
        </div>
      </div>

      {/* FOOTER NAVIGATION */}
      <footer className="shrink-0 bg-white border-t border-stone-200 px-6 md:px-10 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {step > 1 ? (
            <button type="button" onClick={() => { setError(""); setStep(s => s - 1); }}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Étape précédente
            </button>
          ) : <div />}

          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-400">{step} / {TOTAL_STEPS}</span>
            {step < TOTAL_STEPS ? (
              <button type="button" onClick={handleNext}
                className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-sm transition-all ${
                  canContinue()
                    ? "bg-stone-900 text-white hover:bg-black shadow-lg hover:shadow-xl"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}>
                Continuer
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting || !canContinue()}
                className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-sm transition-all ${
                  !isSubmitting && canContinue()
                    ? "bg-stone-900 text-white hover:bg-black shadow-lg hover:shadow-xl"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Envoi…</> : "Recevoir ma sélection →"}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-stone-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-400 w-8 h-8" />
      </div>
    }>
      <WizardContent />
    </Suspense>
  );
}
