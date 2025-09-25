import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedAuth } from './useOptimizedAuth';

interface Operator {
  id: number;
  name: string;
  commission_rate: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useOptimizedOperators() {
  const { user, isAdmin, isLoading: authLoading } = useOptimizedAuth({ 
    requireAuth: true, 
    requireAdmin: true 
  });
  
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchOperators = useCallback(async () => {
    if (hasFetched.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: operatorsError } = await supabase
        .from('telecom_operators')
        .select('*')
        .order('name');

      if (operatorsError) {
        console.error('Erreur lors de la récupération des opérateurs:', operatorsError);
        throw operatorsError;
      }

      setOperators(data || []);
      hasFetched.current = true;
    } catch (err: any) {
      console.error('Erreur lors du chargement des opérateurs:', err);
      setError(err.message || 'Erreur lors du chargement des opérateurs');
    } finally {
      setLoading(false);
    }
  }, []);

  const addOperator = useCallback(async (operatorData: Omit<Operator, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      
      // Vérifier si l'opérateur existe déjà
      const { data: existingOperator } = await supabase
        .from('telecom_operators')
        .select('id')
        .eq('name', operatorData.name)
        .single();
        
      if (existingOperator) {
        throw new Error('Cet opérateur existe déjà.');
      }
      
      const { data, error } = await supabase
        .from('telecom_operators')
        .insert({
          name: operatorData.name.trim(),
          commission_rate: Number(operatorData.commission_rate.toFixed(3)),
          active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'ajout de l\'opérateur:', error);
        throw error;
      }

      // Mettre à jour la liste locale
      setOperators(prev => [...prev, data]);
      hasFetched.current = false; // Permettre le rechargement
      
      return data;
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout de l\'opérateur:', err);
      setError(err.message || 'Erreur lors de l\'ajout de l\'opérateur');
      throw err;
    }
  }, []);

  const updateOperator = useCallback(async (id: number, updates: Partial<Operator>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('telecom_operators')
        .update({
          ...updates,
          commission_rate: updates.commission_rate ? Number(updates.commission_rate.toFixed(3)) : undefined
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour de l\'opérateur:', error);
        throw error;
      }

      // Mettre à jour la liste locale
      setOperators(prev => prev.map(op => op.id === id ? data : op));
      
      return data;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de l\'opérateur:', err);
      setError(err.message || 'Erreur lors de la mise à jour de l\'opérateur');
      throw err;
    }
  }, []);

  const deleteOperator = useCallback(async (id: number) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('telecom_operators')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression de l\'opérateur:', error);
        throw error;
      }

      // Mettre à jour la liste locale
      setOperators(prev => prev.filter(op => op.id !== id));
      
    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'opérateur:', err);
      setError(err.message || 'Erreur lors de la suppression de l\'opérateur');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && isAdmin && !hasFetched.current) {
      fetchOperators();
    }
  }, [authLoading, user, isAdmin, fetchOperators]);

  const refreshOperators = useCallback(() => {
    hasFetched.current = false;
    fetchOperators();
  }, [fetchOperators]);

  return {
    operators,
    loading,
    error,
    addOperator,
    updateOperator,
    deleteOperator,
    refreshOperators,
    isAuthenticated: !!user,
    isAdmin,
    authLoading
  };
}
