'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalSavings: number;
  totalTransactions: number;
  lastTransaction: any;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalSavings: 0,
    totalTransactions: 0,
    lastTransaction: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: savingsData } = await supabase
        .from('user_savings')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      const { data: transactionsData, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      setStats({
        totalSavings: savingsData?.balance || 0,
        totalTransactions: count || 0,
        lastTransaction: transactionsData?.[0] || null
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Bonjour {user?.email?.split('@')[0]} ! 👋
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-600">Épargne totale</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats.totalSavings.toLocaleString()} FCFA
          </p>
          <a href="/epargne" className="text-sm text-green-600 mt-4 inline-block">
            Voir détails →
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-600">Transactions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalTransactions}
          </p>
          <a href="/transactions" className="text-sm text-blue-600 mt-4 inline-block">
            Voir historique →
          </a>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
          <p className="text-2xl font-bold mb-2">Acheter un forfait</p>
          <p className="text-sm mb-4">Achetez et épargnez automatiquement</p>
          <a href="/forfaits" className="inline-block bg-white text-green-600 px-4 py-2 rounded-lg font-medium">
            Commencer →
          </a>
        </div>
      </div>

      {!stats.lastTransaction && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <h3 className="text-2xl font-bold mb-2">Bienvenue sur Yamdata !</h3>
          <p className="text-gray-600 mb-6">
            Commencez dès maintenant à acheter vos forfaits
          </p>
          <a href="/forfaits" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg">
            Acheter mon premier forfait
          </a>
        </div>
      )}
    </div>
  );
}