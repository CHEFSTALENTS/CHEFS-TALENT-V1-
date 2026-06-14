// app/api/admin/requests/[id]/qualification-message/route.ts
//
// GET /api/admin/requests/:id/qualification-message
// Génère 2 versions (email + WhatsApp) d'un message de qualification
// à envoyer au client, basées sur le contexte de la demande, via Claude.
//
// Retour : { ok: true, email: string, whatsapp: string }

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { generateJSON } from '@/lib/ai/claude';
import {
  QUALIFY_CLIENT_SYSTEM_PROMPT,
  QUALIFY_CLIENT_SCHEMA_HINT,
  buildQualifyClientUserPrompt,
} from '@/lib/ai/qualifyClientPrompts';

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

  const { data: request, error } = await supabase
    .from('client_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!request) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

  const userPrompt = buildQualifyClientUserPrompt(request);

  try {
    const result = await generateJSON<{ email: string; whatsapp: string }>({
      systemPrompt: QUALIFY_CLIENT_SYSTEM_PROMPT,
      userPrompt,
      schemaHint: QUALIFY_CLIENT_SCHEMA_HINT,
      maxTokens: 1500,
    });

    const data = result.data;
    if (!data || !data.email || !data.whatsapp) {
      return NextResponse.json({ ok: false, error: 'EMPTY_GENERATION' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      email: data.email,
      whatsapp: data.whatsapp,
      // Tracing usage (pour suivre les coûts cumulés si besoin)
      _meta: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costEur: result.costEur,
      },
    });
  } catch (e: any) {
    console.error('[qualification-message] generation error', e?.message);
    return NextResponse.json({ ok: false, error: e?.message || 'GENERATION_FAILED' }, { status: 500 });
  }
}
