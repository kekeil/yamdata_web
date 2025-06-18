'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { signOut } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import { 
  BellIcon, 
  Cog6ToothIcon, 
  ArrowLeftOnRectangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

export default function AdminHeader() {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Nouvel utilisateur inscrit", time: "Il y a 30 minutes" },
    { id: 2, message: "5 nouvelles transactions", time: "Il y a 2 heures" },
    { id: 3, message: "Mise à jour du système disponible", time: "Il y a 1 jour" }
  ]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Récupérer le rôle de l'utilisateur
        const { data } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id)
          .single();
          
        setUserProfile({
          id: user.id,
          email: user.email || '',
          role: data?.roles?.name || 'utilisateur'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }

  function toggleProfileMenu() {
    setShowProfileMenu(!showProfileMenu);
    if (showNotifications) setShowNotifications(false);
  }

  function toggleNotifications() {
    setShowNotifications(!showNotifications);
    if (showProfileMenu) setShowProfileMenu(false);
  }

  function markAllAsRead() {
    // Logique pour marquer toutes les notifications comme lues
    setNotifications([]);
  }

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Recherche */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Voir les notifications</span>
                <BellIcon className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Tout marquer comme lu
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        Aucune notification
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.map((notification) => (
                          <a
                            key={notification.id}
                            href="#"
                            className="block px-4 py-3 hover:bg-gray-50 transition ease-in-out duration-150"
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <span className="inline-block h-8 w-8 rounded-full bg-green-100 text-green-500 flex items-center justify-center">
                                  <BellIcon className="h-5 w-5" />
                                </span>
                              </div>
                              <div className="ml-3 w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                                <p className="mt-1 text-xs text-gray-500">{notification.time}</p>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 px-4 py-2">
                      <a href="#" className="text-xs text-green-600 hover:text-green-800 font-medium">
                        Voir toutes les notifications
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Profil */}
            <div className="relative">
              <button
                onClick={toggleProfileMenu}
                className="flex items-center max-w-xs text-sm rounded-full focus:outline-none"
              >
                <span className="sr-only">Ouvrir le menu utilisateur</span>
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                  {userProfile?.email.charAt(0).toUpperCase() || <UserIcon className="h-5 w-5" />}
                </div>
              </button>
              
              {showProfileMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    {userProfile && (
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 truncate">{userProfile.email}</p>
                        <p className="text-xs text-gray-500">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            {userProfile.role}
                          </span>
                        </p>
                      </div>
                    )}
                    
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Paramètres
                      </div>
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Se déconnecter
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 