'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Préfixes valides des opérateurs burkinabè (mis à jour 2025)
const VALID_BURKINA_PREFIXES = [
  // Orange Burkina
  '04', '05', '06', '07', '44', '54', '55', '56', '57', '64', '65', '66', '67', '74', '75', '76', '77',
  // Moov Burkina (anciennement Onatel)
  '01', '02', '03', '50', '51', '52', '53', '60', '61', '62', '63', '70', '71', '72', '73',
  // Telecel Burkina
  '58', '68', '69', '78', '79'
];

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  // Redirection si déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Validation du numéro burkinabè en temps réel
  const validateBurkinabePhone = (phone: string): { isValid: boolean; message: string } => {
    // Nettoyer le numéro
    const cleaned = phone.replace(/\s/g, '').replace(/-/g, '');
    
    // Vérifier s'il commence par +226
    if (!cleaned.startsWith('+226')) {
      return {
        isValid: false,
        message: 'Le numéro doit commencer par +226 (indicatif Burkina Faso)'
      };
    }
    
    // Extraire les 8 chiffres après +226
    const number = cleaned.substring(4);
    
    // Vérifier qu'il y a exactement 8 chiffres
    if (!/^\d{8}$/.test(number)) {
      return {
        isValid: false,
        message: 'Le numéro doit contenir exactement 8 chiffres après +226'
      };
    }
    
    // Vérifier le préfixe (2 premiers chiffres)
    const prefix = number.substring(0, 2);
    if (!VALID_BURKINA_PREFIXES.includes(prefix)) {
      return {
        isValid: false,
        message: `Préfixe ${prefix} invalide. Les numéros burkinabè commencent par 50-79`
      };
    }
    
    return {
      isValid: true,
      message: '✓ Numéro valide'
    };
  };

  const handlePhoneChange = (value: string) => {
    // Auto-formater le numéro
    let formatted = value;
    
    // Si l'utilisateur tape juste des chiffres, ajouter +226
    if (/^\d/.test(value) && !value.startsWith('+')) {
      formatted = '+226 ' + value;
    }
    
    setFormData({ ...formData, phone: formatted });
    
    // Valider en temps réel si assez de caractères
    if (formatted.length >= 8) {
      setPhoneValidation(validateBurkinabePhone(formatted));
    } else {
      setPhoneValidation(null);
    }
  };

  const validateForm = () => {
    // Nom complet
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      setError('Veuillez entrer votre nom complet (minimum 3 caractères)');
      return false;
    }

    // Validation téléphone
    const phoneCheck = validateBurkinabePhone(formData.phone);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.message);
      return false;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Adresse email invalide');
      return false;
    }

    // Bloquer les emails jetables courants
    const disposableEmails = ['tempmail', 'guerrillamail', 'throwaway', '10minutemail', 'mailinator'];
    if (disposableEmails.some(domain => formData.email.toLowerCase().includes(domain))) {
      setError('Les emails temporaires ne sont pas autorisés. Veuillez utiliser un email permanent.');
      return false;
    }

    // Validation mot de passe - RENFORCÉE
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    // Vérifier au moins une majuscule
    if (!/[A-Z]/.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins une lettre majuscule');
      return false;
    }

    // Vérifier au moins un chiffre
    if (!/[0-9]/.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins un chiffre');
      return false;
    }

    // Vérifier au moins un caractère spécial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)');
      return false;
    }

    // Confirmation mot de passe
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Nettoyer le numéro pour stockage
      const cleanedPhone = formData.phone.replace(/\s/g, '');

      // 1. Créer le compte utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: cleanedPhone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Créer le profil dans la table profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: cleanedPhone,
            phone_verified: false, // Sera vérifié au premier achat
            email_verified: false  // Sera vérifié si l'utilisateur clique sur le lien
          });

        if (profileError && profileError.code !== '23505') { // Ignorer erreur duplicate
          console.error('Erreur création profil:', profileError);
        }

        // 3. Assigner le rôle utilisateur par défaut
        const { data: defaultRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'utilisateur')
          .single();

        if (defaultRole) {
          await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role_id: defaultRole.id
            });
        }

        // Succès - Message et redirection
        alert(`🎉 Inscription réussie !

Bienvenue ${formData.fullName} !

📧 Un email de bienvenue a été envoyé à ${formData.email}
📱 Votre numéro ${cleanedPhone} sera vérifié lors de votre premier achat

Vous pouvez maintenant vous connecter !`);

        router.push('/login');
      }
    } catch (err: any) {
      console.error('Erreur inscription:', err);
      
      // Messages d'erreur personnalisés
      if (err.message.includes('already registered') || err.message.includes('User already registered')) {
        setError('Cet email est déjà utilisé. Essayez de vous connecter.');
      } else if (err.message.includes('Invalid email')) {
        setError('Adresse email invalide');
      } else if (err.code === '23505') {
        setError('Ce numéro de téléphone ou cet email est déjà utilisé');
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      handlePhoneChange(value);
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    if (error) setError('');
  };

  // Loading pendant vérification session
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si déjà connecté
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-white px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Inscription
            </h1>
            <p className="text-gray-600">
              Créez votre compte Yamdata
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Erreurs */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <XCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Nom complet */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50"
                placeholder="Jean Ouédraogo"
              />
            </div>

            {/* Numéro de téléphone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-colors disabled:bg-gray-50 ${
                  phoneValidation?.isValid 
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                    : phoneValidation 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                placeholder="+226 XX XX XX XX"
                autoComplete="tel"
              />
              {phoneValidation && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${
                  phoneValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {phoneValidation.isValid ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <XCircleIcon className="h-4 w-4" />
                  )}
                  {phoneValidation.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Format : +226 suivi de 8 chiffres (Orange, Moov, Telecel)
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50"
                placeholder="jean@exemple.com"
                autoComplete="email"
              />
              <p className="text-xs text-gray-500 mt-1">
                Utilisez un email permanent (pas de mail temporaire)
              </p>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Indicateur de force du mot de passe */}
              {formData.password.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    <div className={`h-1.5 flex-1 rounded transition-colors ${
                      formData.password.length >= 8 ? 'bg-yellow-500' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-1.5 flex-1 rounded transition-colors ${
                      formData.password.length >= 8 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) 
                        ? 'bg-orange-500' : 'bg-gray-200'
                    }`}></div>
                    <div className={`h-1.5 flex-1 rounded transition-colors ${
                      formData.password.length >= 8 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) && /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                        ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                  </div>
                  
                  <div className="text-xs space-y-1">
                    <p className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      {formData.password.length >= 8 ? '✓' : '○'} Au moins 8 caractères
                    </p>
                    <p className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                      {/[A-Z]/.test(formData.password) ? '✓' : '○'} Une lettre majuscule
                    </p>
                    <p className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                      {/[0-9]/.test(formData.password) ? '✓' : '○'} Un chiffre
                    </p>
                    <p className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '○'} Un caractère spécial (!@#$%...)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Bouton inscription */}
            <button
              type="submit"
              disabled={loading || (phoneValidation !== null && !phoneValidation.isValid)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Inscription en cours...
                </span>
              ) : (
                'S\'inscrire'
              )}
            </button>
          </form>

          {/* Lien connexion */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Se connecter
            </Link>
          </div>
        </div>

        {/* Info sécurité */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Sécurité de votre compte</p>
              <ul className="space-y-1 text-xs">
                <li>✓ Connexion immédiate après inscription</li>
                <li>✓ Vérification par SMS au premier achat</li>
                <li>✓ Email de confirmation envoyé</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}