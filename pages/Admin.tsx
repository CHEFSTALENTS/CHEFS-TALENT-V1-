import React, { useState, useEffect } from 'react';
import { api, auth } from '../services/storage';
import { RequestEntity, RequestStatus, ChefUser, Mission, MissionStatus } from '../types';
import { Button, Input, Marker, Label } from '../components/ui';
import { Lock, Eye, X, Star, ShieldCheck, ChefHat, Crown, Plus } from 'lucide-react';

// Simple environment-like variable (In real app, use env vars)
const ADMIN_PWD = "chef"; 

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [view, setView] = useState<'requests' | 'chefs'>('requests');
  
  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestEntity | null>(null);
  const [selectedChef, setSelectedChef] = useState<ChefUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Mission Management State
  const [chefMissions, setChefMissions] = useState<Mission[]>([]);
  const [showCreateMission, setShowCreateMission] = useState(false);
  const [newMission, setNewMission] = useState({
    title: '',
    location: '',
    startDate: '',
    guestCount: 2,
    serviceLevel: 'Chef Seul',
    estimatedAmount: 0,
    clientPhone: ''
  });

  useEffect(() => {
    if (localStorage.getItem('chef_admin_session') === 'true') {
      setIsAuthenticated(true);
      refreshData();
    }
  }, []);

  useEffect(() => {
    if (selectedChef) {
      loadChefMissions(selectedChef.id);
    }
  }, [selectedChef]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PWD) {
      localStorage.setItem('chef_admin_session', 'true');
      setIsAuthenticated(true);
      refreshData();
    } else {
      alert("Accès refusé");
    }
  };

  const refreshData = async () => {
    setLoading(true);
    const reqs = await api.getRequests();
    const chfs = await auth.getAllChefs();
    setRequests(reqs);
    setChefs(chfs);
    setLoading(false);
  };

  const loadChefMissions = async (chefId: string) => {
    const missions = await api.getChefMissions(chefId);
    setChefMissions(missions);
  };

  const handleCreateMission = async () => {
    if (!selectedChef) return;
    await api.createMission({
      ...newMission,
      chefId: selectedChef.id,
      status: 'offered'
    });
    setShowCreateMission(false);
    loadChefMissions(selectedChef.id);
    setNewMission({ title: '', location: '', startDate: '', guestCount: 2, serviceLevel: 'Chef Seul', estimatedAmount: 0, clientPhone: '' });
  };

  const updateMissionStatus = async (missionId: string, status: MissionStatus) => {
    await api.updateMissionStatus(missionId, status);
    if (selectedChef) loadChefMissions(selectedChef.id);
  };

  const updateStatus = async (id: string, status: RequestStatus) => {
    await api.updateStatus(id, status);
    refreshData();
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest(prev => prev ? ({ ...prev, status }) : null);
    }
  };

  const updateChefStatus = async (id: string, status: ChefUser['status']) => {
    await auth.updateChefStatus(id, status);
    refreshData();
    if (selectedChef && selectedChef.id === id) {
      setSelectedChef(prev => prev ? ({ ...prev, status }) : null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <form onSubmit={handleLogin} className="bg-white p-12 max-w-sm w-full space-y-8 border border-stone-200">
          <div className="text-center">
            <Lock className="w-8 h-8 mx-auto text-stone-400 mb-4" strokeWidth={1} />
            <h1 className="font-serif text-2xl text-stone-900">Admin Access</h1>
          </div>
          <Input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="text-center"
            autoFocus
          />
          <Button type="submit" className="w-full">Entrer</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-stone-200 px-8 flex items-center justify-between">
        <span className="font-serif font-medium">CHEF TALENTS — BACKEND</span>
        <div className="flex gap-4">
           <Button variant="ghost" size="sm" onClick={() => setView('requests')} className={view === 'requests' ? 'bg-stone-100' : ''}>Demandes</Button>
           <Button variant="ghost" size="sm" onClick={() => setView('chefs')} className={view === 'chefs' ? 'bg-stone-100' : ''}>Chefs</Button>
           <div className="w-px h-6 bg-stone-200 my-auto mx-2" />
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              localStorage.removeItem('chef_admin_session');
              setIsAuthenticated(false);
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="p-8 max-w-[100rem] mx-auto">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-serif">
             {view === 'requests' ? `Demandes (${requests.length})` : `Chefs Inscrits (${chefs.length})`}
           </h2>
           <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
             {loading ? '...' : 'Refresh'}
           </Button>
        </div>

        {/* --- REQUESTS VIEW --- */}
        {view === 'requests' && (
          <div className="bg-white border border-stone-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-xs border-b border-stone-200">
                <tr>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Mode</th>
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
        )}

        {/* --- CHEFS VIEW --- */}
        {view === 'chefs' && (
          <div className="bg-white border border-stone-200 overflow-hidden">
             <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-xs border-b border-stone-200">
                <tr>
                  <th className="p-4 font-medium">Chef</th>
                  <th className="p-4 font-medium">Profil</th>
                  <th className="p-4 font-medium">Plan</th>
                  <th className="p-4 font-medium">Expérience</th>
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
                      {chef.profile?.profileType ? (
                         <span className="capitalize">{chef.profile.profileType}</span>
                      ) : (
                         <span className="text-stone-300">-</span>
                      )}
                    </td>
                    <td className="p-4">
                       {chef.plan === 'pro' ? (
                         <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-bronze border border-bronze px-2 py-0.5 rounded-full">
                           <Crown className="w-3 h-3" /> Pro
                         </span>
                       ) : (
                         <span className="text-xs text-stone-400 uppercase tracking-wider">Free</span>
                       )}
                    </td>
                    <td className="p-4 text-stone-600">
                      {chef.profile?.yearsExperience ? `${chef.profile.yearsExperience} ans` : '-'}
                    </td>
                    <td className="p-4">
                       <ChefStatusBadge status={chef.status} />
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedChef(chef)}
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
        )}
      </div>

      {/* Detail Modal: Chef + Missions */}
      {selectedChef && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-stone-900/20 backdrop-blur-sm" onClick={() => setSelectedChef(null)}>
           <div 
             className="h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto p-12"
             onClick={e => e.stopPropagation()}
           >
             <div className="flex justify-between items-start mb-8">
               <div>
                  <Marker />
                  <Label>Gestion Chef</Label>
                  <h2 className="text-3xl font-serif mt-4">{selectedChef.firstName} {selectedChef.lastName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-stone-500 font-mono text-xs">{selectedChef.id}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedChef(null)} className="p-2 hover:bg-stone-100 rounded-full">
                 <X className="w-6 h-6 text-stone-400" />
               </button>
             </div>

             <div className="bg-stone-50 p-6 border border-stone-200 mb-12 flex items-center justify-between">
                <div>
                   <Label>Statut Compte</Label>
                   <ChefStatusBadge status={selectedChef.status} />
                </div>
                <div className="flex gap-2">
                   {['pending_validation', 'approved', 'active', 'paused'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateChefStatus(selectedChef.id, s as ChefUser['status'])}
                        className={`px-3 py-1 text-xs border uppercase tracking-wider ${selectedChef.status === s ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                   ))}
                </div>
             </div>

             {/* Missions Management */}
             <div className="mb-12">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-serif text-xl">Missions</h3>
                 <Button size="sm" onClick={() => setShowCreateMission(true)} className="h-8 text-xs">
                   <Plus className="w-3 h-3 mr-2" /> Offre
                 </Button>
               </div>
               
               {showCreateMission && (
                  <div className="bg-stone-50 p-6 border border-stone-200 mb-6 space-y-4">
                     <h4 className="font-bold text-sm">Nouvelle Offre de Mission</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Titre (ex: Dîner privé)" value={newMission.title} onChange={e => setNewMission({...newMission, title: e.target.value})} />
                        <Input placeholder="Lieu" value={newMission.location} onChange={e => setNewMission({...newMission, location: e.target.value})} />
                        <Input type="date" value={newMission.startDate} onChange={e => setNewMission({...newMission, startDate: e.target.value})} />
                        <Input type="number" placeholder="Montant (€)" value={newMission.estimatedAmount} onChange={e => setNewMission({...newMission, estimatedAmount: parseInt(e.target.value)})} />
                        <Input className="col-span-2" placeholder="Téléphone Client (ex: 336...)" value={newMission.clientPhone} onChange={e => setNewMission({...newMission, clientPhone: e.target.value})} />
                     </div>
                     <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowCreateMission(false)}>Annuler</Button>
                        <Button size="sm" onClick={handleCreateMission}>Créer l'offre</Button>
                     </div>
                  </div>
               )}

               <div className="space-y-3">
                 {chefMissions.map(mission => (
                   <div key={mission.id} className="flex items-center justify-between p-4 border border-stone-100 bg-white">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className={`w-2 h-2 rounded-full ${mission.status === 'offered' ? 'bg-blue-500' : mission.status === 'confirmed' ? 'bg-green-500' : 'bg-stone-300'}`} />
                           <span className="font-medium text-sm">{mission.title}</span>
                           <span className="text-xs text-stone-400">({mission.estimatedAmount}€)</span>
                        </div>
                        <div className="text-xs text-stone-500 uppercase tracking-wider">{mission.status}</div>
                      </div>
                      <div className="flex gap-2">
                        {mission.status === 'accepted' && (
                           <Button size="sm" className="h-6 px-2 text-[10px]" onClick={() => updateMissionStatus(mission.id, 'confirmed')}>Confirmer</Button>
                        )}
                        {mission.status === 'confirmed' && (
                           <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => updateMissionStatus(mission.id, 'completed')}>Compléter</Button>
                        )}
                      </div>
                   </div>
                 ))}
                 {chefMissions.length === 0 && <p className="text-sm text-stone-400 italic">Aucune mission assignée.</p>}
               </div>
             </div>

             <div className="space-y-12 border-t border-stone-100 pt-8">
               <SectionBlock title="Profil">
                 <GridItem label="Type" value={selectedChef.profile?.profileType || '-'} />
                 <GridItem label="Niveau" value={selectedChef.profile?.seniorityLevel || '-'} />
                 <GridItem label="Ville" value={selectedChef.profile?.baseCity || '-'} />
               </SectionBlock>
             </div>

           </div>
        </div>
      )}

      {/* Request Modal removed for brevity in this snippet, assumes it stays same */}

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

const SectionBlock = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div>
    <h4 className="font-serif text-lg mb-6 text-stone-900 border-b border-stone-100 pb-2">{title}</h4>
    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
      {children}
    </div>
  </div>
);

const GridItem = ({ label, value }: { label: string, value: any }) => (
  <div>
    <span className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">{label}</span>
    <span className="block text-stone-800 font-medium">{value}</span>
  </div>
);

export default Admin;