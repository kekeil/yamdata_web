"use client";
import { supabase } from './client';
import { redirect } from 'next/navigation';

// Interface pour le type de retour de la requête
interface UserRoleResponse {
  roles: {
    name: string;
  }
}

// Fonction pour se connecter avec email et mot de passe
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

// Fonction pour se déconnecter - CORRIGÉE
export const signOut = async () => {
  try {
    // 1. Déconnexion de Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erreur Supabase signOut:', error);
      throw error;
    }
    
    // 2. Nettoyer le localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // 3. Supprimer tous les canaux Supabase
    await supabase.removeAllChannels();
    
    return { error: null };
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return { error };
  }
};

// Middleware pour vérifier si l'utilisateur est connecté (côté client)
export const requireAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }
  
  return { user };
};

// Middleware pour vérifier si l'utilisateur est admin (côté client)
export const requireAdmin = async () => {
  const { user } = await requireAuth();
  
  const { data } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id)
    .single<UserRoleResponse>();
    
  if (!data || data.roles.name !== 'admin') {
    redirect('/login');
  }
  
  return { user };
};