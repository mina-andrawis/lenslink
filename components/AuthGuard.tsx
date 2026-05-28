import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Captured once on mount — true if a previous session was cached
  const hadCachedSession = useRef(
    typeof window !== 'undefined' && !!localStorage.getItem('lenslink_authed')
  );

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    // No prior session hint → skip spinner, effect will redirect to /login
    if (!hadCachedSession.current) return null;
    // Prior session exists → show spinner while Firebase restores it
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
