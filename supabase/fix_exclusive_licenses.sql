-- [TIANGUIS BEATS] FIX DE LICENCIAS INCORRECTAS
-- Este script busca transacciones que quedaron marcadas como 'basica' 
-- pero que en realidad son Exclusivas, Pro o Premium segun el nombre del producto.

-- 1. Corregir segun etiquetas en el nombre [Etiqueta]
UPDATE transacciones
SET tipo_licencia = CASE 
    WHEN nombre_producto ILIKE '%[Exclusiva]%' THEN 'exclusiva'
    WHEN nombre_producto ILIKE '%[Exclusive]%' THEN 'exclusiva'
    WHEN nombre_producto ILIKE '%[Pro]%' THEN 'pro'
    WHEN nombre_producto ILIKE '%[Premium]%' THEN 'premium'
    WHEN nombre_producto ILIKE '%[Ilimitada]%' THEN 'ilimitada'
    WHEN nombre_producto ILIKE '%[Unlimited]%' THEN 'ilimitada'
    ELSE tipo_licencia
END
WHERE tipo_licencia = 'basica'
  AND (
    nombre_producto ILIKE '%[Exclusiva]%' OR 
    nombre_producto ILIKE '%[Exclusive]%' OR 
    nombre_producto ILIKE '%[Pro]%' OR 
    nombre_producto ILIKE '%[Premium]%' OR 
    nombre_producto ILIKE '%[Ilimitada]%' OR 
    nombre_producto ILIKE '%[Unlimited]%'
  );

-- 2. Corregir segun precio (Safeguard)
-- Si un beat costo mas de 2500 y dice basica, casi seguro era Exclusiva.
UPDATE transacciones
SET tipo_licencia = 'exclusiva'
WHERE tipo_licencia = 'basica'
  AND precio_total >= 2500
  AND tipo_producto = 'beat';

-- 3. Verificar cambios
SELECT id, nombre_producto, tipo_licencia, precio_total 
FROM transacciones 
WHERE fecha_creacion > NOW() - INTERVAL '7 days'
ORDER BY fecha_creacion DESC;
