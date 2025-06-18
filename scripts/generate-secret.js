/**
 * Script pour générer une clé secrète aléatoire pour l'initialisation de l'administrateur
 * Exécuter avec: node scripts/generate-secret.js
 */

const crypto = require('crypto');

// Générer une chaîne aléatoire de 32 octets et la convertir en base64
const generateRandomSecret = () => {
  const buffer = crypto.randomBytes(32);
  return buffer.toString('base64');
};

const secret = generateRandomSecret();

console.log('\n=== CLÉ SECRÈTE GÉNÉRÉE ===');
console.log(secret);
console.log('\nCopiez cette clé et utilisez-la pour les variables suivantes dans votre fichier .env.local :');
console.log('ADMIN_INIT_SECRET=', secret);
console.log('ADMIN_INIT_SECRET_VERIFY=', secret);
console.log('\n'); 