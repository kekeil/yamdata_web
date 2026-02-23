import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/signup'];
  const protectedRoutes = ['/forfaits', '/epargne', '/transactions', '/profil', '/dashboard'];
  const adminRoutes = ['/admin'];

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));
  const isLoginOrRegister = path === '/login' || path === '/register' || path === '/signup';

  // Créer une réponse modifiable pour Supabase SSR
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  // Créer le client Supabase SSR (il lit/écrit les cookies correctement)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
          });
          response = NextResponse.next({ request: { headers: req.headers } });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Récupérer la session (méthode correcte pour SSR)
  const { data: { user } } = await supabase.auth.getUser();

  // Route protégée sans session → login
  if ((isProtectedRoute || isAdminRoute) && !user) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Déjà connecté sur login/register → dashboard
  if (isLoginOrRegister && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};