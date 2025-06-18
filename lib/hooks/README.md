# Hooks Personnalisés

Ce répertoire contient les hooks React personnalisés utilisés dans l'application admin Yamdata.

## useAuth

Hook pour gérer l'authentification et les protections de routes.

```tsx
import { useAuth } from '@/lib/hooks/useAuth';

// Exemple d'utilisation basique
const { user, isAdmin, isAuthenticated, login, logout } = useAuth();

// Protection d'une route admin
const { user, isLoading } = useAuth({
  redirectTo: '/login',
  requireAdmin: true
});

// Protection avec rôle spécifique
const { user, isLoading } = useAuth({
  redirectTo: '/login',
  requireRole: 'support'
});
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `redirectTo` | `string` | URL de redirection si l'utilisateur n'est pas connecté |
| `redirectIfFound` | `string` | URL de redirection si l'utilisateur est connecté |
| `requireAdmin` | `boolean` | Nécessite que l'utilisateur soit administrateur |
| `requireRole` | `'admin' \| 'support'` | Nécessite que l'utilisateur ait un rôle spécifique |

### Retour

| Propriété | Type | Description |
|-----------|------|-------------|
| `user` | `User \| null` | Objet utilisateur Supabase |
| `isAdmin` | `boolean` | Si l'utilisateur a le rôle admin |
| `isSupport` | `boolean` | Si l'utilisateur a le rôle support |
| `isAuthenticated` | `boolean` | Si l'utilisateur est connecté |
| `isLoading` | `boolean` | Si l'authentification est en cours |
| `error` | `string \| null` | Message d'erreur éventuel |
| `login` | `function` | Fonction de connexion |
| `logout` | `function` | Fonction de déconnexion |
| `refreshUserRole` | `function` | Rafraîchit les rôles de l'utilisateur |

## useDataTable

Hook pour gérer facilement les tableaux de données avec tri, pagination et filtrage.

```tsx
import { useDataTable } from '@/lib/hooks/useDataTable';

// Exemple d'utilisation
const {
  displayData,
  totalItems,
  currentPage,
  totalPages,
  nextPage,
  prevPage,
  setSearchTerm
} = useDataTable({
  data: users,
  initialSortField: 'created_at',
  initialSortDirection: 'desc',
  filterFunction: (user, term) => 
    user.full_name.toLowerCase().includes(term) || 
    user.email.toLowerCase().includes(term)
});
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `data` | `T[]` | Données à afficher dans le tableau |
| `initialSortField` | `keyof T` | Champ initial pour le tri |
| `initialSortDirection` | `'asc' \| 'desc'` | Direction initiale du tri |
| `initialRowsPerPage` | `number` | Nombre d'éléments par page (défaut: 10) |
| `filterFunction` | `function` | Fonction de filtrage personnalisée |

### Retour

| Propriété | Type | Description |
|-----------|------|-------------|
| `displayData` | `T[]` | Données filtrées, triées et paginées |
| `totalItems` | `number` | Nombre total d'éléments après filtrage |
| `currentPage` | `number` | Page actuelle |
| `rowsPerPage` | `number` | Nombre d'éléments par page |
| `totalPages` | `number` | Nombre total de pages |
| `sortField` | `keyof T \| null` | Champ de tri actuel |
| `sortDirection` | `'asc' \| 'desc'` | Direction du tri |
| `searchTerm` | `string` | Terme de recherche actuel |
| `setPage` | `function` | Définir une page spécifique |
| `nextPage` | `function` | Aller à la page suivante |
| `prevPage` | `function` | Aller à la page précédente |
| `setRowsPerPage` | `function` | Définir le nombre d'éléments par page |
| `setSortField` | `function` | Définir le champ de tri |
| `setSortDirection` | `function` | Définir la direction du tri |
| `setSearchTerm` | `function` | Définir le terme de recherche |
| `resetFilters` | `function` | Réinitialiser tous les filtres |

## useForm

Hook pour gérer les formulaires avec validation et gestion des erreurs.

```tsx
import { useForm } from '@/lib/hooks/useForm';

// Exemple d'utilisation
const {
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting
} = useForm({
  initialValues: {
    email: '',
    password: ''
  },
  validate: (values) => {
    const errors: Record<string, string> = {};
    if (!values.email) {
      errors.email = 'Email requis';
    }
    if (!values.password) {
      errors.password = 'Mot de passe requis';
    }
    return errors;
  },
  onSubmit: async (values) => {
    await login(values.email, values.password);
  }
});
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `initialValues` | `T` | Valeurs initiales du formulaire |
| `onSubmit` | `function` | Fonction appelée lors de la soumission |
| `validate` | `function` | Fonction de validation (optionnelle) |

### Retour

| Propriété | Type | Description |
|-----------|------|-------------|
| `values` | `T` | Valeurs actuelles du formulaire |
| `errors` | `Record<keyof T, string>` | Erreurs de validation |
| `touched` | `Record<keyof T, boolean>` | Champs ayant perdu le focus |
| `isSubmitting` | `boolean` | Si le formulaire est en cours de soumission |
| `handleChange` | `function` | Gère les changements de valeur |
| `handleBlur` | `function` | Gère la perte de focus |
| `handleSubmit` | `function` | Gère la soumission du formulaire |
| `setFieldValue` | `function` | Définit la valeur d'un champ |
| `setFieldTouched` | `function` | Marque un champ comme touché |
| `resetForm` | `function` | Réinitialise le formulaire |

## Intégration avec Zustand

Ces hooks sont conçus pour fonctionner harmonieusement avec les stores Zustand de l'application:

- `authStore` - Gestion de l'authentification
- `userStore` - Gestion des utilisateurs
- `planStore` - Gestion des forfaits et opérateurs
- `savingsStore` - Gestion des comptes d'épargne et objectifs 