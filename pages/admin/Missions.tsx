import React, { useEffect, useState } from 'react';
import { api, auth } from '../../services/storage';
import { Mission, ChefUser, MissionStatus } from '../../types';
import { Marker, Label, Button } from '../../components/ui';
import { User, MapPin, Calendar, MoreHorizontal } from 'lucide-react';

const Missions = () => {
  const [missions, setMissions] = useState<(Mission & { chefName?: string })[]>([]);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    const [ms, chefs] = await Promise.all([api.getAllMissions(), auth.getAllChefs()]);
    
    // Enrich missions with chef names
    const enriched = ms.map(m => {
       const chef = chefs.find(c => c.id === m.chefId);
       return { ...m, chefName: chef ? `${chef.firstName} ${chef.lastName}` : 'Inconnu' };
    });
    setMissions(enriched);
  };

  const updateStatus = async (id: string, status: MissionStatus) => {
    if (window.confirm(`Passer la mission en ${status} ?`)) {
      await api.updateMissionStatus(id, status);
      refresh();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <Marker />
          <Label>Opérations</Label>
          <h1 className="text-3xl font-serif text-stone-900">Missions</h1>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>Rafraîchir</Button>
      </div>

      <div className="bg-white border border-stone-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-xs border-b border-stone-200">
            <tr>
              <th className="p-4 font-medium">Mission</th>
              <th className="p-4 font-medium">Chef</th>
              <th className="p-4 font-medium">Dates & Lieu</th>
              <th className="p-4 font-medium text-right">Montant</th>
              <th className="p-4 font-medium">Statut</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {missions.map(m => (
              <tr key={m.id} className="hover:bg-stone-50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-stone-900">{m.title}</div>
                  <div className="text-xs text-stone-400">{m.serviceLevel} • {m.guestCount} p.</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-stone-400" />
                    <span className="text-stone-700 font-medium">{m.chefName}</span>
                  </div>
                </td>
                <td className="p-4">
                   <div className="flex flex-col gap-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(m.startDate).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {m.location}</span>
                   </div>
                </td>
                <td className="p-4 text-right font-medium">
                  {m.estimatedAmount} €
                </td>
                <td className="p-4">
                  <MissionStatusBadge status={m.status} />
                </td>
                <td className="p-4 text-right">
                   <div className="flex justify-end gap-2">
                     {m.status === 'offered' && (
                       <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => updateStatus(m.id, 'cancelled')}>Annuler</Button>
                     )}
                     {m.status === 'accepted' && (
                       <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => updateStatus(m.id, 'confirmed')}>Confirmer</Button>
                     )}
                     {m.status === 'confirmed' && (
                       <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => updateStatus(m.id, 'completed')}>Clôturer</Button>
                     )}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MissionStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    offered: 'bg-blue-50 text-blue-700 border-blue-100',
    accepted: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    confirmed: 'bg-green-50 text-green-700 border-green-100',
    completed: 'bg-stone-100 text-stone-600 border-stone-200',
    declined: 'bg-red-50 text-red-600 border-red-100',
    cancelled: 'bg-stone-50 text-stone-400 border-stone-100 strike-through',
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
};

export default Missions;