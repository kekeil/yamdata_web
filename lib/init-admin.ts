import { supabase } from './supabase/client';
import { supabaseAdmin, isAdminClientAvailable } from './supabase/admin';

export async function initializeAdmin(secretKey: string) {
  try {
    // Vérifier que la clé secrète est valide
    if (!secretKey || secretKey !== process.env.ADMIN_INIT_SECRET) {
      throw new Error('Clé d\'initialisation non valide');
    }
    
    // Vérifier si le client admin est disponible (nécessaire pour contourner RLS)
    if (!isAdminClientAvailable()) {
      throw new Error('Client Supabase avec privilèges d\'administration non disponible. Vérifiez SUPABASE_SERVICE_ROLE_KEY dans les variables d\'environnement.');
    }

    // Essayer de vérifier si un administrateur existe déjà en utilisant la fonction is_user_admin
    // D'abord, obtenir la liste des utilisateurs pour pouvoir vérifier s'ils sont admin
    const { data: users, error: usersError } = await supabaseAdmin!.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }
    
    // Vérifier s'il existe déjà un administrateur
    let adminExists = false;
    for (const user of users.users) {
      // Utiliser la fonction RPC is_user_admin pour vérifier
      const { data: isAdmin, error: checkError } = await supabaseAdmin!.rpc(
        'is_user_admin',
        { user_id_param: user.id }
      );
      
      if (checkError) {
        console.warn("Erreur lors de la vérification du rôle admin:", checkError);
        continue;
      }
      
      if (isAdmin) {
        adminExists = true;
        break;
      }
    }
    
    // Si un administrateur existe déjà, arrêter ici
    if (adminExists) {
      return { success: true, message: 'Un administrateur existe déjà' };
    }
    
    // 1. Créer l'utilisateur avec Supabase Auth
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE;
    
    if (!adminEmail || !adminPassword || !adminPhone) {
      throw new Error('Informations d\'administrateur manquantes dans les variables d\'environnement');
    }
    
    // Créer l'utilisateur dans Auth avec le client admin
    const { data: authData, error: authError } = await supabaseAdmin!.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      phone: adminPhone,
      email_confirm: true // Confirmer automatiquement l'email
    });
    
    if (authError) throw authError;
    
    if (!authData.user) {
      throw new Error('Échec de la création de l\'utilisateur');
    }
    
    // 2. Ajouter l'utilisateur à la table profiles (au lieu de users)
    const { error: profileInsertError } = await supabaseAdmin!
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        phone: adminPhone,
        full_name: 'Administrateur'
      });
    
    if (profileInsertError) throw profileInsertError;
    
    // 3. Utiliser la fonction RPC add_admin_role pour attribuer le rôle admin
    const { data: addRoleResult, error: addRoleError } = await supabaseAdmin!.rpc(
      'add_admin_role',
      { user_id_param: authData.user.id }
    );
    
    if (addRoleError) {
      console.error('Erreur lors de l\'attribution du rôle admin:', addRoleError);
      throw addRoleError;
    }
    
    if (!addRoleResult) {
      throw new Error('Échec de l\'attribution du rôle administrateur');
    }
    
    // 4. Vérifier que le rôle a bien été attribué
    const { data: verifyAdmin, error: verifyError } = await supabaseAdmin!.rpc(
      'is_user_admin',
      { user_id_param: authData.user.id }
    );
    
    if (verifyError) {
      console.error('Erreur lors de la vérification du rôle admin:', verifyError);
      throw verifyError;
    }
    
    if (!verifyAdmin) {
      throw new Error('Vérification de l\'attribution du rôle admin échouée');
    }
    
    return { success: true, message: 'Administrateur créé avec succès' };
  } catch (error: any) {
    console.error('Erreur lors de l\'initialisation de l\'administrateur:', error);
    return { success: false, message: error.message || 'Erreur inconnue' };
  }
} 