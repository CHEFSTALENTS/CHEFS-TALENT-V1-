'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2, Upload } from 'lucide-react';
import { ChefProfileType, ChefSeniority } from '../../../types';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import { format } from '@/lib/chef-i18n';

export default function ChefProfilePage() {
  const router = useRouter();
  const { t } = useChefLocale();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement | null>(null);

  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    photoUrl: '',
    profileType: 'private' as ChefProfileType,
    seniorityLevel: 'confirmed' as ChefSeniority,
  });

useEffect(() => {
  let alive = true;

  (async () => {
    const { data } = await supabase.auth.getSession();
    if (!alive) return;

    const sbUser = data.session?.user ?? null;
    if (!sbUser) return;

    setData((d) => ({
      ...d,
      firstName: (sbUser.user_metadata as any)?.firstName ?? d.firstName,
      lastName: (sbUser.user_metadata as any)?.lastName ?? d.lastName,
      email: sbUser.email ?? d.email,
    }));

    try {
      const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
      const json = await res.json();
      const p = json?.profile ?? {};
      if (!alive) return;

      setData((d) => ({
        ...d,
        phone: p.phone ?? d.phone,
        photoUrl: p.avatarUrl ?? p.photoUrl ?? d.photoUrl,
        profileType: p.profileType ?? d.profileType,
        seniorityLevel: p.seniorityLevel ?? d.seniorityLevel,
      }));
    } catch {}
  })();

  return () => {
    alive = false;
  };
}, []);

async function saveChefProfilePatch(patch: any) {
  const { data } = await supabase.auth.getSession();
  const sbUser = data.session?.user ?? null;
  if (!sbUser?.id) throw new Error('No user');

  const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
  const json = await resGet.json();
  const current = json?.profile ?? {};

  const merged = {
    ...current,
    ...patch,
    id: sbUser.id,
    email: sbUser.email ?? '',
    updatedAt: new Date().toISOString(),
  };

  const resPut = await fetch('/api/chef/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sbUser.id, profile: merged }),
  });

  if (!resPut.ok) throw new Error(await resPut.text());

  return merged;
}

  async function uploadAvatar(file: File, userId: string) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', userId);
    fd.append('kind', 'avatar');

    const res = await fetch('/api/chef/upload', { method: 'POST', body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || 'Upload failed');
    if (!json?.url) throw new Error('Upload ok mais url manquante');
    return json.url as string;
  }

  const pickAvatar = () => avatarRef.current?.click();

 const onAvatarFile = async (files: FileList | null) => {
  const { data } = await supabase.auth.getSession();
  const sbUser = data.session?.user ?? null;
  if (!sbUser?.id) return;

  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file.type.startsWith('image/')) {
    alert(t.identity.alertSelectImage);
    return;
  }

  const maxMb = 6;
  if (file.size > maxMb * 1024 * 1024) {
    alert(format(t.identity.alertImageTooLarge, { max: maxMb }));
    return;
  }

  setUploadingAvatar(true);
  try {
    const url = await uploadAvatar(file, sbUser.id);

    setData((d) => ({ ...d, photoUrl: url }));

    await saveChefProfilePatch({ avatarUrl: url, photoUrl: url });

    if (avatarRef.current) avatarRef.current.value = '';
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  } catch (e: any) {
    console.warn('[identity] avatar upload failed', e?.message || e);
    alert(e?.message || t.identity.uploadError);
  } finally {
    setUploadingAvatar(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const { data: sess } = await supabase.auth.getSession();
    const sbUser = sess.session?.user ?? null;
    if (!sbUser?.id) {
      router.replace('/chef/login');
      return;
    }

    const fullName = `${data.firstName} ${data.lastName}`.trim();

    await saveChefProfilePatch({
      id: sbUser.id,
      email: sbUser.email,
      name: fullName || undefined,
      phone: data.phone,
      photoUrl: data.photoUrl || undefined,
      avatarUrl: data.photoUrl || undefined,
      profileType: data.profileType,
      seniorityLevel: data.seniorityLevel,
    });

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  } catch (err: any) {
    console.warn('[identity] save failed', err?.message || err);
    alert(err?.message || t.common.saveError);
  } finally {
    setLoading(false);
  }
};

  const profileTypeOptions: Array<{
    id: ChefProfileType;
    label: string;
    sub: string;
  }> = [
    { id: 'private',   label: t.identity.profileTypes.private.label,   sub: t.identity.profileTypes.private.sub },
    { id: 'residence', label: t.identity.profileTypes.residence.label, sub: t.identity.profileTypes.residence.sub },
    { id: 'yacht',     label: t.identity.profileTypes.yacht.label,     sub: t.identity.profileTypes.yacht.sub },
  ];

  const seniorityOptions: Array<{ id: ChefSeniority; label: string }> = [
    { id: 'junior',    label: t.identity.seniority.junior },
    { id: 'confirmed', label: t.identity.seniority.confirmed },
    { id: 'senior',    label: t.identity.seniority.senior },
  ];

  return (

      <div className="max-w-2xl">
        <Marker />
        <Label>{t.common.sectionLabel}</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">{t.identity.pageTitle}</h1>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
          {/* Section 1: Classification */}
          <div className="space-y-6 pb-8 border-b border-stone-100">
            <h3 className="text-lg font-serif text-stone-900">{t.identity.classificationTitle}</h3>

            <div className="space-y-4">
              <Label>{t.identity.profileTypeLabel}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profileTypeOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`p-4 border cursor-pointer transition-colors ${
                      data.profileType === opt.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="block font-medium text-stone-900 text-sm">{opt.label}</span>
                        <span className="block text-[10px] text-stone-500 uppercase tracking-wide mt-1">{opt.sub}</span>
                      </div>
                      <input
                        type="radio"
                        name="profileType"
                        className="hidden"
                        checked={data.profileType === opt.id}
                        onChange={() => setData({ ...data, profileType: opt.id })}
                      />
                      <div
                        className={`w-4 h-4 border rounded-full flex items-center justify-center ${
                          data.profileType === opt.id ? 'border-stone-900' : 'border-stone-300'
                        }`}
                      >
                        {data.profileType === opt.id && <div className="w-2 h-2 bg-stone-900 rounded-full" />}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>{t.identity.seniorityLabel}</Label>
              <div className="flex gap-4">
                {seniorityOptions.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="seniority"
                      className="hidden"
                      checked={data.seniorityLevel === opt.id}
                      onChange={() => setData({ ...data, seniorityLevel: opt.id })}
                    />
                    <div
                      className={`w-4 h-4 border flex items-center justify-center ${
                        data.seniorityLevel === opt.id ? 'border-stone-900 bg-stone-900' : 'border-stone-300'
                      }`}
                    >
                      {data.seniorityLevel === opt.id && <div className="w-1.5 h-1.5 bg-white" />}
                    </div>
                    <span className={`text-sm ${data.seniorityLevel === opt.id ? 'text-stone-900 font-medium' : 'text-stone-500'}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Personal Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-serif text-stone-900">{t.identity.personalInfoTitle}</h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t.identity.firstName}</Label>
                <Input disabled value={data.firstName} className="bg-stone-50 text-stone-500" />
              </div>
              <div className="space-y-2">
                <Label>{t.identity.lastName}</Label>
                <Input disabled value={data.lastName} className="bg-stone-50 text-stone-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.identity.emailLabel}</Label>
              <Input disabled value={data.email} className="bg-stone-50 text-stone-500" />
            </div>

            <div className="space-y-2">
              <Label>{t.identity.phoneLabel}</Label>
              <Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder={t.identity.phonePlaceholder} />
            </div>

            {/* ✅ Photo de profil : upload ONLY */}
            <div className="space-y-2">
              <Label>{t.identity.photoLabel}</Label>

              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => onAvatarFile(e.target.files)} />

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-100 border border-stone-200">
                  {data.photoUrl ? (
                    <img src={data.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">—</div>
                  )}
                </div>

                <Button type="button" onClick={pickAvatar} disabled={uploadingAvatar}>
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {data.photoUrl ? t.identity.photoChange : t.identity.photoUpload}
                </Button>

                <div className="text-xs text-stone-500">{t.identity.photoConstraints}</div>
              </div>

              <p className="text-xs text-stone-400">
                {t.identity.photoHint}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
            {success && <span className="text-sm text-green-600">{t.common.savedSuccess}</span>}
            <Button type="submit" disabled={loading} className="ml-auto w-32">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : t.common.save}
            </Button>
          </div>
        </form>
      </div>

  );
}
