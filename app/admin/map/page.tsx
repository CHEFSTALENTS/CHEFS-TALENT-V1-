'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useMemo, useRef, useState } from 'react';

type ChefPoint = {
  id: string;
  name: string;
  city?: string;
  country?: string;
  lat: number;
  lng: number;
  status?: string;
};

export default function AdminMapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<ChefPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const stats = useMemo(() => {
    const total = points.length;
    const byStatus: Record<string, number> = {};
    for (const p of points) {
      const k = String(p.status || 'unknown');
      byStatus[k] = (byStatus[k] || 0) + 1;
    }
    return { total, byStatus };
  }, [points]);

  // Fetch chefs points
  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/chefs/locations', { cache: 'no-store' });
      if (!r.ok) throw new Error(`GET /api/admin/chefs/locations failed: ${r.status}`);
      const json = await r.json();
      setPoints((json.items || []) as ChefPoint[]);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Erreur');
      setPoints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Init map once
  useEffect(() => {
    if (!token) {
      setError('NEXT_PUBLIC_MAPBOX_TOKEN manquant');
      return;
    }
    if (!mapDivRef.current) return;
    if (mapRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default as any;

        if (cancelled) return;

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: mapDivRef.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [8, 48], // Europe
          zoom: 3.6,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        mapRef.current = map;
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Erreur init map');
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (mapRef.current) mapRef.current.remove();
      } catch {}
      mapRef.current = null;
    };
  }, [token]);

  // Render markers when points change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;

    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default as any;
      if (cancelled) return;

      // clear old
      for (const m of markersRef.current) {
        try {
          m.remove();
        } catch {}
      }
      markersRef.current = [];

      // add new
      for (const p of points) {
        if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;

        const el = document.createElement('div');
        el.className = 'ct-marker';
        el.style.width = '10px';
        el.style.height = '10px';
        el.style.borderRadius = '999px';
        el.style.background = 'rgba(255,255,255,0.9)';
        el.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.15)';

        const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(
          `<div style="font-size:12px;line-height:1.3">
            <div style="font-weight:600;margin-bottom:4px">${escapeHtml(p.name || 'Chef')}</div>
            <div style="opacity:.8">${escapeHtml([p.city, p.country].filter(Boolean).join(', ') || '—')}</div>
            <div style="opacity:.7;margin-top:6px">status: ${escapeHtml(p.status || '—')}</div>
          </div>`
        );

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      }

      // Fit bounds (si assez de points)
      if (points.length >= 2) {
        const bounds = new mapboxgl.LngLatBounds();
        for (const p of points) {
          if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) bounds.extend([p.lng, p.lat]);
        }
        try {
          map.fitBounds(bounds, { padding: 80, maxZoom: 6, duration: 600 });
        } catch {}
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [points]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Carte des chefs</h1>
          <p className="text-sm text-white/50 mt-1">
            Source: Supabase (chef_profile + geo_cache)
          </p>
        </div>

        <button
          onClick={refresh}
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
        >
          Rafraîchir
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Chefs géolocalisés</div>
          <div className="text-3xl text-white font-semibold mt-1">{stats.total}</div>
          <div className="text-xs text-white/40 mt-2">
            {loading ? 'Chargement…' : 'OK'}
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50 mb-2">Répartition status</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byStatus).length === 0 ? (
              <span className="text-sm text-white/60">—</span>
            ) : (
              Object.entries(stats.byStatus).map(([k, v]) => (
                <span key={k} className="text-xs text-white/75 border border-white/10 bg-white/5 rounded-full px-2 py-1">
                  {k}: <b className="text-white">{v}</b>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div ref={mapDivRef} style={{ height: '70vh', width: '100%' }} />
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
