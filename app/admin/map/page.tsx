'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ChefPoint = {
  id: string;
  name: string;
  email?: string;
  baseCity: string;
  status?: string;
  lat: number;
  lng: number;
};

export default function AdminMapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ChefPoint[]>([]);

  // ⚠️ token public côté client
  (mapboxgl as any).accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const r = await fetch('/api/admin/chefs/map', { cache: 'no-store' });
        const json = await r.json();
        if (cancelled) return;

        setItems(json.items || []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // init map once
  useEffect(() => {
    if (!mapDivRef.current) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [2.35, 48.86], // Paris
      zoom: 4,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;
const el = document.createElement('div');
el.style.width = '34px';
el.style.height = '34px';
el.style.borderRadius = '999px';
el.style.border = '2px solid rgba(255,255,255,0.8)';
el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';
el.style.background = p.avatarUrl
  ? `url(${p.avatarUrl}) center/cover no-repeat`
  : 'rgba(255,255,255,0.12)';

new mapboxgl.Marker({ element: el })
  .setLngLat([p.lng, p.lat])
  .setPopup(
    new mapboxgl.Popup({ offset: 12 }).setHTML(`
      <div style="font-size:12px">
        <div style="font-weight:600">${escapeHtml(p.name)}</div>
        <div style="opacity:.75">${escapeHtml(p.baseCity)}</div>
        ${p.email ? `<div style="opacity:.6;margin-top:4px">${escapeHtml(p.email)}</div>` : ''}
        ${p.status ? `<div style="opacity:.6;margin-top:4px">status: ${escapeHtml(p.status)}</div>` : ''}
      </div>
    `)
  )
  .addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // render markers when items change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // cleanup previous markers
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    if (!items.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    for (const p of items) {
      bounds.extend([p.lng, p.lat]);

      const el = document.createElement('div');
      el.className = 'chef-dot';
      el.style.width = '10px';
      el.style.height = '10px';
      el.style.borderRadius = '999px';
      el.style.background = 'rgba(255,255,255,0.85)';
      el.style.boxShadow = '0 0 0 6px rgba(255,255,255,0.10)';

    const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(
  `<div style="font-size:12px">
    <div style="font-weight:600">${escapeHtml(p.name)}</div>
    <div style="opacity:.75">${escapeHtml(p.baseCity)}</div>
    ${p.email ? `<div style="opacity:.6;margin-top:4px">${escapeHtml(p.email)}</div>` : ''}
    ${p.status ? `<div style="opacity:.6;margin-top:4px">status: ${escapeHtml(p.status)}</div>` : ''}
  </div>`
);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }

    // fit bounds
    if (items.length >= 2) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 7 });
    } else {
      map.flyTo({ center: [items[0].lng, items[0].lat], zoom: 7 });
    }
  }, [items]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Carte des chefs</h1>
          <p className="text-sm text-white/50 mt-1">
            {loading ? 'Chargement…' : `${items.length} chef(s) affiché(s)`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div ref={mapDivRef} style={{ height: 600, width: '100%' }} />
      </div>

      <div className="text-xs text-white/40">
        Source: chef_profiles + geo_cache (Mapbox geocoding)
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
