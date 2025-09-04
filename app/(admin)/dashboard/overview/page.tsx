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
  net_saving: number;
  created_at: string;
  email?: string;
  phone?: string;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      // Récupérer toutes les statistiques en une seule requête optimisée
      const { data: statsData, error: statsError } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single();
      
      if (statsError) throw statsError;

      setStats({
        usersCount: statsData.users_count || 0,
        totalSavings: Number(statsData.total_savings) || 0,
        transactionsCount: statsData.transactions_count || 0,
        averageSaving: Number(statsData.average_saving) || 0,
        operatorsCount: statsData.operators_count || 0,
        plansCount: statsData.plans_count || 0
      });

      // Dernières transactions avec informations utilisateur en une seule requête
      const { data: transactionsWithUser, error: recentError } = await supabase
        .from('transactions')
        .select(`
          id, 
          user_id, 
          amount_paid, 
          net_saving, 
          created_at,
          profiles!transactions_user_id_fkey (
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentError) throw recentError;

      const formattedTransactions: RecentTransaction[] = (transactionsWithUser || []).map(t => ({
        id: t.id,
        user_id: t.user_id,
        amount_paid: t.amount_paid,
        net_saving: t.net_saving,
        created_at: t.created_at,
        email: Array.isArray(t.profiles) ? t.profiles[0]?.email : t.profiles?.email,
        phone: Array.isArray(t.profiles) ? t.profiles[0]?.phone : t.profiles?.phone
      }));
      
      setRecentTransactions(formattedTransactions);
    } catch (err: any) {
      setError('Erreur lors du chargement du dashboard : ' + (err.message || err));
      setStats(null);
      setRecentTransactions([]);
    } finally {
      setLoading(false);
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

  // Ajout de logs pour le debug
  console.log('[OVERVIEW DEBUG]', { stats, recentTransactions, loading, error });

  // Affichage statique temporaire pour vérifier le montage du composant
  // (à commenter/décommenter pour test)
  // return <div style={{color: 'red'}}>Composant OverviewPage monté !</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Vue d'ensemble</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur : </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Chargement des statistiques...</p>
        </div>
      ) : stats ? (
        <>
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={<UsersIcon className="h-6 w-6 text-white" />} label="Utilisateurs" value={stats.usersCount.toLocaleString()} link="/dashboard/users" linkLabel="Voir tous les utilisateurs" />
            <StatCard icon={<CurrencyDollarIcon className="h-6 w-6 text-white" />} label="Épargne totale" value={formatCurrency(stats.totalSavings)} link="/dashboard/savings" linkLabel="Voir les détails d'épargne" />
            <StatCard icon={<DocumentTextIcon className="h-6 w-6 text-white" />} label="Transactions" value={stats.transactionsCount.toLocaleString()} link="#" linkLabel="Voir toutes les transactions" />
            <StatCard icon={<ArrowTrendingUpIcon className="h-6 w-6 text-white" />} label="Épargne moyenne / transaction" value={formatCurrency(stats.averageSaving)} link="#" linkLabel="Voir les statistiques" />
            <StatCard icon={<BuildingOfficeIcon className="h-6 w-6 text-white" />} label="Opérateurs" value={stats.operatorsCount} link="/dashboard/operators" linkLabel="Gérer les opérateurs" />
            <StatCard icon={<PhoneIcon className="h-6 w-6 text-white" />} label="Forfaits disponibles" value={stats.plansCount} link="/dashboard/plans" linkLabel="Gérer les forfaits" />
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
                              {transaction.email || `Utilisateur ${transaction.user_id.substring(0, 8)}...`} {transaction.phone ? `(${transaction.phone})` : ''}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              {formatCurrency(transaction.amount_paid)}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>{formatDate(transaction.created_at)}</p>
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
      ) : (
        <div className="text-center py-10 text-gray-500">Aucune statistique à afficher.</div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, link, linkLabel }: { icon: React.ReactNode, label: string, value: string | number, link: string, linkLabel: string }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <a href={link} className="font-medium text-green-700 hover:text-green-900">
            {linkLabel}
          </a>
        </div>
      </div>
    </div>
  );
} 