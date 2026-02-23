'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface SMSVerificationProps {
  phone: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SMSVerification({ phone, onSuccess, onCancel }: SMSVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes en secondes
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer compte à rebours
  useEffect(() => {
    if (timeLeft > 0 && !isBlocked) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !canResend) {
      setCanResend(true);
    }
  }, [timeLeft, canResend, isBlocked]);

  // Timer de blocage
  useEffect(() => {
    if (isBlocked && blockTimeLeft > 0) {
      const timer = setTimeout(() => setBlockTimeLeft(blockTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isBlocked && blockTimeLeft === 0) {
      setIsBlocked(false);
      setAttempts(0);
    }
  }, [isBlocked, blockTimeLeft]);

  // Auto-focus sur le premier champ au montage
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (isBlocked) return;

    // Ne garder que les chiffres
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError('');

    // Auto-focus sur le champ suivant
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Si tous les champs sont remplis, vérifier automatiquement
    if (newCode.every(d => d !== '') && digit) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace : revenir au champ précédent
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setCode(newCode);

    // Focus sur le dernier champ rempli ou le suivant
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    // Si 6 chiffres collés, vérifier automatiquement
    if (pastedData.length === 6) {
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (codeString: string) => {
    if (isBlocked) {
      setError(`Trop de tentatives. Réessayez dans ${formatTime(blockTimeLeft)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Remplacer par votre logique de vérification SMS réelle
      // Exemple avec une API :
      // const response = await fetch('/api/verify-sms', {
      //   method: 'POST',
      //   body: JSON.stringify({ phone, code: codeString })
      // });
      
      // SIMULATION pour le développement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler une vérification (à remplacer par votre vraie logique)
      const isValid = codeString === '123456'; // Code de test
      
      if (isValid) {
        // Succès !
        onSuccess();
      } else {
        // Échec
        setAttempts(prev => prev + 1);
        
        if (attempts + 1 >= 3) {
          // Bloquer après 3 tentatives
          setIsBlocked(true);
          setBlockTimeLeft(900); // 15 minutes
          setError('Trop de tentatives. Compte bloqué pendant 15 minutes.');
        } else {
          setError(`Code incorrect. ${3 - (attempts + 1)} tentative(s) restante(s)`);
        }
        
        // Réinitialiser les champs
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Erreur lors de la vérification. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendCount >= 2 || isBlocked) return;

    setLoading(true);
    setError('');

    try {
      // TODO: Remplacer par votre logique d'envoi SMS réelle
      // await fetch('/api/send-sms', {
      //   method: 'POST',
      //   body: JSON.stringify({ phone })
      // });

      // SIMULATION
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTimeLeft(300); // Réinitialiser à 5 minutes
      setCanResend(false);
      setResendCount(prev => prev + 1);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      alert('Un nouveau code a été envoyé !');
    } catch (err) {
      setError('Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codeString = code.join('');
    if (codeString.length === 6) {
      verifyCode(codeString);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Bouton fermer */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vérification SMS
          </h2>
          <p className="text-sm text-gray-600">
            Code envoyé au <span className="font-semibold">{phone}</span>
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          {/* Champs de code */}
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading || isBlocked}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all
                  ${isBlocked ? 'bg-gray-100 border-gray-300 cursor-not-allowed' :
                    digit ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                  focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50`}
              />
            ))}
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Timer et renvoi */}
          <div className="text-center mb-6">
            {isBlocked ? (
              <p className="text-sm text-red-600 font-semibold">
                ⏱️ Bloqué pour {formatTime(blockTimeLeft)}
              </p>
            ) : timeLeft > 0 ? (
              <p className="text-sm text-gray-600">
                Code valide pendant <span className="font-semibold text-green-600">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-600 font-semibold">
                ⏱️ Code expiré
              </p>
            )}

            {/* Bouton renvoyer */}
            {resendCount < 2 && !isBlocked && (
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || loading}
                className="mt-2 text-sm text-green-600 hover:text-green-700 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {canResend ? 'Renvoyer le code' : `Renvoyer disponible dans ${formatTime(timeLeft)}`}
              </button>
            )}

            {resendCount >= 2 && (
              <p className="mt-2 text-xs text-gray-500">
                Limite de renvoi atteinte (2/2)
              </p>
            )}
          </div>

          {/* Bouton vérifier */}
          <button
            type="submit"
            disabled={loading || code.some(d => !d) || isBlocked}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Vérification...
              </span>
            ) : (
              'Vérifier le code'
            )}
          </button>
        </form>

        {/* Aide */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Vous n'avez pas reçu le code ?<br />
            Vérifiez que votre téléphone est allumé et a du réseau.
          </p>
        </div>

        {/* Dev info */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          <p className="font-semibold mb-1">🔧 Mode développement</p>
          <p>Code de test : <span className="font-mono font-bold">123456</span></p>
          <p className="text-[10px] mt-1 opacity-75">Remplacez par votre API SMS en production</p>
        </div>
      </div>
    </div>
  );
}