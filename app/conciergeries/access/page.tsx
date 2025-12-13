'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Textarea, Reveal, Marker, Label } from '../../../components/ui';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ConciergeAccessPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const [data, setData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    website: '',
    locations: '',
    notes: '',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // ✅ Pour l’instant, on affiche juste un succès (pas de backend requis)
      // Plus tard, on branchera un endpoint /api/concierge-access ou une server action.
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] px-6">
        <Reveal className="max-w-lg w-full text-center">
          <Marker className="mx-auto mb-8 bg-stone-900" />
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-16 h-16 text-stone-900" strokeWidth={1} />
          </div>
          <h1 className="text-4xl font-serif text-stone-900 mb-4">Demande envoyée</h1>
          <p className="text-stone-500 font-light">
            Merci. Notre équipe vous recontacte rapidement pour valider l’accès à la Sélection.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link href="/conciergeries">
              <Button variant="link">Retour</Button>
            </Link>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <Reveal className="space-y-10">
          <div className="text-center space-y-4">
            <Marker className="mx-auto mb-2" />
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900">
              Demander l’accès à la Sélection
            </h1>
            <p className="text-stone-500 font-light max-w-2xl mx-auto">
              Présentez votre conciergerie. Nous vous recontactons pour valider l’accès et activer la mise en relation.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8 border border-stone-200 bg-white p-8 md:p-10">
            <div className="space-y-3">
              <Label>Nom de la conciergerie</Label>
              <Input
                value={data.companyName}
                onChange={(e) => setData({ ...data, companyName: e.target.value })}
                placeholder="Ex: Excellence Courchevel"
                required
                autoFocus
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Votre nom</Label>
                <Input
                  value={data.fullName}
                  onChange={(e) => setData({ ...data, fullName: e.target.value })}
                  placeholder="Prénom Nom"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label>Téléphone</Label>
                <Input
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder="+33…"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="contact@…"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label>Site / Instagram (optionnel)</Label>
                <Input
                  value={data.website}
                  onChange={(e) => setData({ ...data, website: e.target.value })}
                  placeholder="https://… ou @…"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Zones couvertes</Label>
              <Input
                value={data.locations}
                onChange={(e) => setData({ ...data, locations: e.target.value })}
                placeholder="Ex: Courchevel, Megève, Ibiza…"
              />
            </div>

            <div className="space-y-3">
              <Label>Message (optionnel)</Label>
              <Textarea
                value={data.notes}
                onChange={(e) => setData({ ...data, notes: e.target.value })}
                placeholder="Votre volume de demandes, typologies de clients, exigences…"
                className="min-h-[120px]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link href="/conciergeries">
                <Button variant="link">← Retour</Button>
              </Link>

              <Button type="submit" disabled={isSubmitting} className="w-64">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Envoyer la demande'}
              </Button>
            </div>
          </form>
        </Reveal>
      </div>
    </div>
  );
}
