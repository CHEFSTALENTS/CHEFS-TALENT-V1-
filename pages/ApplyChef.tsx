import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Reveal, Marker, Label } from '../components/ui';
import { submitChefApplication } from '../services/actions';
import { ChefApplicationForm } from '../types';
import { Loader2, Lock } from 'lucide-react';

const CHEF_PORTAL_PASSWORD = "chef"; // Simulated Environment Variable

const ApplyChef = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // 1. Check Session
    if (localStorage.getItem('chef_portal_session') === 'true') {
      setIsAuthenticated(true);
    }

    // 2. Add NoIndex to Head (Prevent SEO indexing)
    const meta = document.createElement('meta');
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CHEF_PORTAL_PASSWORD) {
      localStorage.setItem('chef_portal_session', 'true');
      setIsAuthenticated(true);
    } else {
      alert("Accès refusé. Veuillez vérifier vos identifiants.");
    }
  };

  const [formData, setFormData] = useState<ChefApplicationForm>({
    fullName: '',
    email: '',
    phone: '',
    baseCity: '',
    travelRange: 'national',
    languages: '',
    background: {
      michelin: false,
      palace: false,
      yacht: false,
      privateHousehold: false
    },
    specialties: '',
    portfolioLink: '',
    availabilityNotes: ''
  });

  const handleCheckboxChange = (field: keyof typeof formData.background) => {
    setFormData(prev => ({
      ...prev,
      background: {
        ...prev.background,
        [field]: !prev.background[field]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitChefApplication(formData);
      setSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER: GATE ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 px-6">
        <div className="max-w-md w-full bg-paper p-12 text-center shadow-2xl">
           <Lock className="w-8 h-8 mx-auto text-stone-900 mb-6" strokeWidth={1} />
           <h2 className="text-2xl font-serif text-stone-900 mb-2">Accès Restreint</h2>
           <p className="text-stone-500 font-light mb-8 text-sm">
             Ce portail est réservé aux candidatures sur invitation.
           </p>
           <form onSubmit={handleLogin} className="space-y-6">
              <Input 
                type="password" 
                placeholder="Code d'accès" 
                className="text-center bg-transparent border-stone-300" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full">Entrer</Button>
           </form>
           <p className="mt-8 text-[10px] text-stone-400 uppercase tracking-widest">Chef Talents Portal</p>
        </div>
      </div>
    );
  }

  // --- RENDER: SUCCESS ---
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-6">
        <div className="max-w-xl w-full text-center space-y-8">
          <Marker className="mx-auto" />
          <h2 className="text-4xl md:text-5xl font-serif text-stone-900">Candidature transmise</h2>
          <p className="text-stone-500 text-lg font-light leading-relaxed">
            Votre profil a été enregistré de manière sécurisée. <br/>
            Notre équipe Talent Acquisition étudie les candidatures pour la Sélection Select chaque semaine. Vous serez contacté si votre profil correspond à nos mandats actuels.
          </p>
          <Button onClick={() => window.location.href = '/'} variant="link">Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  // --- RENDER: FORM ---
  return (
    <div className="min-h-screen bg-paper pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-24">
          <Marker />
          <div className="flex items-center gap-3 mb-4">
             <Label className="mb-0">Portail Chef</Label>
             <span className="text-[10px] text-stone-300 uppercase tracking-widest px-2 py-0.5 border border-stone-200">Privé</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-stone-900 mt-6 mb-6">Rejoindre la Sélection</h1>
          <p className="text-xl text-stone-500 font-light max-w-2xl">
            Veuillez compléter ce profil professionnel. Ces données sont confidentielles et utilisées uniquement pour la validation de votre éligibilité.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-20">
          
          {/* Section 1: Identity */}
          <section className="space-y-12">
             <div className="border-b border-stone-200 pb-4 mb-8">
               <h3 className="text-2xl font-serif text-stone-900">01. Identité</h3>
             </div>
             
             <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <Label>Nom et Prénom</Label>
                  <Input 
                    required 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <Label>Ville de base</Label>
                  <Input 
                    required 
                    placeholder="Ville de résidence principale"
                    value={formData.baseCity}
                    onChange={(e) => setFormData({...formData, baseCity: e.target.value})}
                  />
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <Label>Email Professionnel</Label>
                  <Input 
                    type="email"
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <Label>Téléphone</Label>
                  <Input 
                    type="tel"
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
             </div>
          </section>

          {/* Section 2: Experience */}
          <section className="space-y-12">
             <div className="border-b border-stone-200 pb-4 mb-8">
               <h3 className="text-2xl font-serif text-stone-900">02. Références & Parcours</h3>
             </div>

             <div className="space-y-6">
                <Label>Expérience Vérifiée</Label>
                <div className="grid md:grid-cols-2 gap-px bg-stone-200 border border-stone-200">
                   {[
                     { id: 'michelin', label: 'Expérience Étoilée Michelin' },
                     { id: 'palace', label: 'Hôtellerie de Luxe / Palace' },
                     { id: 'yacht', label: 'Yacht Privé (>30m)' },
                     { id: 'privateHousehold', label: 'Résidence UHNW' }
                   ].map((item) => (
                     <label key={item.id} className="bg-paper p-6 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors">
                        <span className="text-lg text-stone-700 font-light">{item.label}</span>
                        <div className={`w-5 h-5 border border-stone-300 flex items-center justify-center ${formData.background[item.id as keyof typeof formData.background] ? 'bg-stone-900 border-stone-900' : ''}`}>
                           {formData.background[item.id as keyof typeof formData.background] && <div className="w-2 h-2 bg-white" />}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={formData.background[item.id as keyof typeof formData.background]} 
                          onChange={() => handleCheckboxChange(item.id as keyof typeof formData.background)} 
                        />
                     </label>
                   ))}
                </div>
             </div>

             <div className="space-y-4">
                <Label>Portfolio Digital / Instagram</Label>
                <p className="text-xs text-stone-400 italic">Lien vers vos créations ou profil professionnel.</p>
                <Input 
                  placeholder="https://..." 
                  value={formData.portfolioLink}
                  onChange={(e) => setFormData({...formData, portfolioLink: e.target.value})}
                />
             </div>
             
             <div className="space-y-4">
                <Label>Bio Professionnelle & Philosophie</Label>
                <Textarea 
                  placeholder="Décrivez votre style culinaire, vos plats signatures et votre approche du service." 
                  value={formData.specialties}
                  onChange={(e) => setFormData({...formData, specialties: e.target.value})}
                />
             </div>
          </section>

          <div className="pt-12 flex justify-end">
             <Button type="submit" size="lg" className="w-64" disabled={isSubmitting}>
                {isSubmitting ? (
                   <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" /> Envoi en cours...
                   </span>
                ) : 'Soumettre la candidature'}
             </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ApplyChef;