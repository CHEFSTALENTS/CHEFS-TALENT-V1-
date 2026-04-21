"use client";

import React, { Suspense, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { submitRequest } from "../../services/actions";
import type { RequestForm } from "../../types";

// ─────────────────────────────────────────────
// TRADUCTIONS
// ─────────────────────────────────────────────
type Lang = "fr" | "en" | "es";

const T = {
  fr: {
    brand: "CHEFS TALENTS",
    tagline1: "Réponse en 6h",
    tagline2: "Sans engagement",
    close: "Fermer",
    step: "Étape",
    of: "sur",
    continue: "Continuer",
    previous: "Étape précédente",
    submit: "Recevoir ma sélection →",
    sending: "Envoi…",
    whatsapp: "Contacter via WhatsApp",
    required: "Veuillez compléter ce champ.",
    // Étapes
    s1title: "De quelle mission s'agit-il ?",
    s1sub: "Cela nous aide à identifier les profils les plus adaptés.",
    s1a: "Prestation ponctuelle", s1asub: "Dîner, déjeuner : date unique",
    s1b: "Remplacement", s1bsub: "Chef indisponible : besoin urgent",
    s1c: "Séjour / résidence", s1csub: "Villa, chalet : plusieurs jours",
    s1d: "Mission yacht", s1dsub: "Navigation : mission dédiée",
    s2title: "Où a lieu la mission ?",
    s2sub: "Ville, destination, port ou région.",
    s2placeholder: "Recherchez une destination…",
    s2popular: "Destinations populaires",
    s3title: "Quelles sont les dates ?",
    s3titlesingle: "Quelle est la date ?",
    s3sub: "Sélectionnez le début et la fin du séjour.",
    s3subsingle: "Date de la prestation.",
    s3start: "Début", s3end: "Fin",
    s3days: "jours",
    s4title: "Quel service attendez-vous ?",
    s4sub: "Le chef sera présent pour ces repas.",
    s4a: "Petit-déjeuner", s4asub: "Matin uniquement",
    s4b: "Déjeuner", s4bsub: "Midi uniquement",
    s4c: "Dîner", s4csub: "Soir uniquement",
    s4d: "PDJ + Déjeuner", s4dsub: "Matin et midi",
    s4e: "Déjeuner + Dîner", s4esub: "Midi et soir",
    s4f: "Full time", s4fsub: "Tous les repas de la journée",
    s5title: "Vous êtes combien ?",
    s5sub: "Le chef adapte les quantités et la logistique.",
    s5adults: "Adultes", s5adultssub: "16 ans et plus",
    s5children: "Enfants", s5childrensub: "2 à 15 ans",
    s5total: "Total",
    s5people: "personnes",
    s6title: "Quelles langues pour votre chef ?",
    s6sub: "Sélectionnez une ou plusieurs langues.",
    s6skip: "Pas de préférence particulière",
    s7title: "Quel est votre budget ?",
    s7sub: "Estimation basée sur votre destination, vos dates et vos convives.",
    s7essential: "Essentiel", s7essentialsub: "Chef expérimenté, cuisine de qualité",
    s7premium: "Premium", s7premiumsub: "Chef gastronomique, profil senior",
    s7exclusive: "Exclusif", s7exclusivesub: "Profil d'exception, standards UHNW",
    s7popular: "Le plus demandé",
    s7note: "Hors matières premières · NDA disponible sur demande",
    s7estimate: "Estimation pour votre mission",
    s8title: "Des restrictions alimentaires ?",
    s8sub: "Allergies, régimes, préférences — le chef s'adapte.",
    s8no: "Aucune", s8nosub: "Pas de contrainte particulière",
    s8yes: "Oui", s8yessub: "Je vais préciser",
    s8placeholder: "Sans gluten, végétarien, halal, allergie aux noix…",
    s8hint: "Pas sûr ? Vous pourrez le préciser lors de l'échange avec notre équipe.",
    s9title: "Quelque chose à ajouter ?",
    s9sub: "Style culinaire, contraintes particulières, niveau d'autonomie souhaité.",
    s9placeholder: "Cuisine méditerranéenne, dîners en terrasse, chef discret…",
    s9hint: "Optionnel · Plus vous nous en dites, plus la sélection sera précise.",
    s10title: "C'est presque fini.",
    s10sub: "Un membre de notre équipe vous recontacte dans les 6 heures.",
    s10name: "Votre nom complet",
    s10email: "Email",
    s10phone: "Téléphone",
    s10company: "Nom de la conciergerie / structure",
    s10summary: "Votre demande",
    s10privacy: "En soumettant, vous acceptez notre politique de confidentialité. Aucun engagement.",
    s10privacy2: "politique de confidentialité",
    missionLabels: { single_service: "Prestation ponctuelle", single_replacement: "Remplacement", residence: "Séjour / résidence", yacht: "Mission yacht" },
    budgetLabels: { essential: "Essentiel", premium: "Premium", exclusive: "Exclusif" },
    successTitle: "Votre dossier est entre de bonnes mains.",
    successSub: "Un membre de notre équipe analyse votre brief et vous recontacte dans les 6 heures.",
    successRef: "Réf.",
    successBack: "Retour à l'accueil",
    clientTypes: ["Client privé", "Conciergerie"],
    clientTypeSubs: ["Villa, yacht, résidence", "Partenaire B2B"],
  },
  en: {
    brand: "CHEFS TALENTS",
    tagline1: "Response within 6h",
    tagline2: "No commitment",
    close: "Close",
    step: "Step",
    of: "of",
    continue: "Continue",
    previous: "Previous step",
    submit: "Receive my chef selection →",
    sending: "Sending…",
    whatsapp: "Contact via WhatsApp",
    required: "Please complete this field.",
    s1title: "What type of mission?",
    s1sub: "This helps us identify the most suitable profiles.",
    s1a: "One-time service", s1asub: "Dinner, lunch : single date",
    s1b: "Replacement", s1bsub: "Unavailable chef : urgent need",
    s1c: "Stay / residence", s1csub: "Villa, chalet : multiple days",
    s1d: "Yacht mission", s1dsub: "Navigation : dedicated mission",
    s2title: "Where will the mission take place?",
    s2sub: "City, destination, port or region.",
    s2placeholder: "Search a destination…",
    s2popular: "Popular destinations",
    s3title: "What are the dates?",
    s3titlesingle: "What is the date?",
    s3sub: "Select the start and end of the stay.",
    s3subsingle: "Date of the service.",
    s3start: "Start", s3end: "End",
    s3days: "days",
    s4title: "What service do you expect?",
    s4sub: "The chef will be present for these meals.",
    s4a: "Breakfast", s4asub: "Morning only",
    s4b: "Lunch", s4bsub: "Midday only",
    s4c: "Dinner", s4csub: "Evening only",
    s4d: "Breakfast + Lunch", s4dsub: "Morning and midday",
    s4e: "Lunch + Dinner", s4esub: "Midday and evening",
    s4f: "Full time", s4fsub: "All meals of the day",
    s5title: "How many guests?",
    s5sub: "The chef adapts quantities and logistics.",
    s5adults: "Adults", s5adultssub: "16 years and over",
    s5children: "Children", s5childrensub: "2 to 15 years",
    s5total: "Total",
    s5people: "guests",
    s6title: "Which languages for your chef?",
    s6sub: "Select one or more languages.",
    s6skip: "No particular preference",
    s7title: "What is your budget?",
    s7sub: "Estimate based on your destination, dates and guests.",
    s7essential: "Essential", s7essentialsub: "Experienced chef, quality cuisine",
    s7premium: "Premium", s7premiumsub: "Gastronomic chef, senior profile",
    s7exclusive: "Exclusive", s7exclusivesub: "Exceptional profile, UHNW standards",
    s7popular: "Most popular",
    s7note: "Excluding ingredients · NDA available on request",
    s7estimate: "Estimate for your mission",
    s8title: "Any dietary restrictions?",
    s8sub: "Allergies, diets, preferences — the chef adapts.",
    s8no: "None", s8nosub: "No particular constraint",
    s8yes: "Yes", s8yessub: "I will specify",
    s8placeholder: "Gluten-free, vegetarian, halal, nut allergy…",
    s8hint: "Not sure? You can specify during the exchange with our team.",
    s9title: "Anything to add?",
    s9sub: "Culinary style, particular constraints, desired level of autonomy.",
    s9placeholder: "Mediterranean cuisine, terrace dinners, discreet chef…",
    s9hint: "Optional · The more you tell us, the more precise the selection.",
    s10title: "Almost done.",
    s10sub: "A member of our team will contact you within 6 hours.",
    s10name: "Your full name",
    s10email: "Email",
    s10phone: "Phone",
    s10company: "Concierge / company name",
    s10summary: "Your request",
    s10privacy: "By submitting, you accept our privacy policy. No commitment.",
    s10privacy2: "privacy policy",
    missionLabels: { single_service: "One-time service", single_replacement: "Replacement", residence: "Stay / residence", yacht: "Yacht mission" },
    budgetLabels: { essential: "Essential", premium: "Premium", exclusive: "Exclusive" },
    successTitle: "Your file is in good hands.",
    successSub: "A member of our team will analyse your brief and contact you within 6 hours.",
    successRef: "Ref.",
    successBack: "Back to home",
    clientTypes: ["Private client", "Concierge"],
    clientTypeSubs: ["Villa, yacht, residence", "B2B partner"],
  },
  es: {
    brand: "CHEFS TALENTS",
    tagline1: "Respuesta en 6h",
    tagline2: "Sin compromiso",
    close: "Cerrar",
    step: "Paso",
    of: "de",
    continue: "Continuar",
    previous: "Paso anterior",
    submit: "Recibir mi selección →",
    sending: "Enviando…",
    whatsapp: "Contactar por WhatsApp",
    required: "Por favor complete este campo.",
    s1title: "¿Qué tipo de misión?",
    s1sub: "Esto nos ayuda a identificar los perfiles más adecuados.",
    s1a: "Servicio puntual", s1asub: "Cena, almuerzo : fecha única",
    s1b: "Sustitución", s1bsub: "Chef no disponible : necesidad urgente",
    s1c: "Estancia / residencia", s1csub: "Villa, chalet : varios días",
    s1d: "Misión yate", s1dsub: "Navegación : misión dedicada",
    s2title: "¿Dónde tendrá lugar la misión?",
    s2sub: "Ciudad, destino, puerto o región.",
    s2placeholder: "Buscar un destino…",
    s2popular: "Destinos populares",
    s3title: "¿Cuáles son las fechas?",
    s3titlesingle: "¿Cuál es la fecha?",
    s3sub: "Seleccione el inicio y el fin de la estancia.",
    s3subsingle: "Fecha del servicio.",
    s3start: "Inicio", s3end: "Fin",
    s3days: "días",
    s4title: "¿Qué servicio espera?",
    s4sub: "El chef estará presente para estas comidas.",
    s4a: "Desayuno", s4asub: "Solo mañana",
    s4b: "Almuerzo", s4bsub: "Solo mediodía",
    s4c: "Cena", s4csub: "Solo noche",
    s4d: "Desayuno + Almuerzo", s4dsub: "Mañana y mediodía",
    s4e: "Almuerzo + Cena", s4esub: "Mediodía y noche",
    s4f: "Full time", s4fsub: "Todas las comidas del día",
    s5title: "¿Cuántos son?",
    s5sub: "El chef adapta las cantidades y la logística.",
    s5adults: "Adultos", s5adultssub: "16 años y más",
    s5children: "Niños", s5childrensub: "2 a 15 años",
    s5total: "Total",
    s5people: "personas",
    s6title: "¿Qué idiomas para su chef?",
    s6sub: "Seleccione uno o varios idiomas.",
    s6skip: "Sin preferencia particular",
    s7title: "¿Cuál es su presupuesto?",
    s7sub: "Estimación basada en su destino, fechas y comensales.",
    s7essential: "Esencial", s7essentialsub: "Chef experimentado, cocina de calidad",
    s7premium: "Premium", s7premiumsub: "Chef gastronómico, perfil senior",
    s7exclusive: "Exclusivo", s7exclusivesub: "Perfil excepcional, estándares UHNW",
    s7popular: "El más popular",
    s7note: "Sin ingredientes · NDA disponible bajo petición",
    s7estimate: "Estimación para su misión",
    s8title: "¿Restricciones alimentarias?",
    s8sub: "Alergias, dietas, preferencias — el chef se adapta.",
    s8no: "Ninguna", s8nosub: "Sin restricción particular",
    s8yes: "Sí", s8yessub: "Lo especificaré",
    s8placeholder: "Sin gluten, vegetariano, halal, alergia a nueces…",
    s8hint: "¿No está seguro? Podrá precisarlo durante el intercambio con nuestro equipo.",
    s9title: "¿Algo que añadir?",
    s9sub: "Estilo culinario, restricciones particulares, nivel de autonomía deseado.",
    s9placeholder: "Cocina mediterránea, cenas en terraza, chef discreto…",
    s9hint: "Opcional · Cuanto más nos diga, más precisa será la selección.",
    s10title: "Casi listo.",
    s10sub: "Un miembro de nuestro equipo le contactará en las próximas 6 horas.",
    s10name: "Su nombre completo",
    s10email: "Email",
    s10phone: "Teléfono",
    s10company: "Nombre de la conserjería / empresa",
    s10summary: "Su solicitud",
    s10privacy: "Al enviar, acepta nuestra política de privacidad. Sin compromiso.",
    s10privacy2: "política de privacidad",
    missionLabels: { single_service: "Servicio puntual", single_replacement: "Sustitución", residence: "Estancia / residencia", yacht: "Misión yate" },
    budgetLabels: { essential: "Esencial", premium: "Premium", exclusive: "Exclusivo" },
    successTitle: "Su expediente está en buenas manos.",
    successSub: "Un miembro de nuestro equipo analizará su brief y le contactará en 6 horas.",
    successRef: "Ref.",
    successBack: "Volver al inicio",
    clientTypes: ["Cliente privado", "Conserjería"],
    clientTypeSubs: ["Villa, yate, residencia", "Socio B2B"],
  },
} as const;

// ─────────────────────────────────────────────
// DESTINATIONS avec tarifs par ville
// ─────────────────────────────────────────────
const DESTINATIONS = [
  // France
  { name: "Saint-Tropez", country: "France", flag: "🇫🇷", tier: "exclusive", baseDay: 1200 },
  { name: "Côte d'Azur", country: "France", flag: "🇫🇷", tier: "premium", baseDay: 900 },
  { name: "Cannes", country: "France", flag: "🇫🇷", tier: "premium", baseDay: 900 },
  { name: "Antibes", country: "France", flag: "🇫🇷", tier: "premium", baseDay: 800 },
  { name: "Monaco", country: "Monaco", flag: "🇲🇨", tier: "exclusive", baseDay: 1400 },
  { name: "Cap Ferrat", country: "France", flag: "🇫🇷", tier: "exclusive", baseDay: 1200 },
  { name: "Nice", country: "France", flag: "🇫🇷", tier: "standard", baseDay: 700 },
  { name: "Courchevel", country: "France", flag: "🇫🇷", tier: "exclusive", baseDay: 1300 },
  { name: "Megève", country: "France", flag: "🇫🇷", tier: "premium", baseDay: 1000 },
  { name: "Val d'Isère", country: "France", flag: "🇫🇷", tier: "premium", baseDay: 1000 },
  { name: "Biarritz", country: "France", flag: "🇫🇷", tier: "standard", baseDay: 700 },
  { name: "Paris", country: "France", flag: "🇫🇷", tier: "premium", baseDay: 900 },
  // Espagne
  { name: "Ibiza", country: "Espagne", flag: "🇪🇸", tier: "exclusive", baseDay: 1100 },
  { name: "Marbella", country: "Espagne", flag: "🇪🇸", tier: "premium", baseDay: 900 },
  { name: "Formentera", country: "Espagne", flag: "🇪🇸", tier: "premium", baseDay: 1000 },
  { name: "Barcelone", country: "Espagne", flag: "🇪🇸", tier: "standard", baseDay: 700 },
  { name: "Mallorca", country: "Espagne", flag: "🇪🇸", tier: "premium", baseDay: 850 },
  // Grèce
  { name: "Mykonos", country: "Grèce", flag: "🇬🇷", tier: "exclusive", baseDay: 1100 },
  { name: "Santorin", country: "Grèce", flag: "🇬🇷", tier: "premium", baseDay: 1000 },
  { name: "Corfou", country: "Grèce", flag: "🇬🇷", tier: "standard", baseDay: 750 },
  { name: "Athènes", country: "Grèce", flag: "🇬🇷", tier: "standard", baseDay: 700 },
  // Italie
  { name: "Sardaigne", country: "Italie", flag: "🇮🇹", tier: "premium", baseDay: 950 },
  { name: "Porto Cervo", country: "Italie", flag: "🇮🇹", tier: "exclusive", baseDay: 1200 },
  { name: "Portofino", country: "Italie", flag: "🇮🇹", tier: "exclusive", baseDay: 1100 },
  { name: "Amalfi", country: "Italie", flag: "🇮🇹", tier: "premium", baseDay: 900 },
  { name: "Capri", country: "Italie", flag: "🇮🇹", tier: "premium", baseDay: 1000 },
  { name: "Toscane", country: "Italie", flag: "🇮🇹", tier: "standard", baseDay: 750 },
  // Portugal
  { name: "Algarve", country: "Portugal", flag: "🇵🇹", tier: "standard", baseDay: 750 },
  { name: "Lisbonne", country: "Portugal", flag: "🇵🇹", tier: "standard", baseDay: 700 },
  // Maroc
  { name: "Marrakech", country: "Maroc", flag: "🇲🇦", tier: "standard", baseDay: 600 },
  // Émirats
  { name: "Dubaï", country: "Émirats", flag: "🇦🇪", tier: "exclusive", baseDay: 1300 },
  // Croatie
  { name: "Dubrovnik", country: "Croatie", flag: "🇭🇷", tier: "premium", baseDay: 850 },
  { name: "Split", country: "Croatie", flag: "🇭🇷", tier: "standard", baseDay: 700 },
];

const LANGUAGES = [
  { code: "FR", label: "Français", flag: "🇫🇷" },
  { code: "EN", label: "English", flag: "🇬🇧" },
  { code: "ES", label: "Español", flag: "🇪🇸" },
  { code: "IT", label: "Italiano", flag: "🇮🇹" },
  { code: "RU", label: "Русский", flag: "🇷🇺" },
  { code: "AR", label: "العربية", flag: "🇸🇦" },
  { code: "PT", label: "Português", flag: "🇵🇹" },
  { code: "DE", label: "Deutsch", flag: "🇩🇪" },
];

// Détection langue navigateur
function detectLang(): Lang {
  if (typeof navigator === "undefined") return "fr";
  const nav = navigator.language?.toLowerCase() ?? "";
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("en")) return "en";
  return "fr";
}

// Calcul estimation budget
function calcEstimate(dest: typeof DESTINATIONS[0] | undefined, days: number, guests: number, level: string) {
  if (!dest || days <= 0 || guests <= 0) return null;
  const multiplier = level === "exclusive" ? 1.4 : level === "premium" ? 1.0 : 0.7;
  const base = dest.baseDay * multiplier * days;
  const min = Math.round(base * 0.85 / 100) * 100;
  const max = Math.round(base * 1.15 / 100) * 100;
  return { min, max };
}

// ─────────────────────────────────────────────
// Types état wizard
// ─────────────────────────────────────────────
type WizardState = RequestForm & {
  endDate?: string;
  budgetLevel?: "essential" | "premium" | "exclusive";
  missionCategory?: "single_service" | "single_replacement" | "residence" | "yacht";
  mealPlan?: "breakfast" | "lunch" | "dinner" | "breakfast_lunch" | "lunch_dinner" | "full_time";
  hasDietaryRestrictions?: boolean;
  adults?: number;
  children?: number;
  selectedLanguages?: string[];
  budgetAmount?: number | null;
  budgetUnit?: "per_person" | "per_day" | "total";
  replacementNeeded?: "yes" | "no";
  selectedDestination?: typeof DESTINATIONS[0];
};

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
    hasDietaryRestrictions: false, budgetLevel: undefined, selectedLanguages: [],
    selectedDestination: undefined,
  };
}

function buildPayload(s: WizardState) {
  const dm = deriveDateMode(s.missionCategory);
  const totalGuests = (s.adults ?? 0) + (s.children ?? 0);
  const budgetMap = { essential: "2500", premium: "5000", exclusive: "10000" };
  const notes = [
    `Type: ${s.missionCategory ?? "—"}`,
    `Service: ${s.mealPlan ?? "—"}`,
    `Dates: ${s.startDate}${dm === "multi" ? ` → ${s.endDate ?? "—"}` : ""}`,
    `Adultes: ${s.adults ?? 0}, Enfants: ${s.children ?? 0}`,
    `Budget: ${s.budgetLevel ?? "—"}`,
    `Langues: ${(s.selectedLanguages ?? []).join(", ") || "—"}`,
    `Restrictions: ${s.hasDietaryRestrictions ? s.dietaryRestrictions || "Oui" : "Non"}`,
    s.notes ? `Notes: ${s.notes}` : "",
  ].filter(Boolean).join("\n");
  return {
    ...s, dateMode: dm, guestCount: totalGuests || 2,
    budgetRange: s.budgetLevel ? budgetMap[s.budgetLevel] : "",
    assignmentType: s.missionCategory === "yacht" ? "yacht" : s.missionCategory === "residence" ? "daily" : "event",
    serviceRhythm: "daily",
    serviceExpectations: s.mealPlan === "full_time" ? "full_team" : "chef_only",
    endDate: dm === "multi" ? s.endDate : "",
    preferredLanguage: (s.selectedLanguages ?? []).join(", "),
    notes, replacementNeeded: s.missionCategory === "single_replacement" ? "yes" : "no",
  };
}

// ─────────────────────────────────────────────
// Composants UI
// ─────────────────────────────────────────────
function OptionCard({ active, icon, title, subtitle, badge, onClick }: {
  active: boolean; icon?: string; title: string; subtitle?: string; badge?: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
        active ? "border-stone-900 bg-stone-900 text-white shadow-xl scale-[1.02]"
               : "border-stone-200 bg-white text-stone-800 hover:border-stone-400 hover:shadow-md hover:scale-[1.01]"
      }`}>
      {badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.1em] px-3 py-1 rounded-full font-semibold whitespace-nowrap ${
          active ? "bg-white text-stone-900" : "bg-stone-900 text-white"
        }`}>{badge}</div>
      )}
      <div className="flex items-start justify-between">
        <div>
          {icon && <span className="text-2xl mb-2 block">{icon}</span>}
          <p className={`font-semibold text-sm tracking-wide ${active ? "text-white" : "text-stone-900"}`}>{title}</p>
          {subtitle && <p className={`text-xs font-light mt-0.5 ${active ? "text-stone-300" : "text-stone-500"}`}>{subtitle}</p>}
        </div>
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${active ? "border-white bg-white" : "border-stone-300"}`}>
          {active && <div className="w-2 h-2 rounded-full bg-stone-900" />}
        </div>
      </div>
    </button>
  );
}

function Counter({ label, sublabel, value, min = 0, onChange }: {
  label: string; sublabel?: string; value: number; min?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 px-5 bg-white rounded-2xl border border-stone-200">
      <div>
        <p className="font-semibold text-stone-900 text-sm">{label}</p>
        {sublabel && <p className="text-xs text-stone-400 font-light">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-full border-2 border-stone-200 flex items-center justify-center text-stone-600 hover:border-stone-900 transition-all text-lg font-light">−</button>
        <span className="text-xl font-serif w-7 text-center text-stone-900">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full border-2 border-stone-200 flex items-center justify-center text-stone-600 hover:border-stone-900 transition-all text-lg font-light">+</button>
      </div>
    </div>
  );
}

// Mini calendrier interactif
function MiniCalendar({ startDate, endDate, onSelect, multi }: {
  startDate: string; endDate?: string; onSelect: (start: string, end?: string) => void; multi?: boolean;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selecting, setSelecting] = useState<"start" | "end">("start");

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;

  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const days = ["L", "M", "M", "J", "V", "S", "D"];

  const toStr = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const handleDay = (d: number) => {
    const str = toStr(viewYear, viewMonth, d);
    if (!multi) { onSelect(str); return; }
    if (selecting === "start" || (startDate && endDate)) {
      onSelect(str, undefined);
      setSelecting("end");
    } else {
      if (str >= startDate) { onSelect(startDate, str); setSelecting("start"); }
      else { onSelect(str, undefined); setSelecting("end"); }
    }
  };

  const isStart = (d: number) => toStr(viewYear, viewMonth, d) === startDate;
  const isEnd = (d: number) => toStr(viewYear, viewMonth, d) === endDate;
  const isInRange = (d: number) => {
    if (!multi || !startDate || !endDate) return false;
    const str = toStr(viewYear, viewMonth, d);
    return str > startDate && str < endDate;
  };
  const isPast = (d: number) => {
    const str = toStr(viewYear, viewMonth, d);
    return str < toStr(today.getFullYear(), today.getMonth(), today.getDate());
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold text-stone-900">{months[viewMonth]} {viewYear}</p>
        <button type="button" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {days.map(d => <p key={d} className="text-center text-[10px] text-stone-400 font-medium py-1">{d}</p>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array(adjustedFirst).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const d = i + 1;
          const start = isStart(d), end = isEnd(d), range = isInRange(d), past = isPast(d);
          return (
            <button key={d} type="button" disabled={past} onClick={() => handleDay(d)}
              className={`aspect-square flex items-center justify-center text-sm rounded-full transition-all ${
                past ? "text-stone-200 cursor-not-allowed"
                : start || end ? "bg-stone-900 text-white font-semibold"
                : range ? "bg-stone-100 text-stone-700"
                : "text-stone-700 hover:bg-stone-100"
              }`}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// WIZARD PRINCIPAL
// ─────────────────────────────────────────────
const TOTAL_STEPS = 10;

function WizardContent() {
  const [lang, setLang] = useState<Lang>("fr");
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>(makeEmpty);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; referenceId?: string } | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityRef = useRef<HTMLInputElement>(null);

  const t = T[lang];

  // Détection langue + pays au chargement
  useEffect(() => {
    setLang(detectLang());
    // Géolocalisation IP légère via un service public
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(d => {
        if (d?.country_name) {
          const match = DESTINATIONS.find(dest =>
            dest.country.toLowerCase() === d.country_name.toLowerCase() ||
            dest.name.toLowerCase().includes(d.city?.toLowerCase() ?? "")
          );
          if (match) {
            setData(prev => ({ ...prev, selectedDestination: match, location: match.name }));
            setCitySearch(match.name);
          }
        }
      })
      .catch(() => {}); // silencieux si bloqué
  }, []);

  const set = useCallback((patch: Partial<WizardState>) => {
    setData(prev => ({ ...prev, ...patch }));
    setError("");
  }, []);

  const dateMode = deriveDateMode(data.missionCategory);

  // Calcul durée
  const numDays = data.startDate && data.endDate
    ? Math.max(1, Math.floor((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000) + 1)
    : data.startDate ? 1 : 0;

  const totalGuests = (data.adults ?? 0) + (data.children ?? 0);

  // Estimation budget
  const estimate = calcEstimate(data.selectedDestination, numDays, totalGuests, data.budgetLevel ?? "premium");

  // Filtrage villes
  const filteredCities = citySearch.length >= 1
    ? DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(citySearch.toLowerCase()) ||
        d.country.toLowerCase().includes(citySearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const canContinue = () => {
    switch (step) {
      case 1: return !!data.missionCategory;
      case 2: return !!data.location?.trim();
      case 3: return !!data.startDate && (dateMode === "single" || !!data.endDate);
      case 4: return !!data.mealPlan;
      case 5: return totalGuests > 0;
      case 6: return true; // langues optionnelles
      case 7: return !!data.budgetLevel;
      case 8: return data.hasDietaryRestrictions !== undefined;
      case 9: return true;
      case 10: return !!data.fullName?.trim() && !!data.email?.includes("@") && (data.phone?.trim().length ?? 0) >= 6;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!canContinue()) { setError(t.required); return; }
    setError(""); setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleSubmit = async () => {
    if (!canContinue()) { setError(t.required); return; }
    setIsSubmitting(true);
    try {
      const response = await submitRequest(buildPayload(data) as any);
      if (response?.success) setResult(response);
    } catch (e) { console.error(e); setError("Une erreur est survenue."); }
    finally { setIsSubmitting(false); }
  };

  // ── SUCCÈS ──
  if (result) {
    return (
      <div className="fixed inset-0 bg-stone-900 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-8">
          <CheckCircle2 className="w-10 h-10 text-stone-900" strokeWidth={1.5} />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-4">CHEFS TALENTS</p>
        <h1 className="text-4xl md:text-5xl font-serif font-normal text-white mb-4">{t.successTitle}</h1>
        <p className="text-stone-400 font-light text-lg leading-relaxed max-w-md mb-4">
          {t.successSub.split("6 heures").map((part, i) => i === 0 ? part : <React.Fragment key={i}><strong className="text-white font-medium">6 heures</strong>{part}</React.Fragment>)}
        </p>
        {result.referenceId && <p className="text-xs uppercase tracking-[0.2em] text-stone-600 mb-10">{t.successRef} {result.referenceId}</p>}
        <div className="flex items-center gap-6 text-xs uppercase tracking-[0.15em] text-stone-500 mb-12">
          <span>NDA</span><span className="w-px h-3 bg-stone-700" />
          <span>400+ chefs</span><span className="w-px h-3 bg-stone-700" />
          <span>Europe</span>
        </div>
        <Link href="/" className="text-sm uppercase tracking-[0.2em] text-stone-500 hover:text-white transition-colors">{t.successBack}</Link>
      </div>
    );
  }

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-stone-50 flex flex-col">

      {/* HEADER */}
      <header className="flex items-center justify-between px-5 md:px-10 py-4 bg-white border-b border-stone-200 shrink-0">
        <Link href="/" className="font-serif text-sm font-medium text-stone-900 tracking-tight">{t.brand}</Link>
        <div className="flex items-center gap-3 md:gap-6 text-xs">
          <span className="hidden md:flex items-center gap-1.5 text-stone-400 uppercase tracking-[0.12em]">
            <span className="text-stone-700">✓</span>{t.tagline1}
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-stone-400 uppercase tracking-[0.12em]">
            <span className="text-stone-700">✓</span>{t.tagline2}
          </span>
          {/* Sélecteur de langue */}
          <div className="flex items-center gap-1 border border-stone-200 rounded-lg overflow-hidden">
            {(["fr", "en", "es"] as Lang[]).map(l => (
              <button key={l} type="button" onClick={() => setLang(l)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-all ${lang === l ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <Link href="/" className="text-stone-400 hover:text-stone-900 transition-colors text-xl leading-none">×</Link>
      </header>

      {/* PROGRESS */}
      <div className="h-0.5 bg-stone-200 shrink-0">
        <div className="h-full bg-stone-900 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl">

          {/* ÉTAPE 1 — Type de mission */}
          {step === 1 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">{t.step} 1 {t.of} {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 text-center mb-2">{t.s1title}</h1>
              <p className="text-stone-500 font-light text-center mb-8">{t.s1sub}</p>
              {/* Type client */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[0, 1].map(i => (
                  <OptionCard key={i} active={data.clientType === (i === 0 ? "private" : "concierge")}
                    title={t.clientTypes[i]} subtitle={t.clientTypeSubs[i]}
                    icon={i === 0 ? "👤" : "🏢"}
                    onClick={() => set({ clientType: i === 0 ? "private" : "concierge" })} />
                ))}
              </div>
              {data.clientType === "concierge" && (
                <input type="text" value={data.companyName} onChange={e => set({ companyName: e.target.value })}
                  placeholder={t.s10company}
                  className="w-full px-5 py-3.5 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 text-stone-900 placeholder-stone-300 text-sm mb-4" />
              )}
              <div className="grid grid-cols-2 gap-3">
                <OptionCard icon="🍽" active={data.missionCategory === "single_service"} title={t.s1a} subtitle={t.s1asub} onClick={() => set({ missionCategory: "single_service" })} />
                <OptionCard icon="🔄" active={data.missionCategory === "single_replacement"} title={t.s1b} subtitle={t.s1bsub} onClick={() => set({ missionCategory: "single_replacement" })} />
                <OptionCard icon="🏝" active={data.missionCategory === "residence"} title={t.s1c} subtitle={t.s1csub} onClick={() => set({ missionCategory: "residence" })} />
                <OptionCard icon="⛵" active={data.missionCategory === "yacht"} title={t.s1d} subtitle={t.s1dsub} onClick={() => set({ missionCategory: "yacht" })} />
              </div>
            </div>
          )}

          {/* ÉTAPE 2 — Destination avec validation */}
          {step === 2 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">{t.step} 2 {t.of} {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 text-center mb-2">{t.s2title}</h1>
              <p className="text-stone-500 font-light text-center mb-8">{t.s2sub}</p>
              <div className="relative" ref={cityRef as any}>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">📍</span>
                <input
                  type="text"
                  autoFocus
                  value={citySearch}
                  onChange={e => {
                    setCitySearch(e.target.value);
                    setShowCitySuggestions(true);
                    if (!DESTINATIONS.find(d => d.name === e.target.value)) {
                      set({ location: e.target.value, selectedDestination: undefined });
                    }
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  placeholder={t.s2placeholder}
                  className="w-full pl-11 pr-5 py-4 text-base border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 transition-colors text-stone-900 placeholder-stone-300"
                />
                {data.selectedDestination && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 text-sm">✓</span>
                )}
                {/* Suggestions */}
                {showCitySuggestions && filteredCities.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    {filteredCities.map((dest, i) => (
                      <button key={i} type="button"
                        onClick={() => {
                          set({ location: dest.name, selectedDestination: dest });
                          setCitySearch(dest.name);
                          setShowCitySuggestions(false);
                        }}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0">
                        <span className="flex items-center gap-3">
                          <span>{dest.flag}</span>
                          <span className="text-stone-900 font-medium text-sm">{dest.name}</span>
                          <span className="text-stone-400 text-xs">{dest.country}</span>
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          dest.tier === "exclusive" ? "bg-stone-900 text-white" :
                          dest.tier === "premium" ? "bg-stone-100 text-stone-700" : "bg-stone-50 text-stone-500"
                        }`}>{dest.tier}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Destinations populaires */}
              <p className="text-xs uppercase tracking-[0.15em] text-stone-400 mt-5 mb-3">{t.s2popular}</p>
              <div className="flex flex-wrap gap-2">
                {DESTINATIONS.filter(d => d.tier === "exclusive").slice(0, 8).map(dest => (
                  <button key={dest.name} type="button"
                    onClick={() => { set({ location: dest.name, selectedDestination: dest }); setCitySearch(dest.name); setShowCitySuggestions(false); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border transition-all ${
                      data.location === dest.name ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400 bg-white"
                    }`}>
                    {dest.flag} {dest.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 3 — Calendrier interactif */}
          {step === 3 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">{t.step} 3 {t.of} {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 text-center mb-2">
                {dateMode === "multi" ? t.s3title : t.s3titlesingle}
              </h1>
              <p className="text-stone-500 font-light text-center mb-6">
                {dateMode === "multi" ? t.s3sub : t.s3subsingle}
              </p>
              {dateMode === "multi" && (
                <div className="flex items-center justify-center gap-4 mb-5 text-sm">
                  <div className={`px-4 py-2 rounded-xl border-2 transition-all ${data.startDate ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 text-stone-400"}`}>
                    {data.startDate || t.s3start}
                  </div>
                  <span className="text-stone-300">→</span>
                  <div className={`px-4 py-2 rounded-xl border-2 transition-all ${data.endDate ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 text-stone-400"}`}>
                    {data.endDate || t.s3end}
                  </div>
                  {numDays > 0 && (
                    <span className="text-stone-500 text-xs font-light">{numDays} {t.s3days}</span>
                  )}
                </div>
              )}
              <MiniCalendar
                startDate={data.startDate}
                endDate={data.endDate}
                multi={dateMode === "multi"}
                onSelect={(start, end) => set({ startDate: start, endDate: end })}
              />
              {data.startDate && data.selectedDestination && numDays > 0 && (
                <div className="mt-4 p-3 bg-stone-900 rounded-xl text-center">
                  <p className="text-white text-sm font-light">
                    {data.selectedDestination.flag} <span className="font-medium">{numDays} {t.s3days}</span> · {data.selectedDestination.name}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 4 — Rythme de service */}
          {step === 4 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">{t.step} 4 {t.of} {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 text-center mb-2">{t.s4title}</h1>
              <p className="text-stone-500 font-light text-center mb-8">{t.s4sub}</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["breakfast", "🌅", t.s4a, t.s4asub],
                  ["lunch", "☀️", t.s4b, t.s4bsub],
                  ["dinner", "🌙", t.s4c, t.s4csub],
                  ["breakfast_lunch", "🌄", t.s4d, t.s4dsub],
                  ["lunch_dinner", "🌆", t.s4e, t.s4esub],
                  ["full_time", "⭐", t.s4f, t.s4fsub],
                ] as const).map(([val, icon, title, sub]) => (
                  <OptionCard key={val} icon={icon} active={data.mealPlan === val} title={title} subtitle={sub} onClick={() => set({ mealPlan: val })} />
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 5 — Convives */}
          {step === 5 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">{t.step} 5 {t.of} {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 text-center mb-2">{t.s5title}</h1>
              <p className="text-stone-500 font-light text-center mb-8">{t.s5sub}</p>
              <div className="space-y-3 max-w-sm mx-auto">
                <Counter label={t.s5adults} sublabel={t.s5adultssub} value={data.adults ?? 0} min={1} onChange={v => set({ adults: v })} />
                <Counter label={t.s5children} sublabel={t.s5childrensub} value={data.children ?? 0} min={0} onChange={v => set({ children: v })} />
              </div>
              {totalGuests > 0 && (
                <p className="text-center text-stone-500 text-sm mt-5 font-light">
                  {t.s5total} : <strong className="text-stone-900">{totalGuests} {t.s5people}</strong>
                </p>
              )}
            </div>
          )}

          {/* ÉTAPE 6 — Langues */}
          {step === 6 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">{t.step} 6 {t.of} {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 text-center mb-2">{t.s6title}</h1>
              <p className="text-stone-500 font-light text-center mb-8">{t.s6sub}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {LANGUAGES.map(l => {
                  const selected = (data.selectedLanguages ?? []).includes(l.code);
                  return (
                    <button key={l.code} type="button"
                      onClick={() => {
                        const current = data.selectedLanguages ?? [];
                        set({ selectedLanguages: selected ? current.filter(c => c !== l.code) : [...current, l.code] });
                      }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                        selected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                      }`}>
                      <span className="text-lg">{l.flag}</span>
                      <span className="text-sm font-medium">{l.code}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => set({ selectedLanguages: [] })}
                className="block mx-auto text-xs text-stone-400 hover:text-stone-600 transition-colors">
                {t.s6skip}
              </button>
            </div>
          )}

          {/* ÉTAPE 7 — Budget adaptatif */}
          {step === 7 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">{t.step} 7 {t.of} {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 text-center mb-2">{t.s7title}</h1>
              <p className="text-stone-500 font-light text-center mb-6">{t.s7sub}</p>

              {/* Estimation contextuelle */}
              {data.selectedDestination && numDays > 0 && totalGuests > 0 && (
                <div className="bg-stone-900 rounded-2xl p-4 mb-6 text-center">
                  <p className="text-xs uppercase tracking-[0.15em] text-stone-500 mb-2">{t.s7estimate}</p>
                  <p className="text-stone-400 text-xs mb-1">{data.selectedDestination.flag} {data.selectedDestination.name} · {numDays} {t.s3days} · {totalGuests} {t.s5people}</p>
                  {estimate ? (
                    <p className="text-white text-xl font-serif">
                      {estimate.min.toLocaleString("fr-FR")}€ — {estimate.max.toLocaleString("fr-FR")}€
                    </p>
                  ) : (
                    <p className="text-stone-500 text-sm">Sélectionnez un niveau pour voir l'estimation</p>
                  )}
                  <p className="text-stone-600 text-xs mt-1">Hors matières premières et frais de coordination</p>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                {([
                  ["essential", "✦", t.s7essential, t.s7essentialsub] as const,
                  ["premium", "✦✦", t.s7premium, t.s7premiumsub] as const,
                  ["exclusive", "✦✦✦", t.s7exclusive, t.s7exclusivesub] as const,
                ]).map(([val, stars, title, sub]) => {
                  const est = calcEstimate(data.selectedDestination, numDays, totalGuests, val);
                  return (
                    <button key={val} type="button" onClick={() => set({ budgetLevel: val })}
                      className={`relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
                        data.budgetLevel === val ? "border-stone-900 bg-stone-900 text-white shadow-xl scale-[1.02]" : "border-stone-200 bg-white hover:border-stone-400 hover:shadow-md"
                      }`}>
                      {val === "premium" && (
                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.1em] px-3 py-1 rounded-full font-semibold whitespace-nowrap ${data.budgetLevel === "premium" ? "bg-white text-stone-900" : "bg-stone-900 text-white"}`}>
                          {t.s7popular}
                        </div>
                      )}
                      <p className={`text-xs mb-2 ${data.budgetLevel === val ? "text-stone-400" : "text-stone-300"}`}>{stars}</p>
                      <p className={`font-semibold text-base mb-1 ${data.budgetLevel === val ? "text-white" : "text-stone-900"}`}>{title}</p>
                      <p className={`text-xs font-light mb-3 ${data.budgetLevel === val ? "text-stone-300" : "text-stone-500"}`}>{sub}</p>
                      {est ? (
                        <p className={`text-sm font-medium border-t pt-3 ${data.budgetLevel === val ? "border-stone-700 text-stone-200" : "border-stone-100 text-stone-700"}`}>
                          {est.min.toLocaleString("fr-FR")}€ — {est.max.toLocaleString("fr-FR")}€
                        </p>
                      ) : (
                        <p className={`text-xs border-t pt-3 ${data.budgetLevel === val ? "border-stone-700 text-stone-400" : "border-stone-100 text-stone-400"}`}>
                          {val === "exclusive" ? "Sur devis" : val === "premium" ? "À partir de 5 000€" : "À partir de 2 500€"}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-stone-400 mt-4">{t.s7note}</p>
            </div>
          )}

          {/* ÉTAPE 8 — Restrictions */}
          {step === 8 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">{t.step} 8 {t.of} {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 text-center mb-2">{t.s8title}</h1>
              <p className="text-stone-500 font-light text-center mb-8">{t.s8sub}</p>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-5">
                <OptionCard active={data.hasDietaryRestrictions === false} title={t.s8no} subtitle={t.s8nosub} onClick={() => set({ hasDietaryRestrictions: false, dietaryRestrictions: "" })} />
                <OptionCard active={data.hasDietaryRestrictions === true} title={t.s8yes} subtitle={t.s8yessub} onClick={() => set({ hasDietaryRestrictions: true })} />
              </div>
              {data.hasDietaryRestrictions && (
                <input type="text" autoFocus value={data.dietaryRestrictions} onChange={e => set({ dietaryRestrictions: e.target.value })}
                  placeholder={t.s8placeholder}
                  className="w-full max-w-sm mx-auto block px-5 py-4 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 text-stone-900 placeholder-stone-300" />
              )}
              <p className="text-center text-xs text-stone-400 mt-5">{t.s8hint}</p>
            </div>
          )}

          {/* ÉTAPE 9 — Notes */}
          {step === 9 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">{t.step} 9 {t.of} {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 text-center mb-2">{t.s9title}</h1>
              <p className="text-stone-500 font-light text-center mb-8">{t.s9sub}</p>
              <textarea autoFocus value={data.notes} onChange={e => set({ notes: e.target.value })}
                placeholder={t.s9placeholder} rows={6}
                className="w-full px-5 py-4 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 text-stone-900 placeholder-stone-300 resize-none text-sm font-light leading-relaxed" />
              <p className="text-center text-xs text-stone-400 mt-3">{t.s9hint}</p>
            </div>
          )}

          {/* ÉTAPE 10 — Contact */}
          {step === 10 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 text-center mb-3">{t.step} 10 {t.of} {TOTAL_STEPS}</p>
              <h1 className="text-3xl md:text-4xl font-serif text-stone-900 text-center mb-2">{t.s10title}</h1>
              <p className="text-stone-500 font-light text-center mb-6">{t.s10sub}</p>
              <div className="space-y-3 max-w-md mx-auto">
                <input type="text" autoFocus value={data.fullName} onChange={e => set({ fullName: e.target.value })}
                  placeholder={`${t.s10name} *`} autoComplete="name"
                  className="w-full px-5 py-4 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 text-stone-900 placeholder-stone-300" />
                <input type="email" value={data.email} onChange={e => set({ email: e.target.value })}
                  placeholder={`${t.s10email} *`} autoComplete="email"
                  className="w-full px-5 py-4 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 text-stone-900 placeholder-stone-300" />
                <input type="tel" value={data.phone} onChange={e => set({ phone: e.target.value })}
                  placeholder={`${t.s10phone} *`} autoComplete="tel"
                  className="w-full px-5 py-4 border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-stone-900 text-stone-900 placeholder-stone-300" />
                {/* Résumé */}
                <div className="bg-stone-900 rounded-2xl p-5 mt-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-3">{t.s10summary}</p>
                  <div className="space-y-1.5 text-sm">
                    {[
                      data.missionCategory && ["Mission", (t.missionLabels as any)[data.missionCategory]],
                      data.location && ["Lieu", `${data.selectedDestination?.flag ?? ""} ${data.location}`],
                      data.startDate && ["Dates", `${data.startDate}${data.endDate ? ` → ${data.endDate}` : ""}${numDays > 1 ? ` (${numDays}j)` : ""}`],
                      totalGuests > 0 && [t.s5people, `${totalGuests}`],
                      data.budgetLevel && ["Budget", (t.budgetLabels as any)[data.budgetLevel]],
                      (data.selectedLanguages?.length ?? 0) > 0 && ["Langues", data.selectedLanguages!.join(", ")],
                    ].filter(Boolean).map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-stone-500">{(item as string[])[0]}</span>
                        <span className="text-white font-medium">{(item as string[])[1]}</span>
                      </div>
                    ))}
                    {estimate && data.budgetLevel && (
                      <div className="flex justify-between pt-1.5 border-t border-stone-800 mt-1.5">
                        <span className="text-stone-500">Estimation</span>
                        <span className="text-stone-300 font-medium">{estimate.min.toLocaleString("fr-FR")}€ — {estimate.max.toLocaleString("fr-FR")}€</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-stone-400 mt-4 max-w-xs mx-auto">
                {t.s10privacy.split(t.s10privacy2).map((part, i) =>
                  i === 0 ? part : <React.Fragment key={i}><Link href="/privacy" className="underline hover:text-stone-600">{t.s10privacy2}</Link>{part}</React.Fragment>
                )}
              </p>
            </div>
          )}

          {error && <p className="text-center text-red-500 text-sm mt-4">{error}</p>}
        </div>
      </div>

      {/* FOOTER NAV */}
      <footer className="shrink-0 bg-white border-t border-stone-200 px-5 md:px-10 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          {step > 1 ? (
            <button type="button" onClick={() => { setError(""); setStep(s => s - 1); }}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors">
              <ChevronLeft className="w-4 h-4" />{t.previous}
            </button>
          ) : <div />}
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400">{step} / {TOTAL_STEPS}</span>
            {step < TOTAL_STEPS ? (
              <button type="button" onClick={handleNext}
                className={`flex items-center gap-1.5 px-7 py-3 rounded-xl font-medium text-sm transition-all ${
                  canContinue() ? "bg-stone-900 text-white hover:bg-black shadow-md" : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}>
                {t.continue}<ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting || !canContinue()}
                className={`flex items-center gap-1.5 px-7 py-3 rounded-xl font-medium text-sm transition-all ${
                  !isSubmitting && canContinue() ? "bg-stone-900 text-white hover:bg-black shadow-md" : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />{t.sending}</> : t.submit}
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* WHATSAPP FLOTTANT */}
      <a
        href="https://wa.me/33756827612?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20ma%20demande%20de%20chef%20priv%C3%A9."
        target="_blank" rel="noopener noreferrer"
        title={t.whatsapp}
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-50">
        <MessageCircle className="w-6 h-6 text-white" />
      </a>
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
