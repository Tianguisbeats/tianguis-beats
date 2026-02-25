-- ==============================================================================
-- 🛠️ TIANGUIS BEATS - SCRIPT DE RECONSTRUCCIÓN Y OPTIMIZACIÓN
-- ==============================================================================
-- Este script recrea las tablas de negocio PERO preserva 'beats' y 'perfiles'.
-- Asegura que 'perfiles' tenga la columna 'fecha_creacion'.
-- ==============================================================================

BEGIN;

-- 1. ASEGURAR COLUMNAS EN PERFILES
DO $$ 
BEGIN
    -- Asegurar fecha_creacion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'fecha_creacion') THEN
        ALTER TABLE public.perfiles ADD COLUMN fecha_creacion TIMESTAMPTZ DEFAULT now();
    END IF;
    
    -- Otros campos que podrían faltar basados en types.ts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'idioma_preferido') THEN
        ALTER TABLE public.perfiles ADD COLUMN idioma_preferido TEXT DEFAULT 'es';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfiles' AND column_name = 'tema_perfil') THEN
        ALTER TABLE public.perfiles ADD COLUMN tema_perfil TEXT;
    END IF;
END $$;

-- 2. LIMPIEZA DE TABLAS DE NEGOCIO (EXCEPT BEATS & PERFILES)
DROP TABLE IF EXISTS public.archivos_proyecto CASCADE;
DROP TABLE IF EXISTS public.mensajes_proyecto CASCADE;
DROP TABLE IF EXISTS public.proyectos_servicio CASCADE;
DROP TABLE IF EXISTS public.transacciones CASCADE;
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

-- 3. RECREACIÓN DE TABLAS OPTIMIZADAS

-- 3.1 LICENCIAS
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

-- 3.2 TRANSACCIONES
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

-- 3.3 SERVICIOS Y SOUND KITS
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

-- 3.4 PROYECTOS DE SERVICIO
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

-- 3.5 TABLAS AUXILIARES
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
    user_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'pendiente',
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.favoritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(usuario_id, beat_id)
);

CREATE TABLE public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. VISTA DE BÚSQUEDA (ACTUALIZADA)
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

-- 5. HABILITAR RLS Y POLÍTICAS BÁSICAS
ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listas_reproduccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quejas_y_sugerencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5.1 Políticas de Ejemplo (Propietario puede ver/editar)
-- Nota: En un entorno real se deberían definir políticas detalladas para cada tabla.
-- Aquí habilitamos acceso básico para que el sistema funcione.

CREATE POLICY "Control total licencias propio" ON public.licencias FOR ALL USING (auth.uid() = productor_id);
CREATE POLICY "Lectura pública licencias" ON public.licencias FOR SELECT USING (true);

CREATE POLICY "Compradores ven sus transacciones" ON public.transacciones FOR SELECT USING (auth.uid() = comprador_id);
CREATE POLICY "Vendedores ven sus ventas" ON public.transacciones FOR SELECT USING (auth.uid() = vendedor_id);

CREATE POLICY "Control total services" ON public.services FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Lectura pública services" ON public.services FOR SELECT USING (true);

CREATE POLICY "Control total sound_kits" ON public.sound_kits FOR ALL USING (auth.uid() = producer_id);
CREATE POLICY "Lectura pública sound_kits" ON public.sound_kits FOR SELECT USING (true);

CREATE POLICY "Participantes ven sus proyectos" ON public.proyectos_servicio FOR SELECT USING (auth.uid() = comprador_id OR auth.uid() = productor_id);

CREATE POLICY "Inserción pública quejas" ON public.quejas_y_sugerencias FOR INSERT WITH CHECK (true);

COMMIT;
