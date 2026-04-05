import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !roleKey) throw new Error('Supabase Admin env vars missing');
    return createClient(url, roleKey);
};

export async function GET(req: Request) {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const limit = searchParams.get('limit') || '5';

        const { data, error } = await supabase.from('transacciones').select('*').order('fecha_creacion', { ascending: false }).limit(parseInt(limit));

        if (error) throw error;
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
