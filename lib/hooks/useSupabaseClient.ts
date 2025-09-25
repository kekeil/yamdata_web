"use client";
import { supabase } from '../supabase/client';

/**
 * Hook pour obtenir le client Supabase
 */
export function useSupabaseClient() {
  return supabase;
} 