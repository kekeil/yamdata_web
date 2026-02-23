import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { phone, userId } = await request.json();

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
    console.log(`Code SMS pour ${phone}: ${code}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}