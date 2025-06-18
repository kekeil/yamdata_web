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

// Fonction pour se déconnecter
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Middleware pour vérifier si l'utilisateur est connecté
export const requireAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
};

// Middleware pour vérifier si l'utilisateur est admin
export const requireAdmin = async () => {
  const session = await requireAuth();
  
  const { data } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', session.user.id)
    .single<UserRoleResponse>();
    
  if (!data || data.roles.name !== 'admin') {
    redirect('/login');
  }
  
  return session;
}; 