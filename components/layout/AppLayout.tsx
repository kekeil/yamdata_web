import { useSupabaseClient } from '@/lib/hooks/useSupabaseClient';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useSupabaseClient(); // Exposer Supabase pour le débogage
  
  // ... existing code ...
} 