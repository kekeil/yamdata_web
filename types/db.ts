// Types générés à partir du schéma Supabase

/** Lignes embarquées `profiles → user_savings` (schéma réel). */
export interface ProfileUserSaving {
  saving_type_id: number;
  balance: number;
  last_interest_date?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  user_roles?: UserRole[];
  user_savings?: ProfileUserSaving[];
  subscriptions?: Subscription[];
  transactions?: Transaction[];
}

export interface Role {
  id: number;
  name: 'admin' | 'user' | 'support';
  description?: string;
  permissions: Record<string, any>;
}

export interface UserRole {
  user_id: string;
  role_id: number;
  assigned_at: string;
  assigned_by?: string;
  roles?: Role;
}

export interface TelecomOperator {
  id: number;
  name: string;
  commission_rate: number;
}

export interface DataPlan {
  id: number;
  operator_id: number;
  name: string;
  volume_go: number;
  price: number;
  validity_days: number;
  active: boolean;
  plan_type: 'data' | 'sms' | 'airtime';
  sms_count?: number | null;
  airtime_amount?: number | null;
  created_at: string;
  updated_at: string;
  telecom_operators?: TelecomOperator;
}

export interface Subscription {
  id: number;
  user_id: string;
  plan_id: number;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  data_plans?: DataPlan;
}

export interface Transaction {
  id: number;
  user_id: string;
  transaction_type: string;
  amount_paid: number;
  data_cost: number;
  saving_amount: number;
  management_fee_rate: number;
  management_fee_amount?: number | null;
  net_saving?: number | null;
  reference_id?: string | null;
  status: string;
  payment_method?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Types pour les vues
export interface ActiveSubscription {
  subscription_id: number;
  user_id: string;
  plan_name: string;
  operator_name: string;
  volume_go: number;
  price: number;
  start_date: string;
  end_date: string;
  user_email?: string;
  user_phone?: string;
}

export interface PopularDataPlan {
  id: number;
  name: string;
  operator_name: string;
  volume_go: number;
  price: number;
  validity_days: number;
  subscription_count: number;
}

/** Ligne de la vue `saving_statistics` (agrégats par type d'épargne). */
export interface SavingStatistics {
  saving_type: string;
  total_users: number;
  total_balance: number;
  average_balance: number;
  min_balance: number;
  max_balance: number;
}

/** Ligne unique de la vue `dashboard_stats`. */
export interface DashboardStatsView {
  users_count: number;
  total_savings: number;
  transactions_count: number;
  average_saving: number;
  operators_count: number;
  plans_count: number;
  transactions_this_month: number;
  new_users_this_week: number;
} 