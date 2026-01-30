'use client';

import { useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function AdminMapPage() {
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapDivRef.current) return;

    let mounted = true;

    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

      if (!mounted) return;

      mapRef.current = new mapboxgl.Map({
        container: mapDivRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [2.3522, 48.8566], // Paris
        zoom: 4,
      });
    })();

    return () => {
      mounted = false;
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-white">Carte des chefs</h1>
      <div
        ref={mapDivRef}
        className="w-full h-[70vh] rounded-xl border border-white/10 overflow-hidden"
      />
    </div>
  );
}
