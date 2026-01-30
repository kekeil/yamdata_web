'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import UserNavbar from '@/components/user-dashboard/UserNavbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuthStore();

  useEffect(() => {
    // Rediriger si pas connecté
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Rediriger les admins vers le dashboard admin
    if (!isLoading && user && isAdmin) {
      router.push('/admin/dashboard');
    }
  }, [user, isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />
      <main>{children}</main>
    </div>
  );
}