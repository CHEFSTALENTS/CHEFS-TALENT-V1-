'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

type PublicPoint = { city: string; lat: number; lng: number; count: number };

export default function PublicChefsMapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [items, setItems] = useState<PublicPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (mapboxgl as any).accessToken =
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN;

    if (!mapDivRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [2.35, 48.86],
      zoom: 2.2,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/public/chefs/map', { cache: 'no-store' });
        const j = await r.json();
        if (!cancelled) setItems(j.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const p of items) {
      const el = document.createElement('div');

      const size = Math.min(56, 16 + p.count * 2);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = '999px';
      el.style.border = '2px solid rgba(255,255,255,0.8)';
      el.style.background = 'rgba(255,255,255,0.14)';
      el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontSize = '12px';
      el.style.fontWeight = '700';
      el.textContent = String(p.count);

      const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(
        `<div style="font-size:12px">
          <div style="font-weight:700">${escapeHtml(p.city)}</div>
          <div style="opacity:.8">${p.count} chef(s) disponibles</div>
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [items]);

  return (
    <div className="px-6 py-10 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Réseau de chefs — couverture mondiale</h1>
        <p className="text-white/60 mt-1">
          {loading ? 'Chargement…' : `${items.length} zones affichées`} • données anonymisées
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div ref={mapDivRef} style={{ height: 620, width: '100%' }} />
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return (s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
