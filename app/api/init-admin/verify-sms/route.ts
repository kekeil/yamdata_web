import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone, code, userId } = await request.json();

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