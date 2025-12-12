import React, { useEffect, useState } from 'react';
import { auth } from '../../services/storage';
import { ChefUser } from '../../types';
import { Marker, Label, Button } from '../../components/ui';
import { Crown, Eye, X } from 'lucide-react';

const Chefs = () => {
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [selectedChef, setSelectedChef] = useState<ChefUser | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    const data = await auth.getAllChefs();
    setChefs(data);
  };

  const updateStatus = async (id: string, status: ChefUser['status']) => {
    await auth.updateChefStatus(id, status);
    if (selectedChef && selectedChef.id === id) {
       setSelectedChef({ ...selectedChef, status });
    }
    refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <Marker />
          <Label>Ressources</Label>
          <h1 className="text-3xl font-serif text-stone-900">Chefs</h1>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>Rafraîchir</Button>
      </div>

      <div className="bg-white border border-stone-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-xs border-b border-stone-200">
            <tr>
              <th className="p-4 font-medium">Chef</th>
              <th className="p-4 font-medium">Profil</th>
              <th className="p-4 font-medium">Expérience</th>
              <th className="p-4 font-medium">Plan</th>
              <th className="p-4 font-medium">Statut</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {chefs.map(chef => (
              <tr key={chef.id} className="hover:bg-stone-50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-stone-900">{chef.firstName} {chef.lastName}</div>
                  <div className="text-xs text-stone-400">{chef.email}</div>
                </td>
                <td className="p-4">
                  <span className="capitalize text-stone-600">{chef.profile?.profileType || '-'}</span>
                </td>
                <td className="p-4 text-stone-600">
                  {chef.profile?.yearsExperience ? `${chef.profile.yearsExperience} ans` : '-'}
                </td>
                <td className="p-4">
                   {chef.plan === 'pro' && (
                     <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-bronze border border-bronze px-2 py-0.5 rounded-full">
                       <Crown className="w-3 h-3" /> Pro
                     </span>
                   )}
                </td>
                <td className="p-4">
                   <ChefStatusBadge status={chef.status} />
                </td>
                <td className="p-4 text-right">
                   <button onClick={() => setSelectedChef(chef)} className="text-stone-400 hover:text-stone-900">
                     <Eye className="w-5 h-5" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chef Detail Drawer */}
      {selectedChef && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/20 backdrop-blur-sm" onClick={() => setSelectedChef(null)}>
           <div className="w-full max-w-xl bg-white h-full p-8 overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-2xl font-serif text-stone-900">{selectedChef.firstName} {selectedChef.lastName}</h2>
                    <p className="text-xs text-stone-400 font-mono mt-1">{selectedChef.id}</p>
                 </div>
                 <button onClick={() => setSelectedChef(null)}><X className="w-6 h-6 text-stone-400" /></button>
              </div>

              <div className="bg-stone-50 p-6 border border-stone-200 mb-8 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                   <Label>Statut Actuel</Label>
                   <ChefStatusBadge status={selectedChef.status} />
                </div>
                <div className="flex gap-2 pt-4 border-t border-stone-100">
                   {['pending_validation', 'approved', 'active', 'paused'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(selectedChef.id, s as any)}
                        className={`flex-1 py-2 text-xs border uppercase tracking-wider ${selectedChef.status === s ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                      >
                        {s.split('_')[0]}
                      </button>
                   ))}
                </div>
              </div>

              <div className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <Label>Ville</Label>
                       <p>{selectedChef.profile?.baseCity || '-'}</p>
                    </div>
                    <div>
                       <Label>Téléphone</Label>
                       <p>{selectedChef.profile?.phone || '-'}</p>
                    </div>
                 </div>

                 <div>
                    <Label>Bio</Label>
                    <p className="text-sm text-stone-600 leading-relaxed">{selectedChef.profile?.bio || 'Non renseignée.'}</p>
                 </div>
                 
                 <div>
                    <Label>Environnements</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                       {selectedChef.profile?.environments?.map(e => (
                          <span key={e} className="bg-stone-100 text-stone-600 px-2 py-1 text-xs">{e}</span>
                       )) || '-'}
                    </div>
                 </div>
                 
                 {selectedChef.profile?.images && selectedChef.profile.images.length > 0 && (
                    <div>
                       <Label>Portfolio</Label>
                       <div className="grid grid-cols-3 gap-2 mt-2">
                          {selectedChef.profile.images.map((img, i) => (
                             <img key={i} src={img} alt="portfolio" className="aspect-square object-cover bg-stone-100" />
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const ChefStatusBadge = ({ status }: { status: string }) => {
   const styles: Record<string, string> = {
    pending_validation: 'bg-stone-100 text-stone-500',
    approved: 'bg-green-50 text-green-600',
    active: 'bg-stone-900 text-white',
    paused: 'bg-red-50 text-red-400'
  };
  return (
    <span className={`inline-block px-3 py-1 text-[10px] uppercase tracking-widest font-medium border border-transparent ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default Chefs;