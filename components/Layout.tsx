import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  UsersIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
  CameraIcon,
  CalendarDaysIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { href: '/', label: 'Dashboard', icon: HomeIcon },
  { href: '/contacts', label: 'Contacts', icon: UsersIcon },
  { href: '/outreach', label: 'Outreach', icon: EnvelopeIcon },
  { href: '/shoots', label: 'Shoots', icon: CalendarDaysIcon },
  { href: '/pricing', label: 'Pricing', icon: BanknotesIcon },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast.error('Logout failed');
    }
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-60 flex-col bg-gray-900 text-white flex-shrink-0">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
          <CameraIcon className="h-6 w-6 text-indigo-400" />
          <span className="text-lg font-semibold tracking-tight">LensLink</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-700 px-4 py-4">
          <div className="mb-2 truncate text-xs text-gray-400">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content — extra bottom padding on mobile for the tab bar */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-gray-900 border-t border-gray-700 px-2 py-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
              isActive(href) ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>

    </div>
  );
}
