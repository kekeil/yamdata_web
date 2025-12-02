"use client";
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

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE;
    
    if (!adminEmail || !adminPassword || !adminPhone) {
      throw new Error('Informations d\'administrateur manquantes dans les variables d\'environnement');
    }
    
    // 1. Chercher l'utilisateur par email dans Auth
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userPhone: string | null = null;
    let userExists = false;

    const { data: userList, error: userListError } = await supabaseAdmin!.auth.admin.listUsers();
    if (userListError) throw userListError;
    const existingUser = userList?.users?.find(user => user.email === adminEmail);
    if (existingUser) {
      // Utilisateur déjà existant
      userId = existingUser.id;
      userEmail = existingUser.email ?? null;
      userPhone = existingUser.phone ?? null;
      userExists = true;
    } else {
      // Créer l'utilisateur
      const { data: authData, error: authError } = await supabaseAdmin!.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        phone: adminPhone,
        email_confirm: true
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Échec de la création de l\'utilisateur');
      userId = authData.user.id;
      userEmail = authData.user.email ?? null;
      userPhone = authData.user.phone ?? null;
    }

    // 2. Vérifier/créer le profil dans 'profiles'
    const { data: profile, error: profileSelectError } = await supabaseAdmin!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (profileSelectError && profileSelectError.code !== 'PGRST116') throw profileSelectError;
    if (!profile) {
      // Créer le profil si absent
      const { error: profileInsertError } = await supabaseAdmin!
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail || adminEmail,
          phone: userPhone || adminPhone,
          full_name: 'Administrateur'
        });
      if (profileInsertError) throw profileInsertError;
    }

    // 3. Vérifier que le rôle 'admin' existe
    const { data: adminRole, error: adminRoleError } = await supabaseAdmin!.from('roles').select('id').eq('name', 'admin').single();
    if (adminRoleError || !adminRole) {
      console.error('Error fetching admin role:', adminRoleError);
      return { success: false, message: "Failed to find admin role." };
    }

    // 4. Vérifier/créer le lien dans 'user_roles'
    const { data: existingRole } = await supabaseAdmin!
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role_id', adminRole.id)
      .single();
    if (!existingRole) {
      const { error: userRoleInsertError } = await supabaseAdmin!.from('user_roles').insert({ user_id: userId, role_id: adminRole.id });
      if (userRoleInsertError) {
        console.error('Error inserting into user_roles:', userRoleInsertError);
        throw userRoleInsertError;
      }
    }

    // 5. Vérifier que le rôle a bien été attribué
    const { data: verifyAdmin, error: verifyError } = await supabaseAdmin!.rpc(
      'is_user_admin',
      { user_id_param: userId }
    );
    if (verifyError) {
      console.error('Erreur lors de la vérification du rôle admin:', verifyError);
      throw verifyError;
    }
    if (!verifyAdmin) {
      throw new Error('Vérification de l\'attribution du rôle admin échouée');
    }

    return { success: true, message: userExists ? 'Administrateur déjà existant, vérification et mise à jour effectuées.' : 'Administrateur créé avec succès' };
  } catch (error: any) {
    console.error('Erreur lors de l\'initialisation de l\'administrateur:', error);
    return { success: false, message: error.message || 'Erreur inconnue' };
  }
} 