'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function ChefAuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Connexion en cours…');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // 0) si session existe déjà => dashboard
        const { data: s0 } = await supabase.auth.getSession();
        if (s0.session) {
          router.replace('/chef/dashboard');
          return;
        }

        // 1) PKCE flow: ?code=...
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
