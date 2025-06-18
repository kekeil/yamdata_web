'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SavingParameter {
  id: number;
  saving_rate: number;
  management_fee: number;
  saving_types: {
    id: number;
    name: string;
    lock_period_months: number;
    withdrawal_frequency: string;
  };
}

interface SavingStats {
  totalUsers: number;
  totalSavings: number;
  averageSavingPerUser: number;
}

export default function SavingsPage() {
  const [parameters, setParameters] = useState<SavingParameter[]>([]);
  const [stats, setStats] = useState<SavingStats>({
    totalUsers: 0,
    totalSavings: 0,
    averageSavingPerUser: 0
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    saving_rate: number;
    management_fee: number;
  }>({
    saving_rate: 0,
    management_fee: 0
  });

  useEffect(() => {
    fetchSavingParameters();
    fetchSavingStats();
  }, []);

  async function fetchSavingParameters() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saving_parameters')
        .select(`
          id,
          saving_rate,
          management_fee,
          saving_types (
            id,
            name,
            lock_period_months,
            withdrawal_frequency
          )
        `);

      if (error) throw error;
      setParameters(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres d\'épargne:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSavingStats() {
    try {
      // Récupérer le nombre d'utilisateurs avec épargne
      const { count: userCount } = await supabase
        .from('user_savings')
        .select('*', { count: 'exact', head: true });
      
      // Récupérer le total d'épargne
      const { data: savingsData } = await supabase
        .from('user_savings')
        .select('balance');
      
      const totalSavings = savingsData?.reduce((sum, item) => sum + Number(item.balance), 0) || 0;
      const avgSaving = userCount ? totalSavings / userCount : 0;
      
      setStats({
        totalUsers: userCount || 0,
        totalSavings,
        averageSavingPerUser: avgSaving
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques d\'épargne:', error);
    }
  }

  function startEditing(parameter: SavingParameter) {
    setEditingId(parameter.id);
    setEditValues({
      saving_rate: parameter.saving_rate,
      management_fee: parameter.management_fee
    });
  }

  async function saveChanges(id: number) {
    try {
      const { error } = await supabase
        .from('saving_parameters')
        .update({
          saving_rate: editValues.saving_rate,
          management_fee: editValues.management_fee
        })
        .eq('id', id);

      if (error) throw error;
      
      setEditingId(null);
      fetchSavingParameters();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
    }
  }

  function cancelEditing() {
    setEditingId(null);
  }

  function formatPercent(value: number) {
    return (value * 100).toFixed(2) + '%';
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Gestion de l'Épargne</h1>
      </div>

      {/* Statistiques d'épargne */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Utilisateurs avec épargne</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Épargne totale</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalSavings.toLocaleString()} FCFA</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Moyenne par utilisateur</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.averageSavingPerUser.toLocaleString()} FCFA</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paramètres d'épargne */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Paramètres d'épargne</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Chargement des paramètres...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type d'épargne
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Période de blocage
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fréquence de retrait
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taux d'épargne
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frais de gestion
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parameters.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Aucun paramètre trouvé
                      </td>
                    </tr>
                  ) : (
                    parameters.map((param) => (
                      <tr key={param.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${param.saving_types.name === 'bloquée' ? 'bg-red-100 text-red-800' : 
                            param.saving_types.name === 'semi-bloquée' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'}`}>
                            {param.saving_types.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {param.saving_types.lock_period_months} mois
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {param.saving_types.withdrawal_frequency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === param.id ? (
                            <input
                              type="number"
                              min="0.1"
                              max="0.9"
                              step="0.01"
                              className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              value={editValues.saving_rate}
                              onChange={(e) => setEditValues({...editValues, saving_rate: parseFloat(e.target.value)})}
                            />
                          ) : (
                            formatPercent(param.saving_rate)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === param.id ? (
                            <input
                              type="number"
                              min="0"
                              max="0.5"
                              step="0.001"
                              className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              value={editValues.management_fee}
                              onChange={(e) => setEditValues({...editValues, management_fee: parseFloat(e.target.value)})}
                            />
                          ) : (
                            formatPercent(param.management_fee)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === param.id ? (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => saveChanges(param.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                              <button 
                                onClick={cancelEditing}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => startEditing(param)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 