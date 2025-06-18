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

// Middleware pour vérifier si l'utilisateur est connecté (côté client)
export const requireAuth = async () => {
  console.log('[AUTH DEBUG][requireAuth] Vérification de la session');
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[AUTH DEBUG][requireAuth] Session récupérée:', session);
  
  if (!session) {
    console.log('[AUTH DEBUG][requireAuth] Pas de session, redirection vers /login');
    redirect('/login');
  }
  
  return session;
};

// Middleware pour vérifier si l'utilisateur est admin (côté client)
export const requireAdmin = async () => {
  console.log('[AUTH DEBUG][requireAdmin] Début de la vérification admin');
  const session = await requireAuth();
  console.log('[AUTH DEBUG][requireAdmin] Session vérifiée, vérification du rôle admin');
  
  const { data } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', session.user.id)
    .single<UserRoleResponse>();
    
  console.log('[AUTH DEBUG][requireAdmin] Rôle récupéré:', data);
  
  if (!data || data.roles.name !== 'admin') {
    console.log('[AUTH DEBUG][requireAdmin] Utilisateur non admin, redirection vers /login');
    redirect('/login');
  }
  
  console.log('[AUTH DEBUG][requireAdmin] Utilisateur admin vérifié');
  return session;
}; 