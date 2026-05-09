'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Button } from '../../../../../components/ui';
import {
  ArrowLeft,
  Loader2,
  Lock,
  Crown,
  Printer,
} from 'lucide-react';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import {
  getTemplate,
  getTemplateTranslation,
  type TemplateBlock,
} from '@/lib/vip-templates';
import { chefFetchRaw } from '@/lib/chefFetch';

type ChefProfile = {
  plan?: 'free' | 'pro';
  planStatus?: 'active' | 'past_due' | 'cancelled' | string;
};

export default function VipTemplatePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { locale } = useChefLocale();

  const slug = (params?.slug || '') as string;
  const tpl = getTemplate(slug);

  const [booting, setBooting] = useState(true);
  const [profile, setProfile] = useState<ChefProfile | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      const u = data.session?.user ?? null;
      if (!u) {
        router.replace('/chef/login');
        return;
      }
      try {
        const res = await chefFetchRaw(
          '/api/chef/profile',
          { cache: 'no-store' },
        );
        const json = await res.json().catch(() => null);
        if (alive) setProfile(json?.profile ?? null);
      } catch {
        /* ignore */
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  if (!tpl) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Link
          href="/chef/vip"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === 'en' ? 'Back to VIP space' : 'Retour à mon espace VIP'}
        </Link>
        <div className="border border-stone-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-serif text-stone-900 mb-3">
            {locale === 'en' ? 'Template not found' : 'Template introuvable'}
          </h1>
        </div>
      </div>
    );
  }

  if (booting) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
      </div>
    );
  }

  const isVipActive =
    profile?.plan === 'pro' && profile?.planStatus === 'active';
  const hasEngagement =
    profile?.plan === 'pro' &&
    (profile?.planStatus === 'past_due' || profile?.planStatus === 'cancelled');

  if (!isVipActive && !hasEngagement) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Link
          href="/chef/vip"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === 'en' ? 'Back to VIP space' : 'Retour à mon espace VIP'}
        </Link>
        <div className="border border-stone-200 bg-white p-8 md:p-12 text-center">
          <Lock className="w-12 h-12 text-stone-300 mx-auto mb-6" />
          <h2 className="text-2xl font-serif text-stone-900 mb-4">
            {locale === 'en'
              ? 'VIP template — locked'
              : 'Template VIP — verrouillé'}
          </h2>
          <p className="text-stone-500 max-w-xl mx-auto mb-8">
            {locale === 'en'
              ? 'This template is reserved for VIP members.'
              : 'Ce template est réservé aux membres VIP.'}
          </p>
          <Link href="/chef/upgrade">
            <Button className="bg-stone-900 hover:bg-stone-800">
              <Crown className="w-4 h-4 mr-2" />
              {locale === 'en' ? 'Discover VIP' : 'Découvrir le VIP'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { content } = getTemplateTranslation(tpl, locale);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print stylesheet — uses system fonts only, no CDN dependency. */}
      <style jsx global>{`
        .vip-template {
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            'Helvetica Neue',
            Arial,
            sans-serif;
          color: #0a0a0a;
          font-size: 10.5pt;
          line-height: 1.55;
          font-feature-settings: 'kern' 1, 'liga' 1;
        }
        .vip-template-page {
          background: #f8f6f0;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 24mm 22mm 22mm 22mm;
          box-sizing: border-box;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .vip-template-display {
          font-family: Georgia, 'Times New Roman', 'Cambria', serif;
          font-weight: 400;
          letter-spacing: -0.005em;
        }

        /* Top hairline + eyebrow */
        .vip-tpl-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-bottom: 6mm;
          margin-bottom: 8mm;
          border-bottom: 1px solid rgba(10, 10, 10, 0.18);
        }
        .vip-tpl-mark {
          font-family: Georgia, 'Times New Roman', 'Cambria', serif;
          font-size: 11pt;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        .vip-tpl-eyebrow {
          font-size: 7.5pt;
          font-weight: 600;
          letter-spacing: 0.32em;
          color: #7f1d1d;
          text-transform: uppercase;
        }

        /* Body blocks */
        .vip-tpl-title {
          font-family: Georgia, 'Times New Roman', 'Cambria', serif;
          font-size: 28pt;
          font-weight: 400;
          line-height: 1.1;
          margin: 0 0 4mm 0;
          letter-spacing: -0.02em;
        }
        .vip-tpl-subtitle {
          font-family: Georgia, 'Times New Roman', 'Cambria', serif;
          font-size: 13pt;
          font-weight: 400;
          font-style: italic;
          color: #4a4744;
          margin: 0 0 4mm 0;
        }
        .vip-tpl-section {
          font-family: Georgia, 'Times New Roman', 'Cambria', serif;
          font-size: 12.5pt;
          font-weight: 500;
          margin: 5mm 0 2.5mm 0;
          letter-spacing: -0.005em;
          page-break-after: avoid;
        }
        .vip-tpl-section-num {
          font-size: 8.5pt;
          font-weight: 600;
          color: #7f1d1d;
          letter-spacing: 0.18em;
          margin-right: 4mm;
          vertical-align: 1pt;
        }
        .vip-tpl-p {
          margin: 0 0 3mm 0;
          text-align: justify;
          hyphens: auto;
        }
        .vip-tpl-list {
          margin: 0 0 3mm 0;
          padding: 0;
          list-style: none;
        }
        .vip-tpl-list-item {
          padding-left: 8mm;
          position: relative;
          margin-bottom: 1.5mm;
        }
        .vip-tpl-list-item::before {
          position: absolute;
          left: 0;
          top: 0;
        }
        .vip-tpl-list--dash .vip-tpl-list-item::before {
          content: '—';
          color: #7f1d1d;
          font-weight: 500;
        }
        .vip-tpl-list--roman {
          counter-reset: roman;
        }
        .vip-tpl-list--roman .vip-tpl-list-item {
          padding-left: 10mm;
          counter-increment: roman;
        }
        .vip-tpl-list--roman .vip-tpl-list-item::before {
          content: counter(roman, lower-roman) '.';
          font-family: Georgia, 'Times New Roman', 'Cambria', serif;
          font-size: 10pt;
          font-style: italic;
          color: #4a4744;
          width: 8mm;
          text-align: right;
          padding-right: 2mm;
          left: -2mm;
        }
        .vip-tpl-list--plain .vip-tpl-list-item::before {
          content: '';
        }

        .vip-tpl-rule {
          border: 0;
          border-top: 1px solid rgba(10, 10, 10, 0.18);
          margin: 4mm 0;
        }

        .vip-tpl-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 3mm 0;
        }
        .vip-tpl-table td {
          padding: 1.8mm 0;
          border-bottom: 1px dashed rgba(10, 10, 10, 0.25);
          vertical-align: top;
        }
        .vip-tpl-table-label {
          font-size: 9.5pt;
          color: #4a4744;
          width: 50%;
        }
        .vip-tpl-table-value {
          font-size: 10.5pt;
          color: #0a0a0a;
          padding-left: 4mm;
        }

        .vip-tpl-fill {
          margin: 0 0 4mm 0;
        }
        .vip-tpl-fill-label {
          font-size: 8pt;
          font-weight: 600;
          letter-spacing: 0.18em;
          color: #4a4744;
          text-transform: uppercase;
          margin-bottom: 1.5mm;
          display: block;
        }
        .vip-tpl-fill-line {
          border-bottom: 1px solid rgba(10, 10, 10, 0.4);
          height: 7mm;
        }
        .vip-tpl-fill-hint {
          font-style: italic;
          font-size: 9pt;
          color: #807a73;
          padding-left: 1mm;
          line-height: 7mm;
        }

        .vip-tpl-note {
          margin: 3mm 0;
          padding: 3mm 4mm;
          background: #ede9df;
          border-left: 2px solid #7f1d1d;
          font-size: 10pt;
          line-height: 1.55;
        }

        .vip-tpl-signature-double {
          display: flex;
          gap: 12mm;
          margin: 4mm 0;
        }
        .vip-tpl-signature-double > div {
          flex: 1;
        }
        .vip-tpl-signature-label {
          font-size: 8pt;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #4a4744;
          margin-bottom: 12mm;
        }
        .vip-tpl-signature-line {
          border-top: 1px solid rgba(10, 10, 10, 0.4);
          padding-top: 1mm;
          font-size: 9pt;
          font-style: italic;
          color: #807a73;
        }

        .vip-tpl-footnote {
          font-size: 8.5pt;
          font-style: italic;
          color: #807a73;
          margin-top: 4mm;
          line-height: 1.5;
        }

        /* Toolbar (hidden on print) */
        .vip-tpl-toolbar {
          max-width: 210mm;
          margin: 0 auto 6mm;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 4mm;
        }

        @media print {
          body {
            background: #ffffff !important;
          }
          .vip-tpl-toolbar,
          .vip-tpl-no-print {
            display: none !important;
          }
          .vip-template-page {
            box-shadow: none;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 18mm 18mm 18mm 18mm;
          }
        }
      `}</style>

      <div className="vip-tpl-no-print">
        <Link
          href="/chef/vip"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === 'en' ? 'Back to VIP space' : 'Retour à mon espace VIP'}
        </Link>
      </div>

      <div className="vip-tpl-toolbar vip-tpl-no-print">
        <div className="text-sm text-stone-500">
          {locale === 'en'
            ? 'Print or save as PDF from the menu of your browser.'
            : 'Imprimer ou enregistrer en PDF depuis le menu de votre navigateur.'}
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <Printer className="w-4 h-4" />
          {locale === 'en' ? 'Print / Save as PDF' : 'Imprimer / Enregistrer en PDF'}
        </button>
      </div>

      <div className="vip-template">
        <div className="vip-template-page">
          <div className="vip-tpl-header">
            <div className="vip-tpl-mark">Chefs Talents</div>
            <div className="vip-tpl-eyebrow">{content.eyebrow}</div>
          </div>
          {content.body.map((block, i) => (
            <BlockRender key={i} block={block} />
          ))}
        </div>
      </div>
    </>
  );
}

function BlockRender({ block }: { block: TemplateBlock }) {
  switch (block.kind) {
    case 'eyebrow':
      return <div className="vip-tpl-eyebrow">{block.text}</div>;
    case 'title':
      return <h1 className="vip-tpl-title">{block.text}</h1>;
    case 'subtitle':
      return <p className="vip-tpl-subtitle">{block.text}</p>;
    case 'section':
      return (
        <h2 className="vip-tpl-section">
          {block.number && (
            <span className="vip-tpl-section-num">{block.number}</span>
          )}
          {block.text}
        </h2>
      );
    case 'p':
      return (
        <p className="vip-tpl-p">
          {block.text.split('\n').map((line, i, arr) => (
            <React.Fragment key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    case 'list': {
      const styleCls =
        block.style === 'roman'
          ? 'vip-tpl-list--roman'
          : block.style === 'plain'
            ? 'vip-tpl-list--plain'
            : 'vip-tpl-list--dash';
      return (
        <ul className={`vip-tpl-list ${styleCls}`}>
          {block.items.map((it, i) => (
            <li key={i} className="vip-tpl-list-item">
              {it}
            </li>
          ))}
        </ul>
      );
    }
    case 'rule':
      return <hr className="vip-tpl-rule" />;
    case 'spacer':
      return (
        <div style={{ height: `${block.mm ?? 4}mm` }} aria-hidden="true" />
      );
    case 'table':
      return (
        <table className="vip-tpl-table">
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i}>
                <td className="vip-tpl-table-label">{r.label}</td>
                <td className="vip-tpl-table-value">
                  {r.value || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'fillLine': {
      const rows = Math.max(1, block.rows ?? 1);
      return (
        <div className="vip-tpl-fill">
          <span className="vip-tpl-fill-label">{block.label}</span>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="vip-tpl-fill-line">
              {i === 0 && block.hint && (
                <span className="vip-tpl-fill-hint">{block.hint}</span>
              )}
            </div>
          ))}
        </div>
      );
    }
    case 'note':
      return <div className="vip-tpl-note">{block.text}</div>;
    case 'signature':
      return (
        <div className="vip-tpl-signature-double">
          <div>
            <div className="vip-tpl-signature-label">{block.partyLabel}</div>
            <div className="vip-tpl-signature-line">
              {block.partyLabel === 'Le chef' ||
              block.partyLabel === 'The chef'
                ? 'Signature, lieu et date'
                : 'Signature, lieu et date'}
            </div>
          </div>
        </div>
      );
    case 'signatureDouble':
      return (
        <div className="vip-tpl-signature-double">
          <div>
            <div className="vip-tpl-signature-label">{block.leftLabel}</div>
            <div className="vip-tpl-signature-line">
              Signature, lieu et date
            </div>
          </div>
          <div>
            <div className="vip-tpl-signature-label">{block.rightLabel}</div>
            <div className="vip-tpl-signature-line">
              Signature, lieu et date
            </div>
          </div>
        </div>
      );
    case 'footnote':
      return <p className="vip-tpl-footnote">{block.text}</p>;
    default:
      return null;
  }
}
