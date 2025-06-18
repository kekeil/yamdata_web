// Types générés à partir du schéma Supabase

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  user_roles?: UserRole[];
  savings_accounts?: SavingsAccount[];
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

export interface SavingsSettings {
  id: number;
  default_savings_rate: number;
  default_interest_rate: number;
  service_fee_rate: number;
  min_withdrawal_amount: number;
  created_at: string;
  updated_at: string;
}

export interface SavingsAccount {
  id: string; // UUID
  user_id: string;
  balance: number;
  type: 'blocked' | 'semi_blocked' | 'free';
  interest_rate: number;
  last_interest_date?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string; // UUID
  user_id: string;
  account_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: 'mobile_money' | 'card' | 'bank_transfer';
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string; // UUID
  user_id: string;
  type: 'purchase' | 'savings' | 'withdrawal' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method_id?: number;
  reference: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  payment_method?: PaymentMethod;
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

export interface UserSavingsSummary {
  user_id: string;
  email?: string;
  phone?: string;
  total_balance: number;
  savings_count: number;
  last_transaction_date?: string;
  account_types: string[];
}

// Types pour les statistiques
export interface DashboardStats {
  usersCount: number;
  totalSavings: number;
  transactionsCount: number;
  averageSaving: number;
  operatorsCount: number;
  plansCount: number;
} 