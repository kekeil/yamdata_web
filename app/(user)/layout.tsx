'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import UserNavbar from '@/components/user-dashboard/UserNavbar';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Éviter les problèmes d'hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirection si non authentifié
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login');
    }
  }, [mounted, user, isLoading, router]);

  // Pendant le chargement initial ou si pas encore monté
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur, ne rien afficher (redirection en cours)
  if (!user) {
    return null;
  }

  // Rendu normal
  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />
      <main>{children}</main>
    </div>
  );
}