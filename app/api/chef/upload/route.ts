export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const supabase = supabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Missing env' }, { status: 500 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const userId = String(form.get('userId') || '');
    const kind = String(form.get('kind') || 'portfolio'); // 'avatar' | 'portfolio'

    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

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

    // bucket public => URL directe
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: data.publicUrl, path });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
