import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase/auth';
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
  try {
    // Vérifier si l'utilisateur est admin
    await requireAdmin();
    
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  } catch (error) {
    // Rediriger vers la page de login si non autorisé
    redirect('/login');
  }
} 