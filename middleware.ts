import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Routes publiques (accessibles sans authentification)
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  
  // Routes protégées qui nécessitent une authentification
  const protectedRoutes = ['/forfaits', '/epargne', '/transactions', '/profil', '/dashboard'];
  
  // Routes admin
  const adminRoutes = ['/admin'];

  // Vérifier si c'est une route protégée
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  // Récupérer les cookies d'authentification Supabase
  const supabaseAuthToken = req.cookies.get('sb-access-token')?.value || 
                           req.cookies.get('supabase-auth-token')?.value;

  // Si c'est une route protégée et pas de token
  if ((isProtectedRoute || isAdminRoute) && !supabaseAuthToken) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Si authentifié et sur /login ou /register, rediriger vers dashboard
  if (isPublicRoute && (path === '/login' || path === '/register') && supabaseAuthToken) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};