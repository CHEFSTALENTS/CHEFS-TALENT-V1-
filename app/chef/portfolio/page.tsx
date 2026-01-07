'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefLayout } from '../../../components/ChefLayout';
import { supabase } from '@/services/supabaseClient';
import { Label, Button, Marker, Input } from '../../../components/ui';
import { Loader2, X, Image as ImageIcon, Upload, Link as LinkIcon } from 'lucide-react';

function normalizeUrl(raw: string) {
  const v = String(raw || '').trim();
  if (!v) return '';
  // accepte "instagram.com/..." -> ajoute https
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function isProbablyUrl(v: string) {
  try {
    const u = new URL(v);
    return !!u.hostname;
  } catch {
    return false;
  }
}

export default function ChefPortfolioPage() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const fileRef = useRef<HTMLInputElement | null>(null);

  // 1) Session Supabase
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const u = data.session?.user ?? null;
      setSbUser(u);

      if (!u) {
        router.replace('/chef/login');
        return;
      }

      setBooting(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null;
      setSbUser(u);
      if (!u) router.replace('/chef/login');
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // 2) Load profile from DB (source de vérité)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!sbUser?.id) return;

      try {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
        const json = await res.json();
        const p: any = json?.profile ?? {};
        
const MIN_PORTFOLIO = 5;
const photoCount = images.filter(Boolean).length;
const isPortfolioValid = photoCount >= MIN_PORTFOLIO;
        
        const imgs = Array.isArray(p.images) ? p.images.map(String).filter(Boolean) : [];
        const ig = String(p.instagramUrl ?? p.instagram ?? p.socialInstagram ?? '').trim();
        const web = String(p.websiteUrl ?? p.website ?? p.siteUrl ?? '').trim();

        if (!cancelled) {
          setImages(imgs);
          setInstagramUrl(ig);
          setWebsiteUrl(web);
        }
      } catch (e) {
        console.warn('[portfolio] load profile failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUser?.id]);

  async function saveChefProfilePatch(patch: any) {
    if (!sbUser?.id) throw new Error('No user');

    // 1) GET existing profile
    const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
    const json = await resGet.json();
    const current = json?.profile ?? {};

    // 2) MERGE
    const merged = {
      ...current,
      ...patch,
      id: sbUser.id,
      email: sbUser.email ?? '',
      updatedAt: new Date().toISOString(),
    };

    // 3) PUT
    const resPut = await fetch('/api/chef/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sbUser.id, profile: merged }),
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
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || 'Upload failed');
    if (!json?.url) throw new Error('Upload ok mais url manquante');
    return json.url as string;
  }

  const handlePickFiles = () => fileRef.current?.click();

  const persistAll = async (next: { images?: string[]; instagramUrl?: string; websiteUrl?: string }) => {
    const patch: any = {};
    if (next.images) patch.images = next.images;

    if (typeof next.instagramUrl === 'string') {
      patch.instagramUrl = next.instagramUrl || undefined;
      // compat legacy si besoin
      patch.instagram = next.instagramUrl || undefined;
    }

    if (typeof next.websiteUrl === 'string') {
      patch.websiteUrl = next.websiteUrl || undefined;
      patch.website = next.websiteUrl || undefined;
    }

    await saveChefProfilePatch(patch);

    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!sbUser?.id) {
      router.replace('/chef/login');
      return;
    }
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const urls: string[] = [];

      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) continue;

        const maxMb = 8;
        if (f.size > maxMb * 1024 * 1024) continue;

        const url = await uploadOne(f, sbUser.id);
        if (url && !images.includes(url) && !urls.includes(url)) urls.push(url);
      }

      if (urls.length === 0) {
        alert("Aucune image n'a pu être uploadée (format/taille).");
        return;
      }

      const updated = [...images, ...urls];
      setImages(updated);
      await persistAll({ images: updated });

      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) {
      console.error('[portfolio] upload error', e);
      alert(e?.message || "Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = async (url: string) => {
    setLoading(true);
    try {
      const updated = images.filter((i) => i !== url);
      setImages(updated);
      await persistAll({ images: updated });
    } catch (e: any) {
      console.error('[portfolio] remove error', e);
      alert(e?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLinks = async () => {
    setLoading(true);
    try {
      const ig = normalizeUrl(instagramUrl);
      const web = normalizeUrl(websiteUrl);

      if (ig && !isProbablyUrl(ig)) {
        alert("Lien Instagram invalide. Exemple: https://instagram.com/tonprofil");
        return;
      }
      if (web && !isProbablyUrl(web)) {
        alert("Lien site web invalide. Exemple: https://tonsite.com");
        return;
      }

      setInstagramUrl(ig);
      setWebsiteUrl(web);

      await persistAll({ instagramUrl: ig, websiteUrl: web });
    } catch (e: any) {
      console.error('[portfolio] save links error', e);
      alert(e?.message || 'Erreur lors de la sauvegarde des liens');
    } finally {
      setLoading(false);
    }
  };

  if (booting) return <div className="p-10">Chargement…</div>;
  if (!sbUser) return null;

  return (
    <ChefLayout>
      <div className="max-w-4xl">
        <Marker />
        <Label>Visuel</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Portfolio</h1>

        <div className="bg-white p-8 border border-stone-200 space-y-8">
          {/* Message important */}
          <div className="p-5 border border-stone-200 bg-stone-50">
            <div className="text-sm font-medium text-stone-900 mb-1">📸 Important</div>
            <p className="text-sm text-stone-500 font-light">
  Ces photos servent à mettre en avant votre profil auprès des clients.
  Choisissez des plats bien dressés, bien éclairés, sans filtres excessifs.
  <b className="ml-1">Minimum 5 photos</b> pour valider votre portfolio.
</p>
          </div>

          {/* Liens */}
          <div className="space-y-4">
            <Label>Liens (optionnel)</Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Instagram
                </div>
                <Input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/tonprofil"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Site web
                </div>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://tonsite.com"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-stone-500">Facultatif — mais utile pour renforcer la crédibilité du profil.</div>
              <Button type="button" onClick={handleSaveLinks} disabled={loading} className="w-40">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer les liens'}
              </Button>
            </div>
          </div>

          {/* Upload photos */}
          <div className="space-y-2 pt-4 border-t border-stone-100">
            <Label>Ajouter des photos (upload uniquement)</Label>
<div className="text-xs text-stone-500">
  JPG/PNG/WebP • max 8MB / image • idéal : 5 à 10 photos
  <span className={`ml-2 font-medium ${isPortfolioValid ? 'text-green-700' : 'text-amber-700'}`}>
    ({photoCount}/{MIN_PORTFOLIO})
  </span>
</div>

<div className="mt-2 text-xs text-stone-500">
  {isPortfolioValid
    ? '✅ Portfolio validé (5 photos minimum).'
    : `⚠️ Ajoute encore ${Math.max(0, MIN_PORTFOLIO - photoCount)} photo(s) pour valider ton portfolio.`}
</div>
            
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

              <div className="text-xs text-stone-500">JPG/PNG/WebP • max 8MB / image • idéal : 5 à 10 photos</div>

              {success ? <div className="text-sm text-green-600 ml-auto">✅ Enregistré</div> : null}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((url, idx) => (
              <div key={`${url}-${idx}`} className="group relative aspect-square bg-stone-100 overflow-hidden border border-stone-200">
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
