// app/forfaits/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface Operator {
  id: number;
  name: string;
  logo_url: string | null;
}

interface DataPlan {
  id: number;
  name: string;
  volume_mb: number;
  price: number;
  validity_days: number;
  description: string | null;
  operator_id: number;
}

interface PlanWithOperator extends DataPlan {
  operator_name: string;
}

export default function ForfaitsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [plans, setPlans] = useState<PlanWithOperator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanWithOperator | null>(null);

  useEffect(() => {
    fetchOperators();
  }, []);

  useEffect(() => {
    if (selectedOperator) {
      fetchPlans(selectedOperator);
    }
  }, [selectedOperator]);

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('telecom_operators')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setOperators(data || []);
      if (data && data.length > 0) {
        setSelectedOperator(data[0].id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async (operatorId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('data_plans')
        .select(`
          *,
          telecom_operators!inner(name)
        `)
        .eq('operator_id', operatorId)
        .eq('active', true)
        .order('price');

      if (error) throw error;

      const plansWithOperator = data?.map(plan => ({
        ...plan,
        operator_name: (plan.telecom_operators as any).name
      })) || [];

      setPlans(plansWithOperator);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSavings = (price: number) => {
    // Exemple : 33% d'épargne
    const savingRate = 0.33;
    const dataCost = price * 0.67;
    const savings = price * savingRate;
    return {
      dataCost: Math.round(dataCost),
      savings: Math.round(savings),
      total: price
    };
  };

  const formatVolume = (volumeMb: number) => {
    if (volumeMb >= 1024) {
      return `${(volumeMb / 1024).toFixed(1)} Go`;
    }
    return `${volumeMb} Mo`;
  };

  if (loading && operators.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Acheter un forfait</h1>
        <p className="mt-2 text-gray-600">
          Choisissez votre opérateur et votre forfait pour commencer à épargner
        </p>
      </motion.div>

      {/* Sélection d'opérateur */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Choisissez votre opérateur</h2>
        <div className="grid grid-cols-3 gap-4">
          {operators.map((operator) => (
            <button
              key={operator.id}
              onClick={() => setSelectedOperator(operator.id)}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedOperator === operator.id
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="text-center">
                {operator.logo_url ? (
                  <img
                    src={operator.logo_url}
                    alt={operator.name}
                    className="h-12 mx-auto mb-2"
                  />
                ) : (
                  <div className="h-12 flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold">{operator.name.charAt(0)}</span>
                  </div>
                )}
                <p className="font-semibold">{operator.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Liste des forfaits */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Forfaits disponibles</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucun forfait disponible pour cet opérateur</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const savings = calculateSavings(plan.price);
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {formatVolume(plan.volume_mb)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Valide {plan.validity_days} jours
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Prix total</span>
                      <span className="font-semibold">{savings.total} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Coût internet</span>
                      <span>{savings.dataCost} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-green-600 font-medium">Épargné</span>
                      <span className="text-green-600 font-bold">+{savings.savings} FCFA</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Acheter
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de paiement */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold mb-4">Confirmer l'achat</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Forfait</p>
              <p className="text-xl font-bold">{selectedPlan.name}</p>
              <p className="text-green-600 font-semibold mt-1">
                {formatVolume(selectedPlan.volume_mb)}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {(() => {
                const savings = calculateSavings(selectedPlan.price);
                return (
                  <>
                    <div className="flex justify-between">
                      <span>Prix total</span>
                      <span className="font-semibold">{savings.total} FCFA</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Vous épargnez</span>
                      <span className="font-bold">+{savings.savings} FCFA</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Numéro de téléphone</label>
              <input
                type="tel"
                placeholder="+226 XX XX XX XX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert('Paiement simulé ! (Intégration mobile money à venir)');
                  setSelectedPlan(null);
                }}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Payer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}