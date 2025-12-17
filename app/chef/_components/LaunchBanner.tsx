'use client';

export function LaunchBanner() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3">
      <div className="text-sm text-white/90 font-medium">
        🚀 Chef Talents est actuellement en phase de lancement privé.
      </div>
      <div className="text-xs text-white/55 mt-1">
        Les missions ne sont pas encore ouvertes. Les chefs présents dès maintenant seront contactés en priorité lors de l’ouverture officielle.
      </div>
    </div>
  );
}
