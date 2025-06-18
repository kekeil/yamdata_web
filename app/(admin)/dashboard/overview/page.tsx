'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  usersCount: number;
  totalSavings: number;
  transactionsCount: number;
  averageSaving: number;
  operatorsCount: number;
  plansCount: number;
}

interface RecentTransaction {
  id: number;
  user_id: string;
  amount_paid: number;
  data_cost: number;
  saving_amount: number;
  created_at: string;
  phone?: string;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats>({
    usersCount: 0,
    totalSavings: 0,
    transactionsCount: 0,
    averageSaving: 0,
    operatorsCount: 0,
    plansCount: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentTransactions();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      
      // Nombre total d'utilisateurs
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
        
      // Montant total d'épargne
      const { data: savingsData } = await supabase
        .from('user_savings')
        .select('balance');
        
      const totalSavings = savingsData?.reduce((sum, item) => sum + Number(item.balance), 0) || 0;
        
      // Nombre total de transactions
      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      
      // Moyenne d'épargne par transaction
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('net_saving');
        
      const totalNetSaving = transactionsData?.reduce((sum, item) => sum + Number(item.net_saving), 0) || 0;
      const averageSaving = transactionsCount ? totalNetSaving / transactionsCount : 0;
      
      // Nombre d'opérateurs
      const { count: operatorsCount } = await supabase
        .from('telecom_operators')
        .select('*', { count: 'exact', head: true });
      
      // Nombre de forfaits
      const { count: plansCount } = await supabase
        .from('data_plans')
        .select('*', { count: 'exact', head: true });
      
      setStats({
        usersCount: usersCount || 0,
        totalSavings,
        transactionsCount: transactionsCount || 0,
        averageSaving,
        operatorsCount: operatorsCount || 0,
        plansCount: plansCount || 0
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentTransactions() {
    try {
      // Récupérer les 5 transactions les plus récentes
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          amount_paid,
          data_cost,
          saving_amount,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Récupérer les informations des utilisateurs pour ces transactions
      if (transactions && transactions.length > 0) {
        const userIds = transactions.map(t => t.user_id);
        const { data: users } = await supabase
          .from('users')
          .select('id, phone')
          .in('id', userIds);
        
        // Associer les numéros de téléphone aux transactions
        const transactionsWithUserInfo = transactions.map(transaction => {
          const user = users?.find(u => u.id === transaction.user_id);
          return {
            ...transaction,
            phone: user?.phone
          };
        });
        
        setRecentTransactions(transactionsWithUserInfo);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions récentes:', error);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatCurrency(amount: number) {
    return amount.toLocaleString() + ' FCFA';
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Vue d'ensemble</h1>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Chargement des statistiques...</p>
        </div>
      ) : (
        <>
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <UsersIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Utilisateurs</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{stats.usersCount.toLocaleString()}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/admin/dashboard/users" className="font-medium text-green-700 hover:text-green-900">
                    Voir tous les utilisateurs
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <CurrencyDollarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Épargne totale</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalSavings)}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/admin/dashboard/savings" className="font-medium text-green-700 hover:text-green-900">
                    Voir les détails d'épargne
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <DocumentTextIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Transactions</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{stats.transactionsCount.toLocaleString()}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-green-700 hover:text-green-900">
                    Voir toutes les transactions
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Épargne moyenne / transaction</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{formatCurrency(stats.averageSaving)}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-green-700 hover:text-green-900">
                    Voir les statistiques
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Opérateurs</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{stats.operatorsCount}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/admin/dashboard/operators" className="font-medium text-green-700 hover:text-green-900">
                    Gérer les opérateurs
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <PhoneIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Forfaits disponibles</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{stats.plansCount}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/admin/dashboard/plans" className="font-medium text-green-700 hover:text-green-900">
                    Gérer les forfaits
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Graphique d'épargne (simulé avec des barres) */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Évolution de l'épargne</h2>
            </div>
            <div className="p-4">
              <div className="h-64 flex items-end space-x-2">
                {[30, 45, 28, 50, 75, 62, 80].map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-green-500 rounded-t" 
                      style={{ height: `${value}%` }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-1">J-{7-index}</div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4 text-sm text-gray-500">
                Évolution de l'épargne sur les 7 derniers jours
              </div>
            </div>
          </div>

          {/* Transactions récentes */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Transactions récentes</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {recentTransactions.length === 0 ? (
                  <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                    Aucune transaction récente
                  </li>
                ) : (
                  recentTransactions.map((transaction) => (
                    <li key={transaction.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-green-600 truncate">
                            Transaction #{transaction.id}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Complétée
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              {transaction.phone || `Utilisateur ${transaction.user_id.substring(0, 8)}...`}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {formatCurrency(transaction.amount_paid)}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <p>
                              {formatDate(transaction.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 