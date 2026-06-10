'use client';

// QuoteDocumentsPanel — Onglet "Documents" libre par devis
//
// Upload (drag-drop ou input), liste, suppression. Catégorie au choix :
//  - signed     : devis signé en retour
//  - external   : devis externe d'origine
//  - exchange   : échange / email client
//  - brief      : brief sur-mesure
//  - contract   : contrat lié
//  - other      : divers

import { useCallback, useEffect, useRef, useState } from 'react';
import { File as FileIcon, FileText, Image as ImageIcon, Loader2, Trash2, Upload, X } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';

type QuoteDocument = {
  id: string;
  quote_id: string;
  kind: 'signed' | 'external' | 'exchange' | 'brief' | 'contract' | 'other';
  file_name: string;
  file_path: string;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  uploaded_by_admin_email: string | null;
  created_at: string;
};

const KIND_LABEL: Record<QuoteDocument['kind'], string> = {
  signed: 'Devis signé',
  external: 'Devis externe',
  exchange: 'Échange client',
  brief: 'Brief sur-mesure',
  contract: 'Contrat',
  other: 'Autre',
};

const KIND_CLS: Record<QuoteDocument['kind'], string> = {
  signed: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
  external: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
  exchange: 'bg-sky-400/15 text-sky-200 border-sky-400/25',
  brief: 'bg-indigo-400/15 text-indigo-200 border-indigo-400/25',
  contract: 'bg-violet-400/15 text-violet-200 border-violet-400/25',
  other: 'bg-white/10 text-white/70 border-white/15',
};

function fmtSize(n: number | null): string {
  if (!n || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function pickIcon(doc: QuoteDocument) {
  if (doc.mime_type?.startsWith('image/')) return ImageIcon;
  if (doc.mime_type === 'application/pdf') return FileText;
  return FileIcon;
}

export default function QuoteDocumentsPanel({ quoteId }: { quoteId: string }) {
  const [docs, setDocs] = useState<QuoteDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadKind, setUploadKind] = useState<QuoteDocument['kind']>('exchange');
  const [uploadDescription, setUploadDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const json = await adminFetch<{ ok: boolean; documents: QuoteDocument[] }>(
        `/api/admin/quotes/${quoteId}/documents`,
      );
      setDocs(json.documents || []);
    } catch (e: any) {
      console.error('[QuoteDocumentsPanel] fetch', e);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', uploadKind);
      if (uploadDescription.trim()) form.append('description', uploadDescription.trim());

      const r = await adminFetchRaw(`/api/admin/quotes/${quoteId}/documents`, {
        method: 'POST',
        body: form,
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setDocs((prev) => [json.document, ...prev]);
      setUploadDescription('');
    } catch (e: any) {
      setError(e?.message || 'Upload échoué');
    } finally {
      setUploading(false);
    }
  }, [quoteId, uploadKind, uploadDescription]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await adminFetch(`/api/admin/quotes/${quoteId}/documents/${id}`, {
        method: 'DELETE',
      });
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      alert(`Suppression impossible : ${e?.message || 'erreur'}`);
    }
  }, [quoteId]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  return (
    <div className="space-y-3">
      {/* Zone de drop / upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-4 transition ${
          dragOver
            ? 'border-sky-400/60 bg-sky-400/5'
            : 'border-white/15 bg-white/[0.02]'
        }`}
      >
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <select
            value={uploadKind}
            onChange={(e) => setUploadKind(e.target.value as QuoteDocument['kind'])}
            disabled={uploading}
            className="px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white"
          >
            {(Object.entries(KIND_LABEL) as Array<[QuoteDocument['kind'], string]>).map(([k, v]) => (
              <option key={k} value={k} className="bg-neutral-900">{v}</option>
            ))}
          </select>
          <input
            value={uploadDescription}
            onChange={(e) => setUploadDescription(e.target.value)}
            disabled={uploading}
            placeholder="Note libre (optionnel)"
            className="flex-1 min-w-[180px] px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white placeholder:text-white/30"
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-sky-400 text-sky-950 text-xs font-medium hover:bg-sky-300 disabled:opacity-50"
          >
            {uploading
              ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
              : <Upload className="w-3 h-3 mr-1.5" />}
            {uploading ? 'Envoi…' : 'Choisir un fichier'}
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = ''; // reset pour pouvoir re-uploader le même
            }}
          />
        </div>
        <div className="text-xs text-white/55 text-center">
          Glisse-dépose un fichier ici, ou clique "Choisir un fichier". Max 20 MB.
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-0.5 hover:bg-white/10 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center py-6 text-sm text-white/45">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Chargement…
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-sm text-white/45">
          Aucun document pour ce devis.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((doc) => {
            const Icon = pickIcon(doc);
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition"
              >
                <Icon className="w-5 h-5 text-white/55 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={doc.file_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/90 hover:text-white truncate font-medium"
                      title={doc.file_name}
                    >
                      {doc.file_name}
                    </a>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${KIND_CLS[doc.kind]}`}>
                      {KIND_LABEL[doc.kind]}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/45 flex items-center gap-2 mt-0.5">
                    <span>{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    {doc.file_size && <span>· {fmtSize(doc.file_size)}</span>}
                    {doc.uploaded_by_admin_email && <span className="truncate">· {doc.uploaded_by_admin_email}</span>}
                  </div>
                  {doc.description && (
                    <div className="text-[11px] text-white/65 italic mt-1">
                      « {doc.description} »
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 rounded-lg hover:bg-red-400/15 text-white/55 hover:text-red-200 shrink-0"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
