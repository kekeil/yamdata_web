import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Mise en cache optimisée pour les assets statiques et API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Cache les réponses API pour 1 minute
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }
  
  // Préchargement des ressources critiques pour le dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    response.headers.set('Link', [
      '</dashboard/overview>; rel=prefetch',
      '</dashboard/users>; rel=prefetch',
      '</dashboard/preregistrations>; rel=prefetch'
    ].join(', '));
  }
  
  return response;
}

// Configurer les chemins sur lesquels le middleware s'applique
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/access-denied'],
}; 