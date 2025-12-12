import React, { useEffect, useState } from 'react';
import { api } from '../../services/storage';
import { RequestEntity } from '../../types';
import { Marker, Label, Button } from '../../components/ui';
import { Mail, Phone, Building } from 'lucide-react';

interface Client {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  type: string;
  requestCount: number;
  lastRequest: string;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const load = async () => {
      const reqs = await api.getRequests();
      
      const clientMap = new Map<string, Client>();
      
      reqs.forEach(r => {
         const key = r.contact.email;
         const existing = clientMap.get(key);
         
         if (existing) {
            existing.requestCount += 1;
            if (new Date(r.createdAt) > new Date(existing.lastRequest)) {
               existing.lastRequest = r.createdAt;
            }
         } else {
            clientMap.set(key, {
               email: r.contact.email,
               name: r.contact.name,
               phone: r.contact.phone,
               company: r.contact.company,
               type: r.userType,
               requestCount: 1,
               lastRequest: r.createdAt
            });
         }
      });
      
      setClients(Array.from(clientMap.values()));
    };
    load();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <Marker />
        <Label>CRM Light</Label>
        <h1 className="text-3xl font-serif text-stone-900">Clients</h1>
      </div>

      <div className="bg-white border border-stone-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-xs border-b border-stone-200">
            <tr>
              <th className="p-4 font-medium">Nom</th>
              <th className="p-4 font-medium">Contact</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Demandes</th>
              <th className="p-4 font-medium text-right">Dernière activité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {clients.map((client, idx) => (
              <tr key={idx} className="hover:bg-stone-50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-stone-900">{client.name}</div>
                  {client.company && (
                     <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                        <Building className="w-3 h-3" /> {client.company}
                     </div>
                  )}
                </td>
                <td className="p-4">
                   <div className="flex flex-col gap-1 text-stone-600">
                      <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {client.email}</div>
                      {client.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {client.phone}</div>}
                   </div>
                </td>
                <td className="p-4">
                   <span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${client.type === 'b2b' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'}`}>
                      {client.type}
                   </span>
                </td>
                <td className="p-4 text-stone-900 font-medium">
                   {client.requestCount}
                </td>
                <td className="p-4 text-right text-stone-400 text-xs font-mono">
                   {new Date(client.lastRequest).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clients;