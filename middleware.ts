import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  // --- MIDDLEWARE DÉSACTIVÉ TEMPORAIREMENT POUR DEBUG ---
  // // Initialiser le client Supabase
  // const res = NextResponse.next();
  // const supabase = createMiddlewareClient({ req: request, res });
  // // Vérifier si l'utilisateur est connecté
  // const { data: { session } } = await supabase.auth.getSession();
  // // Log de session pour debug
  // console.log('[MIDDLEWARE][SESSION]', session);
  // // ... toute la logique de redirection ...
  return NextResponse.next();
}

// Configurer les chemins sur lesquels le middleware s'applique
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/access-denied'],
}; 