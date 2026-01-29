'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

type ChefPin = {
  id: string;
  name: string;
  city: string;
  country: string;
  status: string;
  lat: number | null;
  lng: number | null;
  query: string; // "Paris, FR"
};

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function AdminMapPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [chefs, setChefs] = useState<ChefPin[]>([]);
  const [stats, setStats] = useState({ total: 0, located: 0, missing: 0 });

  // 1) Fetch chefs
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const json = await fetch('/api/admin/chefs/locations', { cache: 'no-store' }).then(r => r.json());
        const items: ChefPin[] = json.items || [];
        setChefs(items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) Geocode missing coords (MVP)
  useEffect(() => {
    if (!chefs.length) return;

    const run = async () => {
      // on géocode max 25 par refresh (évite de spam)
      const missing = chefs.filter(c => (!c.lat || !c.lng) && c.query).slice(0, 25);
      if (missing.length === 0) return;

      const updates: Record<string, { lat: number; lng: number }> = {};

      for (const c of missing) {
        try {
          const res = await fetch('/api/admin/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: c.query }),
          }).then(r => r.json());

          if (res?.lat && res?.lng) {
            updates[c.id] = { lat: res.lat, lng: res.lng };
          }
        } catch {}
      }

      if (Object.keys(updates).length) {
        setChefs(prev =>
          prev.map(c => (updates[c.id] ? { ...c, ...updates[c.id] } : c))
        );
      }
    };

    run();
  }, [chefs.length]); // intentionnel: déclenche au premier load uniquement

  const geojson = useMemo(() => {
    const features = chefs
      .filter(c => typeof c.lat === 'number' && typeof c.lng === 'number')
      .map(c => ({
        type: 'Feature' as const,
        properties: {
          id: c.id,
          name: c.name,
          status: c.status,
          city: c.city,
          country: c.country,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [c.lng as number, c.lat as number],
        },
      }));

    return { type: 'FeatureCollection' as const, features };
  }, [chefs]);

  // stats
  useEffect(() => {
    const located = chefs.filter(c => c.lat && c.lng).length;
    const missing = chefs.length - located;
    setStats({ total: chefs.length, located, missing });
  }, [chefs]);

  // 3) Init map once
  useEffect(() => {
    if (!mapDivRef.current) return;
    if (!mapboxgl.accessToken) return;

    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [7.5, 47.0], // Europe
      zoom: 3.6,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 4) Add/update source + layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!geojson) return;

    const onLoad = () => {
      const sourceId = 'chefs';

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson as any,
          cluster: true,
          clusterMaxZoom: 8,
          clusterRadius: 40,
        });

        // clusters
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#7c3aed',
            'circle-radius': ['step', ['get', 'point_count'], 16, 20, 22, 50, 28],
            'circle-opacity': 0.35,
          },
        });

        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12,
          },
          paint: { 'text-color': '#ffffff' },
        });

        // points
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#22c55e',
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#0b0b0b',
          },
        });

        // click cluster -> zoom
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          const clusterId = features[0]?.properties?.cluster_id;
          const source = map.getSource(sourceId) as any;
          source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            map.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom,
            });
          });
        });

        // click point -> popup
        map.on('click', 'unclustered-point', (e) => {
          const f = e.features?.[0] as any;
          const props = f?.properties || {};
          const coords = f?.geometry?.coordinates?.slice();

          new mapboxgl.Popup({ closeButton: true })
            .setLngLat(coords)
            .setHTML(
              `<div style="font-family: ui-sans-serif; min-width:200px;">
                <div style="font-weight:700; margin-bottom:4px;">${props.name || 'Chef'}</div>
                <div style="opacity:.8; font-size:12px;">${props.city || ''} ${props.country || ''}</div>
                <div style="opacity:.7; font-size:12px; margin-top:6px;">status: ${props.status || '—'}</div>
              </div>`
            )
            .addTo(map);
        });

        map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''));
        map.on('mouseenter', 'unclustered-point', () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', 'unclustered-point', () => (map.getCanvas().style.cursor = ''));
      } else {
        (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojson as any);
      }
    };

    if (map.loaded()) onLoad();
    else map.once('load', onLoad);

    return () => {};
  }, [geojson]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Carte des chefs</h1>
          <p className="text-sm text-white/50 mt-1">
            Europe • clusters • source Supabase (cache geocode)
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href="/admin/chefs"
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
          >
            Gérer chefs
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat title="Total chefs" value={stats.total} />
        <Stat title="Localisés" value={stats.located} />
        <Stat title="Sans localisation" value={stats.missing} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div ref={mapDivRef} style={{ height: 620, width: '100%' }} />
      </div>

      {loading ? <div className="text-sm text-white/60">Chargement…</div> : null}
      {!mapboxgl.accessToken ? (
        <div className="text-sm text-rose-200">
          ⚠️ NEXT_PUBLIC_MAPBOX_TOKEN manquant.
        </div>
      ) : null}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/50">{title}</div>
      <div className="text-2xl font-semibold text-white mt-1">{value}</div>
    </div>
  );
}
