'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/storage';
import type { RequestEntity } from '@/types';

export default function AdminRequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [req, setReq] = useState<RequestEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getRequest(id as string).then((data) => {
      setReq(data ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p>Chargement…</p>;

  if (!req) {
    return (
      <div>
        <button className="underline" onClick={() => router.push('/admin/requests')}>
          ← Retour
        </button>
        <p className="mt-4">Request introuvable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button className="underline" onClick={() => router.push('/admin/requests')}>
          ← Retour
        </button>
        <span className="px-2 py-1 text-sm rounded bg-gray-100">{req.status}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Request</h1>
        <p className="text-gray-500 text-sm">ID: {req.id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Info label="Mode" value={req.mode} />
        <Info label="Client" value={req.userType} />
        <Info label="Lieu" value={req.location} />
        <Info label="Mission" value={req.missionType} />
        <Info label="Guests" value={String(req.guestCount)} />
        <Info label="Service" value={req.serviceLevel} />
        <Info label="Dates" value={`${req.dates.start}${req.dates.end ? ` → ${req.dates.end}` : ''}`} />
        <Info label="Budget" value={req.budgetRange ?? '-'} />
      </div>

      <div className="border rounded p-4 bg-white">
        <h2 className="font-semibold mb-2">Préférences</h2>
        <p><b>Cuisine:</b> {req.preferences?.cuisine ?? '-'}</p>
        <p><b>Allergies:</b> {req.preferences?.allergies ?? '-'}</p>
        <p><b>Langues:</b> {req.preferences?.languages ?? '-'}</p>
      </div>

      <div className="border rounded p-4 bg-white">
        <h2 className="font-semibold mb-2">Notes</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{req.notes || '-'}</p>
      </div>

      <div className="border rounded p-4 bg-white">
        <h2 className="font-semibold mb-2">Contact</h2>
        <p><b>Nom:</b> {req.contact?.name ?? '-'}</p>
        <p><b>Email:</b> {req.contact?.email ?? '-'}</p>
        <p><b>Téléphone:</b> {req.contact?.phone ?? '-'}</p>
        <p><b>Société:</b> {req.contact?.company ?? '-'}</p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded p-4 bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
