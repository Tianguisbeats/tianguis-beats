-- ==============================================================================
-- BASE_DATOS v6.0: GESTIÓN DE VENCIMIENTO DE SUSCRIPCIONES
-- Fecha: 2026-01-30
-- Instrucciones: Ejecutar SÓLO este script si ya tienes la v5.24 instalada.
-- ==============================================================================

-- 1. AGREGAR FECHA DE VENCIMIENTO
-- Esta columna permite gestionar downgrades sin cortar el servicio inmediatamente.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- 2. NOTA PARA EL DESARROLLADOR
-- El Frontend (Pricing Page) ya está configurado para leer esta fecha.
-- Si subscription_end_date es NULL, se asume que la suscripción está activa indefinidamente o es mensual recurrente estandar.
