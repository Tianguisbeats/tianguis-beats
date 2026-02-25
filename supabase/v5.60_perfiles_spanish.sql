-- ==============================================================================
-- 🚀 V5.60: REFACTORIZACIÓN TOTAL A ESPAÑOL (TABLA PERFILES)
-- ==============================================================================
-- Este script renombra 'profiles' a 'perfiles' y traduce todas sus columnas.
-- También actualiza triggers, funciones y políticas RLS.
-- ==============================================================================

-- 0. Deshabilitar RLS temporalmente para evitar problemas durante la migración
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 1. Renombrar la tabla principal
ALTER TABLE IF EXISTS public.profiles RENAME TO perfiles;

-- 2. Renombrar columnas a español (manteniendo tipos de datos)
ALTER TABLE public.perfiles RENAME COLUMN username TO nombre_usuario;
ALTER TABLE public.perfiles RENAME COLUMN artistic_name TO nombre_artistico;
ALTER TABLE public.perfiles RENAME COLUMN full_name TO nombre_completo;
ALTER TABLE public.perfiles RENAME COLUMN bio TO biografia;
ALTER TABLE public.perfiles RENAME COLUMN country TO pais;
ALTER TABLE public.perfiles RENAME COLUMN open_collaborations TO colaboraciones_abiertas;
ALTER TABLE public.perfiles RENAME COLUMN social_links TO enlaces_sociales;
ALTER TABLE public.perfiles RENAME COLUMN birth_date TO fecha_nacimiento;
ALTER TABLE public.perfiles RENAME COLUMN subscription_tier TO nivel_suscripcion;
ALTER TABLE public.perfiles RENAME COLUMN is_founder TO es_fundador;
ALTER TABLE public.perfiles RENAME COLUMN is_verified TO esta_verificado;
ALTER TABLE public.perfiles RENAME COLUMN username_changes TO cambios_nombre_usuario;
ALTER TABLE public.perfiles RENAME COLUMN fecha_de_creacion TO fecha_creacion;
ALTER TABLE public.perfiles RENAME COLUMN ultima_actualizacion TO fecha_actualizacion;
ALTER TABLE public.perfiles RENAME COLUMN ultima_sesion TO fecha_ultima_sesion;
ALTER TABLE public.perfiles RENAME COLUMN perfil_completado TO esta_completado;
ALTER TABLE public.perfiles RENAME COLUMN stripe_customer_id TO stripe_cliente_id;
ALTER TABLE public.perfiles RENAME COLUMN termina_suscripcion TO fecha_termino_suscripcion;
ALTER TABLE public.perfiles RENAME COLUMN comenzar_suscripcion TO fecha_inicio_suscripcion;
ALTER TABLE public.perfiles RENAME COLUMN cta_text TO texto_cta;
ALTER TABLE public.perfiles RENAME COLUMN cta_url TO url_cta;
ALTER TABLE public.perfiles RENAME COLUMN newsletter_active TO boletin_activo;
ALTER TABLE public.perfiles RENAME COLUMN links_active TO enlaces_activos;
ALTER TABLE public.perfiles RENAME COLUMN verification_status TO estado_verificacion;
ALTER TABLE public.perfiles RENAME COLUMN is_admin TO es_admin;
ALTER TABLE public.perfiles RENAME COLUMN verify_instagram TO verificacion_instagram;
ALTER TABLE public.perfiles RENAME COLUMN verify_youtube TO verificacion_youtube;
ALTER TABLE public.perfiles RENAME COLUMN verify_tiktok TO verificacion_tiktok;
ALTER TABLE public.perfiles RENAME COLUMN stripe_subscription_id TO stripe_suscripcion_id;

-- 3. Actualizar Función de Trigger (sync_founder_status)
CREATE OR REPLACE FUNCTION sync_founder_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la fecha de término es nula o ya pasó, quitamos el status founder
    IF NEW.fecha_termino_suscripcion IS NULL OR NEW.fecha_termino_suscripcion <= NOW() THEN
        NEW.es_fundador = false;
    -- Si la fecha de término es en el futuro, activamos founder
    ELSIF NEW.fecha_termino_suscripcion > NOW() THEN
        NEW.es_fundador = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recrear Trigger en la nueva tabla perfiles
DROP TRIGGER IF EXISTS trg_sync_founder_status ON public.perfiles;
CREATE TRIGGER trg_sync_founder_status
BEFORE UPDATE OF fecha_termino_suscripcion
ON public.perfiles
FOR EACH ROW
EXECUTE FUNCTION sync_founder_status();

-- 5. Actualizar políticas RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.perfiles;
CREATE POLICY "Los perfiles públicos son visibles por todos"
ON public.perfiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.perfiles;
CREATE POLICY "Los usuarios pueden insertar su propio perfil"
ON public.perfiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.perfiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
ON public.perfiles FOR UPDATE
USING (auth.uid() = id);

-- 7. RECREAR VISTA beats_busqueda (Con nuevos nombres de columnas)
CREATE OR REPLACE VIEW public.beats_busqueda AS
SELECT 
    b.*,
    p.nombre_artistico as producer_nombre_artistico,
    p.nombre_usuario as producer_nombre_usuario,
    p.esta_verificado as producer_esta_verificado,
    p.es_fundador as producer_es_fundador,
    p.nivel_suscripcion as producer_nivel_suscripcion,
    p.foto_perfil as producer_foto_perfil
FROM public.beats b
JOIN public.perfiles p ON b.productor_id = p.id
WHERE b.es_publico = true;

-- 8. SCRIPT NUCLEAR: Limpieza total de datos para inicio limpio
TRUNCATE TABLE 
    public.transacciones,
    public.beats,
    public.licencias,
    public.sound_kits,
    public.services,
    public.listas_reproduccion,
    public.notifications,
    public.follows,
    public.favoritos,
    public.comments,
    public.cupones,
    public.verification_requests,
    public.retiros,
    public.quejas_y_sugerencias,
    public.perfiles
CASCADE;
