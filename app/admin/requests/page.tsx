'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/services/storage';
import type { RequestEntity } from '@/types';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRequests().then(data => {
      setRequests(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p>Chargement des requests…</p>;
  }

  if (requests.length === 0) {
    return <p>Aucune request pour le moment.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Requests</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Date</th>
            <th className="text-left py-2">Lieu</th>
            <th className="text-left py-2">Type</th>
            <th className="text-left py-2">Guests</th>
            <th className="text-left py-2">Statut</th>
          </tr>
        </thead>

        <tbody>
          {requests.map(req => (
            <Link
              key={req.id}
              href={`/admin/requests/${req.id}`}
              className="contents"
            >
              <tr className="border-b hover:bg-gray-50 cursor-pointer">
                <td className="py-2">
                  {new Date(req.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2">{req.location}</td>
                <td className="py-2">{req.missionType}</td>
                <td className="py-2">{req.guestCount}</td>
                <td className="py-2">
                  <span className="px-2 py-1 text-sm rounded bg-gray-100">
                    {req.status}
                  </span>
                </td>
              </tr>
            </Link>
          ))}
        </tbody>
      </table>
    </div>
  );
}
