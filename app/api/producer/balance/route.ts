import { NextResponse } from 'next/server';
import { obtenerStripe } from '@/lib/stripe-config';
import { obtenerSupabaseAdmin, obtenerUsuarioDesdeRequest } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    try {
        // Validamos sesión: solo el dueño de la cuenta puede consultar su balance.
        const usuario = await obtenerUsuarioDesdeRequest(req);
        if (!usuario) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userIdQuery = searchParams.get('userId');

        // Si pasan userId distinto al del token, rechazamos. Evita IDOR.
        if (userIdQuery && userIdQuery !== usuario.id) {
            return NextResponse.json({ error: 'No autorizado para consultar este perfil' }, { status: 403 });
        }
        const userId = usuario.id;

        const supabaseAdmin = obtenerSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('perfiles')
            .select('stripe_connect_id, stripe_connect_onboarded')
            .eq('id', userId)
            .single();

        if (!profile?.stripe_connect_id || !profile?.stripe_connect_onboarded) {
            return NextResponse.json({ 
                available: 0, 
                pending: 0, 
                currency: 'mxn',
                status: 'not_connected' 
            });
        }

        const stripe = obtenerStripe();
        const balance = await stripe.balance.retrieve({
            stripeAccount: profile.stripe_connect_id,
        });

        // Sumar balances por moneda (asumimos MXN como principal)
        const available = balance.available.reduce((acc, b) => acc + b.amount, 0) / 100;
        const pending = balance.pending.reduce((acc, b) => acc + b.amount, 0) / 100;

        return NextResponse.json({
            available,
            pending,
            currency: 'mxn',
            status: 'active'
        });

    } catch (err: any) {
        console.error('Error fetching Stripe balance:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
