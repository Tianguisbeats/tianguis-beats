-- ==============================================================================
-- ☢️ TIANGUIS BEATS - SCRIPT NUCLEAR: RESET TOTAL (VERSIÓN ESPAÑOL)
-- ==============================================================================
-- Este script realiza lo siguiente:
-- 1. Elimina TODAS las tablas de negocio existentes (CASCADE).
-- 2. Limpia los datos de las tablas de Auth (opcional - requiere permisos altos).
-- 3. Recrea el esquema completo con nombres en español.
-- 4. Configura políticas RLS y Triggers.
-- 5. Crea vistas optimizadas.
-- ==============================================================================

BEGIN;

-- 1. LIMPIEZA TOTAL (WIPE)
-- Borrar vistas primero
DROP VIEW IF EXISTS public.beats_busqueda CASCADE;

-- Borrar tablas en orden inverso de dependencia o con CASCADE
DROP TABLE IF EXISTS public.archivos_proyecto CASCADE;
DROP TABLE IF EXISTS public.mensajes_proyecto CASCADE;
DROP TABLE IF EXISTS public.proyectos_servicio CASCADE;
DROP TABLE IF EXISTS public.transacciones CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.beats CASCADE;
DROP TABLE IF EXISTS public.licencias CASCADE;
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
DROP TABLE IF EXISTS public.perfiles CASCADE;

-- 2. CREACIÓN DE TABLAS (ESQUEMA EN ESPAÑOL)

-- 2.1 Tabla PERFILES (Referencia central)
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_usuario TEXT UNIQUE,
    nombre_artistico TEXT,
    nombre_completo TEXT,
    foto_perfil TEXT,
    portada_perfil TEXT,
    biografia TEXT,
    pais TEXT DEFAULT 'México',
    enlaces_sociales JSONB DEFAULT '{}',
    nivel_suscripcion TEXT DEFAULT 'free' CHECK (nivel_suscripcion IN ('free', 'pro', 'premium')),
    es_fundador BOOLEAN DEFAULT false,
    esta_verificado BOOLEAN DEFAULT false,
    es_admin BOOLEAN DEFAULT false,
    boletin_activo BOOLEAN DEFAULT true,
    enlaces_activos BOOLEAN DEFAULT true,
    estado_verificacion TEXT DEFAULT 'none', -- 'none', 'pending', 'verified', 'rejected'
    verificacion_instagram TEXT,
    verificacion_youtube TEXT,
    verificacion_tiktok TEXT,
    stripe_cliente_id TEXT,
    stripe_suscripcion_id TEXT,
    fecha_inicio_suscripcion TIMESTAMPTZ,
    fecha_termino_suscripcion TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
    fecha_ultima_sesion TIMESTAMPTZ,
    esta_completado BOOLEAN DEFAULT false,
    
    -- Contadores Musical Chairs
    user_num_total INTEGER,
    user_num_free INTEGER,
    user_num_pro INTEGER,
    user_num_prem INTEGER,
    
    -- Futuro
    metadatos_extra JSONB DEFAULT '{}'
);

-- 2.2 Tabla LICENCIAS (Configuraciones de los productores)
CREATE TABLE public.licencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('basica', 'pro', 'premium', 'ilimitada', 'exclusiva', 'soundkit')),
    streams_limite TEXT,
    copias_limite TEXT,
    videos_limite TEXT,
    radio_limite TEXT,
    texto_legal TEXT,
    usar_texto_personalizado BOOLEAN DEFAULT false,
    incluir_clausulas_pro BOOLEAN DEFAULT true,
    configuracion_avanzada JSONB DEFAULT '{}',
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
    UNIQUE(productor_id, tipo)
);

-- 2.3 Tabla BEATS
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
    
    -- Archivos
    portada_url TEXT,
    archivo_mp3_url TEXT,
    archivo_muestra_url TEXT,
    archivo_wav_url TEXT,
    archivo_stems_url TEXT,
    
    -- Precios 5-Tier
    precio_basico_mxn INTEGER DEFAULT 199,
    precio_pro_mxn INTEGER DEFAULT 499,
    precio_premium_mxn INTEGER DEFAULT 999,
    precio_ilimitado_mxn INTEGER DEFAULT 1999,
    precio_exclusivo_mxn INTEGER,
    
    -- Flags
    es_basica_activa BOOLEAN DEFAULT true,
    es_pro_activa BOOLEAN DEFAULT true,
    es_premium_activa BOOLEAN DEFAULT true,
    es_ilimitada_activa BOOLEAN DEFAULT true,
    es_exclusiva_activa BOOLEAN DEFAULT false,
    es_publico BOOLEAN DEFAULT true,
    esta_vendido BOOLEAN DEFAULT false,
    
    -- Stats
    conteo_reproducciones INTEGER DEFAULT 0,
    conteo_ventas INTEGER DEFAULT 0,
    conteo_likes INTEGER DEFAULT 0,
    conteo_repro_semanal INTEGER DEFAULT 0,
    conteo_ventas_semanal INTEGER DEFAULT 0,
    visibilidad_tier INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    metadatos_extra JSONB DEFAULT '{}'
);

-- 2.4 Tabla TRANSACCIONES (Unificada)
CREATE TABLE public.transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id TEXT, -- Stripe ID
    comprador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL,
    tipo_producto TEXT NOT NULL, -- 'beat', 'sound_kit', 'service', 'plan'
    nombre_producto TEXT NOT NULL,
    precio NUMERIC NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'MXN',
    estado_pago TEXT NOT NULL DEFAULT 'completado',
    metodo_pago TEXT NOT NULL DEFAULT 'stripe',
    tipo_licencia TEXT,
    metadatos JSONB DEFAULT '{}',
    cupon_id UUID,
    recibo_url TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 2.5 Tabla SERVICIOS y SOUND KITS
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL CHECK (precio >= 0),
    tipo_servicio TEXT DEFAULT 'mixing_mastering',
    tiempo_entrega_dias INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sound_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    file_url TEXT NOT NULL,
    cover_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 Gestión de Proyectos de Servicio
CREATE TABLE public.proyectos_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaccion_id UUID REFERENCES public.transacciones(id) ON DELETE CASCADE,
    comprador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    productor_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'paid', -- 'paid', 'requirements_sent', 'in_production', 'review', 'delivered', 'completed'
    requerimientos JSONB DEFAULT '{}',
    archivo_final_url TEXT,
    fecha_entrega TIMESTAMPTZ,
    fecha_auto_liberacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.mensajes_proyecto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID REFERENCES public.proyectos_servicio(id) ON DELETE CASCADE,
    remitente_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.archivos_proyecto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID REFERENCES public.proyectos_servicio(id) ON DELETE CASCADE,
    subidor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    archivo_url TEXT NOT NULL,
    nombre_archivo TEXT NOT NULL,
    tipo_archivo TEXT NOT NULL, -- 'reference', 'final'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 Tablas Auxiliares
CREATE TABLE public.cupones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    codigo TEXT UNIQUE NOT NULL,
    porcentaje_descuento INTEGER CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 100),
    es_activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.listas_reproduccion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    es_publica BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.quejas_y_sugerencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_mensaje TEXT, -- 'queja' o 'sugerencia'
    nombre_usuario TEXT,
    email TEXT,
    descripcion_queja TEXT,
    user_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    estado TEXT DEFAULT 'pendiente',
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 3. TRIGGERS Y FUNCIONES

-- 3.1 Sincronización de Founder Status
CREATE OR REPLACE FUNCTION sync_founder_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_termino_suscripcion IS NULL OR NEW.fecha_termino_suscripcion <= NOW() THEN
        NEW.es_fundador = false;
    ELSIF NEW.fecha_termino_suscripcion > NOW() THEN
        NEW.es_fundador = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_founder_status
BEFORE UPDATE OF fecha_termino_suscripcion ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION sync_founder_status();

-- 3.2 Update Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_perfiles_timestamp BEFORE UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. VISTAS

CREATE OR REPLACE VIEW public.beats_busqueda AS
SELECT 
    b.id, b.productor_id, b.titulo, b.genero, b.subgenero, b.bpm, b.nota_musical, b.escala_musical,
    b.precio_basico_mxn, b.precio_pro_mxn, b.precio_premium_mxn, b.precio_ilimitado_mxn, b.precio_exclusivo_mxn,
    b.es_publico, b.esta_vendido, b.portada_url, b.archivo_muestra_url, b.archivo_mp3_url, b.vibras,
    b.conteo_reproducciones, b.conteo_likes, b.conteo_ventas, b.visibilidad_tier, b.created_at,
    p.nombre_artistico as producer_nombre_artistico,
    p.nombre_usuario as producer_nombre_usuario,
    p.esta_verificado as producer_esta_verificado,
    p.es_fundador as producer_es_fundador,
    p.nivel_suscripcion as producer_nivel_suscripcion,
    p.foto_perfil as producer_foto_perfil
FROM public.beats b
JOIN public.perfiles p ON b.productor_id = p.id
WHERE b.es_publico = true;

-- 5. SEGURIDAD (RLS)

-- Habilitar RLS en todas
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_kits ENABLE ROW LEVEL SECURITY;

-- Políticas Perfiles
CREATE POLICY "Lectura pública perfiles" ON public.perfiles FOR SELECT USING (true);
CREATE POLICY "Control total perfil propio" ON public.perfiles FOR ALL USING (auth.uid() = id);

-- Políticas Beats
CREATE POLICY "Lectura pública beats" ON public.beats FOR SELECT USING (true);
CREATE POLICY "Control total beats productor" ON public.beats FOR ALL USING (auth.uid() = productor_id);

-- Políticas Transacciones
CREATE POLICY "Compradores ven sus compras" ON public.transacciones FOR SELECT USING (auth.uid() = comprador_id);
CREATE POLICY "Vendedores ven sus ventas" ON public.transacciones FOR SELECT USING (auth.uid() = vendedor_id);

COMMIT;
