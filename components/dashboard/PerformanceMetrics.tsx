'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface PerformanceData {
  responseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
}

export default function PerformanceMetrics() {
  const [performance, setPerformance] = useState<PerformanceData>({
    responseTime: 0,
    uptime: 0,
    errorRate: 0,
    throughput: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceMetrics();
    const interval = setInterval(fetchPerformanceMetrics, 30000); // Mise à jour toutes les 30 secondes
    return () => clearInterval(interval);
  }, []);

  async function fetchPerformanceMetrics() {
    try {
      setLoading(true);

      // Mesurer le temps de réponse de la base de données
      const startTime = performance.now();
      await supabase.from('profiles').select('id').limit(1);
      const responseTime = performance.now() - startTime;

      // Calculer le taux d'erreur (simulation)
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const totalTransactions = transactions?.length || 0;
      const failedTransactions = transactions?.filter(t => t.status === 'failed').length || 0;
      const errorRate = totalTransactions > 0 ? (failedTransactions / totalTransactions) * 100 : 0;

      // Calculer le débit (transactions par heure)
      const throughput = totalTransactions / 24;

      // Calculer l'uptime (simulation basée sur les requêtes réussies)
      const uptime = errorRate < 5 ? 99.9 : 95.0;

      setPerformance({
        responseTime: Math.round(responseTime),
        uptime,
        errorRate: Math.round(errorRate * 100) / 100,
        throughput: Math.round(throughput * 100) / 100
      });
    } catch (error) {
      setPerformance({
        responseTime: 0,
        uptime: 0,
        errorRate: 100,
        throughput: 0
      });
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(metric: string, value: number) {
    switch (metric) {
      case 'responseTime':
        return value < 100 ? 'text-green-600' : value < 500 ? 'text-yellow-600' : 'text-red-600';
      case 'uptime':
        return value > 99 ? 'text-green-600' : value > 95 ? 'text-yellow-600' : 'text-red-600';
      case 'errorRate':
        return value < 1 ? 'text-green-600' : value < 5 ? 'text-yellow-600' : 'text-red-600';
      case 'throughput':
        return value > 10 ? 'text-green-600' : value > 5 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métriques de performance</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Métriques de performance</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Temps de réponse</div>
          <div className={`text-2xl font-bold ${getStatusColor('responseTime', performance.responseTime)}`}>
            {performance.responseTime}ms
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Uptime</div>
          <div className={`text-2xl font-bold ${getStatusColor('uptime', performance.uptime)}`}>
            {performance.uptime}%
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Taux d'erreur</div>
          <div className={`text-2xl font-bold ${getStatusColor('errorRate', performance.errorRate)}`}>
            {performance.errorRate}%
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Débit</div>
          <div className={`text-2xl font-bold ${getStatusColor('throughput', performance.throughput)}`}>
            {performance.throughput}/h
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
      </div>
    </div>
  );
}
