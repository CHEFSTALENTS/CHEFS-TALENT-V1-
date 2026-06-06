// app/api/admin/quotes/[id]/pdf/route.ts
//
// GET /api/admin/quotes/:id/pdf?format=html|pdf
//   ?format=html (défaut) → preview inline navigateur
//   ?format=pdf            → download direct du PDF généré côté serveur

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { renderQuote, type QuoteData, type TariffOption } from '@/lib/contracts/quoteTemplate';
import { htmlToPdf } from '@/lib/pdf/htmlToPdf';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  return `${Number(m[3])} ${months[Number(m[2]) - 1] || m[2]} ${m[1]}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'html';

  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  // Reformate la row DB en QuoteData pour le template
  const data: QuoteData = {
    reference: row.reference,
    issued_at: fmtDateLong(row.issued_at),
    intitule: row.intitule || '',
    lieu: row.lieu || '',
    dates_text: row.dates_text || '',
    convives_text: row.convives_text || '',
    rythme_text: row.rythme_text || '',
    langues_text: row.langues_text || '',
    hebergement_text: row.hebergement_text || '',
    emetteur_nom: row.emetteur_nom || '',
    emetteur_ville: row.emetteur_ville || '',
    emetteur_siret: row.emetteur_siret || '',
    emetteur_tva: row.emetteur_tva || '',
    destinataire_nom: row.destinataire_nom || '',
    destinataire_type: row.destinataire_type || '',
    destinataire_adresse: row.destinataire_adresse || undefined,
    tariff_options: Array.isArray(row.tariff_options) ? (row.tariff_options as TariffOption[]) : [],
    courses_text: row.courses_text || '',
    courses_provision_text: row.courses_provision_text || '',
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    validity_date_text: row.validity_date ? `jusqu'au ${fmtDateLong(row.validity_date)}` : undefined,
  };

  const html = renderQuote(data);

  if (format === 'pdf') {
    try {
      const pdfBuffer = await htmlToPdf(html, {
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        mediaType: 'screen',
        viewportWidth: 794,
        viewportHeight: 1123,
        waitForNetwork: true,
        waitForFonts: true,
        ignoreCssPageSize: true,
      });
      const safeRef = row.reference.replace(/[^A-Z0-9-]/gi, '_');
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Devis-${safeRef}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    } catch (e: any) {
      console.error('[quotes/pdf] generation failed', e?.message);
      return NextResponse.json({ error: 'PDF_GENERATION_FAILED', detail: e?.message }, { status: 500 });
    }
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'inline',
    },
  });
}
