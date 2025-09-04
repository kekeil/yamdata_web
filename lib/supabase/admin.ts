/**
 * Client Supabase avec les privilèges d'administration
 * Utilise la clé de service pour contourner les politiques RLS
 * 
 * IMPORTANT: N'utilisez ce client que pour les opérations administratives
 * qui nécessitent de contourner les politiques RLS
 */
'use client';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Récupérer les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vérifier si la clé de service est définie
if (!supabaseServiceKey) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY n\'est pas définie. Le client admin ne fonctionnera pas correctement.');
}

// Créer un client Supabase avec la clé de service
// Cette clé permet de contourner les politiques RLS
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Fonction pour vérifier si le client admin est disponible
export function isAdminClientAvailable(): boolean {
  return !!supabaseAdmin;
} 