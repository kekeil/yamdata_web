'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { signOut } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import { CogIcon, KeyIcon, ShieldCheckIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setPasswordSuccess('Mot de passe mis à jour avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Paramètres</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Section de changement de mot de passe */}
        <div className="md:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center">
              <KeyIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Sécurité</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {passwordError && (
                  <div className="text-sm text-red-600">{passwordError}</div>
                )}

                {passwordSuccess && (
                  <div className="text-sm text-green-600">{passwordSuccess}</div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                  >
                    {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Section des actions rapides */}
        <div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center">
              <CogIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Actions rapides</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <button
                  onClick={handleLogout}
                  className="w-full inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Informations de sécurité</h2>
            </div>
            <div className="p-6">
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dernière connexion</dt>
                  <dd className="mt-1 text-sm text-gray-900">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Rôle</dt>
                  <dd className="mt-1 text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      Administrateur
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Version de l'application</dt>
                  <dd className="mt-1 text-sm text-gray-900">1.0.0</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 