'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { adminFetchRaw } from '@/lib/adminFetch';

type ChefPoint = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  baseCity: string;
  lat: number;
  lng: number;
};

type CityGroup = {
  key: string;
  lat: number;
  lng: number;
  city: string;
  chefs: ChefPoint[];
};

/**
 * Groupe les chefs par coordonnées EXACTES (= même ville après
 * canonicalisation côté API). La PR #37 fait converger toutes les
 * variantes (« Saint Tropez », « SAINT TROPEZ », « St Tropez ») vers
 * les mêmes coords, donc ce groupement produit 1 marker par ville
 * avec un badge contenant le count exact.
 */
function groupByExactCoords(items: ChefPoint[]): CityGroup[] {
  const map = new Map<string, CityGroup>();

  for (const item of items) {
    if (
      typeof item.lat !== 'number' ||
      typeof item.lng !== 'number' ||
      Number.isNaN(item.lat) ||
      Number.isNaN(item.lng)
    ) {
      continue;
    }

    // Arrondi à 5 décimales pour éviter les flottants quasi-égaux
    const key = `${item.lat.toFixed(5)}_${item.lng.toFixed(5)}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        lat: item.lat,
        lng: item.lng,
        city: item.baseCity || '',
        chefs: [],
      });
    }

    map.get(key)!.chefs.push(item);
  }

  // Tri des chefs par nom dans chaque groupe pour un affichage prévisible
  for (const g of map.values()) {
    g.chefs.sort((a, b) => a.name.localeCompare(b.name));
  }

  return Array.from(map.values());
}

export default function AdminMapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ChefPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  (mapboxgl as any).accessToken =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN ||
    '';

  // ============================================================
  // Fetch des chefs
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const r = await adminFetchRaw('/api/admin/chefs/map');
        const json = await r.json();
        if (cancelled) return;
        if (!r.ok) throw new Error(json?.error || `HTTP ${r.status}`);
        setItems(Array.isArray(json.items) ? json.items : []);
      } catch (e: any) {
        console.error('[admin/map] fetch error', e);
        if (!cancelled) {
          setError(e?.message || 'Erreur chargement');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // Initialisation map
  // ============================================================
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
      // Cleanup markers + map
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ============================================================
  // Render markers : 1 marker par ville (groupé par coords exacts)
  // Click → popup avec la liste de TOUS les chefs de la ville (scroll
  // si beaucoup, plus de limite à 5 comme avec Mapbox cluster).
  // ============================================================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Reset markers existants
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const groups = groupByExactCoords(items);
    if (!groups.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    for (const group of groups) {
      bounds.extend([group.lng, group.lat]);

      const popup = new mapboxgl.Popup({
        offset: 18,
        maxWidth: '360px',
      }).setHTML(buildPopupHtml(group));

      const marker = new mapboxgl.Marker({
        element: createMarkerEl(group),
      })
        .setLngLat([group.lng, group.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }

    // Fit bounds
    if (groups.length >= 2) {
      map.fitBounds(bounds, {
        padding: 70,
        maxZoom: 7,
        duration: 800,
      });
    } else {
      map.flyTo({ center: [groups[0].lng, groups[0].lat], zoom: 7 });
    }
  }, [items]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Carte des chefs</h1>
          <p className="text-sm text-white/50 mt-1">
            {loading
              ? 'Chargement…'
              : `${items.length} chef(s) géolocalisé(s) · ${groupByExactCoords(items).length} ville(s)`}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div ref={mapDivRef} style={{ height: 600, width: '100%' }} />
      </div>

      <div className="flex items-center justify-between text-xs text-white/40">
        <span>
          Source : chef_profiles + geo_cache (Mapbox geocoding) · 1 point par ville
        </span>
        <a
          href="/admin/map-debug"
          className="text-white/60 hover:text-white underline"
        >
          Diagnostic →
        </a>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS DOM
// ============================================================

/** Élément DOM du marker : avatar du 1er chef + badge count si > 1 */
function createMarkerEl(group: CityGroup): HTMLDivElement {
  const firstChef = group.chefs[0];
  const count = group.chefs.length;

  const el = document.createElement('div');
  el.style.width = '40px';
  el.style.height = '40px';
  el.style.borderRadius = '999px';
  el.style.border = '2px solid rgba(255,255,255,0.95)';
  el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
  el.style.cursor = 'pointer';
  el.style.position = 'relative';
  el.style.overflow = 'visible';

  // Conteneur de l'avatar (overflow hidden pour le rond)
  const inner = document.createElement('div');
  inner.style.position = 'absolute';
  inner.style.inset = '0';
  inner.style.borderRadius = '999px';
  inner.style.overflow = 'hidden';
  inner.style.background = firstChef?.avatarUrl
    ? `url(${firstChef.avatarUrl}) center/cover no-repeat, rgba(255,255,255,0.12)`
    : 'rgba(255,255,255,0.12)';
  el.appendChild(inner);

  if (count > 1) {
    const badge = document.createElement('div');
    badge.innerText = String(count);
    badge.style.position = 'absolute';
    badge.style.right = '-6px';
    badge.style.top = '-6px';
    badge.style.minWidth = '22px';
    badge.style.height = '22px';
    badge.style.padding = '0 6px';
    badge.style.borderRadius = '999px';
    badge.style.background = '#3b82f6'; // blue-500
    badge.style.color = '#ffffff';
    badge.style.fontSize = '11px';
    badge.style.fontWeight = '700';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.border = '2px solid #ffffff';
    badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    badge.style.lineHeight = '1';
    el.appendChild(badge);
  }

  return el;
}

/**
 * Popup contenant la liste de TOUS les chefs de la ville. Pas de
 * limitation à 5 — affichage scrollable au-delà. Ça résout le bug
 * « plus de 5 chefs → aucun ne s'affiche » du clustering Mapbox.
 */
function buildPopupHtml(group: CityGroup): string {
  const count = group.chefs.length;
  const cityLabel = group.city
    ? escapeHtml(group.city)
    : 'Ville non précisée';

  const chefRows = group.chefs
    .map((chef) => {
      const safeId = encodeURIComponent(chef.id);
      const avatar = chef.avatarUrl
        ? `<img src="${escapeHtmlAttr(chef.avatarUrl)}" alt="" style="width:36px;height:36px;border-radius:999px;object-fit:cover;border:1px solid rgba(255,255,255,0.1);flex:none;" />`
        : `<div style="width:36px;height:36px;border-radius:999px;background:rgba(255,255,255,0.1);flex:none;"></div>`;

      return `
        <a
          href="/admin/chefs/${safeId}"
          target="_blank"
          rel="noopener noreferrer"
          style="
            display:flex;
            align-items:center;
            gap:10px;
            padding:8px 4px;
            text-decoration:none;
            color:inherit;
            border-top:1px solid rgba(255,255,255,0.08);
            transition:background .15s;
          "
          onmouseover="this.style.background='rgba(255,255,255,0.05)'"
          onmouseout="this.style.background='transparent'"
        >
          ${avatar}
          <div style="min-width:0;flex:1;">
            <div style="font-size:13px;font-weight:600;color:#fff;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHtml(chef.name)}
            </div>
            ${
              chef.email
                ? `<div style="font-size:10px;opacity:0.55;color:#cfcfcf;line-height:1.2;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(chef.email)}</div>`
                : ''
            }
          </div>
          <span style="font-size:11px;opacity:0.5;flex:none;color:#cfcfcf;">→</span>
        </a>
      `;
    })
    .join('');

  return `
    <div style="font-family:Inter,system-ui,sans-serif;width:320px;">
      <div style="padding:4px 4px 10px;">
        <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#8a7f73;font-weight:600;margin-bottom:2px;">
          ${count} chef${count > 1 ? 's' : ''} dans cette ville
        </div>
        <div style="font-size:15px;font-weight:700;color:#fff;line-height:1.2;">
          ${cityLabel}
        </div>
      </div>
      <div style="max-height:320px;overflow-y:auto;padding-right:4px;">
        ${chefRows}
      </div>
    </div>
  `;
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
