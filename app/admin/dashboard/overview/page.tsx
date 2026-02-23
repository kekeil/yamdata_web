'use client';

import { useState, useEffect, useRef } from 'react';
import { useOptimizedDashboard } from '@/lib/hooks/useOptimizedDashboard';
import DashboardCharts from '@/components/dashboard/Charts';
import RealTimeMetrics from '@/components/dashboard/RealTimeMetrics';
import DashboardAlerts from '@/components/dashboard/Alerts';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';

// ─── Hook : Compteur animé qui monte jusqu'à la valeur cible ─────────────────
function useAnimatedCount(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const start = count;
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (target - start) * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [target, duration]);

  return count;
}

// ─── Composant : Carte de stat avec animation d'apparition ──────────────────
function StatCard({
  label,
  value,
  suffix = '',
  icon,
  gradient,
  delay = 0,
  visible
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  gradient: string; // ex: "from-blue-500 to-blue-600"
  delay?: number;
  visible: boolean;
}) {
  const animated = useAnimatedCount(visible ? value : 0);

  return (
    <div
      className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-500 cursor-default"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 600ms ${delay}ms cubic-bezier(.4,0,.2,1), transform 600ms ${delay}ms cubic-bezier(.4,0,.2,1), box-shadow 300ms`
      }}
    >
      {/* Bande couleur en haut */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="p-5">
        <div className="flex items-center justify-between">
          {/* Icône */}
          <div className={`bg-gradient-to-br ${gradient} rounded-xl p-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          {/* Badge tendance (factice) */}
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            ↑ en cours
          </span>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">
            {animated.toLocaleString()}
            {suffix && <span className="text-sm font-medium text-gray-400 ml-1">{suffix}</span>}
          </p>
        </div>
      </div>

      {/* Lueur subtile au hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`} />
    </div>
  );
}

// ─── Composant : Skeleton pour le chargement ────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="h-1.5 bg-gray-200" />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
          <div className="w-16 h-5 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
          <div className="w-32 h-7 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── Icônes SVG ──────────────────────────────────────────────────────────────
const Icons = {
  Users: () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Money: () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Chart: () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Trending: () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Building: () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Clipboard: () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  NewUsers: () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

// ─── Page principale ─────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { stats, loading, error, refreshStats, isAuthenticated, isAdmin, authLoading } = useOptimizedDashboard();
  const [cardsVisible, setCardsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Déclencher l'animation après que les données sont chargées
  useEffect(() => {
    if (!loading && stats) {
      const t = setTimeout(() => setCardsVisible(true), 100);
      return () => clearTimeout(t);
    }
  }, [loading, stats]);

  const handleRealTimeUpdate = (update: any) => {
    if (['transaction', 'savings', 'user'].includes(update.type)) refreshStats();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCardsVisible(false);
    await refreshStats();
    setTimeout(() => {
      setRefreshing(false);
      setCardsVisible(true);
    }, 600);
  };

  // ── Loading global ──
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-green-500 animate-spin" />
          </div>
          <p className="mt-4 text-gray-500 text-sm font-medium">Authentification...</p>
        </div>
      </div>
    );
  }

  // ── Accès refusé ──
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Accès refusé</h1>
          <p className="text-gray-500 mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // ── Erreur ──
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <button onClick={handleRefresh} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all">
            <Icons.Refresh /> Réessayer
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-800">Erreur de chargement</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Skeleton loading ──
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-8 bg-gray-100 rounded-xl animate-pulse" />
          <div className="w-28 h-10 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  // ── Données des cartes ──
  const primaryCards = [
    { label: 'Utilisateurs', value: stats?.users_count || 0, suffix: '', icon: <Icons.Users />, gradient: 'from-blue-500 to-blue-600' },
    { label: 'Épargne totale', value: stats?.total_savings || 0, suffix: 'FCFA', icon: <Icons.Money />, gradient: 'from-green-500 to-emerald-600' },
    { label: 'Transactions', value: stats?.transactions_count || 0, suffix: '', icon: <Icons.Chart />, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Moyenne épargne', value: stats?.average_saving || 0, suffix: 'FCFA', icon: <Icons.Trending />, gradient: 'from-purple-500 to-violet-600' },
  ];

  const secondaryCards = [
    { label: 'Opérateurs', value: stats?.operators_count || 0, suffix: '', icon: <Icons.Building />, gradient: 'from-indigo-500 to-indigo-600' },
    { label: 'Forfaits', value: stats?.plans_count || 0, suffix: '', icon: <Icons.Clipboard />, gradient: 'from-rose-500 to-pink-500' },
    { label: 'Transactions ce mois', value: stats?.transactions_this_month || 0, suffix: '', icon: <Icons.Calendar />, gradient: 'from-teal-500 to-cyan-500' },
    { label: 'Nouveaux cette semaine', value: stats?.new_users_this_week || 0, suffix: '', icon: <Icons.NewUsers />, gradient: 'from-pink-500 to-fuchsia-500' },
  ];

  // ── Rendu principal ──
  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      {/* Header avec animation d'apparition */}
      <div
        className="flex justify-between items-center"
        style={{
          opacity: cardsVisible ? 1 : 0,
          transform: cardsVisible ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 500ms ease, transform 500ms ease'
        }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bienvenue, voici un résumé de votre activité</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60"
        >
          <span className={refreshing ? 'animate-spin' : ''}><Icons.Refresh /></span>
          {refreshing ? 'Mise à jour...' : 'Actualiser'}
        </button>
      </div>

      {/* Temps réel */}
      <RealTimeMetrics onUpdate={handleRealTimeUpdate} />

      {/* Alertes */}
      <DashboardAlerts />

      {/* Cartes principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {primaryCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 80} visible={cardsVisible} />
        ))}
      </div>

      {/* Séparateur avec titre animé */}
      <div
        className="flex items-center gap-4"
        style={{
          opacity: cardsVisible ? 1 : 0,
          transition: 'opacity 600ms 500ms ease'
        }}
      >
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Détails supplémentaires</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>

      {/* Cartes secondaires */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {secondaryCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={400 + i * 80} visible={cardsVisible} />
        ))}
      </div>

      {/* Métriques de performance */}
      <div
        style={{
          opacity: cardsVisible ? 1 : 0,
          transform: cardsVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 600ms 700ms ease, transform 600ms 700ms ease'
        }}
      >
        <PerformanceMetrics />
      </div>

      {/* Graphiques */}
      <div
        className="mt-2"
        style={{
          opacity: cardsVisible ? 1 : 0,
          transform: cardsVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 600ms 900ms ease, transform 600ms 900ms ease'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Analyses et tendances</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Mis à jour en temps réel</span>
        </div>
        <DashboardCharts stats={stats} />
      </div>
    </div>
  );
}