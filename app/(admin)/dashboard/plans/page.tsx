'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface DataPlan {
  id: number;
  name: string;
  volume_go: number;
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
  const [operators, setOperators] = useState<{id: number, name: string}[]>([]);
  const [newPlan, setNewPlan] = useState({
    name: '',
    volume_go: 1,
    price: 0,
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
      const { data, error } = await supabase
        .from('data_plans')
        .select(`
          id,
          name,
          volume_go,
          price,
          validity_days,
          telecom_operators (
            id,
            name,
            commission_rate
          )
        `);

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des forfaits:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOperators() {
    try {
      const { data, error } = await supabase
        .from('telecom_operators')
        .select('id, name');

      if (error) throw error;
      setOperators(data || []);
      if (data && data.length > 0) {
        setNewPlan(prev => ({ ...prev, operator_id: data[0].id }));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des opérateurs:', error);
    }
  }

  async function handleAddPlan() {
    try {
      const { error } = await supabase
        .from('data_plans')
        .insert({
          name: newPlan.name,
          volume_go: newPlan.volume_go,
          price: newPlan.price,
          validity_days: newPlan.validity_days,
          operator_id: newPlan.operator_id
        });

      if (error) throw error;
      
      setShowAddModal(false);
      setNewPlan({
        name: '',
        volume_go: 1,
        price: 0,
        validity_days: 30,
        operator_id: operators[0]?.id || 0
      });
      
      fetchPlans();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du forfait:', error);
    }
  }

  async function handleDeletePlan(id: number) {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce forfait?')) {
      try {
        const { error } = await supabase
          .from('data_plans')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchPlans();
      } catch (error) {
        console.error('Erreur lors de la suppression du forfait:', error);
      }
    }
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
        <div className="overflow-x-auto">
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
                        {plan.volume_go} Go
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plan.price.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plan.validity_days} jours
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
      </div>

      {/* Modal d'ajout de forfait */}
      {showAddModal && (
        <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowAddModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Ajouter un nouveau forfait
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
                        <input
                          type="text"
                          id="name"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={newPlan.name}
                          onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label htmlFor="operator" className="block text-sm font-medium text-gray-700">Opérateur</label>
                        <select
                          id="operator"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={newPlan.operator_id}
                          onChange={(e) => setNewPlan({ ...newPlan, operator_id: parseInt(e.target.value) })}
                        >
                          {operators.map(op => (
                            <option key={op.id} value={op.id}>{op.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="volume" className="block text-sm font-medium text-gray-700">Volume (Go)</label>
                        <input
                          type="number"
                          id="volume"
                          min="0"
                          step="0.1"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={newPlan.volume_go}
                          onChange={(e) => setNewPlan({ ...newPlan, volume_go: parseFloat(e.target.value) })}
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
                          onChange={(e) => setNewPlan({ ...newPlan, price: parseInt(e.target.value) })}
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
                          onChange={(e) => setNewPlan({ ...newPlan, validity_days: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleAddPlan}
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 