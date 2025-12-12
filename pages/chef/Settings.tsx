import React, { useState, useEffect } from 'react';
import { ChefLayout } from '../../components/ChefLayout';
import { auth } from '../../services/storage';
import { Label, Button, Input, Marker, Badge } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { SubscriptionPlan } from '../../types';

const ChefSettings = () => {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState({ current: '', new: '' });
  const [showDelete, setShowDelete] = useState(false);
  
  // No active plan switching for now
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('free');

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user) {
      setCurrentPlan(user.plan);
    }
  }, []);

  const handleDelete = async () => {
    const user = auth.getCurrentUser();
    if (user) {
      await auth.deleteChefAccount(user.id);
      navigate('/');
    }
  };

  return (
    <ChefLayout>
      <div className="max-w-3xl">
        <Marker />
        <Label>Compte</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Paramètres</h1>
        
        <div className="space-y-12">
          
          {/* Subscription Section - Coming Soon */}
          <section className="bg-white border border-stone-200 p-8 md:p-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-serif">Abonnement</h3>
              <Badge variant="secondary" className="bg-stone-100 text-stone-500">À venir</Badge>
            </div>
            
            <div className="space-y-6">
              {/* Current Plan Display */}
              <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200">
                <div>
                   <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1">Plan actuel</span>
                   <span className="text-lg font-medium text-stone-900">Gratuit</span>
                </div>
                <div className="text-sm text-stone-500">Accès anticipé</div>
              </div>

              {/* Future Benefits Teaser */}
              <div className="p-6 border border-dashed border-stone-300">
                <h4 className="font-serif text-lg mb-4 text-stone-900">Fonctionnalités Pro (Bientôt disponible)</h4>
                <p className="text-sm text-stone-500 font-light mb-6">
                  Une offre d'abonnement optionnelle permettra bientôt d'accéder à des outils exclusifs pour développer votre activité.
                </p>
                <ul className="space-y-3">
                   {[
                     "Priorisation dans le matching",
                     "Outils de disponibilité avancés",
                     "Statistiques de sollicitations",
                     "Préférences de missions avancées"
                   ].map((benefit, idx) => (
                     <li key={idx} className="flex items-center gap-3 text-sm text-stone-600">
                       <div className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                       {benefit}
                     </li>
                   ))}
                </ul>
              </div>
              
              <div className="flex justify-end">
                <Button disabled variant="outline" className="opacity-50">
                   Gérer mon abonnement
                </Button>
              </div>
            </div>
          </section>

          {/* Security */}
          <div className="bg-white p-8 border border-stone-200 space-y-6">
             <h3 className="text-xl font-serif">Sécurité</h3>
             <div className="space-y-4">
                <div className="space-y-2">
                   <Label>Mot de passe actuel</Label>
                   <Input type="password" value={pwd.current} onChange={e => setPwd({...pwd, current: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <Label>Nouveau mot de passe</Label>
                   <Input type="password" value={pwd.new} onChange={e => setPwd({...pwd, new: e.target.value})} />
                </div>
                <Button variant="outline" className="mt-4" disabled>Mettre à jour (Demo)</Button>
             </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-stone-50 p-8 border border-stone-200 space-y-6">
             <h3 className="text-xl font-serif text-stone-900">Zone de danger</h3>
             
             {!showDelete ? (
                <Button variant="outline" onClick={() => setShowDelete(true)} className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700">
                   Supprimer mon compte
                </Button>
             ) : (
                <div className="space-y-4 bg-white p-6 border border-red-100">
                   <p className="text-sm text-stone-600">Êtes-vous sûr ? Cette action est irréversible.</p>
                   <div className="flex gap-4">
                      <Button onClick={handleDelete} className="bg-red-600 border-red-600 text-white hover:bg-red-700">Confirmer suppression</Button>
                      <Button variant="ghost" onClick={() => setShowDelete(false)}>Annuler</Button>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </ChefLayout>
  );
};

export default ChefSettings;