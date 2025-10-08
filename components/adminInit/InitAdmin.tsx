'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InitAdmin() {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  async function handleInitAdmin(e: React.FormEvent) {
    e.preventDefault();
    
    if (!secret.trim()) {
      setMessage({ text: 'La clé secrète est requise', type: 'error' });
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      const response = await fetch('/api/init-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'initialisation');
      }
      
      setMessage({ text: data.message || 'Administrateur initialisé avec succès', type: 'success' });
      
      // Redirection après 2 secondes en cas de succès
      if (response.ok) {
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Une erreur est survenue', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Initialisation de l'administrateur
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Cette page est protégée et nécessite une clé secrète
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleInitAdmin}>
            <div>
              <label htmlFor="secret" className="block text-sm font-medium text-gray-700">
                Clé secrète d'initialisation
              </label>
              <div className="mt-1">
                <input
                  id="secret"
                  name="secret"
                  type="password"
                  autoComplete="off"
                  required
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            {message && (
              <div className={`rounded-md p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Initialisation...' : 'Initialiser l\'administrateur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 