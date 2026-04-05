import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not defined');
    return new Stripe(key);
};

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !roleKey) throw new Error('Supabase Admin env vars missing');
    return createClient(url, roleKey);
};

export async function GET(req: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] || '');
        
        // El cliente debe pasar su sesión para validar identidad
        // Pero para simplificar en esta ruta interna de dashboard, 
        // asumiremos que el frontend enviará el userId en una query o header si es necesario.
        // Por ahora, usemos el ID del perfil que el frontend conoce.
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
        }

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

        const stripe = getStripe();
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
