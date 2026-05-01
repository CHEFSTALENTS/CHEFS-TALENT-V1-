'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { Mission } from '../../../types';
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
  FileText,
} from 'lucide-react';

type Tab = 'offered' | 'active' | 'history';

// Convertit une ligne Supabase (snake_case) vers Mission (camelCase)
function rowToMission(m: any): Mission {
  return {
    id: m.id,
    chefId: m.chef_id,
    requestId: m.request_id ?? null,
    title: m.title || `Mission — ${m.location || ''}`,
    location: m.location || '—',
    startDate: m.start_date || '',
    endDate: m.end_date || '',
    guestCount: m.guest_count || 0,
    serviceLevel: m.service_level || '',
    estimatedAmount: m.chef_amount || 0,
    status: m.status as Mission['status'],
    createdAt: m.created_at,
    clientPhone: null,
    notes: m.notes || '',
    contractUrl: m.contract_url || null,
  } as any;
}

export default function ChefMissionsPage() {
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('offered');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer le user Supabase au montage
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const id = data?.session?.user?.id ?? null;
      setUserId(id);
    });
  }, []);

  const fetchMissions = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/chef/missions?chefId=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      setMissions((json?.items ?? []).map(rowToMission));
    } catch (e) {
      console.error('[missions] fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchMissions();
  }, [userId, fetchMissions]);

  const handleAction = async (missionId: string, action: 'accepted' | 'declined') => {
    if (!userId) return;
    setActionLoading(missionId);
    try {
      await fetch('/api/chef/missions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, chefId: userId, action }),
      });
      await fetchMissions();
    } catch (e) {
      console.error('[missions] action error', e);
    } finally {
      setActionLoading(null);
    }
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <Marker />
        <Label>Operations</Label>
        <h1 className="text-3xl font-serif text-stone-900">Your Missions</h1>
      </div>

      {/* Banner */}
      <div className="bg-white border border-stone-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 flex items-center justify-center border border-stone-200 bg-stone-50">
              <Sparkles className="w-4 h-4 text-stone-700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border bg-stone-900 text-white border-stone-900">
                  Summer 2026
                </span>
                <p className="text-sm text-stone-900 font-medium">
                  Missions opening now — Ibiza, Saint-Tropez, Mykonos
                </p>
              </div>
              <p className="text-sm text-stone-500 font-light mt-1">
                Complete your profile to be matched with incoming client requests.
                The most complete profiles get placed first.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-stone-200"
              onClick={() => window.location.assign('/chef/identity')}
            >
              Complete profile
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="sm"
              className="bg-stone-900 hover:bg-stone-800"
              onClick={fetchMissions}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 flex gap-8">
        <TabButton label="Proposals" active={activeTab === 'offered'} onClick={() => setActiveTab('offered')} count={offeredCount} />
        <TabButton label="Active" active={activeTab === 'active'} onClick={() => setActiveTab('active')} count={activeCount} />
        <TabButton label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
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
  );
}

/* ── TabButton ── */
const TabButton = ({
  label, active, onClick, count,
}: {
  label: string; active: boolean; onClick: () => void; count?: number;
}) => (
  <button
    onClick={onClick}
    className={`pb-4 text-sm font-medium tracking-wide uppercase transition-colors relative ${
      active ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
    }`}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'}`}>
        {count}
      </span>
    )}
    {active && <div className="absolute bottom-0 left-0 w-full h-px bg-stone-900" />}
  </button>
);

/* ── MissionCard ── */
interface MissionCardProps {
  mission: Mission & { contractUrl?: string | null; notes?: string };
  onAction: (id: string, action: 'accepted' | 'declined') => void;
  isActionLoading: boolean;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission, onAction, isActionLoading }) => {
  const isOffer = mission.status === 'offered';
  const isConfirmed = mission.status === 'confirmed';
  const contractUrl = (mission as any).contractUrl;

  return (
    <div className={`bg-white border p-6 transition-all ${isOffer ? 'border-stone-300 shadow-sm' : 'border-stone-100'}`}>
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
        <div className="space-y-4 flex-grow">
          <div className="flex items-center gap-3">
            <MissionStatusBadge status={mission.status} />
            <span className="text-xs text-stone-400 uppercase tracking-widest">
              {mission.createdAt ? new Date(mission.createdAt).toLocaleDateString() : ''}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-serif text-stone-900 mb-1">{mission.title}</h3>
            <div className="flex items-center gap-2 text-stone-500 text-sm">
              <MapPin className="w-3 h-3" /> {mission.location}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 md:gap-8 pt-2">
            {mission.startDate && (
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Calendar className="w-4 h-4 text-stone-400" />
                <span>
                  {new Date(mission.startDate).toLocaleDateString()}
                  {mission.endDate && ` — ${new Date(mission.endDate).toLocaleDateString()}`}
                </span>
              </div>
            )}
            {mission.guestCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Users className="w-4 h-4 text-stone-400" />
                <span>{mission.guestCount} guests</span>
              </div>
            )}
            {mission.serviceLevel && (
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Clock className="w-4 h-4 text-stone-400" />
                <span>{mission.serviceLevel}</span>
              </div>
            )}
          </div>

          {(mission as any).notes && (
            <p className="text-sm text-stone-500 font-light border-l-2 border-stone-200 pl-3">
              {(mission as any).notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="md:text-right flex flex-col items-start md:items-end gap-4 min-w-[160px]">
          {mission.estimatedAmount > 0 && (
            <div>
              <span className="block text-xs uppercase tracking-widest text-stone-400">Your fee</span>
              <span className="text-xl font-medium text-stone-900">
                {Number(mission.estimatedAmount).toLocaleString('en-GB')} €
              </span>
            </div>
          )}

          {isOffer && (
            <div className="flex flex-col gap-2 w-full">
              <Button
                size="sm"
                onClick={() => onAction(mission.id, 'accepted')}
                disabled={isActionLoading}
                className="w-full bg-stone-900 hover:bg-stone-800"
              >
                {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-2" /> Accept</>}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(mission.id, 'declined')}
                disabled={isActionLoading}
                className="w-full"
              >
                <X className="w-3 h-3 mr-2" /> Decline
              </Button>
            </div>
          )}

          {contractUrl && (
            <a
              href={contractUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 border border-stone-200 px-3 py-2 rounded-lg transition w-full justify-center"
            >
              <FileText className="w-4 h-4" /> View contract
            </a>
          )}

          {isConfirmed && (mission as any).clientPhone && (
            <Button
              size="sm"
              className="w-full bg-[#25D366] hover:bg-[#128C7E] border-none text-white"
              onClick={() => {
                const cleanPhone = (mission as any).clientPhone?.replace(/[^0-9]/g, '');
                const message = `Hello, I'm your private chef via Chefs Talents for the mission on ${new Date(mission.startDate).toLocaleDateString()} in ${mission.location}. Please let me know if you have any questions.`;
                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Contact Client
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── MissionStatusBadge ── */
const MissionStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    offered: 'bg-blue-50 text-blue-700 border-blue-100',
    accepted: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    confirmed: 'bg-green-50 text-green-700 border-green-100',
    completed: 'bg-stone-100 text-stone-600 border-stone-200',
    declined: 'bg-red-50 text-red-600 border-red-100',
    cancelled: 'bg-stone-50 text-stone-400 border-stone-100',
  };
  const labels: Record<string, string> = {
    offered: 'Proposal',
    accepted: 'Accepted',
    confirmed: 'Confirmed',
    completed: 'Completed',
    declined: 'Declined',
    cancelled: 'Cancelled',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  );
};

/* ── EmptyState ── */
const EmptyState = ({ tab }: { tab: Tab }) => {
  const messages = {
    offered: 'No mission proposals yet.',
    active: 'No active or upcoming missions.',
    history: 'No history yet.',
  };
  return (
    <div className="py-16 text-center border border-dashed border-stone-200 bg-stone-50/50">
      <Briefcase className="w-8 h-8 text-stone-300 mx-auto mb-4" />
      <p className="text-stone-500 font-light">{messages[tab]}</p>
    </div>
  );
};
