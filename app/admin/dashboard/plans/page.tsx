'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useOptimizedPlans } from '@/lib/hooks/useOptimizedPlans';
import Modal from '@/components/ui/Modal';

interface DataPlan {
  id: number;
  name: string;
  volume_mb: number;
  price: number;
  validity_days: number;
  telecom_operators: {
    id: number;
    name: string;
    commission_rate: number;
  };
}

export default function DataPlansPage() {
  const { 
    plans, 
    operators, 
    loading, 
    error, 
    addPlan, 
    deletePlan, 
    isAuthenticated, 
    isAdmin, 
    authLoading 
  } = useOptimizedPlans();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    volume_mb: 1,
    price: 0,
    validity_days: 30,
    operator_id: 0
  });

  // Initialiser l'opérateur par défaut
  useEffect(() => {
    if (operators.length > 0 && newPlan.operator_id === 0) {
      setNewPlan(prev => ({ ...prev, operator_id: operators[0].id }));
    }
  }, [operators, newPlan.operator_id]);


  async function handleAddPlan() {
    setAddError(null);
    setAddSuccess(null);
    setAddLoading(true);
    try {
      if (!newPlan.name || newPlan.volume_mb <= 0 || newPlan.price <= 0 || newPlan.validity_days <= 0 || !newPlan.operator_id) {
        setAddError('Veuillez remplir tous les champs correctement.');
        setAddLoading(false);
        return;
      }
      
      await addPlan({
        name: newPlan.name.trim(),
        volume_mb: newPlan.volume_mb,
        price: newPlan.price,
        validity_days: newPlan.validity_days,
        operator_id: newPlan.operator_id,
        active: true
      });
      
      setAddSuccess('Forfait ajouté avec succès !');
      setShowAddModal(false);
      setNewPlan({
        name: '',
        volume_mb: 1,
        price: 0,
        validity_days: 30,
        operator_id: operators[0]?.id || 0
      });
    } catch (error: any) {
      setAddError(error.message || "Erreur lors de l'ajout du forfait.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeletePlan(id: number) {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce forfait?')) {
      try {
        await deletePlan(id);
      } catch (error) {
        console.error('Erreur lors de la suppression du forfait:', error);
      }
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Accès refusé</h1>
          <p className="text-gray-500">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des Forfaits</h1>
        <button
          onClick={() => setShowAddModal(true)}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un forfait
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Liste des forfaits</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement des forfaits...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opérateur
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume (Go)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix (FCFA)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validité (jours)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucun forfait trouvé
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {plan.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${plan.telecom_operators.name === 'Orange' ? 'bg-orange-100 text-orange-800' : 
                        plan.telecom_operators.name === 'Telecel' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                        {plan.telecom_operators.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(plan.volume_mb / 1024).toFixed(2)} Go
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.price.toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.validity_days} jours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal d'ajout de forfait */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un nouveau forfait"
        size="lg"
      >
        <form onSubmit={e => { e.preventDefault(); handleAddPlan(); }} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    id="name"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={newPlan.name}
                    onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="operator" className="block text-sm font-medium text-gray-700">Opérateur</label>
                  <select
                    id="operator"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={newPlan.operator_id}
                    onChange={e => setNewPlan({ ...newPlan, operator_id: parseInt(e.target.value) })}
                    required
                  >
                    {operators.map(op => (
                      <option key={op.id} value={op.id}>{op.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="volume" className="block text-sm font-medium text-gray-700">Volume (Mo)</label>
                  <input
                    type="number"
                    id="volume"
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={newPlan.volume_mb}
                    onChange={e => setNewPlan({ ...newPlan, volume_mb: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Prix (FCFA)</label>
                  <input
                    type="number"
                    id="price"
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={newPlan.price}
                    onChange={e => setNewPlan({ ...newPlan, price: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="validity" className="block text-sm font-medium text-gray-700">Validité (jours)</label>
                  <input
                    type="number"
                    id="validity"
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={newPlan.validity_days}
                    onChange={e => setNewPlan({ ...newPlan, validity_days: parseInt(e.target.value) })}
                    required
                  />
                </div>
                {addError && <div className="text-sm text-red-600">{addError}</div>}
                {addSuccess && <div className="text-sm text-green-600">{addSuccess}</div>}
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
                    onClick={() => setShowAddModal(false)}
                    disabled={addLoading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
                    disabled={addLoading}
                  >
                    {addLoading ? 'Création...' : 'Créer'}
                  </button>
                </div>
        </form>
      </Modal>
    </div>
  );
} 