// app/admin/chefs/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ChefRow = {
  email: string;
  profile: any;
  created_at?: string;
  updated_at?: string;
};

function money(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
}

function safeArr(x: any) {
  return Array.isArray(x) ? x : [];
}

export default async function AdminChefProfilePage({ params }: { params: { id: string } }) {
  const chefId = params.id;

  // ✅ 1) récupérer le chef via profile.id
  const { data: rows, error } = await supabase
    .from('chef_profiles')
    .select('email,profile,created_at,updated_at')
    .eq('profile->>id', chefId)
    .limit(1);

  if (error) {
    console.error('chef profile error', error);
  }

  const chef = (rows?.[0] as ChefRow | undefined) ?? null;
  if (!chef) return notFound();

  const p = chef.profile || {};
  const avatar = p.avatarUrl || p.photoUrl || null;

  // ✅ 2) Missions count
  // IMPORTANT : adapte le nom de table + colonne si besoin.
  // Ici, on tente "missions.chef_id" (le plus standard).
  let missionsCount = 0;
  let missionsRevenue = 0;

  try {
    const { data: missions, error: mErr } = await supabase
      .from('missions')
      .select('id, priceTotal, totalPrice, amount, total', { count: 'exact' })
      .eq('chef_id', chefId);

    if (!mErr) {
      missionsCount = missions?.length ?? 0;
      missionsRevenue =
        (missions || []).reduce((acc: number, mm: any) => {
          const v = Number(mm?.priceTotal ?? mm?.totalPrice ?? mm?.amount ?? mm?.total ?? 0) || 0;
          return acc + v;
        }, 0);
    } else {
      // si ta table/colonne ne s'appelle pas comme ça, tu verras l'erreur dans les logs
      console.warn('missions query error', mErr);
    }
  } catch (e) {
    console.warn('missions fetch failed', e);
  }

  const cuisines = safeArr(p.cuisines);
  const languages = safeArr(p.languages);
  const specialties = safeArr(p.specialties);

  const pricing = p.pricing || {};
  const residence = pricing.residence || {};
  const event = pricing.event || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={p.name || 'Chef'} className="h-full w-full object-cover" />
            ) : null}
          </div>

          <div>
            <div className="text-xs text-white/50">Profil chef</div>
            <h1 className="text-2xl font-semibold text-white">{p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Chef'}</h1>
            <div className="text-sm text-white/55 mt-1">
              {p.baseCity || p.location?.baseCity || '—'} • {chef.email}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/chefs"
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 transition"
          >
            ← Retour liste
          </Link>
          <Link
            href="/admin/map"
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 transition"
          >
            Voir sur la carte
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Missions</div>
          <div className="text-3xl font-semibold text-white mt-1">{missionsCount}</div>
          <div className="text-xs text-white/40 mt-2">réalisées avec toi</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">CA missions</div>
          <div className="text-3xl font-semibold text-white mt-1">{money(missionsRevenue)}</div>
          <div className="text-xs text-white/40 mt-2">selon la table missions</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Statut</div>
          <div className="text-2xl font-semibold text-white mt-2">{p.status || '—'}</div>
          <div className="text-xs text-white/40 mt-2">seniority: {p.seniorityLevel || '—'}</div>
        </div>
      </div>

      {/* Infos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">Informations</div>

          <div className="mt-4 space-y-2 text-sm text-white/75">
            <div><span className="text-white/45">Base city :</span> {p.baseCity || p.location?.baseCity || '—'}</div>
            <div><span className="text-white/45">Rayon :</span> {p.travelRadiusKm ?? p.location?.travelRadiusKm ?? '—'} km</div>
            <div><span className="text-white/45">International :</span> {String(p.internationalMobility ?? p.location?.internationalMobility ?? false)}</div>
            <div><span className="text-white/45">Expérience :</span> {p.yearsExperience ?? '—'} ans</div>
          </div>

          <div className="mt-5">
            <div className="text-xs text-white/50 mb-2">Bio</div>
            <div className="text-sm text-white/80 whitespace-pre-wrap">
              {p.bio || '—'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold text-white">Pricing</div>
            <div className="mt-2 text-sm text-white/75 space-y-1">
              <div><span className="text-white/45">Tier :</span> {pricing.tier || '—'}</div>
              <div><span className="text-white/45">Résidence :</span> {residence.dailyRate ? `${money(residence.dailyRate)}/jour` : '—'} (min {residence.minDays ?? '—'} jours)</div>
              <div><span className="text-white/45">Événement :</span> {event.pricePerPerson ? `${money(event.pricePerPerson)}/pers` : '—'} (min {event.minGuests ?? '—'} pers)</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-white/50 mb-2">Langues</div>
            <div className="flex flex-wrap gap-2">
              {languages.length ? languages.map((x: string) => (
                <span key={x} className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/75">{x}</span>
              )) : <span className="text-sm text-white/50">—</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div>
          <div className="text-xs text-white/50 mb-2">Cuisines</div>
          <div className="flex flex-wrap gap-2">
            {cuisines.length ? cuisines.map((x: string) => (
              <span key={x} className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/75">{x}</span>
            )) : <span className="text-sm text-white/50">—</span>}
          </div>
        </div>

        <div>
          <div className="text-xs text-white/50 mb-2">Spécialités</div>
          <div className="flex flex-wrap gap-2">
            {specialties.length ? specialties.map((x: string) => (
              <span key={x} className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/75">{x}</span>
            )) : <span className="text-sm text-white/50">—</span>}
          </div>
        </div>
      </div>

      <div className="text-xs text-white/35">
        Source: chef_profiles.profile • id: {chefId}
      </div>
    </div>
  );
}
