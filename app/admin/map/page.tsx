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

type GroupedPoint = {
  key: string;
  lat: number;
  lng: number;
  chefs: ChefPoint[];
};

function groupChefsByCoords(items: ChefPoint[]): GroupedPoint[] {
  const groups = new Map<string, GroupedPoint>();

  for (const item of items) {
    if (
      typeof item.lat !== 'number' ||
      typeof item.lng !== 'number' ||
      Number.isNaN(item.lat) ||
      Number.isNaN(item.lng)
    ) {
      continue;
    }

    const key = `${item.lat.toFixed(6)}_${item.lng.toFixed(6)}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        lat: item.lat,
        lng: item.lng,
        chefs: [],
      });
    }

    groups.get(key)!.chefs.push(item);
  }

  return Array.from(groups.values());
}

export default function AdminMapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ChefPoint[]>([]);

  (mapboxgl as any).accessToken =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN || '';

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

  useEffect(() => {
    if (!mapDivRef.current) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [2.35, 48.86],
      zoom: 4,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function createGroupedMarkerEl(group: GroupedPoint) {
    const count = group.chefs.length;
    const firstChef = group.chefs[0];

    const el = document.createElement('div');
    el.style.width = count > 1 ? '42px' : '34px';
    el.style.height = count > 1 ? '42px' : '34px';
    el.style.borderRadius = '999px';
    el.style.border = '2px solid rgba(255,255,255,0.9)';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';
    el.style.cursor = 'pointer';
    el.style.position = 'relative';
    el.style.overflow = 'hidden';

    el.style.background = firstChef?.avatarUrl
      ? `url(${firstChef.avatarUrl}) center/cover no-repeat`
      : 'rgba(255,255,255,0.12)';

    if (count > 1) {
      const badge = document.createElement('div');
      badge.innerText = String(count);
      badge.style.position = 'absolute';
      badge.style.right = '-2px';
      badge.style.bottom = '-2px';
      badge.style.minWidth = '20px';
      badge.style.height = '20px';
      badge.style.padding = '0 5px';
      badge.style.borderRadius = '999px';
      badge.style.background = '#ffffff';
      badge.style.color = '#000000';
      badge.style.fontSize = '11px';
      badge.style.fontWeight = '700';
      badge.style.display = 'flex';
      badge.style.alignItems = 'center';
      badge.style.justifyContent = 'center';
      badge.style.border = '1px solid rgba(0,0,0,0.1)';
      el.appendChild(badge);
    }

    return el;
  }

  function buildPopupHtml(group: GroupedPoint) {
    const title =
      group.chefs.length > 1
        ? `${group.chefs.length} chefs — ${escapeHtml(group.chefs[0]?.baseCity || 'Lieu')}`
        : `${escapeHtml(group.chefs[0]?.name || 'Chef')}`;

    const rows = group.chefs
      .map((chef) => {
        const avatar = chef.avatarUrl
          ? `<img src="${escapeHtmlAttr(chef.avatarUrl)}" style="width:34px;height:34px;border-radius:999px;object-fit:cover;border:1px solid rgba(255,255,255,0.08);" />`
          : `<div style="width:34px;height:34px;border-radius:999px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.08);"></div>`;

        return `
          <a
            href="/admin/chefs/${encodeURIComponent(chef.id)}"
            style="
              display:flex;
              align-items:center;
              gap:10px;
              padding:10px 0;
              text-decoration:none;
              color:inherit;
              border-top:1px solid rgba(255,255,255,0.08);
            "
          >
            ${avatar}
            <div style="min-width:0;">
              <div style="font-size:13px;font-weight:600;line-height:1.2;color:#fff;">
                ${escapeHtml(chef.name)}
              </div>
              <div style="font-size:11px;opacity:.7;line-height:1.2;margin-top:3px;color:#cfcfcf;">
                ${escapeHtml(chef.email || '')}
              </div>
            </div>
          </a>
        `;
      })
      .join('');

    return `
      <div style="min-width:260px;max-width:320px;font-family:Inter,system-ui,sans-serif;">
        <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:#fff;">
          ${title}
        </div>
        ${
          group.chefs.length > 1
            ? `<div style="font-size:11px;opacity:.7;margin-bottom:8px;color:#cfcfcf;">Cliquez sur un profil</div>`
            : `<div style="font-size:11px;opacity:.7;margin-bottom:8px;color:#cfcfcf;">${escapeHtml(group.chefs[0]?.baseCity || '')}</div>`
        }
        <div>
          ${rows}
        </div>
      </div>
    `;
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    if (!items.length) return;

    const grouped = groupChefsByCoords(items);
    if (!grouped.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    for (const group of grouped) {
      bounds.extend([group.lng, group.lat]);

      const el = createGroupedMarkerEl(group);
      const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(buildPopupHtml(group));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([group.lng, group.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }

    if (grouped.length >= 2) {
      map.fitBounds(bounds, { padding: 70, maxZoom: 7 });
    } else {
      const c = grouped[0];
      map.flyTo({ center: [c.lng, c.lat], zoom: 7 });
    }
  }, [items]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Carte des chefs</h1>
          <p className="text-sm text-white/50 mt-1">
            {loading ? 'Chargement…' : `${items.length} chef(s) géolocalisé(s)`}
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

function escapeHtmlAttr(s: string) {
  return escapeHtml(s);
}
