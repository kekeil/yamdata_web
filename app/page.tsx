'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, DevicePhoneMobileIcon, BanknotesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Image
                src="/logo.jpg" 
                alt="Yamdata Logo" 
                width={360} 
                height={96} 
                className="h-20 w-auto transition-all duration-300 hover:scale-105"
              />
            </div>
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
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 py-12 md:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
            >
              <h1>
                <span className="block text-sm font-semibold uppercase tracking-wide text-green-600">
                  Une nouvelle façon d'épargner
                </span>
                <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                  <span className="block text-gray-900">Connecte-toi,</span>
                  <span className="block text-green-600">épargne, évolue.</span>
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Yamdata transforme <span className="text-green-600 font-semibold">vos</span> achats de forfaits internet en épargne intelligente. 
                Achetez <span className="text-green-600 font-semibold">vos</span> données comme d'habitude et épargnez automatiquement à chaque transaction.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <a 
                    href="https://play.google.com/store" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    <span className="mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
                    </span>
                    Télécharger sur Google Play
                  </a>
                  <a
                    href="https://apps.apple.com" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    <span className="mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                      </svg>
                    </span>
                    Télécharger sur App Store
                  </a>
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
            >
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  {/* Mockup d'application mobile */}
                  <div className="aspect-w-9 aspect-h-16 bg-gray-100 p-4">
                    <div className="flex flex-col h-full rounded-xl bg-white shadow-sm overflow-hidden">
                      <div className="h-10 bg-green-600 flex items-center justify-center">
                        <Image 
                          src="/logo.jpg" 
                          alt="Yamdata App" 
                          width={80} 
                          height={20} 
                          className="h-6 w-auto"
                        />
                      </div>
                      <div className="flex-1 p-4">
                        <div className="w-full h-24 bg-green-50 rounded-lg mb-4 flex items-center justify-center">
                          <p className="text-green-600 font-bold text-lg">450 FCFA</p>
                        </div>
                        <div className="space-y-2">
                          <div className="h-8 bg-gray-100 rounded-md"></div>
                          <div className="h-8 bg-gray-100 rounded-md"></div>
                          <div className="h-8 bg-gray-100 rounded-md"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                    >
                      Voir la démo
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-base font-semibold text-green-600 tracking-wide uppercase">Fonctionnalités</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Tout ce dont <span className="text-green-600">vous</span> avez besoin
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Yamdata combine l'achat de forfaits internet et l'épargne automatique dans une seule application, conçue pour <span className="text-green-600 font-medium">vous</span>.
            </p>
          </motion.div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="pt-6"
              >
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-600 rounded-md shadow-lg">
                        <DevicePhoneMobileIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Achat de forfaits</h3>
                    <p className="mt-5 text-base text-gray-500">
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
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-600 rounded-md shadow-lg">
                        <BanknotesIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Épargne automatique</h3>
                    <p className="mt-5 text-base text-gray-500">
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
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-600 rounded-md shadow-lg">
                        <ShieldCheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Sécurité renforcée</h3>
                    <p className="mt-5 text-base text-gray-500">
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
                    <dd className="text-base font-semibold text-gray-600">550 FCFA</dd>
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
                    <dd className="text-base font-semibold text-gray-600">500 FCFA</dd>
                  </div>
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="h-px bg-gradient-to-r from-green-200 to-transparent"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <dt className="text-base font-medium text-gray-900 flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      Frais de gestion
                    </dt>
                    <dd className="text-base font-semibold text-gray-600">-50 FCFA</dd>
                  </div>
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    viewport={{ once: true }}
                    className="h-px bg-gradient-to-r from-green-200 to-transparent"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <dt className="text-base font-bold text-gray-900 flex items-center">
                      <span className="w-3 h-3 bg-green-600 rounded-full mr-2 animate-pulse"></span>
                      Épargne nette
                    </dt>
                    <motion.dd 
                      initial={{ scale: 1 }}
                      whileInView={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, delay: 0.7, times: [0, 0.5, 1] }}
                      viewport={{ once: true }}
                      className="text-lg font-bold text-green-600"
                    >
                      450 FCFA
                    </motion.dd>
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
                          src="/logo.jpg" 
                          alt="Yamdata App" 
                          width={80} 
                          height={20} 
                          className="h-6 w-auto"
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
              <span className="block">Prêt à commencer?</span>
              <span className="block text-green-200">Téléchargez l'application dès maintenant.</span>
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-green-100">
              Rejoignez les milliers d'utilisateurs qui gèrent leur budget et épargnent avec Yamdata. 
              <span className="font-medium"> Votre</span> avenir financier commence ici.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-8 flex lg:mt-0 lg:flex-shrink-0 space-x-4"
          >
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-green-50 shadow-lg transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              Google Play
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-800 hover:bg-green-900 shadow-lg transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
              </svg>
              App Store
            </motion.a>
          </motion.div>
          
          {/* Éléments décoratifs */}
          <div className="hidden lg:block absolute top-0 right-0 -mt-20 -mr-20 opacity-10">
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
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <Image 
                src="/logo.jpg" 
                alt="Yamdata Logo" 
                width={130} 
                height={35} 
                className="h-10 w-auto mb-4"
              />
              <p className="text-gray-300 text-sm mt-2">
                Yamdata transforme vos achats de forfaits internet en épargne intelligente.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-4">Navigation</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-green-300 transition-colors duration-300">Fonctionnalités</a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-gray-400 hover:text-green-300 transition-colors duration-300">Comment ça marche</a>
                </li>
                <li>
                  <a href="/login" className="text-gray-400 hover:text-green-300 transition-colors duration-300">Se connecter</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contact@yamdata.com
                </li>
                <li className="flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +226 XX XX XX XX
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <motion.a 
                whileHover={{ scale: 1.1, y: -2 }}
                href="#" 
                className="text-gray-400 hover:text-green-300 transition-colors duration-300"
              >
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.1, y: -2 }}
                href="#" 
                className="text-gray-400 hover:text-green-300 transition-colors duration-300"
              >
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.1, y: -2 }}
                href="#" 
                className="text-gray-400 hover:text-green-300 transition-colors duration-300"
              >
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </motion.a>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-base text-gray-400">
                &copy; {new Date().getFullYear()} Yamdata. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
