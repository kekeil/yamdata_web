/**
 * Script pour initialiser les rôles dans la base de données
 * Exécuter avec: node scripts/initialize-roles.js
 * 
 * IMPORTANT: Vous devez avoir ajouté SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env
 */
'use client';
// Charger les variables d'environnement
require('dotenv').config({ path: '.env' });

// Vérifier si les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes. Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis dans le fichier .env');
  process.exit(1);
}

// Importer le client Supabase
const { createClient } = require('@supabase/supabase-js');

// Créer un client Supabase avec la clé de service (contourne RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Définir les rôles à créer
const roles = [
  { name: 'admin', permissions: { full_access: true } },
  { name: 'user', permissions: { can_read: true } },
  { name: 'support', permissions: { can_read: true, can_support: true } }
];

async function initializeRoles() {
  try {
    // Récupérer les rôles existants
    const { data: existingRoles, error: rolesError } = await supabaseAdmin
      .from('roles')
      .select('*');
    
    if (rolesError) {
      throw new Error(`Erreur lors de la récupération des rôles: ${rolesError.message}`);
    }
    
    // Créer les rôles manquants
    for (const role of roles) {
      const roleExists = existingRoles.some(r => r.name === role.name);
      
      if (!roleExists) {
        const { error: createError } = await supabaseAdmin
          .from('roles')
          .insert(role);
        
        if (createError) {
          console.error(`❌ Erreur lors de la création du rôle ${role.name}: ${createError.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error(`\n❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter la fonction
initializeRoles(); 