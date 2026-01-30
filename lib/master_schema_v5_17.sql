-- ==============================================================================
-- v5.24 MASTER SCHEMA: 4 CONTADORES (Total/Free/Pro/Prem) + FECHA_CREACION
-- Lógica 'Musical Chairs' y Sistema Founder Exclusivo
-- ==============================================================================

-- 0. LIMPIEZA PREVIA (Borrar triggers/funciones antiguas para evitar conflictos)
DROP TRIGGER IF EXISTS check_founder_on_insert ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
DROP TRIGGER IF EXISTS on_tier_change_before ON public.profiles;
DROP TRIGGER IF EXISTS on_tier_change_after ON public.profiles;
DROP TRIGGER IF EXISTS on_chairs_assignment ON public.profiles;
DROP TRIGGER IF EXISTS on_chairs_resequence ON public.profiles;

DROP FUNCTION IF EXISTS public.auto_founder_check();
DROP FUNCTION IF EXISTS public.resequence_users_after_delete();
DROP FUNCTION IF EXISTS public.manage_tier_identity();
DROP FUNCTION IF EXISTS public.resequence_tiers_after();
DROP FUNCTION IF EXISTS public.assign_musical_chairs();
DROP FUNCTION IF EXISTS public.resequence_musical_chairs();

-- 1. ESTRUCTURA DE TABLA (Actualización de Columnas)

-- A) Renombrar user_num -> user_num_total (Si existe)
-- Esto preserva el ID histórico como el ID Global Total
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_num') THEN
     ALTER TABLE public.profiles RENAME COLUMN user_num TO user_num_total;
  ELSE
     ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_num_total INTEGER;
  END IF;
END $$;

-- B) Crear contadores por Tier y Fecha de Creación
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_num_free INTEGER,
ADD COLUMN IF NOT EXISTS user_num_pro INTEGER,
ADD COLUMN IF NOT EXISTS user_num_prem INTEGER,
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- C) Asegurar que fecha_creacion tenga datos históricos (Copia de created_at si existe)
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
       UPDATE public.profiles SET fecha_creacion = created_at WHERE fecha_creacion IS NULL OR fecha_creacion = created_at;
    END IF;
END $$;


-- 2. TRIGGER 1: ASIGNACIÓN DE "SILLAS" (BEFORE INSERT/UPDATE)
-- Asigna números consecutivos al entrar a una fila (Total y Tier)
CREATE OR REPLACE FUNCTION public.assign_musical_chairs()
RETURNS TRIGGER AS $$
BEGIN
  -- A) NUEVO USUARIO (INSERT)
  IF (TG_OP = 'INSERT') THEN
     -- 1. Asignar Global Total
     SELECT COALESCE(MAX(user_num_total), 0) + 1 INTO NEW.user_num_total FROM public.profiles;
     
     -- 2. Asignar fecha_creacion (Safety check)
     IF NEW.fecha_creacion IS NULL THEN
        NEW.fecha_creacion := now();
     END IF;

     -- 3. Asignar Asiento según Tier
     IF NEW.subscription_tier = 'free' OR NEW.subscription_tier IS NULL THEN
        SELECT COALESCE(MAX(user_num_free), 0) + 1 INTO NEW.user_num_free FROM public.profiles;
     ELSIF NEW.subscription_tier = 'pro' THEN
        SELECT COALESCE(MAX(user_num_pro), 0) + 1 INTO NEW.user_num_pro FROM public.profiles;
     ELSIF NEW.subscription_tier = 'premium' THEN
        SELECT COALESCE(MAX(user_num_prem), 0) + 1 INTO NEW.user_num_prem FROM public.profiles;
     END IF;
  
  -- B) CAMBIO DE TIER (UPDATE)
  ELSIF (TG_OP = 'UPDATE' AND NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier) THEN
     -- 1. Asignar NUEVO asiento al final de la fila DESTINO
     IF NEW.subscription_tier = 'free' THEN
        SELECT COALESCE(MAX(user_num_free), 0) + 1 INTO NEW.user_num_free FROM public.profiles;
        NEW.user_num_pro := NULL; 
        NEW.user_num_prem := NULL;
     ELSIF NEW.subscription_tier = 'pro' THEN
        SELECT COALESCE(MAX(user_num_pro), 0) + 1 INTO NEW.user_num_pro FROM public.profiles;
        NEW.user_num_free := NULL;
        NEW.user_num_prem := NULL;
     ELSIF NEW.subscription_tier = 'premium' THEN
        SELECT COALESCE(MAX(user_num_prem), 0) + 1 INTO NEW.user_num_prem FROM public.profiles;
        NEW.user_num_free := NULL;
        NEW.user_num_pro := NULL;
     END IF;
  END IF;

  -- 4. EVALUAR FOUNDER IMPLÍCITO (Solo Pro/Prem primeros 100)
  NEW.is_founder := (
     (COALESCE(NEW.user_num_pro, 999) <= 100) OR 
     (COALESCE(NEW.user_num_prem, 999) <= 100)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chairs_assignment
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_musical_chairs();


-- 3. TRIGGER 2: RE-SECUENCIA "SILLAS MUSICALES" (AFTER DELETE/UPDATE)
-- Cierra los huecos cuando alguien se va de una fila
CREATE OR REPLACE FUNCTION public.resequence_musical_chairs()
RETURNS TRIGGER AS $$
DECLARE
  v_old_tier TEXT;
  v_old_free INT;
  v_old_pro INT;
  v_old_prem INT;
  v_old_total INT;
BEGIN
  -- Obtener valores viejos
  IF (TG_OP = 'DELETE') THEN
     v_old_tier := OLD.subscription_tier;
     v_old_free := OLD.user_num_free;
     v_old_pro := OLD.user_num_pro;
     v_old_prem := OLD.user_num_prem;
     v_old_total := OLD.user_num_total;
  ELSE -- UPDATE
     v_old_tier := OLD.subscription_tier;
     v_old_free := OLD.user_num_free;
     v_old_pro := OLD.user_num_pro;
     v_old_prem := OLD.user_num_prem;
     v_old_total := NULL; -- En update no cambia el total global
  END IF;

  -- A) CASO GLOBAL: Si se borra, recorre el total
  IF (TG_OP = 'DELETE') AND v_old_total IS NOT NULL THEN
     UPDATE public.profiles SET user_num_total = user_num_total - 1 WHERE user_num_total > v_old_total;
  END IF;

  -- B) CASO TIERS: Si dejó un hueco (por Delete o cambio de Tier)
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) THEN
     
     -- Hueco en FREE
     IF v_old_tier = 'free' AND v_old_free IS NOT NULL THEN
        UPDATE public.profiles SET user_num_free = user_num_free - 1 WHERE user_num_free > v_old_free;
     END IF;

     -- Hueco en PRO
     IF v_old_tier = 'pro' AND v_old_pro IS NOT NULL THEN
        UPDATE public.profiles SET user_num_pro = user_num_pro - 1 WHERE user_num_pro > v_old_pro;
        -- Checar nuevo Founder (el que cayó al puesto 100)
        UPDATE public.profiles SET is_founder = true WHERE user_num_pro = 100 AND subscription_tier = 'pro';
     END IF;

     -- Hueco en PREMIUM
     IF v_old_tier = 'premium' AND v_old_prem IS NOT NULL THEN
        UPDATE public.profiles SET user_num_prem = user_num_prem - 1 WHERE user_num_prem > v_old_prem;
        -- Checar nuevo Founder
        UPDATE public.profiles SET is_founder = true WHERE user_num_prem = 100 AND subscription_tier = 'premium';
     END IF;

  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chairs_resequence
  AFTER DELETE OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.resequence_musical_chairs();


-- 4. CONTROL DE AUTH (Usuarios Nuevos de Supabase)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, artistic_name, full_name, fecha_creacion)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'artistic_name', 'Artista Nuevo'),
    new.raw_user_meta_data->>'full_name',
    now() -- fecha_creacion
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Nota: El trigger 'on_auth_user_created' ya suele existir en Supabase, asegúrate de que use esta función.


-- 5. MIGRACIÓN DE DATOS (RE-CÁLCULO TOTAL)
-- Ejecutar esto reinicializa todos los contadores basándose en fecha_creacion
DO $$
DECLARE
  r RECORD;
  c_total INT := 0;
  c_free INT := 0;
  c_pro INT := 0;
  c_prem INT := 0;
BEGIN
  -- Recorrer TODOS los usuarios ordenados por fecha_creacion
  FOR r IN SELECT id, subscription_tier FROM public.profiles ORDER BY fecha_creacion ASC, id ASC
  LOOP
    -- 1. Asignar Total
    c_total := c_total + 1;
    UPDATE public.profiles SET user_num_total = c_total WHERE id = r.id;

    -- 2. Asignar Tier
    IF r.subscription_tier = 'free' OR r.subscription_tier IS NULL THEN
        c_free := c_free + 1;
        UPDATE public.profiles SET user_num_free = c_free, user_num_pro = NULL, user_num_prem = NULL WHERE id = r.id;
    
    ELSIF r.subscription_tier = 'pro' THEN
        c_pro := c_pro + 1;
        UPDATE public.profiles SET user_num_pro = c_pro, user_num_free = NULL, user_num_prem = NULL WHERE id = r.id;
    
    ELSIF r.subscription_tier = 'premium' THEN
        c_prem := c_prem + 1;
        UPDATE public.profiles SET user_num_prem = c_prem, user_num_free = NULL, user_num_pro = NULL WHERE id = r.id;
    END IF;
  END LOOP;
  
  -- 3. Recalcular Founders Final
  UPDATE public.profiles
  SET is_founder = (
     (COALESCE(user_num_pro, 999) <= 100) OR 
     (COALESCE(user_num_prem, 999) <= 100)
  );
END $$;
