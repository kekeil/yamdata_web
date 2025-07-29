'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
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

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'user',
  });

  useEffect(() => {
    console.log('[DEBUG] EditUserPage montée avec ID:', params.id);
    fetchUser();
  }, [params.id]);

  async function fetchUser() {
    try {
      setLoading(true);
      console.log('[AUTH DEBUG][EditUserPage] Début de la récupération de l\'utilisateur:', params.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AUTH DEBUG][EditUserPage] Session:', session);
      
      if (!session) {
        console.log('[AUTH DEBUG][EditUserPage] Pas de session, redirection vers /login');
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
        `)
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('[AUTH DEBUG][EditUserPage] Erreur Supabase:', error);
        throw error;
      }
      
      if (!data) {
        setError('Utilisateur non trouvé');
        return;
      }

      console.log('[AUTH DEBUG][EditUserPage] Utilisateur récupéré:', data);
      setUser(data);
      
      // Pré-remplir le formulaire
      const formData = {
        email: data.email || '',
        full_name: data.full_name || '',
        phone: data.phone || '',
        role: data.user_roles?.[0]?.roles?.name || 'user',
      };
      
      console.log('[DEBUG] Données du formulaire pré-remplies:', formData);
      setForm(formData);
    } catch (error) {
      console.error('[AUTH DEBUG][EditUserPage] Erreur lors de la récupération de l\'utilisateur:', error);
      setError('Erreur lors de la récupération de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUpdateLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expirée, veuillez vous reconnecter.');
        return;
      }

      // 1. Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: form.email,
          full_name: form.full_name,
          phone: form.phone,
        })
        .eq('id', params.id);

      if (profileError) throw profileError;

      // 2. Mettre à jour le rôle si changé
      const currentRole = user?.user_roles?.[0]?.roles?.name;
      if (currentRole !== form.role) {
        // Supprimer l'ancien rôle
        const { error: deleteRoleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', params.id);

        if (deleteRoleError) throw deleteRoleError;

        // Ajouter le nouveau rôle
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('name', form.role)
          .single();

        if (roleError) throw roleError;

        const { error: userRoleError } = await supabase
          .from('user_roles')
          .insert({ user_id: params.id, role_id: roleData.id });

        if (userRoleError) throw userRoleError;
      }

      setSuccess('Utilisateur mis à jour avec succès !');
      // Recharger les données de l'utilisateur
      fetchUser();
    } catch (error: any) {
      console.error('[AUTH DEBUG][EditUserPage] Erreur lors de la mise à jour:', error);
      setError(error.message || 'Erreur lors de la mise à jour de l\'utilisateur.');
    } finally {
      setUpdateLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard/users" className="text-green-600 hover:text-green-700">
            Retour à la liste des utilisateurs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/users"
          className="text-gray-500 hover:text-gray-700"
        >
          ← Retour
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          Modifier l'utilisateur
        </h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Informations de l'utilisateur
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Modifiez les informations de l'utilisateur ci-dessous
          </p>
        </div>

        <form onSubmit={handleUpdateUser} className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
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
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Nom complet
            </label>
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
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Téléphone
            </label>
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
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Rôle
            </label>
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

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href="/dashboard/users"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:text-sm disabled:opacity-50"
              disabled={updateLoading}
            >
              {updateLoading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>

      {user && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Informations système
            </h3>
          </div>
          <div className="px-6 py-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">ID:</span>
              <span className="text-sm text-gray-900 font-mono">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Date de création:</span>
              <span className="text-sm text-gray-900">
                {new Date(user.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}