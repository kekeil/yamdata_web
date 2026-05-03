import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone, code, userId } = await request.json();

    const rl = checkRateLimit(`verify-sms:${phone}`, 5, 10 * 60 * 1000); // 5 tentatives / 10 min
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

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

    // Vérifier le code
    const { data, error } = await supabaseAdmin
      .from('sms_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    // Marquer comme vérifié
    await supabaseAdmin
      .from('profiles')
      .update({ phone_verified: true })
      .eq('id', userId);

    // Supprimer le code
    await supabaseAdmin
      .from('sms_verifications')
      .delete()
      .eq('id', data.id);

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
