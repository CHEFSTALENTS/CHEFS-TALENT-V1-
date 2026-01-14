"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // On redirige vers reset-password en conservant hash + query
    // (Supabase met souvent les tokens dans le hash #...)
    const nextUrl =
      "/chef/reset-password" +
      window.location.search +
      window.location.hash;

    router.replace(nextUrl);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-sm text-stone-500">Redirection…</div>
    </div>
  );
}
