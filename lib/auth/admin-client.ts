/**
 * Client d'administration pour les opérations qui nécessitent de contourner les politiques RLS
 * Ce client est utilisé uniquement dans l'application côté client
 */
"use client"
import { supabase } from '../supabase/client';

/**
 * Vérifie si un utilisateur a le rôle admin via RPC
 */
export async function checkAdminRoleDirectly(userId: string): Promise<boolean> {
  try {
    // Utiliser une fonction RPC qui contourne les politiques RLS
    const { data, error } = await supabase.rpc('is_user_admin', {
      user_id_param: userId
    });
    
    if (error) {
      return false;
    }
    
    return !!data;
  } catch (error: any) {
    return false;
  }
}

/**
 * Ajoute manuellement le rôle admin à un utilisateur via RPC
 */
export async function addAdminRoleToUser(userId: string): Promise<boolean> {
  try {
    // Utiliser une fonction RPC qui contourne les politiques RLS
    const { data, error } = await supabase.rpc('add_admin_role', {
      user_id_param: userId
    });
    
    if (error) {
      return false;
    }
    
    return true;
  } catch (error: any) {
    return false;
  }
} 