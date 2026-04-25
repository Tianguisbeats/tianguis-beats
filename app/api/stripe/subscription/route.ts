import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { obtenerStripe } from '@/lib/stripe-config';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body; // 'cancel' o 'resume'

        if (!action || (action !== 'cancel' && action !== 'resume')) {
            return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
        }

        const { data: profile, error: profileErr } = await supabase
            .from('perfiles')
            .select('stripe_suscripcion_id, cancela_al_final')
            .eq('id', user.id)
            .single();

        if (profileErr || !profile || !profile.stripe_suscripcion_id) {
            return NextResponse.json({ error: 'Suscripción no encontrada en el perfil' }, { status: 404 });
        }

        const stripe = obtenerStripe();
        const subId = profile.stripe_suscripcion_id;

        if (!subId.startsWith('sub_')) {
            return NextResponse.json({ error: 'El ID de suscripción no es válido para Stripe' }, { status: 400 });
        }

        const updatedSubscription = await stripe.subscriptions.update(subId, {
            cancel_at_period_end: action === 'cancel'
        });

        await supabase
            .from('perfiles')
            .update({ cancela_al_final: action === 'cancel' })
            .eq('id', user.id);

        return NextResponse.json({
            success: true,
            status: updatedSubscription.status,
            cancel_at_period_end: updatedSubscription.cancel_at_period_end
        });

    } catch (err: any) {
        console.error('[Stripe Subscription API] Error:', err);
        return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
    }
}
