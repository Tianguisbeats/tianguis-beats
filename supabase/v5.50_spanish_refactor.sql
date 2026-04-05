-- Description: Full refactor to Spanish schema, Licensing Consolidation and Cleanup
-- Update: Added future-proof columns (metadatos_extra, idioma, configuracion_avanzada)

-- [OPTIONAL] CLEAN START: Uncomment these lines if you want to wipe existing data
-- DELETE FROM public.beats;
-- DELETE FROM public.licencias;

-- 0. Handle dependencies: Drop view before altering table
DROP VIEW IF EXISTS public.beats_busqueda CASCADE;

-- 1. Rename 'licencias_plantillas' to 'licencias'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'licencias_plantillas') THEN
        ALTER TABLE public.licencias_plantillas RENAME TO licencias;
    END IF;
END $$;

-- 2. Cleanup and Rename columns in 'beats' table
DO $$ 
BEGIN
    -- Product Metadata
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'producer_id') THEN
        ALTER TABLE beats RENAME COLUMN producer_id TO productor_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'title') THEN
        ALTER TABLE beats RENAME COLUMN title TO titulo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'genre') THEN
        ALTER TABLE beats RENAME COLUMN genre TO genero;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'musical_key') THEN
        ALTER TABLE beats RENAME COLUMN musical_key TO nota_musical;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'musical_scale') THEN
        ALTER TABLE beats RENAME COLUMN musical_scale TO escala_musical;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'description') THEN
        ALTER TABLE beats RENAME COLUMN description TO descripcion;
    END IF;

    -- [CLEANUP] Remove obsolete/redundant columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'tag_emoji') THEN
        ALTER TABLE beats DROP COLUMN tag_emoji;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'tag_color') THEN
        ALTER TABLE beats DROP COLUMN tag_color;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'cover_color') THEN
        ALTER TABLE beats DROP COLUMN cover_color;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'is_exclusive') THEN
        ALTER TABLE beats DROP COLUMN is_exclusive;
    END IF;

    -- [RENAME] tag to etiqueta
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'tag') THEN
        ALTER TABLE beats RENAME COLUMN tag TO etiqueta;
    END IF;

    -- [FUTURE-PROOFING] Adding expansion fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'metadatos_extra') THEN
        ALTER TABLE beats ADD COLUMN metadatos_extra JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'idioma') THEN
        ALTER TABLE beats ADD COLUMN idioma TEXT DEFAULT 'es';
    END IF;

    -- Prices (Consolidated to 5-Tier)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'price_mxn') THEN
        ALTER TABLE beats RENAME COLUMN price_mxn TO precio_basico_mxn;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'price_pro_mxn') THEN
        ALTER TABLE beats RENAME COLUMN price_pro_mxn TO precio_pro_mxn;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'precio_pro_mxn') THEN
        ALTER TABLE beats ADD COLUMN precio_pro_mxn INTEGER DEFAULT 499;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'price_wav_mxn') THEN
        ALTER TABLE beats RENAME COLUMN price_wav_mxn TO precio_premium_mxn;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'price_stems_mxn') THEN
        ALTER TABLE beats RENAME COLUMN price_stems_mxn TO precio_ilimitado_mxn;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'exclusive_price_mxn') THEN
        ALTER TABLE beats RENAME COLUMN exclusive_price_mxn TO precio_exclusivo_mxn;
    END IF;

    -- Status and Flags
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'is_public') THEN
        ALTER TABLE beats RENAME COLUMN is_public TO es_publico;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'is_sold') THEN
        ALTER TABLE beats RENAME COLUMN is_sold TO esta_vendido;
    END IF;

    -- Toggles for Actives
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'is_mp3_active') THEN
        ALTER TABLE beats RENAME COLUMN is_mp3_active TO es_basica_activa;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'is_pro_active') THEN
        ALTER TABLE beats RENAME COLUMN is_pro_active TO es_pro_activa;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'es_pro_activa') THEN
        ALTER TABLE beats ADD COLUMN es_pro_activa BOOLEAN DEFAULT true;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'is_wav_active') THEN
        ALTER TABLE beats RENAME COLUMN is_wav_active TO es_premium_activa;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'is_stems_active') THEN
        ALTER TABLE beats RENAME COLUMN is_stems_active TO es_ilimitada_activa;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'is_exclusive_active') THEN
        ALTER TABLE beats RENAME COLUMN is_exclusive_active TO es_exclusiva_activa;
    END IF;

    -- File URLs
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'portadabeat_url') THEN
        ALTER TABLE beats RENAME COLUMN portadabeat_url TO portada_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'mp3_tag_url') THEN
        ALTER TABLE beats RENAME COLUMN mp3_tag_url TO archivo_muestra_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'mp3_url') THEN
        ALTER TABLE beats RENAME COLUMN mp3_url TO archivo_mp3_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'wav_url') THEN
        ALTER TABLE beats RENAME COLUMN wav_url TO archivo_wav_url;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'stems_url') THEN
        ALTER TABLE beats RENAME COLUMN stems_url TO archivo_stems_url;
    END IF;

    -- Taxonomy and Stats
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'mood') THEN
        ALTER TABLE beats RENAME COLUMN mood TO vibras;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'play_count') THEN
        ALTER TABLE beats RENAME COLUMN play_count TO conteo_reproducciones;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'sale_count') THEN
        ALTER TABLE beats RENAME COLUMN sale_count TO conteo_ventas;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'like_count') THEN
        ALTER TABLE beats RENAME COLUMN like_count TO conteo_likes;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'tier_visibility') THEN
        ALTER TABLE beats RENAME COLUMN tier_visibility TO visibilidad_tier;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'subgenre') THEN
        ALTER TABLE beats RENAME COLUMN subgenre TO subgenero;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'beat_types') THEN
        ALTER TABLE beats RENAME COLUMN beat_types TO tipos_beat;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'reference_artist') THEN
        ALTER TABLE beats RENAME COLUMN reference_artist TO artista_referencia;
    END IF;

    -- Weekly Stats
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'weekly_play_count') THEN
        ALTER TABLE beats RENAME COLUMN weekly_play_count TO conteo_repro_semanal;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'weekly_sale_count') THEN
        ALTER TABLE beats RENAME COLUMN weekly_sale_count TO conteo_ventas_semanal;
    END IF;
END $$;

-- 3. Update 'licencias' table values and constraints
-- Dropping old constraint and adding new one with Spanish types
ALTER TABLE public.licencias DROP CONSTRAINT IF EXISTS licencias_plantillas_tipo_check;
ALTER TABLE public.licencias DROP CONSTRAINT IF EXISTS licencias_tipo_check;
ALTER TABLE public.licencias ADD CONSTRAINT licencias_tipo_check CHECK (tipo IN ('basica', 'pro', 'premium', 'ilimitada', 'exclusiva', 'soundkit', 'sound-kit'));


-- [FUTURE-PROOFING] Adding advanced config for licenses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licencias' AND column_name = 'configuracion_avanzada') THEN
        ALTER TABLE licencias ADD COLUMN configuracion_avanzada JSONB DEFAULT '{}';
    END IF;
END $$;

-- [!] OPTIMIZACIÓN DE PERFILES CANCELADA PARA PROTECCIÓN DE TRIGGERS
-- Se mantienen las columnas user_num_* y nombres originales (is_founder, is_verified, country, full_name, etc.)
-- para no romper la lógica de 'Musical Chairs' y asignación de rangos.

-- Migrate data to Spanish values
UPDATE public.licencias SET tipo = 'basica' WHERE tipo = 'basic';
UPDATE public.licencias SET tipo = 'pro' WHERE tipo = 'pro';
UPDATE public.licencias SET tipo = 'premium' WHERE tipo = 'premium';
UPDATE public.licencias SET tipo = 'ilimitada' WHERE tipo = 'unlimited';
UPDATE public.licencias SET tipo = 'exclusiva' WHERE tipo = 'exclusive';

-- 4. Recreate Policies for 'beats' table
DROP POLICY IF EXISTS "Public Select" ON public.beats;
DROP POLICY IF EXISTS "Producer All" ON public.beats;
DROP POLICY IF EXISTS "Lectura pública beats" ON public.beats;
DROP POLICY IF EXISTS "Control total productores" ON public.beats;

CREATE POLICY "Lectura pública beats" ON public.beats FOR SELECT USING (true);
CREATE POLICY "Control total productores" ON public.beats FOR ALL USING (auth.uid() = productor_id);

-- 5. Recreate Policies for 'licencias' table
DROP POLICY IF EXISTS "Los usuarios pueden ver cualquier plantilla pública (para checkout)" ON public.licencias;
DROP POLICY IF EXISTS "Los productores pueden crear/editar sus propias plantillas" ON public.licencias;
DROP POLICY IF EXISTS "Lectura pública licencias" ON public.licencias;
DROP POLICY IF EXISTS "Control total licencias productor" ON public.licencias;

CREATE POLICY "Lectura pública licencias" ON public.licencias FOR SELECT USING (true);
CREATE POLICY "Control total licencias productor" ON public.licencias FOR ALL USING (auth.uid() = productor_id);


-- 6. Update 'beats_busqueda' view
CREATE OR REPLACE VIEW public.beats_busqueda AS
SELECT 
    b.id,
    b.productor_id,
    b.titulo,
    b.genero,
    b.bpm,
    b.nota_musical,
    b.escala_musical,
    b.descripcion,
    b.precio_basico_mxn,
    b.precio_pro_mxn,
    b.precio_premium_mxn,
    b.precio_ilimitado_mxn,
    b.precio_exclusivo_mxn,
    b.es_publico,
    b.portada_url,
    b.archivo_muestra_url,
    b.archivo_mp3_url,
    b.archivo_wav_url,
    b.archivo_stems_url,
    b.vibras,
    b.conteo_reproducciones,
    b.conteo_likes,
    b.conteo_ventas,
    b.conteo_repro_semanal,
    b.conteo_ventas_semanal,
    b.created_at,
    b.subgenero,
    b.tipos_beat,
    b.esta_vendido,
    b.artista_referencia,
    b.es_basica_activa,
    b.es_pro_activa,
    b.es_premium_activa,
    b.es_ilimitada_activa,
    b.es_exclusiva_activa,
    b.visibilidad_tier,
    p.artistic_name as producer_name,
    p.username as producer_username,
    p.is_verified as producer_verified,
    p.subscription_tier as producer_tier,
    p.foto_perfil as producer_avatar
FROM public.beats b
JOIN public.profiles p ON b.productor_id = p.id
WHERE b.es_publico = true;

-- 7. Update activity tracking functions
CREATE OR REPLACE FUNCTION public.track_beat_activity(p_beat_id UUID, p_type TEXT)
RETURNS void AS $$
BEGIN
    IF p_type = 'play' THEN
        UPDATE public.beats 
        SET conteo_reproducciones = COALESCE(conteo_reproducciones, 0) + 1,
            conteo_repro_semanal = COALESCE(conteo_repro_semanal, 0) + 1
        WHERE id = p_beat_id;
        
    ELSIF p_type = 'sale' THEN
        UPDATE public.beats 
        SET conteo_ventas = COALESCE(conteo_ventas, 0) + 1,
            conteo_ventas_semanal = COALESCE(conteo_ventas_semanal, 0) + 1
        WHERE id = p_beat_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reset_weekly_stats()
RETURNS void AS $$
BEGIN
    UPDATE public.beats 
    SET conteo_repro_semanal = 0, 
        conteo_ventas_semanal = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

