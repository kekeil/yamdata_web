'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, DevicePhoneMobileIcon, BanknotesIcon, ShieldCheckIcon, CheckCircleIcon, ExclamationTriangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { usePreregistrationStats } from '@/lib/hooks/usePreregistrationStats';

export default function Home() {
  const [preregistrationData, setPreregistrationData] = useState({
    email: '',
    fullName: '',
    phone: '',
    interestedFeatures: [] as string[],
    referralSource: '',
    marketingConsent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPreregForm, setShowPreregForm] = useState(false);
  
  // État séparé pour le formulaire "Inscription express" en bas
  const [expressFormData, setExpressFormData] = useState({
    email: '',
    fullName: ''
  });
  const [isExpressSubmitting, setIsExpressSubmitting] = useState(false);
  const [expressSubmitStatus, setExpressSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expressErrorMessage, setExpressErrorMessage] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Récupération des statistiques de préinscription en temps réel
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = usePreregistrationStats();

  const handleFeatureToggle = (feature: string) => {
    setPreregistrationData(prev => ({
      ...prev,
      interestedFeatures: prev.interestedFeatures.includes(feature)
        ? prev.interestedFeatures.filter(f => f !== feature)
        : [...prev.interestedFeatures, feature]
    }));
  };

  const handlePreregistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      // Vérifier que l'email et le nom sont fournis
      if (!preregistrationData.email || !preregistrationData.fullName) {
        throw new Error('Email et nom complet sont requis');
      }

      // Récupérer l'adresse IP et user agent pour l'audit trail
      const userAgent = navigator.userAgent;
      
      // Préparer les données pour Supabase
      const preregistrationPayload = {
        email: preregistrationData.email.toLowerCase().trim(),
        full_name: preregistrationData.fullName.trim(),
        phone: preregistrationData.phone?.trim() || null,
        interested_features: preregistrationData.interestedFeatures || [],
        referral_source: preregistrationData.referralSource || null,
        marketing_consent: preregistrationData.marketingConsent,
        status: 'pending' as const,
        user_agent: userAgent,
        notes: null
      };

      // Insérer dans Supabase
      const { data, error } = await supabase
        .from('preregistrations')
        .insert([preregistrationPayload])
        .select()
        .single();

      if (error) {
        // Gestion spécifique des erreurs
        if (error.code === '23505') { // Violation de contrainte unique (email déjà existant)
          throw new Error('Cette adresse email est déjà enregistrée pour la préinscription.');
        } else if (error.code === '23514') { // Violation de contrainte de validation
          throw new Error('Les données fournies ne sont pas valides. Veuillez vérifier votre saisie.');
        } else {
          throw new Error('Une erreur s\'est produite lors de l\'enregistrement. Veuillez réessayer.');
        }
      }
      
      // Succès - réinitialiser le formulaire
      setSubmitStatus('success');
      setPreregistrationData({
        email: '',
        fullName: '',
        phone: '',
        interestedFeatures: [],
        referralSource: '',
        marketingConsent: false
      });

      // Actualiser les statistiques après une nouvelle préinscription
      refetchStats();
      
      // Masquer le message de succès après 5 secondes
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);

    } catch (error: any) {
      setSubmitStatus('error');
      
      // Afficher un message d'erreur plus spécifique si possible
      const errorMsg = error.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
      setErrorMessage(errorMsg);

      // Masquer le message d'erreur après 7 secondes
      setTimeout(() => {
        setSubmitStatus('idle');
        setErrorMessage('');
      }, 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpressFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExpressSubmitting(true);
    setExpressSubmitStatus('idle');
    
    try {
      // Vérifier que l'email et le nom sont fournis
      if (!expressFormData.email || !expressFormData.fullName) {
        throw new Error('Email et nom sont requis');
      }

      // Récupérer l'adresse IP et user agent pour l'audit trail
      const userAgent = navigator.userAgent;
      
      // Préparer les données pour Supabase
      const preregistrationPayload = {
        email: expressFormData.email.toLowerCase().trim(),
        full_name: expressFormData.fullName.trim(),
        phone: null,
        interested_features: [],
        referral_source: 'other', // Utiliser 'other' car 'express_form' n'est pas dans la liste autorisée
        marketing_consent: true, // Par défaut true pour le formulaire express
        status: 'pending' as const,
        user_agent: userAgent,
        notes: 'Inscription via formulaire express'
      };

      // Insérer dans Supabase
      const { data, error } = await supabase
        .from('preregistrations')
        .insert([preregistrationPayload])
        .select()
        .single();

      if (error) {
        console.error('Erreur Supabase lors de la préinscription express:', error);
        
        // Gestion spécifique des erreurs
        if (error.code === '23505') { // Violation de contrainte unique (email déjà existant)
          throw new Error('Cette adresse email est déjà enregistrée pour la préinscription.');
        } else if (error.code === '23514') { // Violation de contrainte de validation
          throw new Error('Les données fournies ne sont pas valides. Veuillez vérifier votre saisie.');
        } else {
          throw new Error('Une erreur s\'est produite lors de l\'enregistrement. Veuillez réessayer.');
        }
      }

      // Succès - réinitialiser le formulaire
      setExpressSubmitStatus('success');
      setExpressFormData({
        email: '',
        fullName: ''
      });

      // Actualiser les statistiques après une nouvelle préinscription
      refetchStats();
      
      // Masquer le message de succès après 5 secondes
      setTimeout(() => {
        setExpressSubmitStatus('idle');
      }, 5000);

    } catch (error: any) {
      console.error('Erreur lors de la préinscription express:', error);
      setExpressSubmitStatus('error');
      
      // Afficher un message d'erreur plus spécifique si possible
      const errorMsg = error.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
      setExpressErrorMessage(errorMsg);
      console.error('Message d\'erreur express:', errorMsg);

      // Masquer le message d'erreur après 7 secondes
      setTimeout(() => {
        setExpressSubmitStatus('idle');
        setExpressErrorMessage('');
      }, 7000);
    } finally {
      setIsExpressSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 lg:h-24 items-center">
            {/* Mobile menu button - à gauche sur mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                aria-expanded="false"
              >
                <span className="sr-only">Ouvrir le menu principal</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Logo - centré sur desktop, à droite sur mobile */}
            <div className="flex-shrink-0 flex items-center md:order-first">
              <Image
                src="/logo.svg" 
                alt="Yamdata Logo" 
                width={346} 
                height={92} 
                className="h-12 sm:h-16 lg:h-20 w-auto transition-all duration-300 hover:scale-105"
              />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <Link 
                  href="#features" 
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300"
                >
                  Fonctionnalités
                </Link>
                <Link 
                  href="#how-it-works" 
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300"
                >
                  Comment ça marche
                </Link>
                <Link 
                  href="/login" 
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-300 shadow-md hover:shadow-lg"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-gray-200"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
                <Link
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                >
                  Fonctionnalités
                </Link>
                <Link
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                >
                  Comment ça marche
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium bg-green-600 text-white hover:bg-green-700"
                >
                  Se connecter
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 py-16 md:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left lg:col-span-6"
            >
              <h1>
                <span className="block text-sm font-semibold uppercase tracking-wide text-green-600 text-left">
                  Une nouvelle façon d'épargner
                </span>
                <div className="mt-1 flex items-center justify-start">
                  <div className="flex flex-col items-start">
                    <span className="block text-4xl lg:text-5xl xl:text-6xl tracking-tight font-extrabold text-gray-900">Connecte-toi,</span>
                    <span className="block text-4xl lg:text-5xl xl:text-6xl tracking-tight font-extrabold text-green-600">épargne, évolue.</span>
                  </div>
                </div>
              </h1>
              <p className="mt-3 text-lg lg:text-lg xl:text-xl text-gray-500 max-w-2xl text-left lg:mx-0">
                Yamdata transforme <span className="text-green-600 font-semibold">vos</span> achats de forfaits internet en épargne intelligente. 
                Achetez <span className="text-green-600 font-semibold">vos</span> données comme d'habitude et épargnez automatiquement à chaque transaction.
              </p>
              <div className="mt-8 max-w-lg mx-auto lg:mx-0">
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 shadow-xl text-white mb-6">
                  <div className="flex items-center justify-center lg:justify-start mb-4">
                    <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                      🚀 Lancement bientôt
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-center lg:text-left">
                    Soyez parmi les premiers !
                  </h3>
                  <p className="text-green-100 text-sm mb-4 text-center lg:text-left">
                    Inscrivez-vous dès maintenant pour être notifié du lancement et bénéficier d'avantages exclusifs.
                  </p>
                  
                  {!showPreregForm ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowPreregForm(true)}
                      className="w-full bg-white text-green-600 px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm3 0c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
                      </svg>
                      S'inscrire à la préinscription
                    </motion.button>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handlePreregistrationSubmit}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        <input
                          type="email"
                          placeholder="Votre email"
                          value={preregistrationData.email}
                          onChange={(e) => setPreregistrationData(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-white focus:border-white focus:outline-none shadow-sm text-sm sm:text-base"
                        />
                        <input
                          type="text"
                          placeholder="Votre nom complet"
                          value={preregistrationData.fullName}
                          onChange={(e) => setPreregistrationData(prev => ({ ...prev, fullName: e.target.value }))}
                          required
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-white focus:border-white focus:outline-none shadow-sm text-sm sm:text-base"
                        />
                        <input
                          type="tel"
                          placeholder="Votre téléphone (optionnel)"
                          value={preregistrationData.phone}
                          onChange={(e) => setPreregistrationData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-white focus:border-white focus:outline-none shadow-sm text-sm sm:text-base"
                        />
                      </div>
                      
                      <div className="flex items-center text-xs sm:text-sm">
                        <input
                          type="checkbox"
                          id="marketing-consent"
                          checked={preregistrationData.marketingConsent}
                          onChange={(e) => setPreregistrationData(prev => ({ ...prev, marketingConsent: e.target.checked }))}
                          className="h-3 sm:h-4 w-3 sm:w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="marketing-consent" className="ml-2 text-green-100">
                          J'accepte de recevoir des notifications
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 bg-white text-green-600 px-3 sm:px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                        >
                          {isSubmitting ? (
                            <svg className="animate-spin h-3 sm:h-4 w-3 sm:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : 'Confirmer'}
                        </motion.button>
                        <button
                          type="button"
                          onClick={() => setShowPreregForm(false)}
                          className="px-3 sm:px-4 py-2 text-green-100 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                        >
                          Annuler
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {submitStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-green-500 rounded-lg flex items-center"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      <span className="text-sm">Merci ! Nous vous contacterons bientôt.</span>
                    </motion.div>
                  )}

                  {submitStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-red-500 rounded-lg flex items-start"
                    >
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{errorMessage || 'Une erreur s\'est produite. Réessayez plus tard.'}</span>
                    </motion.div>
                  )}
                </div>
                
                <div className="text-center lg:text-left">
                  <p className="text-sm text-gray-500 mb-4">
                    Ou suivez-nous pour rester informé :
                  </p>
                  <div className="flex justify-center lg:justify-start space-x-4">
                    <a 
                      href="https://www.facebook.com/share/1HnVg1pJxg/?mibextid=wwXIfr" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors duration-300"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.instagram.com/yamdata?igsh=a3R0ZzI2eHV5MTBr&utm_source=qr" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors duration-300"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a 
                      href="https://www.tiktok.com/@yam_data?_r=1&_t=ZN-919jE6XRbja" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors duration-300"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-8 sm:mt-12 relative max-w-sm sm:max-w-lg mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
            >
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md overflow-hidden">
                <div className="relative block w-full bg-black rounded-lg overflow-hidden">
                  {/* Vidéo intégrée */}
                  <div className="aspect-w-9 aspect-h-16 relative">
                    <video
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      src="/Yamdata_format_youtube.mp4"
                    >
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-12 sm:py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-sm sm:text-base font-semibold text-green-600 tracking-wide uppercase">Fonctionnalités</h2>
            <p className="mt-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
              Tout ce dont <span className="text-green-600">vous</span> avez besoin
            </p>
            <p className="max-w-xl mt-3 sm:mt-5 mx-auto text-base sm:text-lg lg:text-xl text-gray-500">
              Yamdata combine l'achat de forfaits internet et l'épargne automatique dans une seule application, conçue pour <span className="text-green-600 font-medium">vous</span>.
            </p>
          </motion.div>

          <div className="mt-12 sm:mt-16">
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="pt-6"
              >
                <div className="flow-root bg-gray-50 rounded-lg px-4 sm:px-6 pb-6 sm:pb-8 h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="-mt-4 sm:-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-2 sm:p-3 bg-green-600 rounded-md shadow-lg">
                        <DevicePhoneMobileIcon className="h-5 sm:h-6 w-5 sm:w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-6 sm:mt-8 text-base sm:text-lg font-medium text-gray-900 tracking-tight">Achat de forfaits</h3>
                    <p className="mt-3 sm:mt-5 text-sm sm:text-base text-gray-500">
                      Achetez <span className="text-green-600 font-medium">vos</span> forfaits via mobile money (Telecel, Orange, Moov) directement depuis l'application, en quelques clics seulement.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="pt-6"
              >
                <div className="flow-root bg-gray-50 rounded-lg px-4 sm:px-6 pb-6 sm:pb-8 h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="-mt-4 sm:-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-2 sm:p-3 bg-green-600 rounded-md shadow-lg">
                        <BanknotesIcon className="h-5 sm:h-6 w-5 sm:w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-6 sm:mt-8 text-base sm:text-lg font-medium text-gray-900 tracking-tight">Épargne automatique</h3>
                    <p className="mt-3 sm:mt-5 text-sm sm:text-base text-gray-500">
                      À chaque achat, une partie est automatiquement épargnée selon <span className="text-green-600 font-medium">vos</span> préférences, sans effort supplémentaire de votre part.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="pt-6"
              >
                <div className="flow-root bg-gray-50 rounded-lg px-4 sm:px-6 pb-6 sm:pb-8 h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="-mt-4 sm:-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-2 sm:p-3 bg-green-600 rounded-md shadow-lg">
                        <ShieldCheckIcon className="h-5 sm:h-6 w-5 sm:w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-6 sm:mt-8 text-base sm:text-lg font-medium text-gray-900 tracking-tight">Sécurité renforcée</h3>
                    <p className="mt-3 sm:mt-5 text-sm sm:text-base text-gray-500">
                      <span className="text-green-600 font-medium">Vos</span> données personnelles et financières sont protégées avec les plus hauts standards de sécurité, pour votre tranquillité d'esprit.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" className="bg-green-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-base font-semibold text-green-600 tracking-wide uppercase">Comment ça marche</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Simple et efficace pour <span className="text-green-600">vous</span>
            </p>
          </motion.div>

          <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
            >
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-bold text-lg">1</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900 text-center">Achetez votre forfait</p>
                  <p className="mt-3 text-base text-gray-500 text-center">
                    Choisissez <span className="text-green-600 font-medium">votre</span> opérateur et le forfait qui vous convient, en quelques clics seulement.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
            >
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-bold text-lg">2</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900 text-center">Épargnez automatiquement</p>
                  <p className="mt-3 text-base text-gray-500 text-center">
                    Une partie du montant est automatiquement épargnée selon <span className="text-green-600 font-medium">vos</span> préférences, sans effort supplémentaire.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
            >
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-bold text-lg">3</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900 text-center">Suivez votre progression</p>
                  <p className="mt-3 text-base text-gray-500 text-center">
                    Visualisez <span className="text-green-600 font-medium">votre</span> épargne et planifiez vos objectifs financiers en toute simplicité.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Example */}
      <div className="bg-white py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="mb-12 lg:mb-0"
            >
              <h2 className="text-base font-semibold text-green-600 tracking-wide uppercase">Exemple concret</h2>
              <p className="mt-2 text-3xl font-extrabold text-gray-900">
                Voyez comment Yamdata fonctionne <span className="text-green-600">pour vous</span>
              </p>
              <p className="mt-4 text-lg text-gray-500">
                Découvrez comment <span className="text-green-600 font-medium">votre</span> achat de forfait se transforme en épargne. Voici un exemple pour un forfait de 2 Go à 1 050 FCFA :
              </p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="mt-6 bg-gradient-to-br from-green-50 to-white rounded-lg p-6 shadow-lg"
              >
                <dl className="space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-base font-medium text-gray-900 flex items-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                      Montant total payé
                    </dt>
                    <dd className="text-base font-semibold text-green-600">1 050 FCFA</dd>
                  </div>
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="h-px bg-gradient-to-r from-green-200 to-transparent"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <dt className="text-base font-medium text-gray-900 flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Coût des 2 Go
                    </dt>
                    <dd className="text-base font-semibold text-gray-600">700 FCFA</dd>
                  </div>
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="h-px bg-gradient-to-r from-green-200 to-transparent"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <dt className="text-base font-medium text-gray-900 flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      Montant destiné à l'épargne
                    </dt>
                    <dd className="text-base font-semibold text-gray-600">250 FCFA</dd>
                  </div>
                </dl>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 italic">
                    Avec Yamdata, <span className="text-green-600 font-medium">vous</span> épargnez à chaque achat de forfait, sans y penser !
                  </p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                viewport={{ once: true }}
                className="mt-6"
              >
                <a href="#" className="text-green-600 font-medium flex items-center hover:text-green-700 transition-colors duration-300">
                  En savoir plus sur notre calculateur d'épargne
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </a>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:mt-0"
            >
              <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
                <div className="w-full rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-500 hover:shadow-2xl">
                  {/* Mockup d'application mobile amélioré */}
                  <div className="aspect-w-9 aspect-h-16 bg-gradient-to-b from-green-50 to-white p-4 rounded-xl">
                    <div className="flex flex-col h-full rounded-xl bg-white shadow-sm overflow-hidden border border-green-100">
                      <div className="h-10 bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center">
                        <Image 
                          src="/logo.svg" 
                          alt="Yamdata App" 
                          width={51} 
                          height={13} 
                          className="h-3 sm:h-4 lg:h-5 w-auto"
                        />
                      </div>
                      <div className="flex-1 p-4">
                        <div className="w-full h-28 bg-gradient-to-br from-green-50 to-green-100 rounded-lg mb-4 flex flex-col items-center justify-center shadow-sm">
                          <p className="text-gray-500 text-sm mb-1">Votre épargne actuelle</p>
                          <motion.p 
                            initial={{ scale: 1 }}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            className="text-green-600 font-bold text-2xl"
                          >
                            450 FCFA
                          </motion.p>
                          <div className="w-32 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "30%" }}
                              transition={{ duration: 1.5, delay: 0.5 }}
                              className="h-full bg-green-500 rounded-full"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <div className="flex-1 h-8 bg-gray-100 rounded-md"></div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div className="flex-1 h-8 bg-gray-100 rounded-md"></div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                            <div className="flex-1 h-8 bg-gray-100 rounded-md"></div>
                          </div>
                        </div>
                      </div>
                      <div className="h-12 flex border-t border-gray-100">
                        <motion.div 
                          whileHover={{ backgroundColor: '#f0fdf4' }}
                          className="flex-1 flex items-center justify-center text-green-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </motion.div>
                        <motion.div 
                          whileHover={{ backgroundColor: '#f0fdf4' }}
                          className="flex-1 flex items-center justify-center text-green-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </motion.div>
                        <motion.div 
                          whileHover={{ backgroundColor: '#f0fdf4' }}
                          className="flex-1 flex items-center justify-center text-green-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Preregistration Stats Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Rejoignez la communauté <span className="text-green-600">Yamdata</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Des milliers d'utilisateurs nous font déjà confiance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg text-center transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-green-600 mb-2"
              >
                {statsLoading ? '...' : `${stats?.total_preregistrations || 0}+`}
              </motion.div>
              <p className="text-gray-600">Préinscriptions</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg text-center transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-green-600 mb-2"
              >
                {statsLoading ? '...' : `${stats?.marketing_consent_count || 0}`}
              </motion.div>
              <p className="text-gray-600">Avec consentement</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg text-center transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-green-600 mb-2"
              >
                {statsLoading ? '...' : `${Math.round((stats?.average_priority_score || 0) * 10)}%`}
              </motion.div>
              <p className="text-gray-600">Score moyen</p>
            </motion.div>
          </div>

          {/* Testimonials */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-xl"
          >
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Ce que disent nos premiers utilisateurs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <blockquote className="text-gray-600 italic mb-4">
                  "J'ai hâte de pouvoir épargner automatiquement avec mes achats de forfaits. L'idée est géniale !"
                </blockquote>
                <div className="font-semibold text-gray-900">Amadou K.</div>
                <div className="text-sm text-gray-500">Entrepreneur, Ouagadougou</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👩‍🎓</span>
                </div>
                <blockquote className="text-gray-600 italic mb-4">
                  "Enfin une solution qui combine mes besoins quotidiens et mes objectifs d'épargne. Bravo !"
                </blockquote>
                <div className="font-semibold text-gray-900">Fatima S.</div>
                <div className="text-sm text-gray-500">Étudiante, Bobo-Dioulasso</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👨‍🏫</span>
                </div>
                <blockquote className="text-gray-600 italic mb-4">
                  "Cette approche révolutionnaire va changer ma façon de gérer mes finances. Vivement le lancement !"
                </blockquote>
                <div className="font-semibold text-gray-900">Ibrahim T.</div>
                <div className="text-sm text-gray-500">Enseignant, Koudougou</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 overflow-hidden">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between relative">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="lg:w-0 lg:flex-1"
          >
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ne ratez pas le lancement !</span>
              <span className="block text-green-200">Inscrivez-vous pour être averti en premier.</span>
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-green-100">
              Les premiers inscrits bénéficieront d'avantages exclusifs : 
              <span className="font-medium text-white"> 3 mois gratuits</span> de frais de gestion et 
               pour votre première épargne.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-8 lg:mt-0 lg:flex-shrink-0"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 text-center">
                Inscription express
              </h3>
              <form onSubmit={handleExpressFormSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  <input
                    type="email"
                    placeholder="Votre email"
                    value={expressFormData.email}
                    onChange={(e) => setExpressFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    autoComplete="email"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-300 focus:border-green-500 focus:outline-none shadow-sm text-sm sm:text-base"
                  />
                  <input
                    type="text"
                    placeholder="Votre nom"
                    value={expressFormData.fullName}
                    onChange={(e) => setExpressFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                    autoComplete="name"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-300 focus:border-green-500 focus:outline-none shadow-sm text-sm sm:text-base"
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isExpressSubmitting}
                  className="w-full bg-white text-green-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                >
                  {isExpressSubmitting ? (
                    <>
                      <svg className="animate-spin h-3 sm:h-4 w-3 sm:w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Inscription...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Réserver ma place
                    </>
                  )}
                </motion.button>
              </form>

              {expressSubmitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-green-500 rounded-lg flex items-center text-white text-sm"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  <span>Parfait ! Vous serez notifié du lancement.</span>
                </motion.div>
              )}

              {expressSubmitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-500 rounded-lg flex items-start text-white text-sm"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{expressErrorMessage || 'Erreur. Réessayez plus tard.'}</span>
                </motion.div>
              )}
              
              <p className="text-green-100 text-xs text-center mt-3 sm:mt-4">
                ✨ Avantages exclusifs garantis pour les premiers inscrits
              </p>
            </div>
          </motion.div>
          
          {/* Éléments décoratifs */}
          <div className="hidden lg:block absolute top-0 right-0 -mt-20 -mr-20 opacity-10 pointer-events-none">
            <svg width="404" height="404" fill="none" viewBox="0 0 404 404">
              <defs>
                <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="4" height="4" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="404" fill="url(#pattern)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <Image 
                src="/logo.svg" 
                alt="Yamdata Logo" 
                width={141} 
                height={38} 
                className="h-8 sm:h-10 lg:h-12 w-auto mb-3 sm:mb-4"
              />
              <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-sm">
                Yamdata transforme vos achats de forfaits internet en épargne intelligente.
              </p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300 tracking-wider uppercase mb-3 sm:mb-4">Navigation</h3>
              <ul className="space-y-1 sm:space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-green-300 transition-colors duration-300 text-sm">Fonctionnalités</a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-gray-400 hover:text-green-300 transition-colors duration-300 text-sm">Comment ça marche</a>
                </li>
                <li>
                  <a href="/login" className="text-gray-400 hover:text-green-300 transition-colors duration-300 text-sm">Se connecter</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300 tracking-wider uppercase mb-3 sm:mb-4">Contact</h3>
              <ul className="space-y-1 sm:space-y-2">
                <li className="flex items-center text-gray-400 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 sm:h-4 w-3 sm:w-4 mr-2 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a
                    href="mailto:contact@yamdata.bf"
                    className="break-all text-gray-400 hover:text-green-300 transition-colors duration-300 text-sm"
                  >
                    contact@yamdata.bf
                  </a>
                </li>
                <li className="flex items-center text-gray-400 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 sm:h-4 w-3 sm:w-4 mr-2 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a
                    href="https://wa.me/22653967777"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-green-300 transition-colors duration-300 text-sm"
                  >
                    Moov : 53 96 77 77
                  </a>
                </li>
                <li className="flex items-center text-gray-400 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 sm:h-4 w-3 sm:w-4 mr-2 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a
                    href="https://wa.me/22679117855"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-green-300 transition-colors duration-300 text-sm"
                  >
                    Telecel : 79 11 78 55
                  </a>
                </li>
                <li className="flex items-center text-gray-400 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 sm:h-4 w-3 sm:w-4 mr-2 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a
                    href="https://wa.me/22656158448"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-green-300 transition-colors duration-300 text-sm"
                  >
                    Orange : 56 15 84 48
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 sm:pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex justify-center sm:justify-start space-x-4 sm:space-x-6 mb-4 sm:mb-0">
              <motion.a 
                whileHover={{ scale: 1.1, y: -2 }}
                href="https://www.facebook.com/share/1HnVg1pJxg/?mibextid=wwXIfr" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-300 transition-colors duration-300"
              >
                <span className="sr-only">Facebook</span>
                <svg className="h-5 sm:h-6 w-5 sm:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.1, y: -2 }}
                href="https://www.instagram.com/yamdata?igsh=a3R0ZzI2eHV5MTBr&utm_source=qr" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-300 transition-colors duration-300"
              >
                <span className="sr-only">Instagram</span>
                <svg className="h-5 sm:h-6 w-5 sm:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.1, y: -2 }}
                href="https://www.tiktok.com/@yam_data?_r=1&_t=ZN-919jE6XRbja" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-300 transition-colors duration-300"
              >
                <span className="sr-only">TikTok</span>
                <svg className="h-5 sm:h-6 w-5 sm:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </motion.a>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Yamdata. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
