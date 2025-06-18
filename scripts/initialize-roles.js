/**
 * Script pour initialiser les rôles dans la base de données
 * Exécuter avec: node scripts/initialize-roles.js
 * 
 * IMPORTANT: Vous devez avoir ajouté SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env
 */

// Charger les variables d'environnement
require('dotenv').config({ path: '.env' });

// Vérifier si les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes. Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis dans le fichier .env');
  console.log('\nVous devez ajouter votre clé de service dans le fichier .env:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=votre_clé_de_service');
  console.log('\nVous pouvez trouver cette clé dans les paramètres de votre projet Supabase, sous "API" > "Project API keys" > "service_role key (secret)"');
  process.exit(1);
}

// Importer le client Supabase
const { createClient } = require('@supabase/supabase-js');

// Créer un client Supabase avec la clé de service (contourne RLS)
console.log(`🔑 Connexion à Supabase avec la clé de service: ${supabaseUrl}`);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Définir les rôles à créer
const roles = [
  { name: 'admin', permissions: { full_access: true } },
  { name: 'user', permissions: { can_read: true } },
  { name: 'support', permissions: { can_read: true, can_support: true } }
];

async function initializeRoles() {
  try {
    console.log('\n📊 Vérification des rôles existants...');
    
    // Récupérer les rôles existants
    const { data: existingRoles, error: rolesError } = await supabaseAdmin
      .from('roles')
      .select('*');
    
    if (rolesError) {
      throw new Error(`Erreur lors de la récupération des rôles: ${rolesError.message}`);
    }
    
    console.log(`✅ Rôles existants: ${existingRoles.map(r => r.name).join(', ') || 'Aucun'}`);
    
    // Créer les rôles manquants
    console.log('\n🔧 Création des rôles manquants...');
    
    for (const role of roles) {
      const roleExists = existingRoles.some(r => r.name === role.name);
      
      if (!roleExists) {
        console.log(`➕ Création du rôle: ${role.name}`);
        
        const { error: createError } = await supabaseAdmin
          .from('roles')
          .insert(role);
        
        if (createError) {
          console.error(`❌ Erreur lors de la création du rôle ${role.name}: ${createError.message}`);
        } else {
          console.log(`✅ Rôle ${role.name} créé avec succès!`);
        }
      } else {
        console.log(`✅ Le rôle ${role.name} existe déjà.`);
      }
    }
    
    // Récupérer les rôles mis à jour
    const { data: updatedRoles } = await supabaseAdmin
      .from('roles')
      .select('*');
    
    console.log('\n📊 Rôles dans la base de données:');
    updatedRoles.forEach(role => {
      console.log(`  - ID: ${role.id}, Nom: ${role.name}`);
    });
    
    console.log('\n✅ Initialisation des rôles terminée!');
    
  } catch (error) {
    console.error(`\n❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter la fonction
initializeRoles(); 