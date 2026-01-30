'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ChefPoint = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  baseCity: string;
  lat: number;
  lng: number;
};

export default function AdminMapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ChefPoint[]>([]);

  // ✅ token public côté client
  (mapboxgl as any).accessToken =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN || '';

  // fetch points
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const r = await fetch('/api/admin/chefs/map', { cache: 'no-store' });
        const json = await r.json();
        if (cancelled) return;

        setItems(Array.isArray(json.items) ? json.items : []);
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function openChef(chefId: string) {
    // ✅ si tu as une page détail:
    window.location.href = `/admin/chefs/${encodeURIComponent(chefId)}`;

    // 🔁 fallback si pas de page détail:
    // window.location.href = `/admin/chefs?chefId=${encodeURIComponent(chefId)}`;
  }

  function createChefMarkerEl(chef: ChefPoint) {
    const el = document.createElement('div');
    el.style.width = '34px';
    el.style.height = '34px';
    el.style.borderRadius = '999px';
    el.style.border = '2px solid rgba(255,255,255,0.85)';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';
    el.style.cursor = 'pointer';

    el.style.background = chef.avatarUrl
      ? `url(${chef.avatarUrl}) center/cover no-repeat`
      : 'rgba(255,255,255,0.12)';

    // ✅ clic => ouvrir fiche
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openChef(chef.id);
    });

    return el;
  }

  // render markers when items change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // cleanup previous markers
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    if (!items.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    for (const chef of items) {
      if (
        typeof chef.lat !== 'number' ||
        typeof chef.lng !== 'number' ||
        Number.isNaN(chef.lat) ||
        Number.isNaN(chef.lng)
      ) {
        continue;
      }

      bounds.extend([chef.lng, chef.lat]);

      const el = createChefMarkerEl(chef);

      // ✅ popup optionnel (tu peux enlever si tu veux “full click”)
      const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(`
        <div style="min-width:220px; font-size:12px">
          <div style="font-weight:600; margin-bottom:4px">${escapeHtml(chef.name)}</div>
          <div style="opacity:.75">${escapeHtml(chef.baseCity)}</div>
          ${chef.email ? `<div style="opacity:.6;margin-top:6px">${escapeHtml(chef.email)}</div>` : ''}
          <div style="margin-top:10px; opacity:.85; text-decoration:underline">
            Ouvrir fiche →
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([chef.lng, chef.lat])
        .setPopup(popup)
        .addTo(map);

      // ✅ aussi possible: ouvrir la fiche si on clique la popup
      marker.getElement().addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openChef(chef.id);
      });

      markersRef.current.push(marker);
    }

    // fit bounds
    if (items.length >= 2) {
      map.fitBounds(bounds, { padding: 70, maxZoom: 7 });
    } else {
      const c = items[0];
      map.flyTo({ center: [c.lng, c.lat], zoom: 7 });
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

      <div className="text-xs text-white/40">Source: chef_profiles + geo_cache (Mapbox geocoding)</div>
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
