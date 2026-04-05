import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not defined');
    return new Stripe(key);
};

const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

export async function POST(req: Request) {
    try {
        const { userId, returnUrl } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'No authenticated user' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        const stripe = getStripe();

        const { data: profile } = await supabase
            .from('perfiles')
            .select('stripe_cliente_id, correo')
            .eq('id', userId)
            .single();

        let customerId: string | undefined = undefined;
        let invalidCustomerIds: string[] = [];

        // 1. Verificar si existe en la base de datos y es válido en Stripe
        if (profile?.stripe_cliente_id) {
            try {
                const customer = await stripe.customers.retrieve(profile.stripe_cliente_id);
                if (customer && !(customer as any).deleted) {
                    customerId = customer.id;
                } else {
                    invalidCustomerIds.push(profile.stripe_cliente_id);
                }
            } catch (err) {
                invalidCustomerIds.push(profile.stripe_cliente_id);
            }
        }

        // 2. Si es inválido o no existe, intentar por email o crear uno nuevo
        if (!customerId) {
            const email = profile?.correo;
            if (email) {
                try {
                    // Check search for existing customer
                    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
                    if (existingCustomers.data.length > 0) {
                        const foundId = existingCustomers.data[0].id;
                        // Ignorar si el encontrado por email ya sabemos que es inválido
                        if (!invalidCustomerIds.includes(foundId) && foundId !== 'cus_UBxLmHgTaAr2aM') {
                            customerId = foundId;
                        }
                    }

                    if (!customerId) {
                        // Create a new Stripe customer
                        const newCustomer = await stripe.customers.create({ 
                            email,
                            metadata: { userId }
                        });
                        customerId = newCustomer.id;
                    }

                    // Sincronizar de vuelta a la DB
                    await supabase
                        .from('perfiles')
                        .update({ stripe_cliente_id: customerId })
                        .eq('id', userId);
                } catch (err) {
                    console.error("Error recuperando cliente en Portal:", err);
                }
            }
        }

        if (!customerId) {
            return NextResponse.json({ error: 'No se pudo obtener un cliente de Stripe válido.' }, { status: 400 });
        }

        // Create a Stripe Customer Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || `${process.env.NEXT_PUBLIC_URL}/studio/billing`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Stripe Portal Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
