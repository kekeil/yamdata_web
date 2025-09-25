'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Alert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export default function DashboardAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      setLoading(true);

      // Récupérer les transactions récentes pour détecter des anomalies
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les utilisateurs récents
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      const newAlerts: Alert[] = [];

      // Alerte si beaucoup de transactions
      if (recentTransactions && recentTransactions.length > 50) {
        newAlerts.push({
          id: 'high-transactions',
          type: 'info',
          title: 'Activité élevée',
          message: `${recentTransactions.length} transactions dans les dernières 24h`,
          timestamp: new Date()
        });
      }

      // Alerte si nouveaux utilisateurs
      if (recentUsers && recentUsers.length > 0) {
        newAlerts.push({
          id: 'new-users',
          type: 'success',
          title: 'Nouveaux utilisateurs',
          message: `${recentUsers.length} nouveaux utilisateurs aujourd'hui`,
          timestamp: new Date()
        });
      }

      // Alerte si aucune transaction récente
      if (recentTransactions && recentTransactions.length === 0) {
        newAlerts.push({
          id: 'no-activity',
          type: 'warning',
          title: 'Faible activité',
          message: 'Aucune transaction dans les dernières 24h',
          timestamp: new Date()
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      // Gestion silencieuse des erreurs
    } finally {
      setLoading(false);
    }
  }

  function getAlertIcon(type: string) {
    switch (type) {
      case 'success':
        return (
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  }

  function getAlertStyles(type: string) {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">Aucune alerte</h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>Tout fonctionne normalement</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Alertes et notifications</h3>
      {alerts.map((alert) => (
        <div key={alert.id} className={`border rounded-md p-4 ${getAlertStyles(alert.type)}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {getAlertIcon(alert.type)}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">{alert.title}</h3>
              <div className="mt-2 text-sm">
                <p>{alert.message}</p>
              </div>
              <div className="mt-1 text-xs opacity-75">
                {alert.timestamp.toLocaleTimeString('fr-FR')}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
