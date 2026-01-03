'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2, Plus, X, Image as ImageIcon, Upload } from 'lucide-react';

async function saveChefProfilePatch(patch: any) {
  const user = auth.getCurrentUser?.();
  if (!user?.id) throw new Error('No user');

  // 1) GET existing profile from DB
  const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
  const json = await resGet.json();
  const current = json?.profile ?? {};

  // 2) merge
  const merged = {
    ...current,
    ...patch,
    id: user.id,
    email: user.email,
    updatedAt: new Date().toISOString(),
  };

  // 3) PUT
  const resPut = await fetch('/api/chef/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id, profile: merged }),
  });

  if (!resPut.ok) throw new Error(await resPut.text());
  return merged;
}

async function uploadOne(file: File, userId: string) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('userId', userId);
  fd.append('kind', 'portfolio');

  const res = await fetch('/api/chef/upload', { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Upload failed');
  return json.url as string;
}

function isValidUrl(u: string) {
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ChefPortfolioPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const user = auth.getCurrentUser?.();
    const imgs = Array.isArray((user as any)?.profile?.images) ? (user as any).profile.images : [];
    setImages(imgs);
  }, []);

  const canAddUrl = useMemo(() => {
    const u = newUrl.trim();
    return u.length > 0 && isValidUrl(u) && !images.includes(u);
  }, [newUrl, images]);

  const persistImages = async (imgList: string[]) => {
    const user = auth.getCurrentUser?.();
    if (!user?.id) return;

    // DB (Supabase)
    await saveChefProfilePatch({ images: imgList });

    // localStorage (ancien MVP)
    await auth.updateChefProfile?.(user.id, { images: imgList } as any);
  };

  const addImageByUrl = async () => {
    const u = newUrl.trim();
    if (!u || !isValidUrl(u) || images.includes(u)) return;

    setLoading(true);
    try {
      const updated = [...images, u];
      setImages(updated);
      setNewUrl('');
      await persistImages(updated);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = async (url: string) => {
    setLoading(true);
    try {
      const updated = images.filter((i) => i !== url);
      setImages(updated);
      await persistImages(updated);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handlePickFiles = () => fileRef.current?.click();

  const handleUploadFiles = async (files: FileList | null) => {
    const user = auth.getCurrentUser?.();
    if (!user?.id) return;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const urls: string[] = [];

      // upload séquentiel (simple + fiable)
      for (const f of Array.from(files)) {
        // garde-fous côté front (le backend re-check aussi)
        if (!f.type.startsWith('image/')) continue;
        const maxMb = 8;
        if (f.size > maxMb * 1024 * 1024) continue;

        const url = await uploadOne(f, user.id);
        if (url && !images.includes(url) && !urls.includes(url)) urls.push(url);
      }

      if (urls.length === 0) {
        alert("Aucune image n'a pu être uploadée (format/taille).");
        return;
      }

      const updated = [...images, ...urls];
      setImages(updated);
      await persistImages(updated);

      // reset input
      if (fileRef.current) fileRef.current.value = '';

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e: any) {
      alert(e?.message || "Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChefLayout>
      <div className="max-w-4xl">
        <Marker />
        <Label>Visuel</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Portfolio</h1>

        <div className="bg-white p-8 border border-stone-200 space-y-8">
          {/* Upload */}
          <div className="space-y-2">
            <Label>Ajouter des photos (recommandé)</Label>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />

            <div className="flex flex-wrap gap-3 items-center">
              <Button type="button" onClick={handlePickFiles} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload photos
              </Button>

              <div className="text-xs text-stone-500">
                JPG/PNG/WebP • max 8MB / image • idéal : 5 à 10 photos
              </div>

              {success ? <div className="text-sm text-green-600 ml-auto">✅ Enregistré</div> : null}
            </div>
          </div>

          {/* URL fallback (optionnel) */}
          <div className="flex gap-4 items-end">
            <div className="flex-grow space-y-2">
              <Label>Ajouter une image via URL (optionnel)</Label>
              <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
              <p className="text-xs text-stone-400">À garder uniquement pour les chefs qui ont déjà leurs images en ligne.</p>
            </div>
            <Button type="button" onClick={addImageByUrl} disabled={!canAddUrl || loading} className="mb-0">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Ajouter
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-stone-50 p-6 border-t border-b border-stone-100">
            <h4 className="text-sm font-medium text-stone-900 mb-2">Conseils Portfolio</h4>
            <p className="text-sm text-stone-500 font-light">
              Privilégiez des photos haute résolution, bien éclairées, mettant en valeur le dressage.
              Évitez les filtres excessifs ou les photos floues. 5 à 10 photos recommandées.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="group relative aspect-square bg-stone-100 overflow-hidden border border-stone-200"
              >
                <img src={url} alt="Portfolio" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  disabled={loading}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-stone-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {images.length === 0 && (
              <div className="col-span-full py-12 text-center text-stone-400 border border-stone-200 border-dashed">
                <ImageIcon className="w-8 h-8 mx-auto mb-4 opacity-50" />
                <p>Aucune image ajoutée.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ChefLayout>
  );
}
