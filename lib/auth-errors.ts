export function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Veuillez confirmer votre adresse email avant de vous connecter.';
  }
  if (message.includes('User already registered') || message.includes('duplicate key')) {
    return 'Un compte existe déjà avec cet email.';
  }
  if (message.includes('Password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Trop de tentatives. Veuillez patienter quelques minutes.';
  }
  // Message générique pour tout le reste
  return 'Une erreur est survenue. Veuillez réessayer.';
}
