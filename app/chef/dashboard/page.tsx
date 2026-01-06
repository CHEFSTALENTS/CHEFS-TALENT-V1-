'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { ChefLayout } from '../../../components/ChefLayout';

export default function ChefDashboardPage() {
  const router = useRouter();
  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!data.session) {
        router.replace('/chef/login');
        return;
      }

      setSbUser(data.session.user);
      setBooting(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (booting) {
    return (
      <ChefLayout>
        <div className="p-8">Chargement…</div>
      </ChefLayout>
    );
  }

  // ✅ À partir d’ici: tu sais que sbUser existe
  return (
    <ChefLayout>
      <div className="p-8">
        Dashboard OK — connecté : {sbUser.email}
      </div>
    </ChefLayout>
  );
}
