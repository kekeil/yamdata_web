import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  // Initialiser le client Supabase
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  // Vérifier si l'utilisateur est connecté
  const { data: { session } } = await supabase.auth.getSession();
  
  // Logs pour le débogage
  console.log("🔍 Middleware - URL:", request.nextUrl.pathname);
  console.log("👤 Middleware - Session:", session ? `Utilisateur: ${session.user.email}` : "Pas de session");
  
  // Si l'utilisateur essaie d'accéder au dashboard sans être connecté
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    console.log("🚫 Middleware - Accès refusé au dashboard (non connecté)");
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Si l'utilisateur est connecté et essaie d'accéder aux routes protégées
  if (request.nextUrl.pathname.startsWith('/dashboard') && session) {
    // Vérifier si l'utilisateur est admin
    try {
      console.log("🔍 Middleware - Vérification du rôle admin pour:", session.user.email);
      
      // Récupérer d'abord tous les rôles
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('*');
      
      if (rolesError) {
        console.error("❌ Middleware - Erreur lors de la récupération des rôles:", rolesError.message);
        return res;
      }
      
      console.log("📋 Middleware - Rôles disponibles:", roles);
      
      // Trouver l'ID du rôle admin
      const adminRole = roles?.find(role => role.name === 'admin');
      console.log("👑 Middleware - Rôle admin trouvé:", adminRole);
      
      if (!adminRole) {
        console.log("⚠️ Middleware - Rôle admin non trouvé dans la base de données");
        // Rediriger vers une page d'accès refusé
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
      
      // Récupérer les rôles de l'utilisateur
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', session.user.id);
      
      if (userRolesError) {
        console.error("❌ Middleware - Erreur lors de la récupération des rôles de l'utilisateur:", userRolesError.message);
        return res;
      }
      
      console.log("📋 Middleware - Rôles de l'utilisateur:", userRoles);
      
      // Vérifier si l'utilisateur a le rôle admin
      const isAdmin = userRoles?.some(role => role.role_id === adminRole.id);
      console.log("👑 Middleware - Est admin:", isAdmin);
      
      if (!isAdmin) {
        console.log("🚫 Middleware - Accès refusé au dashboard (pas admin)");
        // Rediriger vers une page d'accès refusé
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
    } catch (error) {
      console.error("❌ Middleware - Erreur:", error);
    }
  }
  
  // Si l'utilisateur est déjà connecté et essaie d'accéder à la page de login
  if (request.nextUrl.pathname === '/login' && session) {
    // Vérifier si l'utilisateur est admin
    try {
      console.log("🔍 Middleware - Vérification du rôle admin pour redirection depuis login:", session.user.email);
      
      // Récupérer d'abord tous les rôles
      const { data: roles } = await supabase
        .from('roles')
        .select('*');
      
      // Trouver l'ID du rôle admin
      const adminRole = roles?.find(role => role.name === 'admin');
      
      if (adminRole) {
        // Récupérer les rôles de l'utilisateur
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', session.user.id);
        
        // Si l'utilisateur a le rôle admin, rediriger vers le dashboard
        if (userRoles?.some(role => role.role_id === adminRole.id)) {
          console.log("✅ Middleware - Redirection vers le dashboard (admin connecté)");
          return NextResponse.redirect(new URL('/dashboard/overview', request.url));
        }
      }
    } catch (error) {
      console.error("❌ Middleware - Erreur:", error);
    }
  }
  
  return res;
}

// Configurer les chemins sur lesquels le middleware s'applique
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/access-denied'],
}; 