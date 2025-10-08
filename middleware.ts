import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Mise en cache optimisée pour les assets statiques et API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Cache les réponses API pour 1 minute
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }
  
  // Préchargement des ressources critiques pour le dashboard
  if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    response.headers.set('Link', [
      '</admin/dashboard/overview>; rel=prefetch',
      '</admin/dashboard/users>; rel=prefetch',
      '</admin/dashboard/preregistrations>; rel=prefetch'
    ].join(', '));
  }
  
  // Vérification d'authentification pour les routes protégées
  if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
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
                // Ignorer les erreurs de cookies
              }
            },
          }
        }
      );

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Vérifier si l'utilisateur est admin
      const { data: isAdminResult } = await supabase.rpc('is_user_admin', {
        user_id_param: user.id
      });

      if (!isAdminResult) {
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return response;
}

// Configurer les chemins sur lesquels le middleware s'applique
export const config = {
  matcher: ['/admin/dashboard/:path*', '/login', '/access-denied'],
}; 