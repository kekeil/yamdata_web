import { NextResponse } from 'next/server';
import { initializeAdmin } from '@/lib/init-admin';
import { headers } from 'next/headers';

// Fonction pour vérifier la validité du secret
function isValidSecret(secret: string | null): boolean {
  if (!secret) return false;
  
  const storedSecret = process.env.ADMIN_INIT_SECRET;
  const verifySecret = process.env.ADMIN_INIT_SECRET_VERIFY;
  
  // Double vérification pour plus de sécurité
  return secret === storedSecret && storedSecret === verifySecret && !!storedSecret;
}

export async function POST(request: Request) {
  try {
    // Vérification de l'origine de la requête (CSRF protection)
    const headersList = await headers();
    const referer = headersList.get('referer') || '';
    const origin = headersList.get('origin') || '';
    const host = headersList.get('host') || '';
    
    // Vérification basique anti-CSRF
    if (!referer || !origin || !host) {
      return NextResponse.json(
        { error: 'En-têtes de sécurité manquants' },
        { status: 400 }
      );
    }
    
    // Vérifier que l'origine est autorisée
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || '',
      `https://${host}`,
      `http://${host}`
    ].filter(Boolean);
    
    if (!allowedOrigins.some(allowed => origin === allowed)) {
      return NextResponse.json(
        { error: 'Origine non autorisée' },
        { status: 403 }
      );
    }
    
    // Extraire et vérifier le secret
    const data = await request.json();
    const { secret } = data;
    
    if (!isValidSecret(secret)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Initialiser l'administrateur
    const result = await initializeAdmin(secret);
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur lors du traitement de la requête:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 