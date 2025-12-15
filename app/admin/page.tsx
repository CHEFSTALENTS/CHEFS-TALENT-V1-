import Link from 'next/link';

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Admin Chef Talents
      </h1>

      <ul className="space-y-2">
        <li>
          <Link href="/admin/requests" className="underline">
            → Requests
          </Link>
        </li>
        <li>
          <Link href="/admin/chefs" className="underline">
            → Chefs
          </Link>
        </li>
        <li>
          <Link href="/admin/missions" className="underline">
            → Missions
          </Link>
        </li>
      </ul>
    </div>
  );
}

