'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Textarea, Reveal, Marker, Label } from '../../components/ui';
import { submitRequest } from '../../services/actions';
import { RequestForm, RequestMode } from '../../types';
import { Loader2, Star, ShieldCheck, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

function RequestFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<RequestMode | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Result State
  const [result, setResult] = useState<{
    success: boolean;
    referenceId?: string;
    mode?: string;
    matchedChef?: string;
  } | null>(null);

  // Default State
  const [formData, setFormData] = useState<RequestForm>({
    mode: 'fast', // Default, updated on load
    clientType: 'private',
    location: '',
    dateMode: 'single',
    startDate: '',
    assignmentType: 'dinner',
    guestCount: 2,
    serviceExpectations: 'chef_only',
    cuisinePreferences: '',
    dietaryRestrictions: '',
    preferredLanguage: '',
    budgetRange: '',
    notes: '',
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    serviceRhythm: 'daily',
    accommodationProvided: 'yes',
    sailingArea: '',
    crewSize: 0,
  });

  // Initialize Mode from URL
  useEffect(() => {
    const modeParam = searchParams?.get('mode');
    const typeParam = searchParams?.get('type');

    if (modeParam === 'fast' || modeParam === 'concierge') {
      const m = modeParam as RequestMode;
      setMode(m);
      setFormData(prev => ({ ...prev, mode: m })); 
      
      // Force defaults for Fast Match
      if (modeParam === 'fast') {
        setFormData(prev => ({ 
          ...prev, 
          mode: 'fast',
          dateMode: 'single', 
          assignmentType: 'dinner',
          clientType: typeParam === 'concierge' ? 'concierge' : 'private'
        }));
      } else {
        setFormData(prev => ({ ...prev, mode: 'concierge' }));
      }
    }
    
    if (typeParam === 'concierge' || typeParam === 'private') {
      setFormData(prev => ({ ...prev, clientType: typeParam as any }));
    }
  }, [searchParams]);

  const selectMode = (selected: RequestMode) => {
    setMode(selected);
    setFormData(prev => ({ ...prev, mode: selected }));
    router.push(`?mode=${selected}`);
    setStep(1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await submitRequest(formData);
      if (response.success) {
        setResult(response);
      }
    } catch (error) {
      console.error("Error submitting", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalSteps = () => mode === 'fast' ? 2 : 4;

  const nextStep = () => setStep(prev => Math.min(prev + 1, getTotalSteps()));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // --- RENDER: SUCCESS SCREEN ---
  if (result) {
    const isFastMode = result.mode === 'instant_match'; 

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] px-4">
        <Reveal className="max-w-lg w-full text-center">
          <Marker className="mx-auto mb-8 bg-stone-900" />
          
          <div className="flex justify-center mb-6">
            {isFastMode ? (
               <CheckCircle2 className="w-16 h-16 text-stone-900" strokeWidth={1} />
            ) : (
               <Clock className="w-16 h-16 text-stone-400" strokeWidth={1} />
            )}
          </div>

          <h2 className="text-4xl font-serif font-normal mb-6 text-stone-900">
            {isFastMode ? "Demande enregistrée" : "Dossier ouvert"}
          </h2>
          
          <div className="text-stone-500 mb-12 text-lg font-light space-y-4">
            {isFastMode ? (
              <>
                <p>
                  Votre demande Fast Match a bien été reçue.
                </p>
                <p>
                  Nous vérifions la disponibilité immédiate de nos chefs et vous confirmerons l'attribution sous 2h.
                </p>
              </>
            ) : (
              <p>
                 Votre demande a été attribuée à notre équipe Concierge. Nous étudions le cahier des charges et reviendrons vers vous avec une proposition structurée.
              </p>
            )}
            
            <p className="text-xs uppercase tracking-widest pt-4 text-stone-400">Ref: {result.referenceId}</p>
          </div>
          <Link href="/">
            <Button variant="link">Retour à l’accueil</Button>
          </Link>
        </Reveal>
      </div>
    );
  }

  // --- RENDER: MODE SELECTION (If no mode selected) ---
  if (!mode) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] pt-32 pb-24 px-6 md:px-12 flex flex-col items-center justify-center">
        <Reveal className="max-w-5xl w-full">
          <div className="text-center mb-16">
            <Marker className="mx-auto" />
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-6">Quel est votre besoin ?</h1>
            <p className="text-stone-500 font-light">Sélectionnez le type d'accompagnement souhaité.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-16">
            {/* Fast Match Card */}
            <button 
              onClick={() => selectMode('fast')}
              className="group text-left p-10 border border-stone-200 bg-white hover:border-stone-900 transition-all duration-500 flex flex-col h-full"
            >
              <Star className="w-8 h-8 text-stone-400 group-hover:text-stone-900 mb-8 transition-colors" strokeWidth={1} />
              <h3 className="text-3xl font-serif text-stone-900 mb-4">Fast Match</h3>
              <p className="text-stone-500 font-light mb-8 flex-grow">
                Pour une demande simple, sur une date précise (dîner ou déjeuner).
              </p>
              <div className="flex items-center text-xs font-medium uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-900 mt-auto">
                Sélectionner <ChevronRight className="w-4 h-4 ml-2" />
              </div>
            </button>

            {/* Concierge Match Card */}
            <button 
              onClick={() => selectMode('concierge')}
              className="group text-left p-10 bg-stone-900 text-stone-100 hover:bg-stone-800 transition-all duration-500 flex flex-col h-full"
            >
              <ShieldCheck className="w-8 h-8 text-bronze mb-8" strokeWidth={1} />
              <h3 className="text-3xl font-serif text-white mb-4">Concierge Match</h3>
              <p className="text-stone-400 font-light mb-8 flex-grow">
                Pour les demandes complexes, séjours prolongés, villas ou yachts. Étude manuelle du dossier.
              </p>
              <div className="flex items-center text-xs font-medium uppercase tracking-[0.2em] text-bronze mt-auto">
                Sélectionner <ChevronRight className="w-4 h-4 ml-2" />
              </div>
            </button>
          </div>
        </Reveal>
      </div>
    );
  }

  // --- RENDER: FORM FLOW ---
  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-32 pb-24 px-6 md:px-12 font-sans">
      <div className="max-w-4xl mx-auto grid md:grid-cols-12 gap-12">
        
        {/* Sidebar: Context & Progress */}
        <div className="md:col-span-3">
          <div className="sticky top-32 space-y-8">
            <Marker className={mode === 'concierge' ? "bg-stone-900" : "bg-stone-400"} />
            
            <div className="space-y-2">
              <Link href="/request" onClick={() => setMode(null)} className="text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 transition-colors">
                ← Changer de mode
              </Link>
              <h1 className="text-2xl font-serif text-stone-900 leading-tight">
                {mode === 'fast' ? "Fast Match" : "Concierge Match"}
              </h1>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                {mode === 'fast' 
                  ? "Pour une demande simple, sur une date précise."
                  : "Pour les demandes complexes ou sensibles."
                }
              </p>
            </div>
            
            {/* Steps Indicator */}
            <div className="flex flex-col gap-3 pt-4">
              {Array.from({ length: getTotalSteps() }).map((_, i) => {
                const s = i + 1;
                const isActive = s === step;
                const isPast = s < step;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`h-px transition-all duration-500 ${isActive ? 'w-8 bg-stone-900' : isPast ? 'w-4 bg-stone-300' : 'w-2 bg-stone-100'}`} />
                    <span className={`text-[10px] uppercase tracking-widest transition-colors ${isActive ? 'text-stone-900' : 'text-stone-300'}`}>
                      {s === 1 && (mode === 'fast' ? "La Demande" : "Contexte")}
                      {s === 2 && (mode === 'fast' ? "Coordonnées" : "La Mission")}
                      {s === 3 && "Détails"}
                      {s === 4 && "Coordonnées"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Form Area */}
        <div className="md:col-span-9 min-h-[500px] flex flex-col justify-between border-l border-stone-100 pl-0 md:pl-12">
          
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 key={step}">
            
            {/* === FAST MATCH FLOW === */}
            {mode === 'fast' && step === 1 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">Votre demande</h2>
                  
                  <div className="space-y-6">
                    <Label>Vous êtes :</Label>
                    <div className="flex gap-4">
                      {[
                        { val: 'private', label: 'Client Privé' },
                        { val: 'concierge', label: 'Conciergerie / Agence' }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setFormData({...formData, clientType: opt.val as any})}
                          className={`px-6 py-3 text-sm border transition-colors ${formData.clientType === opt.val ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-900'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label>Lieu</Label>
                      <Input 
                        placeholder="Ville" 
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-4">
                      <Label>Date du dîner</Label>
                      <Input 
                        type="date" 
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Nombre de convives</Label>
                    <Input 
                      type="number" 
                      min={1}
                      className="max-w-[100px]"
                      value={formData.guestCount}
                      onChange={(e) => setFormData({...formData, guestCount: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Préférences (Facultatif)</Label>
                    <Textarea 
                      placeholder="Type de cuisine, allergies, ambiance souhaitée..." 
                      value={formData.cuisinePreferences}
                      onChange={(e) => setFormData({...formData, cuisinePreferences: e.target.value})}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </Reveal>
            )}

            {mode === 'fast' && step === 2 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">Vos coordonnées</h2>
                  <div className="space-y-6">
                    <Label>Nom complet</Label>
                    <Input 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      autoFocus
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label>Email</Label>
                      <Input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-4">
                      <Label>Téléphone</Label>
                      <Input 
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* === CONCIERGE MATCH FLOW === */}
            
            {/* Step 1: Context */}
            {mode === 'concierge' && step === 1 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">Contexte de la demande</h2>
                  
                  <div className="space-y-6">
                    <Label>Type de client</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-stone-200 border border-stone-200">
                      {[
                        { val: 'concierge', label: 'Une conciergerie / Agence' },
                        { val: 'private', label: 'Un client privé' }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setFormData({...formData, clientType: opt.val as any})}
                          className={`h-16 text-left px-6 transition-colors ${formData.clientType === opt.val ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:text-stone-900'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.clientType === 'concierge' && (
                    <div className="space-y-4">
                      <Label>Nom de la structure</Label>
                      <Input 
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        placeholder="Agence, Family Office..."
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <Label>Lieu de la mission</Label>
                    <Input 
                      placeholder="Ville, Pays, Station..." 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Durée</Label>
                    <div className="flex gap-8 mb-6">
                      {[{val: 'single', label: 'Date unique'}, {val: 'multi', label: 'Séjour prolongé'}].map((m) => (
                        <label key={m.val} className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-4 h-4 border flex items-center justify-center ${formData.dateMode === m.val ? 'border-stone-900' : 'border-stone-300'}`}>
                            {formData.dateMode === m.val && <div className="w-2 h-2 bg-stone-900" />}
                          </div>
                          <span className="text-stone-600">{m.label}</span>
                          <input type="radio" className="hidden" name="dateMode" checked={formData.dateMode === m.val} onChange={() => setFormData({...formData, dateMode: m.val as any})} />
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <Input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                       {formData.dateMode === 'multi' && (
                         <Input type="date" placeholder="Fin" value={formData.endDate || ''} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                       )}
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* Step 2: Mission */}
            {mode === 'concierge' && step === 2 && (
              <Reveal>
                 <div className="space-y-12">
                   <h2 className="text-3xl font-serif text-stone-900 mb-8">La Mission</h2>
                   
                   <div className="space-y-4">
                      <Label>Type d'assignation</Label>
                      <select
                        value={formData.assignmentType}
                        onChange={(e) => setFormData({...formData, assignmentType: e.target.value as any})}
                        className="w-full h-14 bg-transparent border-b border-stone-200 text-lg focus:outline-none"
                      >
                        <option value="dinner">Dîner privé</option>
                        <option value="event">Événement</option>
                        <option value="daily">Service quotidien (Villa/Chalet)</option>
                        <option value="yacht">Mission Yachting</option>
                      </select>
                   </div>

                   {formData.assignmentType === 'yacht' && (
                     <div className="grid grid-cols-2 gap-8 p-6 bg-stone-50 border border-stone-100">
                        <div className="space-y-2">
                           <Label>Zone de navigation</Label>
                           <Input value={formData.sailingArea} onChange={(e) => setFormData({...formData, sailingArea: e.target.value})} placeholder="Ex: Caraïbes" />
                        </div>
                        <div className="space-y-2">
                           <Label>Équipage total</Label>
                           <Input type="number" value={formData.crewSize} onChange={(e) => setFormData({...formData, crewSize: parseInt(e.target.value)})} />
                        </div>
                     </div>
                   )}

                   <div className="space-y-4">
                      <Label>Convives (Principal)</Label>
                      <Input type="number" min={1} value={formData.guestCount} onChange={(e) => setFormData({...formData, guestCount: parseInt(e.target.value)})} />
                   </div>

                   <div className="space-y-4">
                      <Label>Niveau de staffing</Label>
                      <div className="grid gap-3">
                         {{[
  { id: 'chef_only', title: 'Chef seul', desc: 'Cuisine & dressage simple' },
  {
    id: 'chef_service',
    title: 'Chef + Service',
    desc: "Avec maître d’hôtel/serveur",
    disabled: true,
    note: 'Disponible prochainement',
  },
  {
    id: 'full_team',
    title: 'Brigade complète',
    desc: 'Pour grands événements',
    disabled: true,
    note: 'Disponible prochainement',
  },
].map((l) => (
                           <label key={l.id} className={`flex justify-between items-center p-4 border cursor-pointer transition-colors ${formData.serviceExpectations === l.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200'}`}>
                              <div>
                                <span className="block font-medium text-stone-900">{l.title}</span>
                                <span className="text-xs text-stone-500">{l.desc}</span>
                              </div>
                              <input type="radio" className="hidden" name="service" checked={formData.serviceExpectations === l.id} onChange={() => setFormData({...formData, serviceExpectations: l.id as any})} />
                              <div className={`w-4 h-4 border flex items-center justify-center rounded-full ${formData.serviceExpectations === l.id ? 'border-stone-900' : 'border-stone-300'}`}>
                                 {formData.serviceExpectations === l.id && <div className="w-2 h-2 bg-stone-900 rounded-full" />}
                              </div>
                           </label>
                         ))}
                      </div>
                   </div>

                   {formData.dateMode === 'multi' && (
                     <div className="grid grid-cols-2 gap-8 border-t border-stone-100 pt-8">
                        <div className="space-y-4">
                           <Label>Rythme</Label>
                           <select className="w-full h-12 border-b border-stone-200 bg-transparent" value={formData.serviceRhythm} onChange={(e) => setFormData({...formData, serviceRhythm: e.target.value as any})}>
                             <option value="daily">3 repas / jour</option>
                             <option value="occasional">Dîner uniquement</option>
                             <option value="ondemand">À la carte</option>
                           </select>
                        </div>
                        <div className="space-y-4">
                           <Label>Logement Chef</Label>
                           <select className="w-full h-12 border-b border-stone-200 bg-transparent" value={formData.accommodationProvided} onChange={(e) => setFormData({...formData, accommodationProvided: e.target.value as any})}>
                             <option value="yes">Fourni sur place</option>
                             <option value="no">Non fourni</option>
                           </select>
                        </div>
                     </div>
                   )}
                 </div>
              </Reveal>
            )}

            {/* Step 3: Details */}
            {mode === 'concierge' && step === 3 && (
              <Reveal>
                <div className="space-y-12">
                   <h2 className="text-3xl font-serif text-stone-900 mb-8">Précisions</h2>
                   
                   <div className="space-y-4">
                      <Label>Style Culinaire</Label>
                      <Textarea placeholder="Méditerranéen, Gastronomique, Family style..." value={formData.cuisinePreferences} onChange={(e) => setFormData({...formData, cuisinePreferences: e.target.value})} />
                   </div>
                   
                   <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <Label>Restrictions / Allergies</Label>
                        <Input value={formData.dietaryRestrictions} onChange={(e) => setFormData({...formData, dietaryRestrictions: e.target.value})} placeholder="Sans gluten, etc." />
                     </div>
                     <div className="space-y-4">
                        <Label>Langues parlées</Label>
                        <Input value={formData.preferredLanguage} onChange={(e) => setFormData({...formData, preferredLanguage: e.target.value})} placeholder="FR, EN..." />
                     </div>
                   </div>

                   <div className="space-y-4 pt-6 border-t border-stone-100">
                      <Label>Budget Estimatif</Label>
                      <p className="text-xs text-stone-400 italic mb-2">Confidentiel. Permet de calibrer le profil du chef.</p>
                      <Input value={formData.budgetRange} onChange={(e) => setFormData({...formData, budgetRange: e.target.value})} placeholder="Ex: 500-800€ / jour ou Budget global" />
                   </div>
                </div>
              </Reveal>
            )}

            {/* Step 4: Contact */}
            {mode === 'concierge' && step === 4 && (
              <Reveal>
                 <div className="space-y-12">
                    <h2 className="text-3xl font-serif text-stone-900 mb-8">Finalisation</h2>
                    
                    <div className="space-y-4">
                       <Label>Notes confidentielles</Label>
                       <Textarea 
                          value={formData.notes} 
                          onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                          placeholder="Protocoles particuliers, confidentialité, accès..."
                          className="min-h-[100px]"
                       />
                    </div>

                    <div className="space-y-6 pt-6">
                      <Label>Vos coordonnées</Label>
                      <Input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nom complet" />
                      <div className="grid md:grid-cols-2 gap-8">
                         <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email professionnel" />
                         <Input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Téléphone" />
                      </div>
                    </div>
                 </div>
              </Reveal>
            )}

          </div>

          {/* Navigation Buttons */}
          <div className="pt-16 mt-8 flex items-center justify-end gap-6 border-t border-stone-100">
             {step > 1 && (
               <Button variant="link" onClick={prevStep} className="text-stone-400 hover:text-stone-900">
                 Revenir
               </Button>
             )}
             
             {step < getTotalSteps() ? (
               <Button onClick={nextStep} className="w-40">
                 Continuer
               </Button>
             ) : (
               <Button onClick={handleSubmit} disabled={isSubmitting} className="w-64">
                 {isSubmitting ? <Loader2 className="animate-spin" /> : (mode === 'fast' ? 'Envoyer la demande' : 'Soumettre le dossier')}
               </Button>
             )}
          </div>
          
          {step === getTotalSteps() && (
            <div className="text-right mt-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">
                {mode === 'fast' ? "Réponse sous 24h." : "Traitement confidentiel."}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <RequestFormContent />
    </Suspense>
  );
}
