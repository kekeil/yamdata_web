"use client";
import { supabase } from './client';

// Récupérer les utilisateurs avec leurs rôles
export const fetchUsersWithRoles = async () => {
  return supabase
    .from('profiles')
    .select(`
      id, 
      phone, 
      created_at,
      user_roles ( roles ( name ) )
    `);
};

// Récupérer les détails d'un utilisateur spécifique
export const fetchUserDetails = async (userId: string) => {
  return supabase
    .from('profiles')
    .select(`
      id,
      phone,
      created_at,
      user_roles ( roles ( name ) ),
      user_savings ( saving_type_id, balance, last_interest_date ),
      transactions (
        id,
        transaction_type,
        amount_paid,
        data_cost,
        saving_amount,
        management_fee_rate,
        management_fee_amount,
        net_saving,
        status,
        created_at
      )
    `)
    .eq('id', userId)
    .single();
};

// Récupérer les forfaits data avec leurs opérateurs
export const fetchDataPlans = async () => {
  return supabase
    .from('data_plans')
    .select(`
      id,
      name,
      volume_go,
      price,
      validity_days,
      telecom_operators ( id, name, commission_rate )
    `);
};

// Récupérer les paramètres d'épargne
export const fetchSavingParameters = async () => {
  return supabase
    .from('saving_parameters')
    .select(`
      id,
      saving_rate,
      management_fee,
      saving_types ( id, name, lock_period_months, withdrawal_frequency )
    `);
};

// Mettre à jour les paramètres d'épargne
export const updateSavingParameter = async (id: number, saving_rate: number, management_fee: number) => {
  return supabase
    .from('saving_parameters')
    .update({ saving_rate, management_fee })
    .eq('id', id);
};

// Statistiques agrégées (vue `dashboard_stats`, pas de RPC)
export const fetchDashboardStats = async () => {
  const { data, error } = await supabase
    .from('dashboard_stats')
    .select('*')
    .single();

  if (error) throw error;

  return {
    usersCount: data?.users_count ?? 0,
    totalSavings: Number(data?.total_savings ?? 0),
    transactionsCount: data?.transactions_count ?? 0,
    averageSaving: Number(data?.average_saving ?? 0),
    operatorsCount: data?.operators_count ?? 0,
    plansCount: data?.plans_count ?? 0,
    transactionsThisMonth: data?.transactions_this_month ?? 0,
    newUsersThisWeek: data?.new_users_this_week ?? 0,
  };
}; 