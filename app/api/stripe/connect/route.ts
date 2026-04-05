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

// GET: Obtener estado de la cuenta conectada
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data: profile, error } = await supabase
            .from('perfiles')
            .select('stripe_connect_id, stripe_connect_onboarded')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
        }

        let status = 'none';
        let details = null;

        if (profile.stripe_connect_id) {
            const stripe = getStripe();
            try {
                const account = await stripe.accounts.retrieve(profile.stripe_connect_id);
                let loginUrl = null;

                if (account.details_submitted) {
                    status = 'completed';
                    
                    // Generar link de login para el dashboard de Stripe Express
                    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_connect_id);
                    loginUrl = loginLink.url;

                    // Actualizar en DB si no estaba marcado como onboarded
                    if (!profile.stripe_connect_onboarded) {
                        await supabase
                            .from('perfiles')
                            .update({ stripe_connect_onboarded: true })
                            .eq('id', userId);
                    }
                } else {
                    status = 'pending';
                }

                details = {
                    email: account.email,
                    charges_enabled: account.charges_enabled,
                    payouts_enabled: account.payouts_enabled,
                    login_url: loginUrl
                };
            } catch (stripeErr) {
                console.error('Error recuperando cuenta de Stripe:', stripeErr);
                status = 'error';
            }
        }

        return NextResponse.json({ status, details, profileStatus: profile.stripe_connect_onboarded });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST: Crear cuenta o generar link de onboarding
export async function POST(req: Request) {
    try {
        const { userId, email, returnUrl } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'Faltan datos (userId, email)' }, { status: 400 });
        }

        const stripe = getStripe();
        const supabase = getSupabaseAdmin();

        // 1. Buscar si ya tiene una cuenta
        const { data: profile } = await supabase
            .from('perfiles')
            .select('stripe_connect_id, nombre_usuario')
            .eq('id', userId)
            .single();

        let stripeAccountId = profile?.stripe_connect_id;

        // 2. Si no tiene, crear una cuenta Express
        if (!stripeAccountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                email: email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                metadata: {
                    userId: userId,
                    username: profile?.nombre_usuario || ''
                }
            });

            stripeAccountId = account.id;

            // Guardar en DB
            await supabase
                .from('perfiles')
                .update({ stripe_connect_id: stripeAccountId })
                .eq('id', userId);
        }

        // 3. Crear el Account Link para el onboarding
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: returnUrl || `${process.env.NEXT_PUBLIC_URL}/studio/payments`,
            return_url: returnUrl || `${process.env.NEXT_PUBLIC_URL}/studio/payments`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });
    } catch (err: any) {
        console.error('Error en Stripe Connect POST:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
