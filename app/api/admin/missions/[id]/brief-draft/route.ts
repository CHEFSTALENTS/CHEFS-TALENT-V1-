// app/api/admin/missions/[id]/brief-draft/route.ts
//
// GET /api/admin/missions/:id/brief-draft
// Génère via Claude un brief chef + message WhatsApp d'accompagnement
// à partir des données du contrat (missions.contracts_data.chef).
// Aucun envoi — c'est juste la génération.
//
// Retour : { ok: true, brief, whatsapp, missingFields }

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { generateJSON } from '@/lib/ai/claude';
import {
  CHEF_BRIEF_SYSTEM_PROMPT,
  CHEF_BRIEF_SCHEMA_HINT,
  buildChefBriefUserPrompt,
} from '@/lib/ai/chefBriefPrompts';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: mission, error } = await supabase
    .from('missions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!mission) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

  const userPrompt = buildChefBriefUserPrompt(mission);

  try {
    const result = await generateJSON<{ brief: string; whatsapp: string; missingFields: string[] }>({
      systemPrompt: CHEF_BRIEF_SYSTEM_PROMPT,
      userPrompt,
      schemaHint: CHEF_BRIEF_SCHEMA_HINT,
      maxTokens: 3000,
    });

    const data = result.data;
    if (!data || !data.brief || !data.whatsapp) {
      return NextResponse.json({ ok: false, error: 'EMPTY_GENERATION' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      brief: data.brief,
      whatsapp: data.whatsapp,
      missingFields: data.missingFields || [],
      _meta: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costEur: result.costEur,
      },
    });
  } catch (e: any) {
    console.error('[brief-draft] generation error', e?.message);
    return NextResponse.json({ ok: false, error: e?.message || 'GENERATION_FAILED' }, { status: 500 });
  }
}
