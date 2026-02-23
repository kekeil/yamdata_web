'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import BackButton from '@/components/ui/BackButton';

interface SavingsData {
  balance: number;
  total_saved: number;
  total_withdrawn: number;
  saving_type_name: string;
}

interface SavingType {
  id: number;
  name: string;
  description: string;
}

export default function EpargnePage() {
  const { user } = useAuthStore();
  const [savings, setSavings] = useState<SavingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCreateCoffreModal, setShowCreateCoffreModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [savingTypes, setSavingTypes] = useState<SavingType[]>([]);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [hasCoffre, setHasCoffre] = useState(false);

  useEffect(() => {
    if (user) {
      checkAndFetchSavings();
    }
  }, [user]);

  const checkAndFetchSavings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_savings')
        .select(`
          balance,
          total_saved,
          total_withdrawn,
          saving_types!inner(name)
        `)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur:', error);
      }

      if (!data) {
        // Pas de coffre, afficher la modal de création
        setHasCoffre(false);
        setShowCreateCoffreModal(true);
        // Charger les types d'épargne
        await fetchSavingTypes();
      } else {
        setHasCoffre(true);
        setSavings({
          balance: data.balance,
          total_saved: data.total_saved,
          total_withdrawn: data.total_withdrawn,
          saving_type_name: (data.saving_types as any).name
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavingTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('saving_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setSavingTypes(data || []);
      if (data && data.length > 0) {
        setSelectedType(data[0].id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCreateCoffre = async () => {
    if (!selectedType) {
      alert('Veuillez sélectionner un type d\'épargne');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_savings')
        .insert({
          user_id: user?.id,
          saving_type_id: selectedType,
          balance: 0,
          total_saved: 0,
          total_withdrawn: 0
        });

      if (error) throw error;

      setShowCreateCoffreModal(false);
      setHasCoffre(true);
      // Recharger les données
      await checkAndFetchSavings();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du coffre');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      alert('Montant invalide');
      return;
    }

    if (amount > (savings?.balance || 0)) {
      alert('Solde insuffisant');
      return;
    }

    alert(`Demande de retrait de ${amount} FCFA enregistrée !
(Fonctionnalité complète à venir)`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Modal de création de coffre
  if (!hasCoffre && showCreateCoffreModal) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <span className="text-6xl mb-4 block">🏦</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Créez votre coffre d'épargne
            </h2>
            <p className="text-gray-600">
              Choisissez le type d'épargne qui vous convient
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {savingTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                  selectedType === type.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {type.name}
                </h3>
                <p className="text-sm text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateCoffre}
            disabled={!selectedType}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Créer mon coffre
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Bouton retour */}
      <div className="mb-6">
        <BackButton href="/dashboard" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Mon épargne</h1>
        <p className="mt-2 text-gray-600">
          Suivez l'évolution de votre épargne Yamdata
        </p>
      </motion.div>

      {/* Solde principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white mb-8 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-green-100 text-sm mb-1">Solde disponible</p>
            <h2 className="text-5xl font-bold">
              {savings?.balance.toLocaleString()} <span className="text-2xl">FCFA</span>
            </h2>
          </div>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-4xl">💰</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Retirer
          </button>
          <a
            href="/forfaits"
            className="flex-1 bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors text-center"
          >
            Épargner plus
          </a>
        </div>
      </motion.div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total épargné</p>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {savings?.total_saved.toLocaleString()} FCFA
          </p>
          <p className="text-xs text-gray-500 mt-1">Depuis le début</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total retiré</p>
            <span className="text-2xl">💸</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {savings?.total_withdrawn.toLocaleString()} FCFA
          </p>
          <p className="text-xs text-gray-500 mt-1">Retraits effectués</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Type d'épargne</p>
            <span className="text-2xl">🏦</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {savings?.saving_type_name || 'Libre'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Retrait à tout moment</p>
        </motion.div>
      </div>

      {/* Informations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-6"
      >
        <div className="flex items-start">
          <span className="text-3xl mr-4">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Comment fonctionne l'épargne Yamdata ?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✅ À chaque achat de forfait, environ 33% est automatiquement épargné</li>
              <li>✅ Votre épargne est disponible à tout moment</li>
              <li>✅ Aucun frais de retrait</li>
              <li>✅ Vous pouvez retirer quand vous voulez</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Modal de retrait */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold mb-4">Demande de retrait</h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Solde disponible</p>
              <p className="text-2xl font-bold text-green-600">
                {savings?.balance.toLocaleString()} FCFA
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Montant à retirer
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Entrez le montant"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Maximum : {savings?.balance.toLocaleString()} FCFA
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Numéro de téléphone (Mobile Money)
              </label>
              <input
                type="tel"
                placeholder="+226 XX XX XX XX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}