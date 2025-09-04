'use client';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Créer un client Supabase pour utilisation côté client (navigateur) avec gestion automatique du cookie
export const supabase = createPagesBrowserClient();

// Interface pour le type de retour de la requête
interface UserRoleResponse {
  roles: {
    name: string;
  }
}

// Exporter un helper pour vérifier si un utilisateur est admin
export const isAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  try {
    // Utiliser une requête RPC pour contourner les politiques RLS
    const { data, error } = await supabase.rpc('is_user_admin', {
      user_id_param: user.id
    });
    
    if (error) {
      console.error("Erreur lors de la vérification du rôle admin:", error.message);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Erreur lors de la vérification du rôle admin:", error);
    return false;
  }
}; 