import { supabase } from './client';

// Récupérer les utilisateurs avec leurs rôles
export const fetchUsersWithRoles = async () => {
  return supabase
    .from('users')
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
    .from('users')
    .select(`
      id,
      phone,
      created_at,
      user_roles ( roles ( name ) ),
      user_savings ( saving_type_id, balance, last_interest_date ),
      transactions ( id, amount_paid, data_cost, saving_amount, management_fee, net_saving, created_at )
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

// Récupérer les statistiques globales pour le dashboard
export const fetchDashboardStats = async () => {
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
    
  return {
    usersCount,
    totalSavings,
    transactionsCount
  };
}; 