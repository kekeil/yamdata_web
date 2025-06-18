'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';

export default function AccessDenied() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
              Accès refusé
            </h2>
            <div className="mt-6 text-red-600 text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>Vous n'avez pas les droits nécessaires pour accéder au tableau de bord.</p>
            </div>
            <div className="mt-8 space-y-4">
              <div>
                <button
                  onClick={handleLogout}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Se déconnecter
                </button>
              </div>
              <div>
                <Link href="/" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Retour à l'accueil
                </Link>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur du système.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 