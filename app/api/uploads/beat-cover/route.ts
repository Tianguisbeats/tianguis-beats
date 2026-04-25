import { NextRequest, NextResponse } from 'next/server';
import { obtenerSupabaseAdmin, obtenerUsuarioDesdeRequest } from '@/lib/supabase-admin';
import { stripExifJpeg, validarArchivo } from '@/lib/file-validation';

export const runtime = 'nodejs';

function sanitizeFileName(name: string): string {
    return name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
}

export async function POST(req: NextRequest) {
    const usuario = await obtenerUsuarioDesdeRequest(req);
    if (!usuario) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const form = await req.formData();
        const file = form.get('file');

        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'Archivo de portada requerido' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const validation = await validarArchivo(buffer, 'imagen');
        if (!validation.valido) {
            return NextResponse.json({ error: validation.razon || 'Portada inválida' }, { status: 400 });
        }

        const supabaseAdmin = obtenerSupabaseAdmin();
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('perfiles')
            .select('nombre_usuario')
            .eq('id', usuario.id)
            .single();

        if (profileError || !profile?.nombre_usuario) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
        }

        const cleanBuffer = validation.mimeDetectado === 'image/jpeg'
            ? stripExifJpeg(buffer)
            : buffer;
        const safeName = sanitizeFileName(file.name);
        const path = `${profile.nombre_usuario}/cover-${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('portadas_beats')
            .upload(path, cleanBuffer, {
                contentType: validation.mimeDetectado || file.type || 'application/octet-stream',
                upsert: true,
            });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message || 'Error subiendo portada' }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('portadas_beats')
            .getPublicUrl(path);

        return NextResponse.json({ path, publicUrl });
    } catch (err: any) {
        console.error('[Beat Cover Upload] Error:', err);
        return NextResponse.json({ error: 'Error interno al procesar portada' }, { status: 500 });
    }
}
