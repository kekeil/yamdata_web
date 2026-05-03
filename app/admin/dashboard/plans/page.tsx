'use client';

import { useState, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useOptimizedPlans } from '@/lib/hooks/useOptimizedPlans';
import Modal from '@/components/ui/Modal';

interface DataPlan {
  id: number;
  name: string;
  volume_mb: number;
  price: number;
  validity_days: number;
  code_offer: string | null;
  telecom_operators: {
    id: number;
    name: string;
    commission_rate: number;
  };
}

type PlanFormValue = {
  name: string;
  code_offer: string;
  volume_mb: number;
  price: number;
  validity_days: number;
  operator_id: number;
};

const CODE_OFFER_INVALID_MSG =
  'Format invalide. Caractères autorisés : lettres, chiffres, _ et -';

function normalizeCodeOfferForSubmit(raw: string): { value: string | null; error: string | null } {
  const t = raw.trim();
  if (t === '') {
    return { value: null, error: null };
  }
  if (!/^[A-Za-z0-9_-]+$/.test(t)) {
    return { value: null, error: CODE_OFFER_INVALID_MSG };
  }
  return { value: t, error: null };
}

function PlanForm({
  value,
  onChange,
  disabled,
  operators,
}: {
  value: PlanFormValue;
  onChange: (next: PlanFormValue) => void;
  disabled?: boolean;
  operators: { id: number; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="plan-name" className="block text-sm font-medium text-gray-700">
          Nom
        </label>
        <input
          type="text"
          id="plan-name"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label htmlFor="plan-code-offer" className="block text-sm font-medium text-gray-700">
          Code offre
        </label>
        <input
          type="text"
          id="plan-code-offer"
          placeholder="Ex: DATA_100MB"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm font-mono text-xs"
          value={value.code_offer}
          onChange={(e) => onChange({ ...value, code_offer: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div>
        <label htmlFor="plan-operator" className="block text-sm font-medium text-gray-700">
          Opérateur
        </label>
        <select
          id="plan-operator"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          value={value.operator_id}
          onChange={(e) => onChange({ ...value, operator_id: parseInt(e.target.value, 10) })}
          required
          disabled={disabled}
        >
          {operators.map((op) => (
            <option key={op.id} value={op.id}>
              {op.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="plan-volume" className="block text-sm font-medium text-gray-700">
          Volume (Mo)
        </label>
        <input
          type="number"
          id="plan-volume"
          min={1}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          value={value.volume_mb}
          onChange={(e) => onChange({ ...value, volume_mb: parseInt(e.target.value, 10) || 0 })}
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label htmlFor="plan-price" className="block text-sm font-medium text-gray-700">
          Prix (FCFA)
        </label>
        <input
          type="number"
          id="plan-price"
          min={0}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          value={value.price}
          onChange={(e) => onChange({ ...value, price: parseInt(e.target.value, 10) || 0 })}
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label htmlFor="plan-validity" className="block text-sm font-medium text-gray-700">
          Validité (jours)
        </label>
        <input
          type="number"
          id="plan-validity"
          min={1}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          value={value.validity_days}
          onChange={(e) => onChange({ ...value, validity_days: parseInt(e.target.value, 10) || 0 })}
          required
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function defaultPlanForm(operatorId: number): PlanFormValue {
  return {
    name: '',
    code_offer: '',
    volume_mb: 1,
    price: 0,
    validity_days: 30,
    operator_id: operatorId,
  };
}

function planToFormValue(plan: DataPlan): PlanFormValue {
  return {
    name: plan.name,
    code_offer: plan.code_offer ?? '',
    volume_mb: plan.volume_mb,
    price: plan.price,
    validity_days: plan.validity_days,
    operator_id: plan.telecom_operators.id,
  };
}

export default function DataPlansPage() {
  const {
    plans,
    operators,
    loading,
    error,
    addPlan,
    updatePlan,
    deletePlan,
    isAuthenticated,
    isAdmin,
    authLoading,
  } = useOptimizedPlans();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState<PlanFormValue>(() => defaultPlanForm(0));

  const clearSuccessLater = useCallback((msg: string) => {
    setAddSuccess(msg);
    window.setTimeout(() => setAddSuccess(null), 5000);
  }, []);

  useEffect(() => {
    if (operators.length > 0 && newPlan.operator_id === 0) {
      setNewPlan((prev) => ({ ...prev, operator_id: operators[0].id }));
    }
  }, [operators, newPlan.operator_id]);

  function openAddModal() {
    setAddError(null);
    setNewPlan(defaultPlanForm(operators[0]?.id ?? 0));
    setShowAddModal(true);
  }

  function openEditModal(plan: DataPlan) {
    setEditError(null);
    setEditingPlanId(plan.id);
    setNewPlan(planToFormValue(plan));
    setShowEditModal(true);
  }

  async function handleAddPlan() {
    setAddError(null);
    setAddLoading(true);
    try {
      if (
        !newPlan.name.trim() ||
        newPlan.volume_mb <= 0 ||
        newPlan.price <= 0 ||
        newPlan.validity_days <= 0 ||
        !newPlan.operator_id
      ) {
        setAddError('Veuillez remplir tous les champs correctement.');
        setAddLoading(false);
        return;
      }

      const { value: codeOffer, error: codeErr } = normalizeCodeOfferForSubmit(newPlan.code_offer);
      if (codeErr) {
        setAddError(codeErr);
        setAddLoading(false);
        return;
      }

      await addPlan({
        name: newPlan.name.trim(),
        volume_mb: newPlan.volume_mb,
        price: newPlan.price,
        validity_days: newPlan.validity_days,
        operator_id: newPlan.operator_id,
        active: true,
        code_offer: codeOffer,
      });

      setShowAddModal(false);
      setNewPlan(defaultPlanForm(operators[0]?.id ?? 0));
      clearSuccessLater('Forfait ajouté avec succès !');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'ajout du forfait.";
      setAddError(message);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleUpdatePlan() {
    if (editingPlanId == null) return;
    setEditError(null);
    setEditLoading(true);
    try {
      if (
        !newPlan.name.trim() ||
        newPlan.volume_mb <= 0 ||
        newPlan.price <= 0 ||
        newPlan.validity_days <= 0 ||
        !newPlan.operator_id
      ) {
        setEditError('Veuillez remplir tous les champs correctement.');
        setEditLoading(false);
        return;
      }

      const { value: codeOffer, error: codeErr } = normalizeCodeOfferForSubmit(newPlan.code_offer);
      if (codeErr) {
        setEditError(codeErr);
        setEditLoading(false);
        return;
      }

      await updatePlan(editingPlanId, {
        name: newPlan.name.trim(),
        volume_mb: newPlan.volume_mb,
        price: newPlan.price,
        validity_days: newPlan.validity_days,
        operator_id: newPlan.operator_id,
        code_offer: codeOffer,
      });

      setShowEditModal(false);
      setEditingPlanId(null);
      setNewPlan(defaultPlanForm(operators[0]?.id ?? 0));
      clearSuccessLater('Forfait mis à jour avec succès !');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du forfait.';
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeletePlan(id: number) {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce forfait?')) {
      try {
        await deletePlan(id);
      } catch (err) {
        console.error('Erreur lors de la suppression du forfait:', err);
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
          onClick={openAddModal}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un forfait
        </button>
      </div>

      {addSuccess && <div className="text-sm text-green-600">{addSuccess}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

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
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nom
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Code offre
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Opérateur
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Volume (Go)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Prix (FCFA)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Validité (jours)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucun forfait trouvé
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {plan.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-900">
                      {plan.code_offer != null && plan.code_offer !== '' ? (
                        plan.code_offer
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          plan.telecom_operators.name === 'Orange'
                            ? 'bg-orange-100 text-orange-800'
                            : plan.telecom_operators.name === 'Telecel'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
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
                        <button
                          type="button"
                          onClick={() => openEditModal(plan)}
                          className="text-indigo-600 hover:text-indigo-900"
                          aria-label="Modifier le forfait"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
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

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un nouveau forfait" size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddPlan();
          }}
          className="space-y-4"
        >
          <PlanForm value={newPlan} onChange={setNewPlan} disabled={addLoading} operators={operators} />
          {addError && <div className="text-sm text-red-600">{addError}</div>}
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

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier le forfait" size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdatePlan();
          }}
          className="space-y-4"
        >
          <PlanForm value={newPlan} onChange={setNewPlan} disabled={editLoading} operators={operators} />
          {editError && <div className="text-sm text-red-600">{editError}</div>}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
              onClick={() => {
                setShowEditModal(false);
                setEditingPlanId(null);
              }}
              disabled={editLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
              disabled={editLoading}
            >
              {editLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
