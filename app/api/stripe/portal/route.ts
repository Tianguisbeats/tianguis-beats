import { NextResponse } from 'next/server';
import { obtenerStripe } from '@/lib/stripe-config';
import { obtenerSupabaseAdmin, obtenerUsuarioDesdeRequest } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const usuario = await obtenerUsuarioDesdeRequest(req);

        if (!usuario) {
            return NextResponse.json({ error: 'No authenticated user' }, { status: 401 });
        }

        const { returnUrl } = await req.json();
        const supabase = obtenerSupabaseAdmin();
        const stripe = obtenerStripe();

        const { data: profile } = await supabase
            .from('perfiles')
            .select('stripe_cliente_id, correo')
            .eq('id', usuario.id)
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
                    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
                    if (existingCustomers.data.length > 0) {
                        const foundId = existingCustomers.data[0].id;
                        if (!invalidCustomerIds.includes(foundId)) {
                            customerId = foundId;
                        }
                    }

                    if (!customerId) {
                        const newCustomer = await stripe.customers.create({
                            email,
                            metadata: { userId: usuario.id }
                        });
                        customerId = newCustomer.id;
                    }

                    await supabase
                        .from('perfiles')
                        .update({ stripe_cliente_id: customerId })
                        .eq('id', usuario.id);
                } catch (err) {
                    console.error("Error recuperando cliente en Portal:", err);
                }
            }
        }

        if (!customerId) {
            return NextResponse.json({ error: 'No se pudo obtener un cliente de Stripe válido.' }, { status: 400 });
        }

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
