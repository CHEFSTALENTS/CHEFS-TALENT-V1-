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

const SOURCE_ID = 'chefs-source';

// Couches Mapbox natives pour les clusters (gérées automatiquement
// par cluster: true sur la source GeoJSON).
const CLUSTERS_LAYER_ID = 'chefs-clusters';
const CLUSTER_COUNT_LAYER_ID = 'chefs-cluster-count';

export default function AdminMapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const sourceLoadedRef = useRef(false);
  // Map des markers HTML actuellement rendus, indexés par chef id.
  // Permet de re-synchroniser à chaque render Mapbox sans recréer
  // tous les éléments DOM (perf + animations stables).
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

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
  // Initialisation de la map (une seule fois)
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

    map.on('load', () => {
      // Source GeoJSON vide au départ — sera alimentée par setData()
      // dès que les items sont fetchés. cluster: true active le
      // clustering natif Mapbox.
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 12, // arrête de clusteriser au zoom > 12
        clusterRadius: 60, // pixels — distance max pour être groupés
      });

      // Layer 1 : les clusters (cercles bleus dégradés selon le count)
      map.addLayer({
        id: CLUSTERS_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#3b82f6', // blue-500 pour < 10
            10,
            '#2563eb', // blue-600 pour < 25
            25,
            '#1d4ed8', // blue-700 pour 25+
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18, // < 10
            10,
            24, // < 25
            25,
            32, // 25+
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.85,
        },
      });

      // Layer 2 : compteur du cluster (chiffre blanc au centre)
      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // ⚠️ On NE met PAS de layer pour les unclustered-points : on les
      // rend en HTML via les Marker custom (pour avoir les avatars).
      // Mais on place quand même un layer "fantôme" invisible pour
      // que l'event 'render' ait bien quelque chose à query.

      sourceLoadedRef.current = true;

      // Click cluster → zoom progressif
      map.on('click', CLUSTERS_LAYER_ID, (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [CLUSTERS_LAYER_ID],
        });
        const clusterId = features[0]?.properties?.cluster_id;
        if (clusterId == null) return;
        const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const geom = features[0].geometry;
          if (geom.type !== 'Point') return;
          map.easeTo({
            center: geom.coordinates as [number, number],
            zoom: zoom ?? map.getZoom() + 2,
          });
        });
      });

      // Curseur pointer sur cluster
      map.on('mouseenter', CLUSTERS_LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', CLUSTERS_LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
      });

      // Sync des markers HTML quand la source change ou que l'utilisateur
      // bouge la map → on regarde les features non-clusterisées et on
      // place / retire des Marker HTML en fonction.
      map.on('render', () => {
        if (!map.isSourceLoaded(SOURCE_ID)) return;
        syncHtmlMarkers(map);
      });
    });

    return () => {
      // Cleanup à l'unmount
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      sourceLoadedRef.current = false;
    };
  }, []);

  // ============================================================
  // Synchronise les Marker HTML custom avec les features non-clusterisées.
  // Appelé sur chaque render (donc à chaque pan/zoom).
  // ============================================================
  function syncHtmlMarkers(map: mapboxgl.Map) {
    const features = map.querySourceFeatures(SOURCE_ID);
    const newMarkers = new Map<string, mapboxgl.Marker>();

    for (const feature of features) {
      // On ignore les clusters (gérés par les layers Mapbox)
      if (feature.properties?.cluster) continue;
      if (feature.geometry?.type !== 'Point') continue;

      const props = feature.properties || {};
      const id = String(props.chefId || '');
      if (!id) continue;

      const coords = feature.geometry.coordinates as [number, number];

      // Si le marker existe déjà, on le réutilise (évite le flash)
      const existing = markersRef.current.get(id);
      if (existing) {
        newMarkers.set(id, existing);
        continue;
      }

      const el = createMarkerEl(props);

      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(
        buildPopupHtml(props),
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map);

      newMarkers.set(id, marker);
    }

    // Retirer les markers qui ne sont plus visibles (clusterisés ou hors champ)
    markersRef.current.forEach((marker, id) => {
      if (!newMarkers.has(id)) marker.remove();
    });

    markersRef.current = newMarkers;
  }

  // ============================================================
  // Mise à jour de la source GeoJSON quand items change
  // ============================================================
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateSource = () => {
      const source = map.getSource(SOURCE_ID) as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (!source) return;

      const validItems = items.filter(
        (chef) =>
          typeof chef.lat === 'number' &&
          typeof chef.lng === 'number' &&
          !Number.isNaN(chef.lat) &&
          !Number.isNaN(chef.lng),
      );

      const featureCollection = {
        type: 'FeatureCollection' as const,
        features: validItems.map((chef) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [chef.lng, chef.lat] as [number, number],
          },
          properties: {
            chefId: chef.id,
            chefName: chef.name,
            chefEmail: chef.email,
            baseCity: chef.baseCity,
            avatarUrl: chef.avatarUrl || '',
          },
        })),
      };

      source.setData(featureCollection);

      // Fit bounds sur l'ensemble des chefs
      if (validItems.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validItems.forEach((c) => bounds.extend([c.lng, c.lat]));
        map.fitBounds(bounds, { padding: 70, maxZoom: 7, duration: 800 });
      }
    };

    if (sourceLoadedRef.current) {
      updateSource();
    } else {
      // La map n'est pas encore chargée — on attend l'event 'load'
      const handler = () => updateSource();
      map.once('load', handler);
      return () => {
        map.off('load', handler);
      };
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
              : `${items.length} chef(s) géolocalisé(s)`}
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
          Source : chef_profiles + geo_cache (Mapbox geocoding) · Clustering natif
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
// HELPERS DOM (Marker HTML custom + popup)
// ============================================================

/** Crée l'élément DOM d'un marker chef (avatar rond avec bordure). */
function createMarkerEl(props: any): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '36px';
  el.style.height = '36px';
  el.style.borderRadius = '999px';
  el.style.border = '2px solid rgba(255,255,255,0.9)';
  el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';
  el.style.cursor = 'pointer';
  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.style.background = props.avatarUrl
    ? `url(${props.avatarUrl}) center/cover no-repeat, rgba(255,255,255,0.12)`
    : 'rgba(255,255,255,0.12)';
  return el;
}

function buildPopupHtml(props: any): string {
  const name = escapeHtml(props.chefName || 'Chef');
  const city = escapeHtml(props.baseCity || '');
  const email = escapeHtml(props.chefEmail || '');
  const id = encodeURIComponent(props.chefId || '');
  const avatar = props.avatarUrl
    ? `<img src="${escapeHtmlAttr(props.avatarUrl)}" style="width:48px;height:48px;border-radius:999px;object-fit:cover;border:1px solid rgba(255,255,255,0.1);" />`
    : `<div style="width:48px;height:48px;border-radius:999px;background:rgba(255,255,255,0.1);"></div>`;

  return `
    <div style="min-width:240px;font-family:Inter,system-ui,sans-serif;">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px;">
        ${avatar}
        <div style="min-width:0;">
          <div style="font-size:14px;font-weight:700;color:#fff;line-height:1.2;">${name}</div>
          ${city ? `<div style="font-size:11px;opacity:0.7;color:#cfcfcf;margin-top:3px;">${city}</div>` : ''}
        </div>
      </div>
      ${email ? `<div style="font-size:11px;opacity:0.55;color:#cfcfcf;margin-bottom:10px;word-break:break-all;">${email}</div>` : ''}
      <a href="/admin/chefs/${id}" style="display:inline-block;background:rgba(255,255,255,0.95);color:#161616;text-decoration:none;font-size:11px;font-weight:600;padding:8px 14px;border-radius:8px;letter-spacing:0.05em;">
        Voir la fiche →
      </a>
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
