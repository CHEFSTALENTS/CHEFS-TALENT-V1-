// app/admin/chefs/[id]/page.tsx
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ChefProfileClient from './ui';
import { useParams } from 'next/navigation';

const params = useParams();
const chefId = params.id;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type MissionRow = {
  id: string;
  created_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  city?: string | null;
  status?: string | null;
  amount?: number | null;
  total?: number | null;
  total_price?: number | null;
  price_total?: number | null;
};

function amountOf(m: MissionRow) {
  return Number(m.price_total ?? m.total_price ?? m.total ?? m.amount ?? 0) || 0;
}

async function getChefByProfileId(profileId: string) {
  const { data, error } = await supabase
    .from('chef_profiles')
    .select('email, profile')
    .eq('profile->>id', profileId)
    .maybeSingle();

  if (error) throw error;
  return data as null | { email: string | null; profile: any };
}

/**
 * Missions: on essaye plusieurs schémas courants.
 * Ajuste ensuite la requête quand tu me confirmes le nom exact de ta table/colonnes.
 */
async function getChefMissions(profileId: string, chefEmail?: string | null) {
  // 1) table missions (chef_id)
  {
    const { data, error } = await supabase
      .from('missions')
      .select('id,created_at,start_date,end_date,location,city,status,amount,total,total_price,price_total')
      .or(`chef_id.eq.${profileId}${chefEmail ? `,chef_email.eq.${chefEmail}` : ''}`)
      .limit(200);

    if (!error && data) return data as MissionRow[];
  }

  // 2) table proposals (chef_id)
  {
    const { data, error } = await supabase
      .from('proposals')
      .select('id,created_at,start_date,end_date,location,city,status,amount,total,total_price,price_total')
      .or(`chef_id.eq.${profileId}${chefEmail ? `,chef_email.eq.${chefEmail}` : ''}`)
      .limit(200);

    if (!error && data) return data as MissionRow[];
  }

  // fallback
  return [] as MissionRow[];
}

export default async function AdminChefProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  const row = await getChefByProfileId(id);
  if (!row) return notFound();

  const profile = row.profile ?? {};
  const email = row.email ?? profile?.email ?? null;

  const missions = await getChefMissions(id, email);

  const totalRevenue = missions.reduce((acc, m) => acc + amountOf(m), 0);
  const missionCount = missions.length;
  const avgBasket = missionCount ? Math.round(totalRevenue / missionCount) : 0;

  const sorted = [...missions].sort((a, b) => {
    const da = new Date(a.created_at || a.start_date || 0).getTime() || 0;
    const db = new Date(b.created_at || b.start_date || 0).getTime() || 0;
    return db - da;
  });

  const lastMission = sorted[0] ?? null;

  return (
    <ChefProfileClient
      chefId={id}
      chefEmail={email}
      profile={profile}
      missions={sorted}
      kpis={{
        missionCount,
        totalRevenue,
        avgBasket,
        lastMission,
      }}
    />
  );
}
