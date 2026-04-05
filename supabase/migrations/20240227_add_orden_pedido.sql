-- Migración para añadir la columna orden_pedido a la tabla transacciones
-- Esto permitirá tener IDs de pedido amigables (ej: BT-270226-C3D4)

ALTER TABLE public.transacciones 
ADD COLUMN IF NOT EXISTS orden_pedido TEXT;

-- Crear un índice para búsquedas rápidas por este nuevo ID
CREATE INDEX IF NOT EXISTS idx_transacciones_orden_pedido ON public.transacciones(orden_pedido);

-- Opcional: Si quieres que las transacciones anteriores tengan un ID amigable, 
-- podrías hacer un script de actualización, pero por ahora los nuevos registros lo tendrán.
