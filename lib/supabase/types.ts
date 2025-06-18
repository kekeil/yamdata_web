export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string
          created_at: string
        }
        Insert: {
          id: string
          phone: string
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          created_at?: string
        }
      }
      roles: {
        Row: {
          id: number
          name: string
          permissions: Json
        }
        Insert: {
          id?: number
          name: string
          permissions?: Json
        }
        Update: {
          id?: number
          name?: string
          permissions?: Json
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role_id: number
          assigned_at: string
        }
        Insert: {
          user_id: string
          role_id: number
          assigned_at?: string
        }
        Update: {
          user_id?: string
          role_id?: number
          assigned_at?: string
        }
      }
      telecom_operators: {
        Row: {
          id: number
          name: string
          commission_rate: number
        }
        Insert: {
          id?: number
          name: string
          commission_rate: number
        }
        Update: {
          id?: number
          name?: string
          commission_rate?: number
        }
      }
      data_plans: {
        Row: {
          id: number
          operator_id: number
          name: string
          volume_go: number
          price: number
          validity_days: number
        }
        Insert: {
          id?: number
          operator_id: number
          name: string
          volume_go: number
          price: number
          validity_days: number
        }
        Update: {
          id?: number
          operator_id?: number
          name?: string
          volume_go?: number
          price?: number
          validity_days?: number
        }
      }
      subscriptions: {
        Row: {
          id: number
          user_id: string
          plan_id: number
          purchase_date: string
          expiration_date: string
        }
        Insert: {
          id?: number
          user_id: string
          plan_id: number
          purchase_date?: string
          expiration_date: string
        }
        Update: {
          id?: number
          user_id?: string
          plan_id?: number
          purchase_date?: string
          expiration_date?: string
        }
      }
      subscriptions_history: {
        Row: {
          history_id: number
          subscription_id: number
          user_id: string
          plan_id: number
          event: string
          event_time: string
        }
        Insert: {
          history_id?: number
          subscription_id: number
          user_id: string
          plan_id: number
          event: string
          event_time?: string
        }
        Update: {
          history_id?: number
          subscription_id?: number
          user_id?: string
          plan_id?: number
          event?: string
          event_time?: string
        }
      }
      saving_types: {
        Row: {
          id: number
          name: string
          lock_period_months: number
          withdrawal_frequency: string
        }
        Insert: {
          id?: number
          name: string
          lock_period_months: number
          withdrawal_frequency: string
        }
        Update: {
          id?: number
          name?: string
          lock_period_months?: number
          withdrawal_frequency?: string
        }
      }
      saving_parameters: {
        Row: {
          id: number
          saving_type_id: number
          saving_rate: number
          management_fee: number
        }
        Insert: {
          id?: number
          saving_type_id: number
          saving_rate: number
          management_fee: number
        }
        Update: {
          id?: number
          saving_type_id?: number
          saving_rate?: number
          management_fee?: number
        }
      }
      user_savings: {
        Row: {
          id: number
          user_id: string
          saving_type_id: number
          balance: number
          last_interest_date: string
        }
        Insert: {
          id?: number
          user_id: string
          saving_type_id: number
          balance: number
          last_interest_date: string
        }
        Update: {
          id?: number
          user_id?: string
          saving_type_id?: number
          balance?: number
          last_interest_date?: string
        }
      }
      transactions: {
        Row: {
          id: number
          user_id: string
          amount_paid: number
          data_cost: number
          saving_amount: number
          management_fee: number
          net_saving: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          amount_paid: number
          data_cost: number
          saving_amount: number
          management_fee: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          amount_paid?: number
          data_cost?: number
          saving_amount?: number
          management_fee?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_transaction_savings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      log_subscription_change: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Types dérivés pour une utilisation plus facile dans l'application
export type User = Database['public']['Tables']['users']['Row']
export type Role = Database['public']['Tables']['roles']['Row']
export type UserRole = Database['public']['Tables']['user_roles']['Row']
export type TelecomOperator = Database['public']['Tables']['telecom_operators']['Row']
export type DataPlan = Database['public']['Tables']['data_plans']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionHistory = Database['public']['Tables']['subscriptions_history']['Row']
export type SavingType = Database['public']['Tables']['saving_types']['Row']
export type SavingParameter = Database['public']['Tables']['saving_parameters']['Row']
export type UserSaving = Database['public']['Tables']['user_savings']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row'] 