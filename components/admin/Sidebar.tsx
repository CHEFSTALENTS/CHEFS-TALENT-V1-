'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/admin/requests', label: 'Requests' },
  { href: '/admin/chefs', label: 'Chefs' },
  { href: '/admin/missions', label: 'Missions' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r p-6">
      <div className="font-bold text-xl mb-8">Chef Talents Admin</div>

      <nav className="space-y-3">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded ${
              pathname.startsWith(link.href)
                ? 'bg-black text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
