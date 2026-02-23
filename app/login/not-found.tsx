'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Illustration 404 */}
        <div className="relative mb-8">
          <div className="text-9xl font-black text-green-100 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-32 h-32 text-green-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Page introuvable
        </h1>
        <p className="text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Retour
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <HomeIcon className="h-5 w-5" />
            Accueil
          </Link>
        </div>

        {/* Liens rapides */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Vous cherchez peut-être :</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/forfaits" className="text-sm text-green-600 hover:text-green-700 hover:underline">
              Forfaits
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/epargne" className="text-sm text-green-600 hover:text-green-700 hover:underline">
              Mon épargne
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/transactions" className="text-sm text-green-600 hover:text-green-700 hover:underline">
              Transactions
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/profil" className="text-sm text-green-600 hover:text-green-700 hover:underline">
              Profil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}