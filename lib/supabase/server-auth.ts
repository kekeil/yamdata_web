import { createServerClient } from '@supabase/ssr';
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
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(
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
  
  const { data: { user }, error } = await supabaseServer.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }
  
  return { user };
};

// Middleware pour vérifier si l'utilisateur est admin (côté serveur)
export const requireServerAdmin = async () => {
  const { user } = await requireServerAuth();
  
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(
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
  
  const { data } = await supabaseServer
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id)
    .single<UserRoleResponse>();
    
  if (!data || data.roles.name !== 'admin') {
    redirect('/login');
  }
  
  return { user };
}; 