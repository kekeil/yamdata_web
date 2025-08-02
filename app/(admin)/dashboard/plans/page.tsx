'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PencilIcon, TrashIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPlan, setEditPlan] = useState({
    name: '',
    volume_mb: 1024,
    price: 1000,
    validity_days: 30,
    operator_id: 0
  });
  const [operators, setOperators] = useState<{id: number, name: string}[]>([]);
  const [newPlan, setNewPlan] = useState({
    name: '',
    volume_mb: 1024,
    price: 1000,
    validity_days: 30,
    operator_id: 0
  });

  useEffect(() => {
    fetchPlans();
    fetchOperators();
  }, []);

  async function fetchPlans() {
    try {
      setLoading(true);
      console.log('[AUTH DEBUG][PlansPage] Début de la récupération des forfaits');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AUTH DEBUG][PlansPage] Session:', session);
      
      if (!session) {
        console.log('[AUTH DEBUG][PlansPage] Pas de session, redirection vers /login');
        window.location.href = '/login';
        return;
      }

      const { data, error } = await supabase
        .from('data_plans')
        .select(`
          id,
          name,
          volume_mb,
          price,
          validity_days,
          telecom_operators (
            id,
            name,
            commission_rate
          )
        `);

      if (error) {
        console.error('[AUTH DEBUG][PlansPage] Erreur Supabase:', error);
        throw error;
      }
      
      console.log('[AUTH DEBUG][PlansPage] Forfaits récupérés:', data);
      setPlans(data || []);
    } catch (error) {
      console.error('[AUTH DEBUG][PlansPage] Erreur lors de la récupération des forfaits:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOperators() {
    try {
      console.log('[AUTH DEBUG][PlansPage] Début de la récupération des opérateurs');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[AUTH DEBUG][PlansPage] Pas de session pour la récupération des opérateurs');
        return;
      }

      const { data, error } = await supabase
        .from('telecom_operators')
        .select('id, name');

      if (error) {
        console.error('[AUTH DEBUG][PlansPage] Erreur Supabase (opérateurs):', error);
        throw error;
      }
      
      console.log('[AUTH DEBUG][PlansPage] Opérateurs récupérés:', data);
      setOperators(data || []);
      if (data && data.length > 0) {
        setNewPlan(prev => ({ ...prev, operator_id: data[0].id }));
        console.log('[DEBUG] Opérateur par défaut défini:', data[0].id);
      } else {
        console.log('[DEBUG] Aucun opérateur trouvé');
      }
    } catch (error) {
      console.error('[AUTH DEBUG][PlansPage] Erreur lors de la récupération des opérateurs:', error);
    }
  }

  async function handleAddPlan() {
    setAddError(null);
    setAddSuccess(null);
    setAddLoading(true);
    
    console.log('[DEBUG] Tentative d\'ajout de forfait:', newPlan);
    
    try {
      // Validation détaillée
      if (!newPlan.name) {
        setAddError('Le nom du forfait est requis.');
        setAddLoading(false);
        return;
      }
      if (newPlan.volume_mb <= 0) {
        setAddError('Le volume doit être supérieur à 0.');
        setAddLoading(false);
        return;
      }
      if (newPlan.price <= 0) {
        setAddError('Le prix doit être supérieur à 0.');
        setAddLoading(false);
        return;
      }
      if (newPlan.validity_days <= 0) {
        setAddError('La validité doit être supérieure à 0.');
        setAddLoading(false);
        return;
      }
      if (newPlan.operator_id <= 0) {
        setAddError('Veuillez sélectionner un opérateur.');
        setAddLoading(false);
        return;
      }
      
      console.log('[DEBUG] Validation passée, vérification session...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAddError('Session expirée, veuillez vous reconnecter.');
        setAddLoading(false);
        return;
      }
      
      console.log('[DEBUG] Session OK, insertion en cours...');
      
      const { data, error } = await supabase
        .from('data_plans')
        .insert({
          name: newPlan.name,
          volume_mb: newPlan.volume_mb,
          price: newPlan.price,
          validity_days: newPlan.validity_days,
          operator_id: newPlan.operator_id
        })
        .select();
      
      console.log('[DEBUG] Résultat insertion:', { data, error });
      
      if (error) throw error;
      
      setAddSuccess('Forfait ajouté avec succès !');
      setTimeout(() => {
        setShowAddModal(false);
        setNewPlan({
          name: '',
          volume_mb: 1024,
          price: 1000,
          validity_days: 30,
          operator_id: operators[0]?.id || 0
        });
        fetchPlans();
      }, 1500);
    } catch (error: any) {
      console.error('[DEBUG] Erreur lors de l\'ajout:', error);
      setAddError(error.message || "Erreur lors de l'ajout du forfait.");
    } finally {
      setAddLoading(false);
    }
  }

  function startEditingPlan(plan: DataPlan) {
    setEditingId(plan.id);
    setEditPlan({
      name: plan.name,
      volume_mb: plan.volume_mb,
      price: plan.price,
      validity_days: plan.validity_days,
      operator_id: plan.telecom_operators.id
    });
  }

  async function handleUpdatePlan() {
    try {
      if (!editPlan.name || editPlan.volume_mb <= 0 || editPlan.price <= 0 || editPlan.validity_days <= 0 || editPlan.operator_id <= 0) {
        alert('Veuillez remplir tous les champs correctement.');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expirée, veuillez vous reconnecter.');
        return;
      }

      const { error } = await supabase
        .from('data_plans')
        .update({
          name: editPlan.name,
          volume_mb: editPlan.volume_mb,
          price: editPlan.price,
          validity_days: editPlan.validity_days,
          operator_id: editPlan.operator_id
        })
        .eq('id', editingId);

      if (error) throw error;
      
      setEditingId(null);
      fetchPlans();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du forfait:', error);
      alert(error.message || 'Erreur lors de la mise à jour du forfait.');
    }
  }

  function cancelEditingPlan() {
    setEditingId(null);
  }

  async function handleDeletePlan(id: number) {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce forfait?')) {
      try {
        console.log('[AUTH DEBUG][PlansPage] Début de la suppression du forfait:', id);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[AUTH DEBUG][PlansPage] Pas de session pour la suppression du forfait');
          return;
        }

        const { error } = await supabase
          .from('data_plans')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('[AUTH DEBUG][PlansPage] Erreur Supabase (suppression):', error);
          throw error;
        }
        
        console.log('[AUTH DEBUG][PlansPage] Forfait supprimé avec succès');
        fetchPlans();
      } catch (error) {
        console.error('[AUTH DEBUG][PlansPage] Erreur lors de la suppression du forfait:', error);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des Forfaits</h1>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              console.log('[TEST] Test de connexion...');
              const { data, error } = await supabase.from('telecom_operators').select('*');
              console.log('[TEST] Opérateurs:', { data, error });
              alert(`Opérateurs trouvés: ${data?.length || 0}`);
            }}
            type="button"
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Test DB
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter un forfait
          </button>
        </div>
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
                      {editingId === plan.id ? (
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={editPlan.name}
                          onChange={e => setEditPlan({ ...editPlan, name: e.target.value })}
                        />
                      ) : (
                        plan.name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === plan.id ? (
                        <select
                          className="border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={editPlan.operator_id}
                          onChange={e => setEditPlan({ ...editPlan, operator_id: parseInt(e.target.value) })}
                        >
                          {operators.map(op => (
                            <option key={op.id} value={op.id}>{op.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${plan.telecom_operators.name === 'Orange' ? 'bg-orange-100 text-orange-800' : 
                          plan.telecom_operators.name === 'Telecel' ? 'bg-red-100 text-red-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                          {plan.telecom_operators.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === plan.id ? (
                        <input
                          type="number"
                          min="1"
                          className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={editPlan.volume_mb}
                          onChange={e => setEditPlan({ ...editPlan, volume_mb: parseInt(e.target.value) || 1 })}
                        />
                      ) : (
                        `${(plan.volume_mb / 1024).toFixed(2)} Go`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === plan.id ? (
                        <input
                          type="number"
                          min="1"
                          className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={editPlan.price}
                          onChange={e => setEditPlan({ ...editPlan, price: parseInt(e.target.value) || 1 })}
                        />
                      ) : (
                        `${plan.price.toLocaleString()} FCFA`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === plan.id ? (
                        <input
                          type="number"
                          min="1"
                          className="w-16 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={editPlan.validity_days}
                          onChange={e => setEditPlan({ ...editPlan, validity_days: parseInt(e.target.value) || 1 })}
                        />
                      ) : (
                        `${plan.validity_days} jours`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {editingId === plan.id ? (
                          <>
                            <button 
                              onClick={handleUpdatePlan}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={cancelEditingPlan}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => startEditingPlan(plan)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleDeletePlan(plan.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
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
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-500 bg-opacity-75">
        <div 
          className="relative bg-white rounded-lg shadow-xl mx-4 p-6 w-full max-w-lg"
          onClick={e => e.stopPropagation()} // Empêche la fermeture quand on clique à l'intérieur
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter un nouveau forfait</h3>
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
                    <option value="0">Sélectionner un opérateur</option>
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
        </div>
      </div>
      )}
    </div>
  );
} 