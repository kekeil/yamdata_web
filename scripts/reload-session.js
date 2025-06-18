// Script pour recharger la session et réinitialiser le cache local
// À exécuter depuis le navigateur quand vous êtes bloqué malgré un rôle admin correct

(async function() {
  try {
    console.log("🔄 Début du rechargement de la session...");
    
    // 1. Vérifier si Supabase est disponible
    if (!window.supabase) {
      console.error("❌ Supabase n'est pas disponible dans le contexte global.");
      console.log("📋 Ce script doit être exécuté dans la console du navigateur sur l'application Yamdata Admin.");
      return;
    }
    
    // 2. Récupérer la session actuelle
    const { data: sessionData } = await window.supabase.auth.getSession();
    if (!sessionData.session) {
      console.error("❌ Aucune session active trouvée. Veuillez vous connecter.");
      return;
    }
    
    console.log("✅ Session trouvée pour:", sessionData.session.user.email);
    
    // 3. Récupérer l'ID de l'utilisateur
    const userId = sessionData.session.user.id;
    console.log("👤 ID utilisateur:", userId);
    
    // 4. Récupérer le rôle admin
    const { data: adminRole, error: roleError } = await window.supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();
    
    if (roleError || !adminRole) {
      console.error("❌ Erreur lors de la récupération du rôle admin:", roleError?.message || "Rôle non trouvé");
      return;
    }
    
    console.log("👑 Rôle admin trouvé:", adminRole);
    
    // 5. Vérifier si l'utilisateur a le rôle admin
    const { data: userRoles, error: userRolesError } = await window.supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role_id', adminRole.id);
    
    if (userRolesError) {
      console.error("❌ Erreur lors de la récupération des rôles de l'utilisateur:", userRolesError.message);
      return;
    }
    
    const hasAdminRole = userRoles && userRoles.length > 0;
    console.log("👑 Est admin:", hasAdminRole, userRoles);
    
    if (!hasAdminRole) {
      console.warn("⚠️ L'utilisateur n'a pas le rôle admin dans la base de données.");
      console.log("📋 Voulez-vous ajouter le rôle admin à cet utilisateur? Exécutez 'window.addAdminRole()' pour le faire.");
      
      // Définir une fonction pour ajouter le rôle admin
      window.addAdminRole = async () => {
        try {
          const { error: insertError } = await window.supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role_id: adminRole.id
            });
          
          if (insertError) {
            console.error("❌ Erreur lors de l'attribution du rôle admin:", insertError.message);
            return;
          }
          
          console.log("✅ Rôle admin attribué avec succès. Veuillez rafraîchir la page.");
        } catch (error) {
          console.error("❌ Erreur:", error);
        }
      };
      
      return;
    }
    
    // 6. Mettre à jour le localStorage pour forcer une reconnexion
    console.log("🔄 Mise à jour du localStorage pour forcer une reconnexion...");
    
    // Récupérer les clés Supabase du localStorage
    const supabaseKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('supabase.auth')) {
        supabaseKeys.push(key);
      }
    }
    
    console.log("🔑 Clés Supabase trouvées:", supabaseKeys);
    
    // Supprimer les clés pour forcer une reconnexion
    for (const key of supabaseKeys) {
      localStorage.removeItem(key);
      console.log("🗑️ Suppression de la clé:", key);
    }
    
    // 7. Recharger la page
    console.log("🔄 Rechargement de la page...");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error("❌ Erreur lors du rechargement de la session:", error);
  }
})(); 