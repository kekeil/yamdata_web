'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Animation d'apparition
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const fetchDashboardData = async () => {
    try {
      const { data: savingsData } = await supabase
        .from('user_savings')
        .select('balance')
        .eq('user_id', user?.id)
        .maybeSingle();

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 500ms ease, transform 500ms ease'
        }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour {user?.email?.split('@')[0]} ! 👋
        </h1>
        <p className="text-gray-500 mt-1">Voici un résumé de votre compte</p>
      </div>

      {/* Cartes principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Épargne */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 500ms 100ms ease, transform 500ms 100ms ease'
          }}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Épargne totale</p>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {stats.totalSavings.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">FCFA</span>
          </p>
          <Link href="/epargne" className="text-sm text-green-600 hover:text-green-700 mt-4 inline-flex items-center gap-1 font-medium">
            Voir détails →
          </Link>
        </div>

        {/* Transactions */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 500ms 200ms ease, transform 500ms 200ms ease'
          }}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Transactions</p>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalTransactions}
          </p>
          <Link href="/transactions" className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-flex items-center gap-1 font-medium">
            Voir historique →
          </Link>
        </div>

        {/* Acheter un forfait */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 500ms 300ms ease, transform 500ms 300ms ease'
          }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-green-100">Forfait</p>
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-xl">📱</span>
            </div>
          </div>
          <p className="text-2xl font-bold mb-1">Acheter un forfait</p>
          <p className="text-sm text-green-100 mb-4">Achetez et épargnez automatiquement</p>
          <Link href="/forfaits" className="inline-block bg-white text-green-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50 transition-colors">
            Commencer →
          </Link>
        </div>
      </div>

      {/* Message de bienvenue si pas encore de transaction */}
      {!stats.lastTransaction && (
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 500ms 400ms ease, transform 500ms 400ms ease'
          }}
          className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100"
        >
          <span className="text-6xl mb-4 block">🎉</span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue sur Yamdata !
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez dès maintenant à acheter vos forfaits et à épargner automatiquement
          </p>
          <Link
            href="/forfaits"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Acheter mon premier forfait
          </Link>
        </div>
      )}

      {/* Dernière transaction */}
      {stats.lastTransaction && (
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 500ms 400ms ease'
          }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dernière transaction
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {stats.lastTransaction.transaction_type === 'purchase' ? '🛒 Achat forfait' : 'Autre'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(stats.lastTransaction.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {stats.lastTransaction.amount_paid?.toLocaleString()} FCFA
              </p>
              <p className="text-xs text-green-600 font-medium">
                +{stats.lastTransaction.net_saving?.toLocaleString()} FCFA épargné
              </p>
            </div>
          </div>
          <Link
            href="/transactions"
            className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Voir tout l'historique →
          </Link>
        </div>
      )}
    </div>
  );
}