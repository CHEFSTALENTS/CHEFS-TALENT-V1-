import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // 1) Demandes (client_requests)
  const { count: todoCount } = await supabase
    .from('client_requests')
    .select('id', { count: 'exact', head: true })
    .in('status', ['new', 'in_review']);

  const { count: b2bNew } = await supabase
    .from('client_requests')
    .select('id', { count: 'exact', head: true })
    .eq('client_type', 'concierge')
    .eq('status', 'new');

  const { count: b2cNew } = await supabase
    .from('client_requests')
    .select('id', { count: 'exact', head: true })
    .neq('client_type', 'concierge')
    .eq('status', 'new');

  const { count: inReview } = await supabase
    .from('client_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'in_review');

  // 2) Chefs pending (table à valider → adapte)
  // Si c'est dans `profiles`:
  const { count: chefsPending } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'chef')
    .eq('status', 'pending_validation');

  return NextResponse.json({
    todo: todoCount ?? 0,
    b2bNew: b2bNew ?? 0,
    b2cNew: b2cNew ?? 0,
    inReview: inReview ?? 0,
    chefsPending: chefsPending ?? 0,
  });
}
