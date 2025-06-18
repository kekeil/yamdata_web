'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const router = useRouter();
  const { login, error, user, isAdmin, isLoading } = useAuthStore();
  const [loginInProgress, setLoginInProgress] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>();
  
  // Redirection si l'utilisateur est connecté et admin
  useEffect(() => {
    if (user && isAdmin && !isLoading) {
      router.push('/dashboard/overview');
    }
  }, [user, isAdmin, isLoading, router]);
  
  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginInProgress(true);
      await login(data.email, data.password);
      // La redirection sera gérée par le useEffect
    } catch (err) {
      console.error("Erreur lors de la connexion:", err);
    } finally {
      setLoginInProgress(false);
    }
  };
  
  // Afficher un message de chargement pendant la connexion
  if (loginInProgress || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
        <p className="text-green-600 font-medium">Connexion en cours...</p>
      </div>
    );
  }
  
  // Afficher un message d'erreur si l'utilisateur n'est pas admin
  if (user && !isAdmin && !isLoading) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 my-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Accès refusé</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Vous êtes connecté, mais vous n'avez pas les droits d'administrateur nécessaires pour accéder au tableau de bord.</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => useAuthStore.getState().logout()}
                className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="mt-1">
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            {...register('email', { 
              required: 'Email est requis',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email invalide'
              }
            })}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mot de passe
        </label>
        <div className="mt-1">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            {...register('password', { required: 'Mot de passe est requis' })}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur de connexion</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <button
          type="submit"
          disabled={loginInProgress || isLoading}
          className="flex w-full justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loginInProgress || isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </div>
    </form>
  );
} 