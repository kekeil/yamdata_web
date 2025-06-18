/**
 * Client d'administration pour les opérations qui nécessitent de contourner les politiques RLS
 * Ce client est utilisé uniquement dans l'application côté client
 */

import { supabase } from '../supabase/client';

/**
 * Vérifie si un utilisateur a le rôle admin via RPC
 */
export async function checkAdminRoleDirectly(userId: string): Promise<boolean> {
  try {
    console.log("Vérification du rôle admin pour:", userId);
    
    // Utiliser une fonction RPC qui contourne les politiques RLS
    const { data, error } = await supabase.rpc('is_user_admin', {
      user_id_param: userId
    });
    
    if (error) {
      console.error("Erreur lors de la vérification du rôle admin:", error.message);
      return false;
    }
    
    console.log("Résultat vérification admin:", data);
    return !!data;
  } catch (error: any) {
    console.error("Erreur lors de la vérification du rôle admin:", error.message);
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
      console.error("Erreur lors de l'attribution du rôle admin:", error.message);
      return false;
    }
    
    console.log("Rôle admin attribué avec succès");
    return true;
  } catch (error: any) {
    console.error("Erreur lors de l'attribution du rôle admin:", error.message);
    return false;
  }
} 