'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface DashboardChartsProps {
  stats: {
    users_count: number;
    total_savings: number;
    transactions_count: number;
    average_saving: number;
    operators_count: number;
    plans_count: number;
    transactions_this_month: number;
    new_users_this_week: number;
  } | null;
}

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  const [transactionsData, setTransactionsData] = useState<ChartData[]>([]);
  const [savingsData, setSavingsData] = useState<ChartData[]>([]);
  const [operatorsData, setOperatorsData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  async function fetchChartData() {
    try {
      setLoading(true);

      // Données des transactions des 7 derniers jours
      const { data: transactions } = await supabase
        .from('transactions')
        .select('created_at, amount_paid')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      // Données des épargnes par type
      const { data: savings } = await supabase
        .from('user_savings')
        .select(`
          balance,
          saving_types (
            name
          )
        `);

      // Données des opérateurs
      const { data: operators } = await supabase
        .from('telecom_operators')
        .select(`
          name,
          data_plans (
            id
          )
        `);

      // Traitement des données des transactions
      const dailyTransactions = transactions?.reduce((acc: any, transaction) => {
        const date = new Date(transaction.created_at).toLocaleDateString('fr-FR', { 
          weekday: 'short',
          day: 'numeric'
        });
        if (!acc[date]) {
          acc[date] = { date, transactions: 0, amount: 0 };
        }
        acc[date].transactions += 1;
        acc[date].amount += Number(transaction.amount_paid || 0);
        return acc;
      }, {});

      setTransactionsData(Object.values(dailyTransactions || {}));

      // Traitement des données d'épargne
      const savingsByType = savings?.reduce((acc: any, saving) => {
        const savingType = saving.saving_types;
        const type = savingType && !Array.isArray(savingType) 
          ? (savingType as { name: string }).name 
          : Array.isArray(savingType) && savingType[0] 
            ? (savingType[0] as { name: string }).name 
            : 'Non défini';
        if (!acc[type]) {
          acc[type] = { name: type, value: 0 };
        }
        acc[type].value += Number(saving.balance || 0);
        return acc;
      }, {});

      setSavingsData(Object.values(savingsByType || {}));

      // Traitement des données des opérateurs
      const operatorsWithPlans = operators?.map(op => ({
        name: op.name,
        value: op.data_plans?.length || 0
      }));

      setOperatorsData(operatorsWithPlans || []);

    } catch (error) {
      // Gestion silencieuse des erreurs
    } finally {
      setLoading(false);
    }
  }

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Données de fallback si aucune donnée n'est disponible
  const hasData = transactionsData.length > 0 || savingsData.length > 0 || operatorsData.length > 0;
  
  if (!hasData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aucune donnée disponible</h3>
        <p className="text-gray-500">Les graphiques s'afficheront une fois que des données seront disponibles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graphique des transactions des 7 derniers jours */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transactions des 7 derniers jours
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={transactionsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'transactions' ? `${value} transactions` : `${Number(value).toLocaleString()} FCFA`,
                  name === 'transactions' ? 'Transactions' : 'Montant'
                ]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="transactions" 
                stackId="1" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Transactions"
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stackId="2" 
                stroke="#F59E0B" 
                fill="#F59E0B" 
                fillOpacity={0.6}
                name="Montant (FCFA)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des épargnes par type */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Épargnes par type
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={savingsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent } = props;
                    return `${name} ${((percent || 0) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {savingsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, 'Montant']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique des opérateurs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Forfaits par opérateur
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatorsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} forfaits`, 'Nombre de forfaits']} />
                <Bar dataKey="plans" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Graphique des tendances mensuelles */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tendance des épargnes
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={transactionsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, 'Montant épargné']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="Épargnes (FCFA)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
