'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Textarea, Reveal, Marker, Label } from '../../components/ui';
import { submitRequest } from '../../services/actions';
import { RequestForm, RequestMode } from '../../types';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

function RequestFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mode, setMode] = useState<RequestMode | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState<RequestForm>({
    mode: 'fast',
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

  useEffect(() => {
    const m = searchParams.get('mode') as RequestMode | null;
    if (m === 'fast' || m === 'concierge') {
      setMode(m);
      setFormData((p) => ({ ...p, mode: m }));
    }
  }, [searchParams]);

  const getTotalSteps = () => (mode === 'fast' ? 2 : 4);
  const nextStep = () => setStep((s) => Math.min(s + 1, getTotalSteps()));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const res = await submitRequest(formData);
    setResult(res);
    setIsSubmitting(false);
  };

  /* ---------------- SUCCESS ---------------- */
  if (result) {
    const fast = result.mode === 'instant_match';
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <Reveal className="text-center max-w-lg">
          <Marker className="mx-auto mb-6 bg-stone-900" />
          {fast ? <CheckCircle2 className="mx-auto w-14 h-14" /> : <Clock className="mx-auto w-14 h-14" />}
          <h2 className="text-4xl font-serif mt-6">
            {fast ? 'Demande enregistrée' : 'Dossier ouvert'}
          </h2>
          <p className="text-stone-500 mt-4">Ref : {result.referenceId}</p>
          <Link href="/">
            <Button variant="link" className="mt-8">Retour accueil</Button>
          </Link>
        </Reveal>
      </div>
    );
  }

  /* ---------------- MODE SELECTION ---------------- */
  if (!mode) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-6">
        <Reveal className="max-w-4xl w-full grid md:grid-cols-2 gap-12">
          <button onClick={() => setMode('fast')} className="border p-10 text-left">
            <h3 className="text-3xl font-serif">Fast Match</h3>
            <p className="text-stone-500 mt-4">Demande simple</p>
          </button>
          <button onClick={() => setMode('concierge')} className="border p-10 text-left">
            <h3 className="text-3xl font-serif">Concierge Match</h3>
            <p className="text-stone-500 mt-4">Mission complexe</p>
          </button>
        </Reveal>
      </div>
    );
  }

  /* ---------------- FORM FLOW ---------------- */
  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-12">

        {/* SIDEBAR */}
        <aside className="md:col-span-3 sticky top-32 space-y-8">
          <Marker className={mode === 'concierge' ? 'bg-stone-900' : 'bg-stone-400'} />
          <h1 className="font-serif text-2xl">
            {mode === 'fast' ? 'Fast Match' : 'Concierge Match'}
          </h1>

          <div className="flex flex-col gap-3">
            {Array.from({ length: getTotalSteps() }).map((_, i) => {
              const s = i + 1;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`h-px ${step === s ? 'w-8 bg-stone-900' : 'w-4 bg-stone-300'}`} />
                  <span className="text-[10px] uppercase">{s}</span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* MAIN */}
        <main className="md:col-span-9 border-l border-stone-100 pl-12">
          {mode === 'fast' && step === 1 && (
            <Reveal>
              <Label>Lieu</Label>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </Reveal>
          )}

          {step === getTotalSteps() && (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="mt-12">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Soumettre'}
            </Button>
          )}

          {step < getTotalSteps() && (
            <Button onClick={nextStep} className="mt-12">Continuer</Button>
          )}
        </main>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={<Loader2 className="animate-spin" />}>
      <RequestFormContent />
    </Suspense>
  );
}
