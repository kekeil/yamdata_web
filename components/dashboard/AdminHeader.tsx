'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  UserIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

interface Notification {
  id: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead?: boolean;
}

export default function AdminHeader() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);

  // Fermer les menus quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        notificationsMenuRef.current &&
        !notificationsMenuRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUserProfile();
    fetchNotifications();

    // Mettre à jour les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  async function fetchUserProfile() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (user) {
        const { data, error: roleError } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError && roleError.code !== 'PGRST116') {
          console.error('Erreur lors de la récupération du rôle:', roleError);
        }

        const roleName = data?.roles?.name || 'utilisateur';

        setUserProfile({
          id: user.id,
          email: user.email || '',
          role: roleName
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  }

  async function fetchNotifications() {
    try {
      setNotificationsLoading(true);
      const newNotifications: Notification[] = [];
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      // Récupérer les nouvelles transactions (dernières 2 heures)
      const { data: recentTransactions, error: transError } = await supabase
        .from('transactions')
        .select('id, created_at')
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false });

      // Récupérer les nouveaux utilisateurs (dernières 2 heures)
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false });

      // Récupérer les nouvelles épargnes (dernières 2 heures)
      const { data: recentSavings, error: savingsError } = await supabase
        .from('user_savings')
        .select('id, created_at')
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false });

      // Notifications pour les nouvelles transactions
      if (recentTransactions && recentTransactions.length > 0) {
        newNotifications.push({
          id: `transaction-${recentTransactions[0].id}`,
          message: `${recentTransactions.length} nouvelle${recentTransactions.length > 1 ? 's' : ''} transaction${recentTransactions.length > 1 ? 's' : ''}`,
          time: getTimeAgo(recentTransactions[0].created_at),
          type: 'info',
          isRead: false
        });
      }

      // Notifications pour les nouveaux utilisateurs
      if (recentUsers && recentUsers.length > 0) {
        newNotifications.push({
          id: `user-${recentUsers[0].id}`,
          message: `${recentUsers.length} nouvel${recentUsers.length > 1 ? 's' : ''} utilisateur${recentUsers.length > 1 ? 's' : ''} inscrit${recentUsers.length > 1 ? 's' : ''}`,
          time: getTimeAgo(recentUsers[0].created_at),
          type: 'success',
          isRead: false
        });
      }

      // Notifications pour les nouvelles épargnes
      if (recentSavings && recentSavings.length > 0) {
        newNotifications.push({
          id: `saving-${recentSavings[0].id}`,
          message: `${recentSavings.length} nouvelle${recentSavings.length > 1 ? 's' : ''} épargne${recentSavings.length > 1 ? 's' : ''} créée${recentSavings.length > 1 ? 's' : ''}`,
          time: getTimeAgo(recentSavings[0].created_at),
          type: 'success',
          isRead: false
        });
      }

      // Si aucune notification, afficher un message informatif
      if (newNotifications.length === 0) {
        newNotifications.push({
          id: `no-activity-${Date.now()}`,
          message: 'Aucune nouvelle activité récente',
          time: 'Maintenant',
          type: 'info',
          isRead: true
        });
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      setNotifications([{
        id: `error-${Date.now()}`,
        message: 'Erreur lors du chargement des notifications',
        time: 'Maintenant',
        type: 'error',
        isRead: false
      }]);
    } finally {
      setNotificationsLoading(false);
    }
  }

  function getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  }

  async function handleLogout() {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      // Utiliser le logout du store qui vide aussi le cache persistant
      await logout();

      // Redirection forcée vers /login après nettoyage complet
      window.location.href = '/login';

    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      alert('Erreur lors de la déconnexion. Veuillez réessayer.');
      setIsLoggingOut(false);
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
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Rediriger vers une page de recherche ou filtrer les données
      console.log('Recherche:', searchQuery);
      // router.push(`/admin/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-white shadow-sm z-10 sticky top-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Recherche */}
            <div className="hidden md:block">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="block w-64 pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationsMenuRef}>
              <button
                onClick={toggleNotifications}
                className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              >
                <span className="sr-only">Voir les notifications</span>
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={fetchNotifications}
                            disabled={notificationsLoading}
                            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-opacity"
                            title="Actualiser les notifications"
                          >
                            <span className={notificationsLoading ? 'animate-spin inline-block' : ''}>
                              🔄
                            </span>
                          </button>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-green-600 hover:text-green-800 transition-colors"
                            >
                              Tout lire
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {notificationsLoading ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto mb-2"></div>
                        Chargement...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        Aucune notification
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 ${
                              notification.isRead ? 'border-transparent' : 'border-green-500 bg-green-50'
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <span className={`inline-flex h-10 w-10 rounded-full items-center justify-center ${
                                  notification.type === 'error' ? 'bg-red-100 text-red-500' :
                                  notification.type === 'warning' ? 'bg-yellow-100 text-yellow-500' :
                                  notification.type === 'success' ? 'bg-green-100 text-green-500' :
                                  'bg-blue-100 text-blue-500'
                                }`}>
                                  <BellIcon className="h-5 w-5" />
                                </span>
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                                <p className="mt-1 text-xs text-gray-500">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bouton de déconnexion rapide (mobile) */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="md:hidden p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:opacity-50"
              title="Se déconnecter"
            >
              <ArrowLeftOnRectangleIcon className="h-6 w-6" />
            </button>

            {/* Profil */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={toggleProfileMenu}
                className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              >
                <span className="sr-only">Ouvrir le menu utilisateur</span>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg transition-shadow">
                  {userProfile?.email.charAt(0).toUpperCase() || <UserIcon className="h-5 w-5" />}
                </div>
              </button>

              {showProfileMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {userProfile && (
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 truncate">{userProfile.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            {userProfile.role}
                          </span>
                        </p>
                      </div>
                    )}

                    <Link
                      href="/admin/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Paramètres
                      </div>
                    </Link>

                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 text-red-400" />
                        {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
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