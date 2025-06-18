import { redirect } from 'next/navigation';
import { requireServerAdmin } from '@/lib/supabase/server-auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yamdata Admin - Dashboard',
  description: 'Tableau de bord administrateur pour Yamdata',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[AUTH DEBUG][AdminLayout] Début de la vérification admin');
  try {
    // Vérifier si l'utilisateur est admin
    const session = await requireServerAdmin();
    console.log('[AUTH DEBUG][AdminLayout] Session admin vérifiée:', session);
    
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  } catch (error) {
    console.log('[AUTH DEBUG][AdminLayout] Erreur de vérification admin:', error);
    // Rediriger vers la page de login si non autorisé
    redirect('/login');
  }
} 