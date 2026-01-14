import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="text-sm text-stone-500">Chargement…</div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}

