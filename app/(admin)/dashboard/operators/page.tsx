'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PencilIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useOptimizedOperators } from '@/lib/hooks/useOptimizedOperators';
import Modal from '@/components/ui/Modal';

interface Operator {
  id: number;
  name: string;
  commission_rate: number;
}

export default function OperatorsPage() {
  const { 
    operators, 
    loading, 
    error, 
    addOperator, 
    updateOperator, 
    deleteOperator, 
    isAuthenticated, 
    isAdmin, 
    authLoading 
  } = useOptimizedOperators();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    name: string;
    commission_rate: number;
  }>({
    name: '',
    commission_rate: 0
  });
  const [newOperator, setNewOperator] = useState({
    name: 'Telecel',
    commission_rate: 0.05
  });


  function startEditing(operator: Operator) {
    setEditingId(operator.id);
    setEditValues({
      name: operator.name,
      commission_rate: operator.commission_rate
    });
  }

  async function saveChanges(id: number) {
    try {
      await updateOperator(id, {
        name: editValues.name,
        commission_rate: editValues.commission_rate
      });
      
      setEditingId(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'opérateur:', error);
    }
  }

  async function handleAddOperator() {
    setAddError(null);
    setAddSuccess(null);
    setAddLoading(true);
    try {
      if (!newOperator.name || newOperator.commission_rate < 0) {
        setAddError('Veuillez remplir tous les champs correctement.');
        setAddLoading(false);
        return;
      }
      
      await addOperator({
        name: newOperator.name.trim(),
        commission_rate: Number(newOperator.commission_rate.toFixed(3)),
        active: true
      });
      
      setAddSuccess('Opérateur ajouté avec succès !');
      setShowAddModal(false);
      setNewOperator({ name: 'Telecel', commission_rate: 0.05 });
    } catch (error: any) {
      setAddError(error.message || "Erreur lors de l'ajout de l'opérateur.");
    } finally {
      setAddLoading(false);
    }
  }

  function cancelEditing() {
    setEditingId(null);
  }

  function formatPercent(value: number) {
    return (value * 100).toFixed(2) + '%';
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
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des Opérateurs</h1>
        <button
          onClick={() => setShowAddModal(true)}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un opérateur
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Liste des opérateurs télécom</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Chargement des opérateurs...</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux de commission
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {operators.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      Aucun opérateur trouvé
                    </td>
                  </tr>
                ) : (
                  operators.map((operator) => (
                    <tr key={operator.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === operator.id ? (
                          <select
                            className="border border-gray-300 rounded-md shadow-sm py-1 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            value={editValues.name}
                            onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                          >
                            <option value="Telecel">Telecel</option>
                            <option value="Orange">Orange</option>
                            <option value="Moov">Moov</option>
                          </select>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${operator.name === 'Orange' ? 'bg-orange-100 text-orange-800' : 
                            operator.name === 'Telecel' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                            {operator.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === operator.id ? (
                          <input
                            type="number"
                            min="0"
                            max="0.5"
                            step="0.001"
                            className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            value={editValues.commission_rate}
                            onChange={(e) => setEditValues({...editValues, commission_rate: parseFloat(e.target.value)})}
                          />
                        ) : (
                          formatPercent(operator.commission_rate)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === operator.id ? (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => saveChanges(operator.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={cancelEditing}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => startEditing(operator)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal d'ajout d'opérateur */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un nouvel opérateur"
        size="md"
      >
        <form onSubmit={e => { e.preventDefault(); handleAddOperator(); }} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
                  <select
                    id="name"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={newOperator.name}
                    onChange={e => setNewOperator({ ...newOperator, name: e.target.value })}
                    required
                  >
                    <option value="Telecel">Telecel</option>
                    <option value="Orange">Orange</option>
                    <option value="Moov">Moov</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="commission" className="block text-sm font-medium text-gray-700">Taux de commission</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      id="commission"
                      min="0"
                      max="0.5"
                      step="0.001"
                      className="focus:ring-green-500 focus:border-green-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      value={newOperator.commission_rate}
                      onChange={e => setNewOperator({ ...newOperator, commission_rate: parseFloat(e.target.value) })}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Le taux de commission est appliqué sur chaque transaction.</p>
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