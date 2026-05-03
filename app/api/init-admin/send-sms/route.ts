import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown';
    const rl = checkRateLimit(`send-sms:${ip}`, 3, 60 * 1000); // 3 req / min
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const { phone, userId } = await request.json();

    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user: authUser } } = await supabaseServer.auth.getUser();
    if (!authUser || authUser.id !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Sauvegarder le code
    const { error } = await supabaseAdmin
      .from('sms_verifications')
      .insert({
        phone,
        code,
        expires_at: expiresAt.toISOString(),
        user_id: userId
      });

    if (error) throw error;

    // TODO: Envoyer le SMS ici

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}