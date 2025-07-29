'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  phone: string;
  full_name?: string;
  created_at: string;
  user_roles: {
    roles: {
      name: string;
    };
  }[];
}

const ROLES = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'support', label: 'Support' },
  { value: 'user', label: 'Utilisateur' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'user',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      console.log('[AUTH DEBUG][UsersPage] Début de la récupération des utilisateurs');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AUTH DEBUG][UsersPage] Session:', session);
      
      if (!session) {
        console.log('[AUTH DEBUG][UsersPage] Pas de session, redirection vers /login');
        window.location.href = '/login';
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          email,
          phone, 
          full_name,
          created_at,
          user_roles:user_roles!user_roles_user_id_fkey (
            roles (
              name
            )
          )
        `);

      if (error) {
        console.error('[AUTH DEBUG][UsersPage] Erreur Supabase:', error, error.message, error.details, error.hint);
        throw error;
      }
      
      console.log('[AUTH DEBUG][UsersPage] Utilisateurs récupérés:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('[AUTH DEBUG][UsersPage] Erreur lors de la récupération des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    setAddLoading(true);
    try {
      // 1. Créer l'utilisateur dans auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            phone: form.phone,
          },
        },
      });
      if (signUpError) throw signUpError;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Utilisateur non créé côté auth.");
      // 2. Créer le profil (si non créé automatiquement)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: form.email,
          full_name: form.full_name,
          phone: form.phone,
        });
      if (profileError) throw profileError;
      // 3. Attribuer le rôle
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', form.role)
        .single();
      if (roleError) throw roleError;
      const { error: userRoleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleData.id });
      if (userRoleError) throw userRoleError;
      setAddSuccess('Utilisateur créé avec succès !');
      setForm({ email: '', password: '', full_name: '', phone: '', role: 'user' });
      setShowAddModal(false);
      fetchUsers();
    } catch (error: any) {
      setAddError(error.message || 'Erreur lors de la création de l\'utilisateur.');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    
    try {
      console.log('[DEBUG] Suppression utilisateur:', userId);
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      
      if (error) {
        console.error('[DEBUG] Erreur suppression:', error);
        alert("Erreur lors de la suppression: " + error.message);
      } else {
        console.log('[DEBUG] Suppression réussie');
        fetchUsers();
      }
    } catch (error) {
      console.error('[DEBUG] Erreur inattendue:', error);
      alert("Erreur inattendue lors de la suppression");
    }
  }

  const filteredUsers = users.filter(user => 
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.user_roles?.[0]?.roles?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des Utilisateurs</h1>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          onClick={() => setShowAddModal(true)}
        >
          <span className="h-5 w-5 mr-2" role="img" aria-label="ajouter">➕</span>
          Ajouter un utilisateur
        </button>
      </div>

      {/* Modal d'ajout d'utilisateur (amélioré) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay semi-transparent allégé */}
          <div
            className="absolute inset-0 bg-black bg-opacity-20 transition-opacity"
            onClick={() => setShowAddModal(false)}
          />
          {/* Contenu de la modale */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto z-10 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ajouter un utilisateur</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Nom complet</label>
                <input
                  type="text"
                  id="full_name"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  type="tel"
                  id="phone"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rôle</label>
                <select
                  id="role"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  required
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
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

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Liste des utilisateurs</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement des utilisateurs...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'inscription
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.user_roles?.[0]?.roles?.name === 'admin' ? 'bg-purple-100 text-purple-800' : 
                        user.user_roles?.[0]?.roles?.name === 'support' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}>
                        {user.user_roles?.[0]?.roles?.name || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/dashboard/users/${user.id}`} 
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => console.log('[DEBUG] Redirection vers:', `/dashboard/users/${user.id}`)}
                        >
                          <span className="h-5 w-5" role="img" aria-label="éditer">✏️</span>
                        </Link>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <span className="h-5 w-5" role="img" aria-label="supprimer">🗑️</span>
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
  );
} 