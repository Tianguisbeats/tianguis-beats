import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// Inicialización de Stripe
const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not defined');
    return new Stripe(key);
};

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

        // Obtener el ID de la subscripción de Stripe desde Supabase
        const { data: profile, error: profileErr } = await supabase
            .from('perfiles')
            .select('stripe_suscripcion_id, cancela_al_final')
            .eq('id', user.id)
            .single();

        if (profileErr || !profile || !profile.stripe_suscripcion_id) {
            return NextResponse.json({ error: 'Suscripción no encontrada en el perfil' }, { status: 404 });
        }

        const stripe = getStripe();
        const subId = profile.stripe_suscripcion_id;

        // Comprobar si el ID en la BD parece ser de Stripe (empieza por sub_)
        if (!subId.startsWith('sub_')) {
            return NextResponse.json({ error: 'El ID de suscripción no es válido para Stripe' }, { status: 400 });
        }

        // Actualizar la suscripción en Stripe
        // cancel_at_period_end = true (cancelar), false (mantener/reanudar)
        const updatedSubscription = await stripe.subscriptions.update(subId, {
            cancel_at_period_end: action === 'cancel'
        });

        // Opcional: El webhook lo actualizará automáticamente, pero podemos adelantarnos para mejor UX
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
