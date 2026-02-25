-- ==============================================================================
-- ☢️ TIANGUIS BEATS - SCRIPT DEFINITIVO: 100% ESPAÑOL Y OPTIMIZADO
-- ==============================================================================
-- Este script realiza lo siguiente:
-- 1. Libera las tablas de triggers de autenticación de Supabase que impiden borrarlas.
-- 2. Renombra la tabla 'profiles' a 'perfiles' (si existe aún en inglés) y traduce TODAS sus columnas.
-- 3. Mantiene intactos tus datos en 'beats' y 'perfiles'.
-- 4. Borra en CASCADE todas las demás tablas en inglés o antiguas.
-- 5. Crea TODAS las tablas necesarias, pero esta vez 100% EN ESPAÑOL (ej. 'servicios' en vez de 'services').
-- 6. Configura de nuevo la seguridad (RLS) y las vistas de búsqueda.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- PASO 1: LIBERAR DEPENDENCIAS (TRIGGERS DE SUPABASE AUTH)
-- ==============================================================================
-- Esto es lo que impedía que 'profiles' se borrara o modificara tranquilamente.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.crear_perfil_nuevo_usuario();

-- ==============================================================================
-- PASO 2: CONVERTIR Y PRESERVAR TABLA PERFILES
-- ==============================================================================
-- 2.1 Renombrar tabla si sigue como 'profiles'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE public.profiles RENAME TO perfiles;
    END IF;
END $$;

-- 2.2 Desactivar RLS momentáneamente para evitar bloqueos
ALTER TABLE IF EXISTS public.perfiles DISABLE ROW LEVEL SECURITY;

-- 2.3 Traducir columnas de 'perfiles' al español absoluto
DO $$ 
BEGIN
    -- Informacion basica
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'username') THEN ALTER TABLE public.perfiles RENAME COLUMN username TO nombre_usuario; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'artistic_name') THEN ALTER TABLE public.perfiles RENAME COLUMN artistic_name TO nombre_artistico; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'full_name') THEN ALTER TABLE public.perfiles RENAME COLUMN full_name TO nombre_completo; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'bio') THEN ALTER TABLE public.perfiles RENAME COLUMN bio TO biografia; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'country') THEN ALTER TABLE public.perfiles RENAME COLUMN country TO pais; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'email') THEN ALTER TABLE public.perfiles RENAME COLUMN email TO correo; END IF;
    
    -- Ajustes y UI
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'open_collaborations') THEN ALTER TABLE public.perfiles RENAME COLUMN open_collaborations TO colaboraciones_abiertas; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'social_links') THEN ALTER TABLE public.perfiles RENAME COLUMN social_links TO enlaces_sociales; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'birth_date') THEN ALTER TABLE public.perfiles RENAME COLUMN birth_date TO fecha_nacimiento; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'subscription_tier') THEN ALTER TABLE public.perfiles RENAME COLUMN subscription_tier TO nivel_suscripcion; END IF;
    
    -- Status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'is_founder') THEN ALTER TABLE public.perfiles RENAME COLUMN is_founder TO es_fundador; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'is_verified') THEN ALTER TABLE public.perfiles RENAME COLUMN is_verified TO esta_verificado; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'is_admin') THEN ALTER TABLE public.perfiles RENAME COLUMN is_admin TO es_admin; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'verification_status') THEN ALTER TABLE public.perfiles RENAME COLUMN verification_status TO estado_verificacion; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'username_changes') THEN ALTER TABLE public.perfiles RENAME COLUMN username_changes TO cambios_nombre_usuario; END IF;
    
    -- Fechas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'fecha_de_creacion') THEN ALTER TABLE public.perfiles RENAME COLUMN fecha_de_creacion TO fecha_creacion; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'created_at') THEN ALTER TABLE public.perfiles RENAME COLUMN created_at TO fecha_creacion; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'ultima_actualizacion') THEN ALTER TABLE public.perfiles RENAME COLUMN ultima_actualizacion TO fecha_actualizacion; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'updated_at') THEN ALTER TABLE public.perfiles RENAME COLUMN updated_at TO fecha_actualizacion; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'ultima_sesion') THEN ALTER TABLE public.perfiles RENAME COLUMN ultima_sesion TO fecha_ultima_sesion; END IF;
    
    -- Perfil
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'perfil_completado') THEN ALTER TABLE public.perfiles RENAME COLUMN perfil_completado TO esta_completado; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'cta_text') THEN ALTER TABLE public.perfiles RENAME COLUMN cta_text TO texto_cta; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'cta_url') THEN ALTER TABLE public.perfiles RENAME COLUMN cta_url TO url_cta; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'newsletter_active') THEN ALTER TABLE public.perfiles RENAME COLUMN newsletter_active TO boletin_activo; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'links_active') THEN ALTER TABLE public.perfiles RENAME COLUMN links_active TO enlaces_activos; END IF;
    
    -- Stripe y Pagos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'stripe_customer_id') THEN ALTER TABLE public.perfiles RENAME COLUMN stripe_customer_id TO stripe_cliente_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'stripe_subscription_id') THEN ALTER TABLE public.perfiles RENAME COLUMN stripe_subscription_id TO stripe_suscripcion_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'comenzar_suscripcion') THEN ALTER TABLE public.perfiles RENAME COLUMN comenzar_suscripcion TO fecha_inicio_suscripcion; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'termina_suscripcion') THEN ALTER TABLE public.perfiles RENAME COLUMN termina_suscripcion TO fecha_termino_suscripcion; END IF;
    
    -- Asegurar columnas si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'fecha_creacion') THEN
        ALTER TABLE public.perfiles ADD COLUMN fecha_creacion TIMESTAMPTZ DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'idioma_preferido') THEN
        ALTER TABLE public.perfiles ADD COLUMN idioma_preferido TEXT DEFAULT 'es';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'tema_perfil') THEN
        ALTER TABLE public.perfiles ADD COLUMN tema_perfil TEXT;
    END IF;
END $$;


-- ==============================================================================
-- PASO 3: ASEGURAR TABLA BEATS 100% ESPAÑOL
-- ==============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'producer_id') THEN ALTER TABLE public.beats RENAME COLUMN producer_id TO productor_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'title') THEN ALTER TABLE public.beats RENAME COLUMN title TO titulo; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'genre') THEN ALTER TABLE public.beats RENAME COLUMN genre TO genero; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'subgenre') THEN ALTER TABLE public.beats RENAME COLUMN subgenre TO subgenero; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'musical_key') THEN ALTER TABLE public.beats RENAME COLUMN musical_key TO nota_musical; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'musical_scale') THEN ALTER TABLE public.beats RENAME COLUMN musical_scale TO escala_musical; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'description') THEN ALTER TABLE public.beats RENAME COLUMN description TO descripcion; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'mood') THEN ALTER TABLE public.beats RENAME COLUMN mood TO vibras; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'beat_types') THEN ALTER TABLE public.beats RENAME COLUMN beat_types TO tipos_beat; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'reference_artist') THEN ALTER TABLE public.beats RENAME COLUMN reference_artist TO artista_referencia; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'is_public') THEN ALTER TABLE public.beats RENAME COLUMN is_public TO es_publico; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'is_sold') THEN ALTER TABLE public.beats RENAME COLUMN is_sold TO esta_vendido; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'created_at') THEN ALTER TABLE public.beats RENAME COLUMN created_at TO fecha_creacion; END IF;
END $$;


-- ==============================================================================
-- PASO 4: DESTRUCCIÓN NUCLEAR DE TABLAS OBSOLETAS O EN INGLÉS
-- ==============================================================================
DROP VIEW IF EXISTS public.beats_busqueda CASCADE;
DROP TABLE IF EXISTS public.archivos_proyecto CASCADE;
DROP TABLE IF EXISTS public.mensajes_proyecto CASCADE;
DROP TABLE IF EXISTS public.proyectos_servicio CASCADE;
DROP TABLE IF EXISTS public.transacciones CASCADE;
DROP TABLE IF EXISTS public.licencias CASCADE;
DROP TABLE IF EXISTS public.licencias_plantillas CASCADE;
DROP TABLE IF EXISTS public.sound_kits CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.cupones CASCADE;
DROP TABLE IF EXISTS public.listas_reproduccion CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.favoritos CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.verification_requests CASCADE;
DROP TABLE IF EXISTS public.retiros CASCADE;
DROP TABLE IF EXISTS public.quejas_y_sugerencias CASCADE;

-- ==============================================================================
-- PASO 5: CREACIÓN DE TABLAS EN ESPAÑOL ABSOLUTO
-- ==============================================================================

-- 5.1 PRECIOS Y LICENCIAS
CREATE TABLE public.licencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('basica', 'pro', 'premium', 'ilimitada', 'exclusiva', 'kit_sonido')),
    limite_streams TEXT,
    limite_copias TEXT,
    limite_videos TEXT,
    limite_radios TEXT,
    texto_legal TEXT,
    usar_texto_personalizado BOOLEAN DEFAULT false,
    incluir_clausulas_pro BOOLEAN DEFAULT true,
    configuracion_avanzada JSONB DEFAULT '{}',
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
    UNIQUE(productor_id, tipo)
);

-- 5.2 LA CÁMARA DEL TESORO (TRANSACCIONES UNIFICADAS)
CREATE TABLE public.transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pago_stripe TEXT, 
    comprador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL,
    tipo_producto TEXT NOT NULL, -- 'beat', 'kit_sonido', 'servicio', 'suscripcion'
    nombre_producto TEXT NOT NULL,
    precio_total NUMERIC NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'MXN',
    estado_pago TEXT NOT NULL DEFAULT 'completado',
    metodo_pago TEXT NOT NULL DEFAULT 'stripe',
    tipo_licencia TEXT,
    metadatos JSONB DEFAULT '{}',
    cupon_id UUID,
    url_recibo TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 5.3 SERVICIOS PROFESIONALES (Antes Services)
CREATE TABLE public.servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL CHECK (precio >= 0),
    tipo_servicio TEXT DEFAULT 'mezcla_master',
    tiempo_entrega_dias INTEGER DEFAULT 3,
    es_activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 5.4 KITS DE SONIDO (Antes Sound Kits)
CREATE TABLE public.kits_sonido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL CHECK (precio >= 0),
    url_archivo TEXT NOT NULL,
    url_portada TEXT,
    es_publico BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 5.5 GESTIÓN DE PROYECTOS DE SERVICIO (Producers colaborando con artistas)
CREATE TABLE public.proyectos_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaccion_id UUID REFERENCES public.transacciones(id) ON DELETE CASCADE,
    comprador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    productor_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'pagado', -- 'pagado', 'requerimientos_enviados', 'en_produccion', 'en_revision', 'entregado', 'completado'
    requerimientos JSONB DEFAULT '{}',
    url_archivo_final TEXT,
    fecha_entrega TIMESTAMPTZ,
    fecha_auto_liberacion TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.mensajes_proyecto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID REFERENCES public.proyectos_servicio(id) ON DELETE CASCADE,
    remitente_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.archivos_proyecto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID REFERENCES public.proyectos_servicio(id) ON DELETE CASCADE,
    subidor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    url_archivo TEXT NOT NULL,
    nombre_archivo TEXT NOT NULL,
    tipo_archivo TEXT NOT NULL, -- 'referencia', 'final'
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 5.6 TABLAS AUXILIARES (MARKETING, SOCIAL, SOPORTE)
CREATE TABLE public.cupones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    codigo TEXT UNIQUE NOT NULL,
    porcentaje_descuento INTEGER CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 100),
    es_activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.listas_reproduccion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    es_publica BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.quejas_y_sugerencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_mensaje TEXT, -- 'queja' o 'sugerencia'
    nombre_usuario TEXT,
    correo TEXT,
    descripcion_problema TEXT,
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'pendiente',
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.favoritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    UNIQUE(usuario_id, beat_id)
);

CREATE TABLE public.seguimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seguidor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    seguido_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    UNIQUE(seguidor_id, seguido_id)
);

CREATE TABLE public.comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    esta_leida BOOLEAN DEFAULT false,
    url_destino TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- PASO 6: CREAR TRIGGER PARA CREACIÓN AUTOMÁTICA DE PERFIL (VINCULADO A AUTH)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.crear_perfil_nuevo_usuario()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre_usuario, correo, fecha_creacion)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', 'usuario_' || substr(new.id::text, 1, 6)), new.email, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.crear_perfil_nuevo_usuario();

-- ==============================================================================
-- PASO 7: VISTA MATERIZALIZADA DE BÚSQUEDA (TODO EN ESPAÑOL)
-- ==============================================================================
CREATE OR REPLACE VIEW public.beats_busqueda AS
SELECT 
    b.*,
    p.nombre_artistico as productor_nombre_artistico,
    p.nombre_usuario as productor_nombre_usuario,
    p.esta_verificado as productor_esta_verificado,
    p.es_fundador as productor_es_fundador,
    p.nivel_suscripcion as productor_nivel_suscripcion,
    p.foto_perfil as productor_foto_perfil
FROM public.beats b
JOIN public.perfiles p ON b.productor_id = p.id
WHERE b.es_publico = true;

-- ==============================================================================
-- PASO 8: HABILITAR RLS Y POLÍTICAS BÁSICAS
-- ==============================================================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits_sonido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listas_reproduccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quejas_y_sugerencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas elementales (Lectura pública y control propio)
CREATE POLICY "Lectura pública perfiles" ON public.perfiles FOR SELECT USING (true);
CREATE POLICY "Control total propio perfil" ON public.perfiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Lectura pública beats" ON public.beats FOR SELECT USING (true);
CREATE POLICY "Control total propio beats" ON public.beats FOR ALL USING (auth.uid() = productor_id);

CREATE POLICY "Control total licencias propio" ON public.licencias FOR ALL USING (auth.uid() = productor_id);
CREATE POLICY "Lectura pública licencias" ON public.licencias FOR SELECT USING (true);

CREATE POLICY "Compradores ven sus transacciones" ON public.transacciones FOR SELECT USING (auth.uid() = comprador_id);
CREATE POLICY "Vendedores ven sus ventas" ON public.transacciones FOR SELECT USING (auth.uid() = vendedor_id);

CREATE POLICY "Control total servicios" ON public.servicios FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "Lectura pública servicios" ON public.servicios FOR SELECT USING (true);

CREATE POLICY "Control total kits_sonido" ON public.kits_sonido FOR ALL USING (auth.uid() = productor_id);
CREATE POLICY "Lectura pública kits_sonido" ON public.kits_sonido FOR SELECT USING (true);

CREATE POLICY "Participantes ven sus proyectos" ON public.proyectos_servicio FOR SELECT USING (auth.uid() = comprador_id OR auth.uid() = productor_id);

CREATE POLICY "Inserción pública quejas" ON public.quejas_y_sugerencias FOR INSERT WITH CHECK (true);

COMMIT;
