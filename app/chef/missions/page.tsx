'use client';

import React, { useState, useEffect } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth, api } from '../../../services/storage';
import { Mission } from '../../../types';
import { Marker, Label, Button } from '../../../components/ui';
import {
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Clock,
  Check,
  X,
  Loader2,
  MessageCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

type Tab = 'offered' | 'active' | 'history';

export default function ChefMissionsPage() {
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('offered');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    const user = auth.getCurrentUser();
    if (user) {
      const data = await api.getChefMissions(user.id);
      setMissions(data);
    }
    setLoading(false);
  };

  const handleAction = async (id: string, action: 'accepted' | 'declined') => {
    setActionLoading(id);
    await api.updateMissionStatus(id, action);
    await fetchMissions();
    setActionLoading(null);
  };

  const filterMissions = (tab: Tab) => {
    switch (tab) {
      case 'offered':
        return missions.filter(m => m.status === 'offered');
      case 'active':
        return missions.filter(m => ['accepted', 'confirmed'].includes(m.status));
      case 'history':
        return missions.filter(m => ['completed', 'cancelled', 'declined'].includes(m.status));
      default:
        return [];
    }
  };

  const displayedMissions = filterMissions(activeTab);

  const offeredCount = missions.filter(m => m.status === 'offered').length;
  const activeCount = missions.filter(m => ['accepted', 'confirmed'].includes(m.status)).length;

  return (
    <ChefLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <Marker />
          <Label>Opérations</Label>
          <h1 className="text-3xl font-serif text-stone-900">Vos Missions</h1>
        </div>

        {/* Premium Launch Message */}
        <div className="bg-white border border-stone-200 shadow-sm p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 flex items-center justify-center border border-stone-200 bg-stone-50">
                <Sparkles className="w-4 h-4 text-stone-700" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border bg-stone-900 text-white border-stone-900">
                    Launch
                  </span>
                  <p className="text-sm text-stone-900 font-medium">
                    Nouvelles missions en cours d’ouverture
                  </p>
                </div>

                <p className="text-sm text-stone-500 font-light mt-1">
                  La plateforme est en phase de lancement : les missions seront ouvertes progressivement.
                  Les chefs qui s'inscrivent maintenant seront contactés en priorité dès l’ouverture.
                </p>
                
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-stone-200"
onClick={() => window.location.assign('/chef/profile')}              >
                Compléter mon profil
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                size="sm"
                className="bg-stone-900 hover:bg-stone-800"
                onClick={fetchMissions}
              >
                Rafraîchir
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-stone-200 flex gap-8">
          <TabButton
            label="Propositions"
            active={activeTab === 'offered'}
            onClick={() => setActiveTab('offered')}
            count={offeredCount}
          />
          <TabButton
            label="En cours"
            active={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
            count={activeCount}
          />
          <TabButton
            label="Historique"
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
          </div>
        ) : (
          <div className="grid gap-6">
            {displayedMissions.length > 0 ? (
              displayedMissions.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onAction={handleAction}
                  isActionLoading={actionLoading === mission.id}
                />
              ))
            ) : (
              <EmptyState tab={activeTab} />
            )}
          </div>
        )}
      </div>
    </ChefLayout>
  );
}

const TabButton = ({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={`pb-4 text-sm font-medium tracking-wide uppercase transition-colors relative ${
      active ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
    }`}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span
        className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
          active ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'
        }`}
      >
        {count}
      </span>
    )}
    {active && <div className="absolute bottom-0 left-0 w-full h-px bg-stone-900" />}
  </button>
);

interface MissionCardProps {
  mission: Mission;
  onAction: (id: string, action: 'accepted' | 'declined') => void;
  isActionLoading: boolean;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission, onAction, isActionLoading }) => {
  const isOffer = mission.status === 'offered';
  const isConfirmed = mission.status === 'confirmed';

  return (
    <div
      className={`bg-white border p-6 transition-all ${
        isOffer ? 'border-stone-300 shadow-sm' : 'border-stone-100'
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
        <div className="space-y-4 flex-grow">
          <div className="flex items-center gap-3">
            <MissionStatusBadge status={mission.status} />
            <span className="text-xs text-stone-400 uppercase tracking-widest">
              {new Date(mission.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-serif text-stone-900 mb-1">{mission.title}</h3>
            <div className="flex items-center gap-2 text-stone-500 text-sm">
              <MapPin className="w-3 h-3" /> {mission.location}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 md:gap-8 pt-2">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Calendar className="w-4 h-4 text-stone-400" />
              <span>
                {new Date(mission.startDate).toLocaleDateString()}
                {mission.endDate && ` — ${new Date(mission.endDate).toLocaleDateString()}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Users className="w-4 h-4 text-stone-400" />
              <span>{mission.guestCount} convives</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>{mission.serviceLevel}</span>
            </div>
          </div>
        </div>

        {/* Actions or Amount */}
        <div className="md:text-right flex flex-col items-start md:items-end gap-4 min-w-[160px]">
          <div>
            <span className="block text-xs uppercase tracking-widest text-stone-400">Montant Est.</span>
            <span className="text-xl font-medium text-stone-900">{mission.estimatedAmount} €</span>
          </div>

          {isOffer && (
            <div className="flex flex-col gap-2 w-full">
              <Button
                size="sm"
                onClick={() => onAction(mission.id, 'accepted')}
                disabled={isActionLoading}
                className="w-full bg-stone-900 hover:bg-stone-800"
              >
                {isActionLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Check className="w-3 h-3 mr-2" /> Accepter
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(mission.id, 'declined')}
                disabled={isActionLoading}
                className="w-full"
              >
                <X className="w-3 h-3 mr-2" /> Refuser
              </Button>
            </div>
          )}

          {isConfirmed && mission.clientPhone && (
            <Button
              size="sm"
              className="w-full bg-[#25D366] hover:bg-[#128C7E] border-none text-white"
              onClick={() => {
                const cleanPhone = mission.clientPhone?.replace(/[^0-9]/g, '');
                const message = `Bonjour, je suis votre chef via Chef Talents pour la mission du ${new Date(
                  mission.startDate
                ).toLocaleDateString()} à ${mission.location}. Je reste à votre disposition pour finaliser les détails.`;
                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Client
            </Button>
          )}
        </div>
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

  const labels: Record<string, string> = {
    offered: 'Proposition',
    accepted: 'Acceptée',
    confirmed: 'Confirmée',
    completed: 'Réalisée',
    declined: 'Refusée',
    cancelled: 'Annulée',
  };

  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
        styles[status] || 'bg-gray-100 text-gray-500'
      }`}
    >
      {labels[status] || status}
    </span>
  );
};

const EmptyState = ({ tab }: { tab: Tab }) => {
  const messages = {
    offered: 'Aucune proposition de mission pour le moment.',
    active: 'Aucune mission en cours ou planifiée.',
    history: 'Historique vide.',
  };

  return (
    <div className="py-16 text-center border border-dashed border-stone-200 bg-stone-50/50">
      <Briefcase className="w-8 h-8 text-stone-300 mx-auto mb-4" />
      <p className="text-stone-500 font-light">{messages[tab]}</p>
    </div>
  );
};
