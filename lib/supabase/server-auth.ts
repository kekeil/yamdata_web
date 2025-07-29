import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Interface pour le type de retour de la requête
interface UserRoleResponse {
  roles: {
    name: string;
  }
}

// Helper function to create server client
const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

// Middleware pour vérifier si l'utilisateur est connecté (côté serveur)
export const requireServerAuth = async () => {
  console.log('[AUTH DEBUG][requireServerAuth] Vérification de la session côté serveur');
  const supabaseServer = createSupabaseServerClient();
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
  
  const supabaseServer = createSupabaseServerClient();
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