-- TIANGUIS BEATS - DATA PURGE V5.16
-- Ejecuta esto si quieres borrar todos los beats y datos antiguos para empezar de cero.

-- 1. Borrar registros de interacción
TRUNCATE TABLE follows CASCADE;
TRUNCATE TABLE notifications CASCADE;
-- TRUNCATE TABLE messages CASCADE; -- Descomenta si quieres borrar chats

-- 2. Borrar todos los Beats
TRUNCATE TABLE beats CASCADE;

-- 3. Limpiar URLs de perfiles (opcional, para forzar nuevas subidas)
UPDATE profiles SET 
    avatar_url = NULL, 
    cover_url = NULL, 
    bio = NULL, 
    artistic_name = NULL, 
    country = NULL,
    is_verified = false,
    is_founder = false;

-- 4. Verificación Especial para Sondemaik (Ejecutar después de crear el usuario)
-- UPDATE profiles SET is_verified = true, is_founder = true, subscription_tier = 'premium' WHERE username = 'sondemaik';
