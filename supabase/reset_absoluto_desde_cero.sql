-- ==============================================================================
-- ☢️ SCRIPT DE RESETEO ABSOLUTO - TIANGUIS BEATS (DESDE CERO)
-- ==============================================================================
-- ¡ADVERTENCIA! ESTE SCRIPT BORRA TODOS LOS DATOS EXISTENTES Y RECREA
-- LA BASE DE DATOS COMPLETA 100% EN ESPAÑOL, BASADO EN TU CÓDIGO ACTUAL.
-- ==============================================================================

BEGIN;

-- 1. MATAR LOS TRIGGERS Y FUNCIONES QUE BLOQUEAN LAS TABLAS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.crear_perfil_nuevo_usuario() CASCADE;

-- 2. BOMBA NUCLEAR A TODAS LAS TABLAS EXISTENTES (EN INGLÉS O ESPAÑOL)
DROP VIEW IF EXISTS public.beats_busqueda CASCADE;
DROP TABLE IF EXISTS public.archivos_proyecto CASCADE;
DROP TABLE IF EXISTS public.mensajes_proyecto CASCADE;
DROP TABLE IF EXISTS public.proyectos_servicio CASCADE;
DROP TABLE IF EXISTS public.proyectos CASCADE;
DROP TABLE IF EXISTS public.transacciones CASCADE;
DROP TABLE IF EXISTS public.licencias CASCADE;
DROP TABLE IF EXISTS public.licencias_plantillas CASCADE;
DROP TABLE IF EXISTS public.sound_kits CASCADE;
DROP TABLE IF EXISTS public.kits_sonido CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.servicios CASCADE;
DROP TABLE IF EXISTS public.cupones CASCADE;
DROP TABLE IF EXISTS public.items_lista_reproduccion CASCADE;
DROP TABLE IF EXISTS public.listas_reproduccion CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.notificaciones CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.seguidores CASCADE;
DROP TABLE IF EXISTS public.favoritos CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.comentarios CASCADE;
DROP TABLE IF EXISTS public.verification_requests CASCADE;
DROP TABLE IF EXISTS public.retiros CASCADE;
DROP TABLE IF EXISTS public.quejas_y_sugerencias CASCADE;
DROP TABLE IF EXISTS public.beats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.perfiles CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;

-- ==============================================================================
-- 3. CREACIÓN DE LA NUEVA BASE DE DATOS (ESTRUCTURA OPTIMIZADA EN ESPAÑOL)
-- ==============================================================================

-- 3.1 PERFILES (El Corazón de los Usuarios)
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_usuario TEXT UNIQUE NOT NULL,
    nombre_artistico TEXT,
    nombre_completo TEXT,
    foto_perfil TEXT,
    portada_perfil TEXT,
    ajuste_portada INTEGER DEFAULT 50,
    biografia TEXT,
    pais TEXT DEFAULT 'México',
    idioma_preferido TEXT DEFAULT 'es',
    colaboraciones_abiertas BOOLEAN DEFAULT false,
    enlaces_sociales JSONB DEFAULT '{}',
    fecha_nacimiento DATE,
    
    -- Roles y Estados
    nivel_suscripcion TEXT DEFAULT 'free' CHECK (nivel_suscripcion IN ('free', 'pro', 'premium')),
    es_fundador BOOLEAN DEFAULT false,
    esta_verificado BOOLEAN DEFAULT false,
    es_admin BOOLEAN DEFAULT false,
    estado_verificacion TEXT DEFAULT 'ninguno', -- ninguno, pendiente, verificado, rechazado
    cambios_nombre_usuario INTEGER DEFAULT 0,
    correo TEXT,
    
    -- UI y Personalización
    esta_completado BOOLEAN DEFAULT false,
    tema_perfil TEXT DEFAULT 'oscuro',
    color_acento TEXT DEFAULT 'blue',
    video_destacado_url TEXT,
    texto_cta TEXT,
    url_cta TEXT,
    
    -- Ajustes Generales
    boletin_activo BOOLEAN DEFAULT true,
    enlaces_activos BOOLEAN DEFAULT true,
    
    -- Verificaciones Sociales
    verificacion_instagram TEXT,
    verificacion_youtube TEXT,
    verificacion_tiktok TEXT,
    
    -- Stripe y Pagos
    stripe_cliente_id TEXT,
    stripe_suscripcion_id TEXT,
    fecha_inicio_suscripcion TIMESTAMPTZ,
    fecha_termino_suscripcion TIMESTAMPTZ,
    
    -- Contadores Internos (Musical Chairs u otros)
    visitas_totales INTEGER DEFAULT 0, 
    
    -- Fechas de Sistema
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
    fecha_ultima_sesion TIMESTAMPTZ
);

-- 3.2 BEATS (El Producto Principal)
CREATE TABLE public.beats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    genero TEXT,
    subgenero TEXT,
    bpm INTEGER,
    nota_musical TEXT,
    escala_musical TEXT,
    descripcion TEXT,
    vibras TEXT,
    tipos_beat TEXT[],
    artista_referencia TEXT,
    
    -- Precios Diferenciados (MXN)
    precio_basico_mxn INTEGER DEFAULT 199,
    precio_pro_mxn INTEGER DEFAULT 499,
    precio_premium_mxn INTEGER DEFAULT 999,
    precio_ilimitado_mxn INTEGER DEFAULT 1999,
    precio_exclusivo_mxn INTEGER,
    
    -- Controles y Estados
    es_publico BOOLEAN DEFAULT true,
    esta_vendido BOOLEAN DEFAULT false,
    
    -- URLs de Archivos en Storage
    portada_url TEXT,
    archivo_mp3_url TEXT,
    archivo_muestra_url TEXT,
    archivo_wav_url TEXT,
    archivo_stems_url TEXT,
    
    -- Estadísticas
    conteo_reproducciones INTEGER DEFAULT 0,
    conteo_ventas INTEGER DEFAULT 0,
    conteo_likes INTEGER DEFAULT 0,
    visibilidad_tier INTEGER DEFAULT 0,
    
    -- Interruptores de Licencias (Activar/Desactivar tipos de venta)
    es_basica_activa BOOLEAN DEFAULT true,
    es_pro_activa BOOLEAN DEFAULT true,
    es_premium_activa BOOLEAN DEFAULT true,
    es_ilimitada_activa BOOLEAN DEFAULT true,
    es_exclusiva_activa BOOLEAN DEFAULT true,
    
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 3.3 LICENCIAS (Reglas de Venta de cada Productor)
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

-- 3.4 KITS DE SONIDO
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

-- 3.5 SERVICIOS
CREATE TABLE public.servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL CHECK (precio >= 0),
    tipo_servicio TEXT DEFAULT 'mezcla_master',
    tiempo_entrega_dias INTEGER DEFAULT 3,
    es_activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 3.6 TRANSACCIONES (Compras, Ventas, Suscripciones a la app)
CREATE TABLE public.transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pago_stripe TEXT, 
    comprador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL,
    tipo_producto TEXT NOT NULL, -- 'beat', 'kit_sonido', 'servicio', 'suscripcion_app'
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

-- 3.7 PROYECTOS DE SERVICIO (Para manejar entregables post-venta)
CREATE TABLE public.proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaccion_id UUID REFERENCES public.transacciones(id) ON DELETE CASCADE,
    comprador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    productor_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'pagado', -- pagado, progreso, revision, completado
    requerimientos JSONB DEFAULT '{}',
    url_archivo_final TEXT,
    fecha_entrega_estimada TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.mensajes_proyecto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE CASCADE,
    remitente_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.archivos_proyecto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE CASCADE,
    subidor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    url_archivo TEXT NOT NULL,
    nombre_archivo TEXT NOT NULL,
    tipo_archivo TEXT NOT NULL, 
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 3.8 TABLAS SOCIALES Y DE PLATAFORMA
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

CREATE TABLE public.seguidores (
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
-- 4. VINCULACIÓN CON SUPABASE AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.crear_perfil_nuevo_usuario()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre_usuario, correo, fecha_creacion)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', 'usuario_' || substr(new.id::text, 1, 6)), 
    new.email, 
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.crear_perfil_nuevo_usuario();


-- ==============================================================================
-- 5. VISTA DE BÚSQUEDA OPTIMIZADA
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
-- 6. HABILITAR SEGURIDAD (RLS)
-- ==============================================================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits_sonido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listas_reproduccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quejas_y_sugerencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura global (Todo el mundo puede ver lo público)
CREATE POLICY "Lectura perfiles" ON public.perfiles FOR SELECT USING (true);
CREATE POLICY "Acceso total propio perfil" ON public.perfiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Lectura beats" ON public.beats FOR SELECT USING (true);
CREATE POLICY "Gestión beats propios" ON public.beats FOR ALL USING (auth.uid() = productor_id);

CREATE POLICY "Lectura licencias" ON public.licencias FOR SELECT USING (true);
CREATE POLICY "Gestión licencias" ON public.licencias FOR ALL USING (auth.uid() = productor_id);

CREATE POLICY "Lectura kits" ON public.kits_sonido FOR SELECT USING (true);
CREATE POLICY "Gestión kits" ON public.kits_sonido FOR ALL USING (auth.uid() = productor_id);

CREATE POLICY "Lectura servicios" ON public.servicios FOR SELECT USING (true);
CREATE POLICY "Gestión servicios" ON public.servicios FOR ALL USING (auth.uid() = productor_id);

-- En privacidad (solo los involucrados pueden ver)
CREATE POLICY "Lectura compras" ON public.transacciones FOR SELECT USING (auth.uid() = comprador_id);
CREATE POLICY "Lectura ventas" ON public.transacciones FOR SELECT USING (auth.uid() = vendedor_id);

CREATE POLICY "Proyectos para involucrados" ON public.proyectos FOR SELECT USING (auth.uid() = comprador_id OR auth.uid() = productor_id);

CREATE POLICY "Inserción pública de quejas" ON public.quejas_y_sugerencias FOR INSERT WITH CHECK (true);

-- Favoritos y Seguidos (Solo autenticados manejan lo suyo)
CREATE POLICY "Gestión favoritos propios" ON public.favoritos FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "Lectura favoritos" ON public.favoritos FOR SELECT USING (true);

CREATE POLICY "Gestión seguidores propios" ON public.seguidores FOR ALL USING (auth.uid() = seguidor_id);
CREATE POLICY "Lectura seguidores" ON public.seguidores FOR SELECT USING (true);

COMMIT;
