import React, { useEffect, useState } from 'react';
import { api, auth } from '../../services/storage';
import { RequestEntity, ChefUser } from '../../types';
import { Marker, Label, Button, Input } from '../../components/ui';
import { Eye, ShieldCheck, Star, X, Plus } from 'lucide-react';

const Requests = () => {
  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestEntity | null>(null);
  
  // Mission Creation State
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionForm, setMissionForm] = useState({
    chefId: '',
    title: '',
    estimatedAmount: 0,
    clientPhone: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const [reqs, chfs] = await Promise.all([api.getRequests(), auth.getAllChefs()]);
    setRequests(reqs);
    setChefs(chfs.filter(c => c.status === 'active' || c.status === 'approved'));
  };

  const handleCreateMission = async () => {
    if (!selectedRequest || !missionForm.chefId) return;

    await api.createMission({
      chefId: missionForm.chefId,
      requestId: selectedRequest.id,
      title: missionForm.title || selectedRequest.missionType,
      location: selectedRequest.location,
      startDate: selectedRequest.dates.start,
      endDate: selectedRequest.dates.end,
      guestCount: selectedRequest.guestCount,
      serviceLevel: selectedRequest.serviceLevel,
      estimatedAmount: missionForm.estimatedAmount,
      clientPhone: missionForm.clientPhone || selectedRequest.contact.phone,
      status: 'offered'
    });

    await api.updateStatus(selectedRequest.id, 'assigned');
    setShowMissionModal(false);
    setSelectedRequest(null);
    refreshData();
    alert("Mission proposée au chef avec succès.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <Marker />
          <Label>Opérations</Label>
          <h1 className="text-3xl font-serif text-stone-900">Demandes Clients</h1>
        </div>
        <Button variant="outline" size="sm" onClick={refreshData}>Rafraîchir</Button>
      </div>

      <div className="bg-white border border-stone-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-xs border-b border-stone-200">
            <tr>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Client</th>
              <th className="p-4 font-medium">Lieu</th>
              <th className="p-4 font-medium">Statut</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-stone-50 transition-colors">
                <td className="p-4 text-stone-400 font-mono text-xs">
                  {new Date(req.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {req.mode === 'fast' ? (
                    <span className="inline-flex items-center gap-2 text-stone-900 font-medium">
                      <Star className="w-3 h-3 text-stone-400" /> Fast
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-bronze font-medium">
                      <ShieldCheck className="w-3 h-3" /> Concierge
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="font-medium text-stone-900">{req.contact.name}</div>
                  <div className="text-xs text-stone-400 uppercase tracking-wider">{req.userType}</div>
                </td>
                <td className="p-4 text-stone-600">{req.location}</td>
                <td className="p-4">
                   <StatusBadge status={req.status} />
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => setSelectedRequest(req)}
                    className="text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/20 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}>
           <div className="w-full max-w-xl bg-white h-full p-8 overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-8">
                 <h2 className="text-2xl font-serif text-stone-900">Détail Demande</h2>
                 <button onClick={() => setSelectedRequest(null)}><X className="w-6 h-6 text-stone-400" /></button>
              </div>
              
              <div className="space-y-8">
                 <div className="bg-stone-50 p-6 border border-stone-200 space-y-4">
                    <Label>Contact</Label>
                    <p className="text-lg font-medium">{selectedRequest.contact.name}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-stone-600">
                       <div>{selectedRequest.contact.email}</div>
                       <div>{selectedRequest.contact.phone}</div>
                       {selectedRequest.contact.company && <div className="col-span-2 text-stone-400">{selectedRequest.contact.company}</div>}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <Label>Mission</Label>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                          <span className="block text-stone-400 text-xs">Dates</span>
                          {new Date(selectedRequest.dates.start).toLocaleDateString()}
                          {selectedRequest.dates.end && ` - ${new Date(selectedRequest.dates.end).toLocaleDateString()}`}
                       </div>
                       <div>
                          <span className="block text-stone-400 text-xs">Lieu</span>
                          {selectedRequest.location}
                       </div>
                       <div>
                          <span className="block text-stone-400 text-xs">Convives</span>
                          {selectedRequest.guestCount} pers.
                       </div>
                       <div>
                          <span className="block text-stone-400 text-xs">Service</span>
                          {selectedRequest.serviceLevel}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <Label>Préférences</Label>
                    <div className="text-sm space-y-2 text-stone-600">
                       <p><strong>Cuisine:</strong> {selectedRequest.preferences.cuisine || '-'}</p>
                       <p><strong>Restrictions:</strong> {selectedRequest.preferences.allergies || '-'}</p>
                       <p><strong>Langues:</strong> {selectedRequest.preferences.languages || '-'}</p>
                       <p><strong>Budget:</strong> {selectedRequest.budgetRange || '-'}</p>
                    </div>
                 </div>

                 {selectedRequest.notes && (
                   <div className="space-y-4">
                      <Label>Notes</Label>
                      <p className="text-sm text-stone-600 bg-stone-50 p-4">{selectedRequest.notes}</p>
                   </div>
                 )}
                 
                 <div className="border-t border-stone-200 pt-8">
                    {selectedRequest.status === 'new' || selectedRequest.status === 'in_review' ? (
                      <Button onClick={() => setShowMissionModal(true)} className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Créer une offre de mission
                      </Button>
                    ) : (
                      <div className="text-center text-stone-400 text-sm italic">
                         Cette demande est déjà traitée ou assignée.
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Create Mission Modal */}
      {showMissionModal && selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/50 backdrop-blur-sm">
           <div className="bg-white p-8 max-w-md w-full shadow-2xl space-y-6">
              <h3 className="font-serif text-xl">Assigner un Chef</h3>
              
              <div className="space-y-4">
                 <div>
                    <Label>Sélectionner un chef</Label>
                    <select 
                      className="w-full h-12 border border-stone-200 px-4 bg-transparent"
                      value={missionForm.chefId}
                      onChange={e => setMissionForm({...missionForm, chefId: e.target.value})}
                    >
                      <option value="">-- Choisir --</option>
                      {chefs.map(c => (
                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.profile?.baseCity})</option>
                      ))}
                    </select>
                 </div>
                 
                 <div>
                    <Label>Titre de la mission</Label>
                    <Input 
                      placeholder={selectedRequest.missionType} 
                      value={missionForm.title} 
                      onChange={e => setMissionForm({...missionForm, title: e.target.value})} 
                    />
                 </div>

                 <div>
                    <Label>Montant Chef (€)</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={missionForm.estimatedAmount} 
                      onChange={e => setMissionForm({...missionForm, estimatedAmount: parseInt(e.target.value)})} 
                    />
                 </div>

                 <div>
                    <Label>Téléphone Client (WhatsApp)</Label>
                    <Input 
                      placeholder={selectedRequest.contact.phone || "Ex: 336..."} 
                      value={missionForm.clientPhone} 
                      onChange={e => setMissionForm({...missionForm, clientPhone: e.target.value})} 
                    />
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                 <Button variant="ghost" onClick={() => setShowMissionModal(false)}>Annuler</Button>
                 <Button onClick={handleCreateMission} disabled={!missionForm.chefId}>Envoyer l'offre</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    new: 'bg-blue-50 text-blue-600 border-blue-100',
    in_review: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    assigned: 'bg-green-50 text-green-600 border-green-100',
    closed: 'bg-stone-100 text-stone-500 border-stone-200'
  };
  return (
    <span className={`inline-block px-3 py-1 text-[10px] uppercase tracking-widest font-medium border ${styles[status] || styles.new}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default Requests;