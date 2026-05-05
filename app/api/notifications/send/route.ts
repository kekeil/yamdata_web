import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Vérifier que l'appelant est admin (côté serveur)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier rôle admin
    const { data: isAdmin } = await supabase.rpc('is_user_admin', {
      user_id_param: user.id,
    });
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();

    // Appel edge function avec INTERNAL_SECRET côté serveur
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const internalSecret = process.env.INTERNAL_SECRET;

    if (!internalSecret) {
      console.error('[api/notifications/send] INTERNAL_SECRET manquant côté Next.js');
      return NextResponse.json(
        { error: 'Configuration serveur incomplète (INTERNAL_SECRET manquant)' },
        { status: 500 },
      );
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[api/notifications/send] edge function status', res.status, data);
      return NextResponse.json(
        { error: data?.error || 'Erreur edge function' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[api/notifications/send]', message);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
