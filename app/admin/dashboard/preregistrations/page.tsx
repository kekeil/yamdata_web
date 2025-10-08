'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedAuth } from '@/lib/hooks/useOptimizedAuth';
import { 
  UsersIcon, 
  EyeIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserPlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Preregistration {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  interested_features: string[];
  referral_source?: string;
  marketing_consent: boolean;
  status: 'pending' | 'contacted' | 'registered' | 'unsubscribed';
  priority_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PreregistrationStats {
  total_preregistrations: number;
  pending_count: number;
  marketing_consent_count: number;
  with_phone_count: number;
  average_priority_score: number;
  friend_referrals: number;
  social_media_referrals: number;
  last_week_registrations: number;
  last_month_registrations: number;
}

export default function PreregistrationsPage() {
  // Authentification optimisée
  const { isLoading: authLoading } = useOptimizedAuth({ 
    requireAuth: true, 
    requireAdmin: true 
  });
  
  const [preregistrations, setPreregistrations] = useState<Preregistration[]>([]);
  const [stats, setStats] = useState<PreregistrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'priority_score' | 'email'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPreregistration, setSelectedPreregistration] = useState<Preregistration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Ne charger les données que si l'authentification est terminée
    if (!authLoading) {
      fetchPreregistrations();
      fetchStats();
    }
  }, [authLoading]);

  async function fetchPreregistrations() {
    try {
      setLoading(true);
      
      // Session vérifiée par useOptimizedAuth, pas besoin de vérifier à nouveau

      let query = supabase
        .from('preregistrations')
        .select('*');

      // Appliquer les filtres
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Appliquer le tri
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des préinscriptions:', error);
        throw error;
      }
      
      setPreregistrations(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const { data, error } = await supabase
        .from('preregistration_stats')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
        console.error('Erreur lors de la récupération des statistiques:', error);
        return;
      }
      
      setStats(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  async function updatePreregistrationStatus(id: number, status: string, notes?: string) {
    try {
      const { error } = await supabase
        .from('preregistrations')
        .update({ 
          status, 
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Refresh data
      await fetchPreregistrations();
      await fetchStats();
      
      // Close modal
      setShowDetailsModal(false);
      setSelectedPreregistration(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  }

  async function deletePreregistration(id: number) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette préinscription ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('preregistrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchPreregistrations();
      await fetchStats();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function exportToCSV() {
    const headers = ['Email', 'Nom', 'Téléphone', 'Statut', 'Score de priorité', 'Consentement marketing', 'Source', 'Date d\'inscription'];
    const csvContent = [
      headers.join(','),
      ...filteredPreregistrations.map(p => [
        p.email,
        p.full_name,
        p.phone || '',
        p.status,
        p.priority_score,
        p.marketing_consent ? 'Oui' : 'Non',
        p.referral_source || '',
        new Date(p.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preregistrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const filteredPreregistrations = preregistrations.filter(preregistration => {
    const matchesSearch = 
      preregistration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preregistration.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (preregistration.phone && preregistration.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-blue-100 text-blue-800',
      registered: 'bg-green-100 text-green-800',
      unsubscribed: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      pending: 'En attente',
      contacted: 'Contacté',
      registered: 'Inscrit',
      unsubscribed: 'Désabonné'
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getReferralSourceLabel = (source?: string) => {
    const labels = {
      social_media: 'Réseaux sociaux',
      friend: 'Ami',
      web_search: 'Recherche web',
      advertisement: 'Publicité',
      other: 'Autre'
    };
    return source ? labels[source as keyof typeof labels] || source : 'Non spécifié';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Préinscriptions</h1>
          <p className="text-gray-600">Gérez les préinscriptions avant le lancement officiel</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtres
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total préinscriptions</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total_preregistrations}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserPlusIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending_count}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avec consentement</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.marketing_consent_count}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Score moyen</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.average_priority_score?.toFixed(1)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="contacted">Contacté</option>
                <option value="registered">Inscrit</option>
                <option value="unsubscribed">Désabonné</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="created_at">Date d'inscription</option>
                <option value="priority_score">Score de priorité</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ordre</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchPreregistrations}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table des préinscriptions */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Liste des préinscriptions ({filteredPreregistrations.length})
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par email, nom, téléphone..."
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement des préinscriptions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPreregistrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucune préinscription trouvée
                    </td>
                  </tr>
                ) : (
                  filteredPreregistrations.map((preregistration) => (
                    <tr key={preregistration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {preregistration.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {preregistration.email}
                          </div>
                          {preregistration.phone && (
                            <div className="text-sm text-gray-500">
                              📞 {preregistration.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(preregistration.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {preregistration.priority_score}
                          </div>
                          {preregistration.marketing_consent && (
                            <CheckCircleIcon className="ml-2 h-4 w-4 text-green-500" title="Consentement marketing" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getReferralSourceLabel(preregistration.referral_source)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(preregistration.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPreregistration(preregistration);
                              setShowDetailsModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Voir les détails"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deletePreregistration(preregistration.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showDetailsModal && selectedPreregistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowDetailsModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto z-10 p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Détails de la préinscription
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations personnelles */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Informations personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPreregistration.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPreregistration.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPreregistration.phone || 'Non fourni'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source de parrainage</label>
                    <p className="mt-1 text-sm text-gray-900">{getReferralSourceLabel(selectedPreregistration.referral_source)}</p>
                  </div>
                </div>
              </div>

              {/* Préférences */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Préférences</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Consentement marketing</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedPreregistration.marketing_consent ? '✅ Accepté' : '❌ Refusé'}
                    </p>
                  </div>
                  {selectedPreregistration.interested_features.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fonctionnalités d'intérêt</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selectedPreregistration.interested_features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations système */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Informations système</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Score de priorité</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPreregistration.priority_score}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut actuel</label>
                    <p className="mt-1">{getStatusBadge(selectedPreregistration.status)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date d'inscription</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedPreregistration.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dernière mise à jour</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedPreregistration.updated_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPreregistration.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
                    {selectedPreregistration.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPreregistration.status === 'pending' && (
                    <button
                      onClick={() => updatePreregistrationStatus(selectedPreregistration.id, 'contacted')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Marquer comme contacté
                    </button>
                  )}
                  
                  {selectedPreregistration.status !== 'registered' && (
                    <button
                      onClick={() => updatePreregistrationStatus(selectedPreregistration.id, 'registered')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Marquer comme inscrit
                    </button>
                  )}
                  
                  {selectedPreregistration.status !== 'unsubscribed' && (
                    <button
                      onClick={() => updatePreregistrationStatus(selectedPreregistration.id, 'unsubscribed')}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Marquer comme désabonné
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
