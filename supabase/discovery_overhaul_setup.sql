-- =========================================================
-- TIANGUIS BEATS - SMART DISCOVERY OVERHAUL (HYBRID SCHEMA)
-- =========================================================

-- 1. ADD WEEKLY METRICS TO BEATS (Keep original play_count, like_count, sale_count)
ALTER TABLE IF EXISTS public.beats ADD COLUMN IF NOT EXISTS weekly_play_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.beats ADD COLUMN IF NOT EXISTS weekly_sale_count INTEGER DEFAULT 0;

-- 2. TRADUCIR TABLA LIKES A FAVORITOS
ALTER TABLE IF EXISTS public.likes RENAME TO favoritos;
ALTER TABLE public.favoritos RENAME COLUMN user_id TO usuario_id;
ALTER TABLE public.favoritos RENAME COLUMN created_at TO fecha_creacion;

-- (Opcional) Puedes borrar manualmente la tabla 'listens' desde el panel de Supabase 
-- ya que ahora las reproducciones se cuentan directamente en 'play_count'.

-- 3. CREATE SEARCH VIEW (Uses original English names for beat properties)
CREATE OR REPLACE VIEW public.beats_busqueda AS
SELECT 
    b.id,
    b.producer_id,
    b.title,
    b.genre,
    b.bpm,
    b.musical_key,
    b.musical_scale,
    b.description,
    b.price_mxn,
    b.price_wav_mxn,
    b.price_stems_mxn,
    b.exclusive_price_mxn,
    b.is_exclusive,
    b.is_public,
    b.portadabeat_url,
    b.mp3_tag_url,
    b.mp3_url,
    b.wav_url,
    b.stems_url,
    b.mood,
    b.play_count,
    b.like_count,
    b.sale_count,
    b.weekly_play_count,
    b.weekly_sale_count,
    b.created_at,
    b.subgenre,
    b.beat_types,
    b.is_sold,
    b.reference_artist,
    p.artistic_name as producer_name,
    p.username as producer_username,
    p.is_verified as producer_verified,
    p.subscription_tier as producer_tier,
    p.foto_perfil as producer_avatar
FROM public.beats b
JOIN public.profiles p ON b.producer_id = p.id
WHERE b.is_public = true;

GRANT SELECT ON public.beats_busqueda TO anon, authenticated;

-- 4. ACTIVITY TRACKING FUNCTIONS
CREATE OR REPLACE FUNCTION public.track_beat_activity(p_beat_id UUID, p_type TEXT)
RETURNS void AS $$
BEGIN
    IF p_type = 'play' THEN
        -- Updates English metrics in beats table directly
        UPDATE public.beats 
        SET play_count = COALESCE(play_count, 0) + 1,
            weekly_play_count = COALESCE(weekly_play_count, 0) + 1
        WHERE id = p_beat_id;
        
    ELSIF p_type = 'sale' THEN
        UPDATE public.beats 
        SET sale_count = COALESCE(sale_count, 0) + 1,
            weekly_sale_count = COALESCE(weekly_sale_count, 0) + 1
        WHERE id = p_beat_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reset_weekly_stats()
RETURNS void AS $$
BEGIN
    UPDATE public.beats 
    SET weekly_play_count = 0, 
        weekly_sale_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
