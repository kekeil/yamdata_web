"use client";
import { useEffect } from 'react';
import { supabase } from '../supabase/client';

/**
 * Hook pour exposer le client Supabase au contexte global (window)
 * Utilisé uniquement pour le débogage
 */
export function useSupabaseClient() {
  useEffect(() => {
    // En développement uniquement, exposer le client pour le débogage
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore - Exposer Supabase dans la fenêtre pour le débogage
      window.supabase = supabase;
      console.log("✅ Client Supabase exposé dans window.supabase pour le débogage");
    }
  }, []);

  return supabase;
} 