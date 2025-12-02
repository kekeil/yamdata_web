// Script pour exposer le client Supabase dans le contexte global (window)
// pour permettre le débogage dans la console du navigateur

(function() {
  try {
    // Vérifier si Supabase est déjà disponible
    if (window.supabase) {
      return;
    }
    
    // Essayer de trouver le client Supabase via les props de React
    const findSupabaseClient = () => {
      // Explorer tous les éléments DOM pour trouver des instances React
      const elements = document.querySelectorAll('*');
      
      for (const element of elements) {
        // Vérifier si l'élément a des props React
        const key = Object.keys(element).find(key => 
          key.startsWith('__reactFiber$') || 
          key.startsWith('__reactProps$') || 
          key.startsWith('__reactContainer$')
        );
        
        if (key) {
          // Explorer les props pour trouver Supabase
          try {
            const props = element[key];
            // Explorer l'arbre des props à la recherche de Supabase
            const findInProps = (obj, path = []) => {
              if (!obj || typeof obj !== 'object') return null;
              
              // Vérifier si c'est un client Supabase
              if (obj.supabaseUrl && obj.supabaseKey) {
                return obj;
              }
              
              // Explorer les propriétés enfants
              for (const key in obj) {
                try {
                  const result = findInProps(obj[key], [...path, key]);
                  if (result) return result;
                } catch (e) {
                  // Ignorer les erreurs d'accès
                }
              }
              
              return null;
            };
            
            const supabaseClient = findInProps(props);
            if (supabaseClient) {
              return supabaseClient;
            }
          } catch (e) {
            // Ignorer les erreurs
          }
        }
      }
      
      return null;
    };
    
    // Essayer de récupérer le client depuis le store global
    if (window.__NEXT_DATA__) {
      // Explorer les données pour trouver le client Supabase
      // Généralement pas disponible ici mais on essaie quand même
    }
    
    // Exposer une fonction pour faciliter la configuration manuelle
    window.setupSupabase = (url, key) => {
      try {
        // Vérifier si supabaseJs est disponible
        if (!window.supabaseJs && !window.supabase) {
          console.error("❌ La bibliothèque Supabase n'est pas accessible");
          return;
        }
        
        if (window.supabaseJs) {
          window.supabase = window.supabaseJs.createClient(url, key);
        } else {
          console.warn("⚠️ Impossible de créer le client, mais window.supabase existe peut-être déjà");
        }
      } catch (error) {
        console.error("❌ Erreur lors de la configuration de Supabase:", error);
      }
    };
    
  } catch (error) {
    console.error("❌ Erreur lors de l'exposition de Supabase:", error);
  }
})(); 