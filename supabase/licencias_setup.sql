-- TIANGUIS BEATS - SISTEMA AVANZADO DE CONTRATOS/LICENCIAS
-- v1.0 - 2026-02-24

-- 1. Tabla de Plantillas de Licencias (Configuradas por el Productor)
CREATE TABLE IF NOT EXISTS licencias_plantillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('basic', 'premium', 'unlimited', 'exclusive', 'soundkit')),
    
    -- Modo Fácil (Límites por defecto numéricos/texto)
    streams_limite TEXT, 
    copias_limite TEXT,
    videos_limite TEXT,
    radio_limite TEXT,
    
    -- Modo Experto (Sobreescribir todo con Rich Text)
    texto_legal TEXT,
    usar_texto_personalizado BOOLEAN DEFAULT FALSE,

    -- Cláusulas Pro de Protección (NUEVO)
    incluir_clausulas_pro BOOLEAN DEFAULT TRUE,
    
    -- Metadatos
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
    
    -- Restricción Única: Un productor solo puede tener una plantilla por tipo (ej. una config para mp3, otra para wav)
    UNIQUE(productor_id, tipo)
);

-- Políticas RLS para licencias_plantillas
ALTER TABLE licencias_plantillas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver cualquier plantilla pública (para checkout)" 
ON licencias_plantillas FOR SELECT USING (true);

CREATE POLICY "Los productores pueden crear/editar sus propias plantillas" 
ON licencias_plantillas FOR ALL USING (auth.uid() = productor_id);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_timestamp_plantillas()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_plantillas ON licencias_plantillas;
CREATE TRIGGER trg_actualizar_plantillas
BEFORE UPDATE ON licencias_plantillas
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_plantillas();


-- 2. Bucket de Almacenamiento Seguro (licencias-generadas)
-- NOTA: Supabase Storage usualmente se crea desde el Dashboard, 
-- pero el script SQL para crearlo de forma nativa es el siguiente.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'licencias-generadas'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('licencias-generadas', 'licencias-generadas', true, 5242880, ARRAY['application/pdf']::text[]); -- 5MB limit max para PDFs
    END IF;
END $$;

-- Políticas del Bucket 'licencias-generadas' (Solo el servidor o el comprador deben poder acceder si lo hiciésemos privado, 
-- pero por simplicidad inicial en cumplimiento de URL lo marcamos público para acceder vía URL o se puede manejar mediante URL firmada)
-- Por seguridad comercial, lo ideal es privado, generado on-the-fly, pero si se guarda es mejor que los insert los haga el service_role 
-- y el SELECT sea validado.
-- 
-- Eliminamos políticas previas si existieran por error:
DROP POLICY IF EXISTS "Public Select if knowing URL" ON storage.objects;
DROP POLICY IF EXISTS "Auth Users Insert" ON storage.objects;

-- Los usuarios pueden descargar/ver el PDF (lectura) del bucket licencias-generadas asumiendo que es publico.
CREATE POLICY "Public Download Permissions"
ON storage.objects FOR SELECT
USING (bucket_id = 'licencias-generadas');

-- La inserción debe poder hacerla el Edge Function/Server (service role bypasses RLS) 
-- Dejaremos la inserción habilitada para usuarios autenticados para propósitos de prueba de webhook.
CREATE POLICY "Auth Users Upload PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'licencias-generadas');
