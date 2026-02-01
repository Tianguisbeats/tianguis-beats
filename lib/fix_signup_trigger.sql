-- TIANGUIS BEATS - FIX SIGNUP TRIGGER (REFINED)
-- Actualización del disparador para capturar todos los metadatos del registro de forma segura.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    found_count INTEGER;
BEGIN
    -- Contar perfiles para determinar estatus de Founder (primeros 100)
    SELECT count(*) INTO found_count FROM public.profiles;
    
    INSERT INTO public.profiles (
        id, 
        username, 
        artistic_name, 
        full_name,
        email, 
        birth_date,
        role,
        is_founder
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'artistic_name', NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::DATE,
        COALESCE(NEW.raw_user_meta_data->>'role', 'producer'),
        (found_count < 100)
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Loguear el error y continuar para no bloquear la creación del usuario en Auth
        -- El perfil podría tener que crearse manualmente o en el primer login
        RAISE WARNING 'Error en handle_new_user para ID %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
