import { NextResponse } from 'next/server';
import { obtenerStripe } from '@/lib/stripe-config';
import { obtenerSupabaseAdmin } from '@/lib/supabase-admin';

// GET: Obtener estado de la cuenta conectada
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
        }

        const supabase = obtenerSupabaseAdmin();
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
            const stripe = obtenerStripe();
            try {
                const account = await stripe.accounts.retrieve(profile.stripe_connect_id);
                let loginUrl = null;

                if (account.details_submitted) {
                    status = 'completed';

                    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_connect_id);
                    loginUrl = loginLink.url;

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

        const stripe = obtenerStripe();
        const supabase = obtenerSupabaseAdmin();

        const { data: profile } = await supabase
            .from('perfiles')
            .select('stripe_connect_id, nombre_usuario')
            .eq('id', userId)
            .single();

        let stripeAccountId = profile?.stripe_connect_id;

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

            await supabase
                .from('perfiles')
                .update({ stripe_connect_id: stripeAccountId })
                .eq('id', userId);
        }

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
