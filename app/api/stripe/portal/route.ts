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

        // Get the stripe_customer_id from the profile
        const { data: profile } = await supabase
            .from('perfiles')
            .select('stripe_customer_id, email')
            .eq('id', userId)
            .single();

        let customerId = profile?.stripe_customer_id;

        // If no customer ID stored, try to find by email or create one
        if (!customerId) {
            // Try to get the user's email from auth
            const { data: { user } } = await supabase.auth.admin.getUserById(userId);
            const email = user?.email || profile?.email;

            if (email) {
                // Check if customer exists in Stripe by email
                const existingCustomers = await stripe.customers.list({ email, limit: 1 });
                if (existingCustomers.data.length > 0) {
                    customerId = existingCustomers.data[0].id;
                } else {
                    // Create a new Stripe customer
                    const newCustomer = await stripe.customers.create({ email });
                    customerId = newCustomer.id;
                }

                // Save the customer ID for future use
                await supabase
                    .from('perfiles')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', userId);
            }
        }

        if (!customerId) {
            return NextResponse.json({ error: 'No se pudo obtener el cliente de Stripe' }, { status: 400 });
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
