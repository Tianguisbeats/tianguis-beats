-- ==============================================================================
-- 🆔 TIANGUIS BEATS - RETRO-ACTUALIZACIÓN DE IDs DE PEDIDO (Tianguis ID)
-- ==============================================================================
-- Este script actualiza todas las transacciones pasadas que no tienen un
-- ID amigable (orden_pedido) siguiendo el nuevo formato: [PREFIJO]-[FECHA]-[STRIPE4]
-- 
-- Prefijos:
-- Beat: BT | Sound Kit: SK | Servicio: SP | Plan: SU | Varios: MX
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    v_prefix TEXT;
    v_date TEXT;
    v_suffix TEXT;
    v_final_id TEXT;
BEGIN
    FOR r IN (
        SELECT id, pago_id, tipo_producto, fecha_creacion 
        FROM public.transacciones 
        WHERE orden_pedido IS NULL 
           OR orden_pedido NOT LIKE '%-%-%' -- Re-procesar si no tiene el formato correcto
    ) LOOP
        -- 1. Determinar Prefijo
        CASE LOWER(r.tipo_producto)
            WHEN 'beat' THEN v_prefix := 'BT';
            WHEN 'sound_kit', 'soundkit', 'kit_sonido' THEN v_prefix := 'SK';
            WHEN 'service', 'servicio' THEN v_prefix := 'SP';
            WHEN 'plan', 'subscription', 'suscripcion' THEN v_prefix := 'SU';
            ELSE v_prefix := 'MX';
        END CASE;
        
        -- 2. Formatear Fecha (DDMMYY)
        v_date := to_char(r.fecha_creacion, 'DDMMYY');
        
        -- 3. Obtener Sufijo (Últimos 4 de Stripe ID)
        -- Si no hay pago_id (raro), usamos los últimos 4 del ID de tabla
        IF r.pago_id IS NOT NULL AND length(r.pago_id) >= 4 THEN
            v_suffix := UPPER(RIGHT(r.pago_id, 4));
        ELSE
            v_suffix := UPPER(RIGHT(r.id::text, 4));
        END IF;
        
        v_final_id := v_prefix || '-' || v_date || '-' || v_suffix;
        
        -- 4. Actualizar registro
        UPDATE public.transacciones 
        SET orden_pedido = v_final_id 
        WHERE id = r.id;
        
        -- Opcional: Log en consola de postgres
        -- RAISE NOTICE 'Actualizado ID: % para transaccion %', v_final_id, r.id;
    END LOOP;
END $$;
