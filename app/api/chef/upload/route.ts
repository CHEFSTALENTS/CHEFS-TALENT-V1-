export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireChefOr401 } from '@/lib/auth/requireChef';

const BUCKET = 'chef-uploads';

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export async function POST(req: Request) {
  try {
    const auth = await requireChefOr401(req);
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.id; // SOURCE DE VÉRITÉ — jamais issu du form

    const supabase = supabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Missing env' }, { status: 500 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const kind = String(form.get('kind') || 'portfolio'); // 'avatar' | 'portfolio'

    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });

    // garde-fous
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    const maxMb = 8;
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `Image too large (> ${maxMb}MB)` }, { status: 400 });
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${userId}/${kind}/${crypto.randomUUID()}-${safeFileName(file.name)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // ⚠️ Bucket chef-uploads PRIVÉ : on retourne une signed URL pour
    // l'affichage immédiat (preview après upload), TTL 1h.
    // On retourne aussi `publicUrl` (= URL publique reconstruite) car
    // c'est ce format qui sera persisté en DB par l'upsert profile.
    // À la lecture, le helper signChefUrl() resigne automatiquement.
    const { data: signedData, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600);

    if (signErr || !signedData?.signedUrl) {
      console.error('[chef/upload] sign error', signErr?.message);
      return NextResponse.json(
        { error: signErr?.message || 'Failed to sign URL' },
        { status: 500 },
      );
    }

    // URL publique legacy (stockage canonique en DB — non fonctionnelle
    // mais reconnue par signChefUrl pour resigner à la lecture)
    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      // `url` = signed URL pour usage immédiat (preview après upload).
      // C'est ce que le client doit afficher tout de suite.
      url: signedData.signedUrl,
      // `path` = chemin canonique dans le bucket (utilisable plus tard
      // par toute API qui veut resigner ou supprimer).
      path,
      // `publicUrl` = format de stockage DB (legacy). Le client peut
      // choisir d'envoyer celui-ci au backend pour persistance.
      publicUrl: publicData.publicUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
