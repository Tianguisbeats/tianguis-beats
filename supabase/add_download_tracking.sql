-- Agregar columnas de rastreo de descargas a la tabla de transacciones (EN ESPAÑOL)
ALTER TABLE public.transacciones
ADD COLUMN IF NOT EXISTS conteo_descargas INT4 DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_descarga_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ip_descarga TEXT;

-- Función para incrementar el conteo de descargas de forma atómica (EN ESPAÑOL)
CREATE OR REPLACE FUNCTION incrementar_conteo_descargas(t_id UUID, t_ip TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.transacciones
    SET 
        conteo_descargas = COALESCE(conteo_descargas, 0) + 1,
        ultima_descarga_at = NOW(),
        ip_descarga = t_ip
    WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios detallados
COMMENT ON COLUMN public.transacciones.conteo_descargas IS 'Número total de veces que el usuario ha descargado los archivos de esta compra';
COMMENT ON COLUMN public.transacciones.ultima_descarga_at IS 'Fecha y hora de la última descarga exitosa';
COMMENT ON COLUMN public.transacciones.ip_descarga IS 'Dirección IP desde la que se realizó la última descarga';
