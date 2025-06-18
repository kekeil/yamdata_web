import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Interface pour le type de retour de la requête
interface UserRoleResponse {
  roles: {
    name: string;
  }
}

// Middleware pour vérifier si l'utilisateur est connecté (côté serveur)
export const requireServerAuth = async () => {
  console.log('[AUTH DEBUG][requireServerAuth] Vérification de la session côté serveur');
  const supabaseServer = createServerComponentClient({ cookies });
  const { data: { session } } = await supabaseServer.auth.getSession();
  console.log('[AUTH DEBUG][requireServerAuth] Session récupérée:', session);
  
  if (!session) {
    console.log('[AUTH DEBUG][requireServerAuth] Pas de session, redirection vers /login');
    redirect('/login');
  }
  
  return session;
};

// Middleware pour vérifier si l'utilisateur est admin (côté serveur)
export const requireServerAdmin = async () => {
  console.log('[AUTH DEBUG][requireServerAdmin] Début de la vérification admin côté serveur');
  const session = await requireServerAuth();
  console.log('[AUTH DEBUG][requireServerAdmin] Session vérifiée, vérification du rôle admin');
  
  const supabaseServer = createServerComponentClient({ cookies });
  const { data } = await supabaseServer
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', session.user.id)
    .single<UserRoleResponse>();
    
  console.log('[AUTH DEBUG][requireServerAdmin] Rôle récupéré:', data);
  
  if (!data || data.roles.name !== 'admin') {
    console.log('[AUTH DEBUG][requireServerAdmin] Utilisateur non admin, redirection vers /login');
    redirect('/login');
  }
  
  console.log('[AUTH DEBUG][requireServerAdmin] Utilisateur admin vérifié');
  return session;
}; 