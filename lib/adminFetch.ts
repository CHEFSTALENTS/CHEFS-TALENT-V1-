export async function adminFetch<T>(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      'x-admin-email': 'thomas@chef-talents.com',
    },
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return (text ? JSON.parse(text) : null) as T;
}
