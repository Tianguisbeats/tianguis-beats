-- [TIANGUIS BEATS] ALINEACIÓN DE ESQUEMA DE LICENCIAS Y LÓGICA DE VENTA
-- 1. Añadir columnas para Licencia Gratis
ALTER TABLE public.beats 
ADD COLUMN IF NOT EXISTS es_gratis_activa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS precio_gratis_mxn INTEGER DEFAULT 0;

-- 2. Asegurar que existe esta_vendido (por si acaso no se ejecutó en resets previos)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'esta_vendido') THEN
        ALTER TABLE public.beats ADD COLUMN esta_vendido BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Migración Inicial de Datos
-- Actualmente es_basica_activa se usa para "Gratis" en el código.
-- Pasamos ese valor a es_gratis_activa.
UPDATE public.beats 
SET es_gratis_activa = es_basica_activa
WHERE es_gratis_activa IS FALSE;

-- 4. Actualizar Vista de Búsqueda para incluir las nuevas columnas
DROP VIEW IF EXISTS public.beats_busqueda CASCADE;

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
WHERE b.es_publico = true AND b.esta_vendido = false;

-- 5. Comentarios de documentación
COMMENT ON COLUMN public.beats.es_gratis_activa IS 'Indica si la licencia Gratis está activa';
COMMENT ON COLUMN public.beats.precio_gratis_mxn IS 'Precio de la licencia Gratis (siempre 0)';

-- 5. Mejoras en la tabla TRANSACCIONES para mejor ligación y claridad
DO $$ 
BEGIN
    -- Asegurar columnas de auditoría y pedido
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transacciones' AND COLUMN_NAME = 'orden_pedido') THEN
        ALTER TABLE public.transacciones ADD COLUMN orden_pedido TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transacciones' AND COLUMN_NAME = 'codigo_cupon') THEN
        ALTER TABLE public.transacciones ADD COLUMN codigo_cupon TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transacciones' AND COLUMN_NAME = 'monto_descuento') THEN
        ALTER TABLE public.transacciones ADD COLUMN monto_descuento NUMERIC DEFAULT 0;
    END IF;

    -- URL directa al contrato PDF para no depender de metadatos JSON
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transacciones' AND COLUMN_NAME = 'contract_url') THEN
        ALTER TABLE public.transacciones ADD COLUMN contract_url TEXT;
    END IF;

    -- UUID de producto para ligación real con las tablas beats, kits_sonido y servicios
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transacciones' AND COLUMN_NAME = 'producto_uuid') THEN
        ALTER TABLE public.transacciones ADD COLUMN producto_uuid UUID;
        
        -- Intentar poblar producto_uuid desde producto_id (BEATS)
        UPDATE public.transacciones SET producto_uuid = producto_id::uuid 
        WHERE tipo_producto = 'beat' 
        AND producto_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

        -- Intentar poblar producto_uuid desde producto_id (SOUND KITS)
        UPDATE public.transacciones SET producto_uuid = producto_id::uuid 
        WHERE (tipo_producto = 'sound_kit' OR tipo_producto = 'kit') 
        AND producto_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

        -- Intentar poblar producto_uuid desde producto_id (SERVICIOS)
        UPDATE public.transacciones SET producto_uuid = producto_id::uuid 
        WHERE tipo_producto = 'service' 
        AND producto_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    END IF;
END $$;

-- Índices para mejorar el performance de búsqueda en transacciones
CREATE INDEX IF NOT EXISTS idx_transacciones_producto_uuid ON public.transacciones(producto_uuid);
CREATE INDEX IF NOT EXISTS idx_transacciones_comprador_id ON public.transacciones(comprador_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_vendedor_id ON public.transacciones(vendedor_id);
COMMENT ON COLUMN public.beats.esta_vendido IS 'Indica si el beat ya fue vendido como Exclusivo';

-- 6. Limpieza y Renombramiento de Columnas en BEATS
-- Primero eliminamos la vista dependiente para evitar errores de dependencia
DROP VIEW IF EXISTS public.beats_busqueda CASCADE;

DO $$ 
BEGIN
    -- Renombrar precio_mp3_mxn a precio_basica_mxn
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'beats' AND COLUMN_NAME = 'precio_mp3_mxn') THEN
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'beats' AND COLUMN_NAME = 'precio_basica_mxn') THEN
            ALTER TABLE public.beats RENAME COLUMN precio_mp3_mxn TO precio_basica_mxn;
        END IF;
    END IF;

    -- Eliminar columnas obsoletas
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'beats' AND COLUMN_NAME = 'precio_basico_mxn') THEN
        ALTER TABLE public.beats DROP COLUMN precio_basico_mxn;
    END IF;

    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'beats' AND COLUMN_NAME = 'precio_ilimitado_mxn') THEN
        ALTER TABLE public.beats DROP COLUMN precio_ilimitado_mxn;
    END IF;

    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'beats' AND COLUMN_NAME = 'es_ilimitada_activa') THEN
        ALTER TABLE public.beats DROP COLUMN es_ilimitada_activa;
    END IF;
END $$;

-- 7. Trigger para incrementar conteo_ventas en la tabla BEATS
CREATE OR REPLACE FUNCTION public.incrementar_conteo_ventas_beat()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.tipo_producto = 'beat' AND NEW.estado_pago = 'completado') THEN
        UPDATE public.beats 
        SET conteo_ventas = conteo_ventas + 1 
        WHERE id = NEW.producto_uuid;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_incrementar_ventas_beat ON public.transacciones;
CREATE TRIGGER tr_incrementar_ventas_beat
AFTER INSERT ON public.transacciones
FOR EACH ROW EXECUTE FUNCTION public.incrementar_conteo_ventas_beat();

-- Re-crear vista de búsqueda con los nuevos nombres
DROP VIEW IF EXISTS public.beats_busqueda CASCADE;
CREATE VIEW public.beats_busqueda AS
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
WHERE b.es_publico = true AND b.esta_vendido = false;
