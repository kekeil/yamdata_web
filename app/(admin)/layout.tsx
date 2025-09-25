import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yamdata Admin - Dashboard',
  description: 'Tableau de bord administrateur pour Yamdata',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // L'authentification est maintenant gérée par le middleware
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 