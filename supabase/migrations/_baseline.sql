--
-- PostgreSQL database dump
--

\restrict PIXwplO4W4ba71pQ0u7hgfKsU7I5bdsDypoQ07H02XVchdMUdrXkoibRuo45MDX

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: actualizar_fecha_mutacion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_fecha_mutacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$;


--
-- Name: actualizar_timestamp_licencias(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_timestamp_licencias() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$;


--
-- Name: actualizar_timestamp_licencias_final(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_timestamp_licencias_final() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$;


--
-- Name: alternar_like_comentario(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.alternar_like_comentario(p_comentario_id uuid) RETURNS TABLE(likes_count integer, dio_like boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_usuario_id  UUID := auth.uid();
    v_existe      BOOLEAN;
    v_nuevo_count INT;
    v_dio_like    BOOLEAN;
BEGIN
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para dar like';
    END IF;

    -- Verificar que el comentario exista (también previene leak de IDs por error)
    IF NOT EXISTS (SELECT 1 FROM public.comentarios WHERE id = p_comentario_id) THEN
        RAISE EXCEPTION 'El comentario no existe';
    END IF;

    -- ¿Ya tiene like del usuario?
    SELECT EXISTS(
        SELECT 1 FROM public.likes_comentarios
        WHERE comentario_id = p_comentario_id
          AND usuario_id    = v_usuario_id
    ) INTO v_existe;

    IF v_existe THEN
        DELETE FROM public.likes_comentarios
        WHERE comentario_id = p_comentario_id
          AND usuario_id    = v_usuario_id;
        v_dio_like := false;
    ELSE
        INSERT INTO public.likes_comentarios(comentario_id, usuario_id)
        VALUES (p_comentario_id, v_usuario_id);
        v_dio_like := true;
    END IF;

    -- Recomputar contador real (fuente de verdad)
    SELECT COUNT(*)::INT INTO v_nuevo_count
    FROM public.likes_comentarios
    WHERE comentario_id = p_comentario_id;

    -- Sincronizar el cache desnormalizado en la tabla comentarios.
    -- Este UPDATE bypassa la policy "Autor puede editar su comentario"
    -- porque la función corre como SECURITY DEFINER (rol del owner).
    UPDATE public.comentarios
    SET likes_count = v_nuevo_count
    WHERE id = p_comentario_id;

    RETURN QUERY SELECT v_nuevo_count, v_dio_like;
END;
$$;


--
-- Name: crear_bucket(text, boolean, bigint, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_bucket(bucket_id text, is_public boolean, file_size_limit bigint, allowed_mime_types text[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (bucket_id, bucket_id, is_public, file_size_limit, allowed_mime_types)
    ON CONFLICT (id) DO UPDATE SET 
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
END;
$$;


--
-- Name: crear_bucket_seguro(text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_bucket_seguro(p_bucket_id text, is_public boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES (p_bucket_id, p_bucket_id, is_public)
    ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
END;
$$;


--
-- Name: crear_perfil_nuevo_usuario(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_perfil_nuevo_usuario() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    username_val TEXT;
    nombre_art_val TEXT;
    nombre_comp_val TEXT;
BEGIN
    -- Captura inteligente de datos desde el registro
    username_val := COALESCE(new.raw_user_meta_data->>'nombre_usuario', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
    nombre_art_val := COALESCE(new.raw_user_meta_data->>'nombre_artistico', new.raw_user_meta_data->>'artistic_name', username_val);
    nombre_comp_val := COALESCE(new.raw_user_meta_data->>'nombre_completo', new.raw_user_meta_data->>'full_name', '');

    INSERT INTO public.perfiles (id, nombre_usuario, nombre_artistico, nombre_completo, fecha_nacimiento, correo, fecha_creacion, nivel_suscripcion, esta_completado, esta_verificado)
    VALUES (
        new.id, username_val, nombre_art_val, nombre_comp_val,
        (NULLIF(new.raw_user_meta_data->>'fecha_nacimiento', ''))::DATE,
        new.email, now(), 'free', true, false
    )
    ON CONFLICT (id) DO UPDATE SET 
        nombre_usuario = EXCLUDED.nombre_usuario,
        nombre_artistico = EXCLUDED.nombre_artistico,
        nombre_completo = EXCLUDED.nombre_completo,
        correo = EXCLUDED.correo,
        esta_completado = true;
    RETURN new;
END;
$$;


--
-- Name: fn_activar_membresia_desde_transaccion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_activar_membresia_desde_transaccion() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_nivel TEXT;
BEGIN
    -- Si se detecta un plan pagado, activar el perfil automáticamente
    IF (NEW.tipo_producto = 'plan' AND NEW.estado_pago = 'completado') THEN
        v_nivel := CASE WHEN (NEW.tipo_licencia = 'premium' OR NEW.producto_id ILIKE '%premium%') THEN 'premium' ELSE 'pro' END;
        
        UPDATE public.perfiles SET 
            nivel_suscripcion = v_nivel,
            fecha_termino_suscripcion = COALESCE(NEW.fecha_creacion, NOW()) + (COALESCE((NEW.metadatos->>'meses_duracion')::INTEGER, 1) || ' months')::INTERVAL + '2 days'::INTERVAL,
            fecha_inicio_suscripcion = COALESCE(NEW.fecha_creacion, NOW()),
            es_prueba = COALESCE((NEW.metadatos->>'es_prueba')::BOOLEAN, false)
        WHERE id = NEW.comprador_id;

        PERFORM public.manejar_upgrade_produccion(NEW.comprador_id);
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: handle_coupon_upsert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_coupon_upsert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.codigo := UPPER(TRIM(NEW.codigo));
    RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$;


--
-- Name: incrementar_balance_productor(uuid, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.incrementar_balance_productor(id_productor uuid, monto_ganancia numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.perfiles SET balance_pendiente = COALESCE(balance_pendiente, 0) + monto_ganancia WHERE id = id_productor;
END;
$$;


--
-- Name: incrementar_conteo_descargas(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.incrementar_conteo_descargas(t_id uuid, t_ip text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.transacciones
    SET 
        conteo_descargas = COALESCE(conteo_descargas, 0) + 1,
        ultima_descarga_at = NOW(),
        ip_descarga = t_ip
    WHERE id = t_id;
END;
$$;


--
-- Name: incrementar_conteo_ventas_beat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.incrementar_conteo_ventas_beat() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF (NEW.tipo_producto = 'beat' AND NEW.estado_pago = 'completado') THEN
        UPDATE public.beats 
        SET conteo_ventas = conteo_ventas + 1 
        WHERE id = NEW.producto_uuid;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: incrementar_reproduccion(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.incrementar_reproduccion(id_beat uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.beats SET conteo_reproducciones = COALESCE(conteo_reproducciones, 0) + 1 WHERE id = id_beat;
END;
$$;


--
-- Name: incrementar_uso_cupon(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.incrementar_uso_cupon(id_cupon uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.cupones SET usos_actuales = COALESCE(usos_actuales, 0) + 1 WHERE id = id_cupon;
END;
$$;


--
-- Name: limpiar_politicas_bucket(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.limpiar_politicas_bucket(target_bucket_id text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Select_' || target_bucket_id || '" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "All_' || target_bucket_id || '" ON storage.objects';
END;
$$;


--
-- Name: manejar_downgrade_produccion(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.manejar_downgrade_produccion(p_usuario_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_beat_count INTEGER;
BEGIN
    -- A. Desactivar todos los Sound Kits y Servicios (Son funciones Premium)
    UPDATE public.kits_sonido 
    SET esta_desactivado_por_plan = true,
        es_publico = false
    WHERE productor_id = p_usuario_id;
    
    UPDATE public.servicios 
    SET esta_desactivado_por_plan = true,
        es_activo = false
    WHERE productor_id = p_usuario_id;

    -- B. Manejar límite de Beats (Límite Free = 5)
    SELECT count(*) INTO v_beat_count FROM public.beats WHERE productor_id = p_usuario_id;
    
    IF v_beat_count > 5 THEN
        -- Desactivar los beats más antiguos que excedan el límite de 5
        UPDATE public.beats SET esta_desactivado_por_plan = false WHERE productor_id = p_usuario_id;
        
        UPDATE public.beats
        SET esta_desactivado_por_plan = true,
            es_publico = false
        WHERE id IN (
            SELECT id FROM public.beats 
            WHERE productor_id = p_usuario_id
            ORDER BY fecha_creacion ASC 
            OFFSET 5
        );
    ELSE
        UPDATE public.beats SET esta_desactivado_por_plan = false WHERE productor_id = p_usuario_id;
    END IF;

END;
$$;


--
-- Name: manejar_escalera_perfiles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.manejar_escalera_perfiles() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- 1. NUEVO USUARIO (INSERT)
  IF (TG_OP = 'INSERT') THEN
     SELECT COALESCE(MAX(user_num_total), 0) + 1 INTO NEW.user_num_total FROM public.perfiles;
     
     IF NEW.nivel_suscripcion = 'free' OR NEW.nivel_suscripcion IS NULL THEN
        SELECT COALESCE(MAX(user_num_free), 0) + 1 INTO NEW.user_num_free FROM public.perfiles;
     ELSIF NEW.nivel_suscripcion = 'pro' THEN
        SELECT COALESCE(MAX(user_num_pro), 0) + 1 INTO NEW.user_num_pro FROM public.perfiles;
     ELSIF NEW.nivel_suscripcion = 'premium' THEN
        SELECT COALESCE(MAX(user_num_prem), 0) + 1 INTO NEW.user_num_prem FROM public.perfiles;
     END IF;
  
  -- 2. CAMBIO DE NIVEL (UPDATE)
  ELSIF (TG_OP = 'UPDATE' AND NEW.nivel_suscripcion IS DISTINCT FROM OLD.nivel_suscripcion) THEN
     -- Lógica de RECORRIDO (Sliding Window) para el nivel ANTERIOR
     IF OLD.nivel_suscripcion = 'free' OR OLD.nivel_suscripcion IS NULL THEN
        UPDATE public.perfiles SET user_num_free = user_num_free - 1 WHERE user_num_free > OLD.user_num_free;
     ELSIF OLD.nivel_suscripcion = 'pro' THEN
        UPDATE public.perfiles SET user_num_pro = user_num_pro - 1 WHERE user_num_pro > OLD.user_num_pro;
     ELSIF OLD.nivel_suscripcion = 'premium' THEN
        UPDATE public.perfiles SET user_num_prem = user_num_prem - 1 WHERE user_num_prem > OLD.user_num_prem;
     END IF;

     -- Asignar nuevo número en el nivel ACTUAL
     IF NEW.nivel_suscripcion = 'free' THEN
        SELECT COALESCE(MAX(user_num_free), 0) + 1 INTO NEW.user_num_free FROM public.perfiles;
        NEW.user_num_pro := NULL; 
        NEW.user_num_prem := NULL;
     ELSIF NEW.nivel_suscripcion = 'pro' THEN
        SELECT COALESCE(MAX(user_num_pro), 0) + 1 INTO NEW.user_num_pro FROM public.perfiles;
        NEW.user_num_free := NULL;
        NEW.user_num_prem := NULL;
     ELSIF NEW.nivel_suscripcion = 'premium' THEN
        SELECT COALESCE(MAX(user_num_prem), 0) + 1 INTO NEW.user_num_prem FROM public.perfiles;
        NEW.user_num_free := NULL;
        NEW.user_num_pro := NULL;
     END IF;
  END IF;

  -- 3. EVALUACIÓN DE FUNDADOR (Primeros 100 de Pro o Premium)
  -- El estatus se actualiza automáticamente al re-ordenar (trigger BEFORE UPDATE)
  IF NEW.nivel_suscripcion = 'free' THEN
     NEW.es_fundador := false;
  ELSE
     NEW.es_fundador := (
        (COALESCE(NEW.user_num_pro, 999) <= 100) OR 
        (COALESCE(NEW.user_num_prem, 999) <= 100)
     );
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: manejar_upgrade_produccion(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.manejar_upgrade_produccion(p_usuario_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.beats SET esta_desactivado_por_plan = false WHERE productor_id = p_usuario_id;
    UPDATE public.kits_sonido SET esta_desactivado_por_plan = false WHERE productor_id = p_usuario_id;
    UPDATE public.servicios SET esta_desactivado_por_plan = false WHERE productor_id = p_usuario_id;
END;
$$;


--
-- Name: recomputar_likes_count_comentario(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recomputar_likes_count_comentario() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_target_id UUID;
BEGIN
    v_target_id := COALESCE(NEW.comentario_id, OLD.comentario_id);

    UPDATE public.comentarios
    SET likes_count = (
        SELECT COUNT(*) FROM public.likes_comentarios WHERE comentario_id = v_target_id
    )
    WHERE id = v_target_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: sincronizar_conteo_likes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sincronizar_conteo_likes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.beats SET conteo_likes = COALESCE(conteo_likes, 0) + 1 WHERE id = NEW.beat_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.beats SET conteo_likes = GREATEST(COALESCE(conteo_likes, 0) - 1, 0) WHERE id = OLD.beat_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: soy_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.soy_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND es_admin = true);
END;
$$;


--
-- Name: update_oferta_exclusiva_ts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_oferta_exclusiva_ts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$                                                            
  BEGIN                                                                                             
      NEW.fecha_actualizacion = NOW();                                                              
      RETURN NEW;                                                                                   
  END;
  $$;


--
-- Name: validar_beat_antes_insertar(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_beat_antes_insertar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_tier TEXT;
    v_es_admin BOOLEAN;
BEGIN
    -- 0. Si la operación viene del service-role (sin auth.uid()), permitir.
    --    Esto deja pasar las inserciones desde APIs server-side (que ya validan).
    IF v_uid IS NULL THEN
        RETURN NEW;
    END IF;

    -- 1. Anti-spoof: productor_id debe coincidir con el usuario autenticado
    IF NEW.productor_id <> v_uid THEN
        -- Excepción: admins pueden corregir/migrar beats
        SELECT es_admin INTO v_es_admin FROM public.perfiles WHERE id = v_uid;
        IF NOT COALESCE(v_es_admin, false) THEN
            RAISE EXCEPTION 'No puedes crear/editar beats a nombre de otro productor';
        END IF;
    END IF;

    -- 2. Sanidad de precios (no negativos)
    IF COALESCE(NEW.precio_gratis_mxn, 0) < 0
       OR COALESCE(NEW.precio_basica_mxn, 0) < 0
       OR COALESCE(NEW.precio_pro_mxn, 0) < 0
       OR COALESCE(NEW.precio_premium_mxn, 0) < 0
       OR COALESCE(NEW.precio_exclusiva_estandar_mxn, 0) < 0
       OR COALESCE(NEW.precio_exclusiva_premium_mxn, 0) < 0 THEN
        RAISE EXCEPTION 'Los precios no pueden ser negativos';
    END IF;

    -- 3. Tier de suscripción del productor
    SELECT COALESCE(LOWER(nivel_suscripcion), 'free') INTO v_tier
    FROM public.perfiles WHERE id = NEW.productor_id;

    -- Si activa licencias Pro o Premium o Exclusivas, debe ser productor pro/premium.
    -- Free pueden vender solo: gratis, básica.
    IF v_tier = 'free' THEN
        IF COALESCE(NEW.es_pro_activa, false)
           OR COALESCE(NEW.es_premium_activa, false)
           OR COALESCE(NEW.es_exclusiva_estandar_activa, false)
           OR COALESCE(NEW.es_exclusiva_premium_activa, false) THEN
            RAISE EXCEPTION 'Tu plan Free no permite vender licencias Pro, Premium o Exclusivas. Activa Pro o Premium en /pricing.';
        END IF;
    END IF;

    -- Solo Premium puede vender Exclusiva Premium (regla del marketplace)
    IF COALESCE(NEW.es_exclusiva_premium_activa, false) AND v_tier <> 'premium' THEN
        RAISE EXCEPTION 'Solo productores Premium pueden vender la licencia Exclusiva Premium';
    END IF;

    -- 4. Si una licencia paga está activa, su precio debe ser > 0
    IF COALESCE(NEW.es_basica_activa, false) AND COALESCE(NEW.precio_basica_mxn, 0) <= 0 THEN
        RAISE EXCEPTION 'La licencia Básica está activa pero su precio es 0';
    END IF;
    IF COALESCE(NEW.es_pro_activa, false) AND COALESCE(NEW.precio_pro_mxn, 0) <= 0 THEN
        RAISE EXCEPTION 'La licencia Pro está activa pero su precio es 0';
    END IF;
    IF COALESCE(NEW.es_premium_activa, false) AND COALESCE(NEW.precio_premium_mxn, 0) <= 0 THEN
        RAISE EXCEPTION 'La licencia Premium está activa pero su precio es 0';
    END IF;
    IF COALESCE(NEW.es_exclusiva_estandar_activa, false) AND COALESCE(NEW.precio_exclusiva_estandar_mxn, 0) <= 0 THEN
        RAISE EXCEPTION 'La licencia Exclusiva Estándar está activa pero su precio es 0';
    END IF;
    IF COALESCE(NEW.es_exclusiva_premium_activa, false) AND COALESCE(NEW.precio_exclusiva_premium_mxn, 0) <= 0 THEN
        RAISE EXCEPTION 'La licencia Exclusiva Premium está activa pero su precio es 0';
    END IF;

    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analiticas_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analiticas_eventos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    productor_id uuid,
    beat_id uuid,
    tipo_evento text NOT NULL,
    valor_numerico numeric DEFAULT 0,
    metadatos jsonb DEFAULT '{}'::jsonb,
    usuario_id uuid
);


--
-- Name: archivos_proyecto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.archivos_proyecto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proyecto_id uuid,
    subidor_id uuid,
    url_archivo text NOT NULL,
    nombre_archivo text NOT NULL,
    tipo_archivo text NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now()
);


--
-- Name: beats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.beats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    productor_id uuid NOT NULL,
    titulo text NOT NULL,
    genero text,
    subgenero text,
    bpm integer,
    descripcion text,
    vibras text,
    tipos_beat text[],
    artista_referencia text,
    precio_pro_mxn integer DEFAULT 499,
    precio_premium_mxn integer DEFAULT 999,
    es_publico boolean DEFAULT true,
    esta_vendido boolean DEFAULT false,
    portada_url text,
    archivo_mp3_url text,
    archivo_muestra_url text,
    archivo_wav_url text,
    archivo_stems_url text,
    conteo_reproducciones integer DEFAULT 0,
    conteo_ventas integer DEFAULT 0,
    conteo_likes integer DEFAULT 0,
    es_basica_activa boolean DEFAULT true,
    es_pro_activa boolean DEFAULT true,
    es_premium_activa boolean DEFAULT true,
    fecha_creacion timestamp with time zone DEFAULT now(),
    tono_escala text,
    precio_basica_mxn integer DEFAULT 349,
    instrumentos text[] DEFAULT '{}'::text[],
    esta_desactivado_por_plan boolean DEFAULT false,
    esta_archivado boolean DEFAULT false,
    es_visible boolean DEFAULT true,
    es_gratis_activa boolean DEFAULT false,
    precio_gratis_mxn integer DEFAULT 0,
    es_exclusiva_premium_activa boolean DEFAULT false NOT NULL,
    precio_exclusiva_premium_mxn integer DEFAULT 0 NOT NULL,
    es_exclusiva_estandar_activa boolean DEFAULT false NOT NULL,
    precio_exclusiva_estandar_mxn integer DEFAULT 0 NOT NULL
);


--
-- Name: TABLE beats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.beats IS 'Tabla de beats con soporte para 5 tiers de licencias y campos unificados.';


--
-- Name: COLUMN beats.esta_vendido; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.beats.esta_vendido IS 'Indica si el beat ya fue vendido como Exclusivo';


--
-- Name: COLUMN beats.esta_archivado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.beats.esta_archivado IS 'Indica si el beat ha sido retirado por el productor pero se mantiene para compradores';


--
-- Name: COLUMN beats.es_visible; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.beats.es_visible IS 'Indica si el beat debe aparecer en el catálogo público';


--
-- Name: COLUMN beats.es_gratis_activa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.beats.es_gratis_activa IS 'Indica si la licencia Gratis está activa';


--
-- Name: COLUMN beats.precio_gratis_mxn; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.beats.precio_gratis_mxn IS 'Precio de la licencia Gratis (siempre 0)';


--
-- Name: perfiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perfiles (
    id uuid NOT NULL,
    nombre_usuario text NOT NULL,
    nombre_artistico text,
    nombre_completo text,
    foto_perfil text,
    portada_perfil text,
    ajuste_portada integer DEFAULT 50,
    biografia text,
    pais text DEFAULT 'México'::text,
    idioma_preferido text DEFAULT 'es'::text,
    colaboraciones_abiertas boolean DEFAULT false,
    enlaces_sociales jsonb DEFAULT '{}'::jsonb,
    fecha_nacimiento date,
    nivel_suscripcion text DEFAULT 'free'::text,
    es_fundador boolean DEFAULT false,
    esta_verificado boolean DEFAULT false,
    es_admin boolean DEFAULT false,
    estado_verificacion text DEFAULT 'ninguno'::text,
    cambios_nombre_usuario integer DEFAULT 0,
    correo text,
    esta_completado boolean DEFAULT false,
    tema_perfil text DEFAULT 'oscuro'::text,
    color_acento text DEFAULT 'blue'::text,
    video_destacado_url text,
    texto_cta text,
    url_cta text,
    boletin_activo boolean DEFAULT true,
    enlaces_activos boolean DEFAULT true,
    verificacion_instagram text,
    verificacion_youtube text,
    verificacion_tiktok text,
    stripe_cliente_id text,
    stripe_suscripcion_id text,
    fecha_inicio_suscripcion timestamp with time zone,
    fecha_termino_suscripcion timestamp with time zone,
    visitas_totales integer DEFAULT 0,
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone DEFAULT now(),
    fecha_ultima_sesion timestamp with time zone,
    balance_pendiente numeric DEFAULT 0,
    balance_disponible numeric DEFAULT 0,
    user_num_total integer,
    user_num_free integer,
    user_num_pro integer,
    user_num_prem integer,
    es_soporte boolean DEFAULT false,
    es_prueba boolean DEFAULT false,
    fecha_fin_prueba timestamp with time zone,
    cancela_al_final boolean DEFAULT false,
    stripe_connect_id text,
    stripe_connect_onboarded boolean DEFAULT false,
    es_regalo boolean DEFAULT false,
    CONSTRAINT perfiles_nivel_suscripcion_check CHECK ((nivel_suscripcion = ANY (ARRAY['free'::text, 'pro'::text, 'premium'::text])))
);


--
-- Name: COLUMN perfiles.stripe_suscripcion_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.perfiles.stripe_suscripcion_id IS 'ID técnico de la suscripcion en Stripe (sub_...)';


--
-- Name: COLUMN perfiles.es_prueba; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.perfiles.es_prueba IS 'Indica si el usuario está en un periodo de prueba (trial) de Stripe';


--
-- Name: COLUMN perfiles.fecha_fin_prueba; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.perfiles.fecha_fin_prueba IS 'La fecha exacta en la que se le hará el primer cobro real o se le bajará a plan Free si canceló.';


--
-- Name: COLUMN perfiles.cancela_al_final; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.perfiles.cancela_al_final IS 'Si es verdadero, el productor canceló su suscripción pero se le mantendrán los beneficios hasta que termine su ciclo pagado o su mes de prueba.';


--
-- Name: COLUMN perfiles.stripe_connect_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.perfiles.stripe_connect_id IS 'ID de la cuenta conectada de Stripe Express';


--
-- Name: COLUMN perfiles.stripe_connect_onboarded; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.perfiles.stripe_connect_onboarded IS 'Indica si el productor ha completado el onboarding de Stripe';


--
-- Name: COLUMN perfiles.es_regalo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.perfiles.es_regalo IS 'Indica si la suscripción fue otorgada como regalo o cupón del 100%';


--
-- Name: beats_busqueda; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.beats_busqueda AS
 SELECT b.id,
    b.productor_id,
    b.titulo,
    b.genero,
    b.subgenero,
    b.bpm,
    b.vibras,
    b.instrumentos,
    b.tipos_beat,
    b.artista_referencia,
    b.portada_url,
    b.archivo_mp3_url,
    b.archivo_muestra_url,
    b.precio_basica_mxn,
    b.precio_pro_mxn,
    b.precio_premium_mxn,
    b.precio_exclusiva_estandar_mxn,
    b.precio_exclusiva_premium_mxn,
    b.es_gratis_activa,
    b.es_publico,
    b.es_visible,
    b.esta_archivado,
    b.conteo_reproducciones,
    b.conteo_ventas,
    b.fecha_creacion,
    b.tono_escala,
    p.nombre_artistico AS productor_nombre_artistico,
    p.nombre_usuario AS productor_nombre_usuario,
    p.foto_perfil AS productor_foto
   FROM (public.beats b
     JOIN public.perfiles p ON ((b.productor_id = p.id)));


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    item_id text NOT NULL,
    item_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    price numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: comentarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comentarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    beat_id uuid,
    contenido text NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now(),
    perfil_id uuid,
    parent_id uuid,
    likes_count integer DEFAULT 0 NOT NULL
);


--
-- Name: configuracion_global; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion_global (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clave text NOT NULL,
    valor boolean DEFAULT false,
    ultima_actualizacion timestamp with time zone DEFAULT now()
);


--
-- Name: cupones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cupones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    productor_id uuid,
    codigo text NOT NULL,
    porcentaje_descuento integer,
    es_activo boolean DEFAULT true,
    fecha_creacion timestamp with time zone DEFAULT now(),
    aplica_a text DEFAULT 'beats'::text,
    nivel_objetivo text DEFAULT 'todos'::text,
    usos_maximos integer,
    usos_actuales integer DEFAULT 0,
    fecha_expiracion timestamp with time zone,
    id_cupon_stripe text,
    texto_descuento text,
    CONSTRAINT cupones_porcentaje_descuento_check CHECK (((porcentaje_descuento > 0) AND (porcentaje_descuento <= 100)))
);


--
-- Name: favoritos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favoritos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    beat_id uuid NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now()
);


--
-- Name: kits_sonido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kits_sonido (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    productor_id uuid NOT NULL,
    titulo text NOT NULL,
    descripcion text,
    precio numeric NOT NULL,
    url_archivo text NOT NULL,
    url_portada text,
    es_publico boolean DEFAULT true,
    fecha_creacion timestamp with time zone DEFAULT now(),
    archivo_muestra_url text,
    esta_desactivado_por_plan boolean DEFAULT false,
    CONSTRAINT kits_sonido_precio_check CHECK ((precio >= (0)::numeric))
);


--
-- Name: licencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licencias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    productor_id uuid NOT NULL,
    licencia_gratis text,
    licencia_basica text,
    licencia_pro text,
    licencia_premium text,
    licencia_soundkits text,
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone DEFAULT now(),
    gratis_activa boolean DEFAULT false,
    basica_activa boolean DEFAULT false,
    pro_activa boolean DEFAULT false,
    premium_activa boolean DEFAULT false,
    exclusiva_activa boolean DEFAULT false,
    soundkits_activa boolean DEFAULT false,
    licencia_exclusiva_premium text,
    exclusiva_premium_activa boolean DEFAULT false NOT NULL,
    licencia_exclusiva_estandar text,
    exclusiva_estandar_activa boolean DEFAULT false NOT NULL
);


--
-- Name: likes_comentarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.likes_comentarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    comentario_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now()
);


--
-- Name: listas_reproduccion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listas_reproduccion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid,
    nombre text NOT NULL,
    es_publica boolean DEFAULT true,
    fecha_creacion timestamp with time zone DEFAULT now(),
    es_privada boolean DEFAULT false
);


--
-- Name: listas_reproduccion_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listas_reproduccion_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    playlist_id uuid NOT NULL,
    beat_id uuid NOT NULL,
    indice_orden integer DEFAULT 0 NOT NULL,
    fecha_agregado timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: mensajes_proyecto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mensajes_proyecto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proyecto_id uuid,
    remitente_id uuid,
    contenido text NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now()
);


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    tipo text NOT NULL,
    contenido text NOT NULL,
    esta_leida boolean DEFAULT false,
    url_destino text,
    fecha_creacion timestamp with time zone DEFAULT now()
);


--
-- Name: ofertas_exclusivas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ofertas_exclusivas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    beat_id uuid NOT NULL,
    productor_id uuid NOT NULL,
    comprador_id uuid NOT NULL,
    monto_ofertado numeric(12,2) NOT NULL,
    mensaje_comprador text,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone DEFAULT now(),
    historial_chat jsonb DEFAULT '[]'::jsonb,
    fecha_expiracion timestamp with time zone,
    CONSTRAINT ofertas_exclusivas_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'aceptada'::text, 'rechazada'::text]))),
    CONSTRAINT ofertas_exclusivas_monto_ofertado_check CHECK ((monto_ofertado > (0)::numeric))
);


--
-- Name: ofertas_volumen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ofertas_volumen (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    productor_id uuid NOT NULL,
    venta_minima integer DEFAULT 2 NOT NULL,
    beats_gratis integer DEFAULT 1 NOT NULL,
    es_activa boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now(),
    CONSTRAINT ofertas_volumen_beats_gratis_check CHECK ((beats_gratis >= 1)),
    CONSTRAINT ofertas_volumen_venta_minima_check CHECK ((venta_minima >= 2)),
    CONSTRAINT ov_gratis_menor_que_minimo CHECK ((beats_gratis < venta_minima))
);


--
-- Name: proyectos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proyectos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaccion_id uuid,
    comprador_id uuid NOT NULL,
    productor_id uuid NOT NULL,
    estado text DEFAULT 'pagado'::text NOT NULL,
    requerimientos jsonb DEFAULT '{}'::jsonb,
    url_archivo_final text,
    fecha_entrega_estimada timestamp with time zone,
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone DEFAULT now()
);


--
-- Name: quejas_y_sugerencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quejas_y_sugerencias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo_mensaje text,
    usuario_q text,
    correo text,
    descripcion_problema text,
    usuario_id uuid,
    estado text DEFAULT 'pendiente'::text,
    evidencia_1 text,
    evidencia_2 text,
    evidencia_3 text,
    fecha_creacion timestamp with time zone DEFAULT now()
);


--
-- Name: seguidores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seguidores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seguidor_id uuid NOT NULL,
    seguido_id uuid NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now()
);


--
-- Name: servicios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    productor_id uuid NOT NULL,
    titulo text NOT NULL,
    descripcion text,
    precio numeric NOT NULL,
    tipo_servicio text DEFAULT 'mezcla_master'::text,
    tiempo_entrega_dias integer DEFAULT 3,
    es_activo boolean DEFAULT true,
    fecha_creacion timestamp with time zone DEFAULT now(),
    esta_desactivado_por_plan boolean DEFAULT false,
    CONSTRAINT servicios_precio_check CHECK ((precio >= (0)::numeric))
);


--
-- Name: solicitudes_verificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_verificacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nombre_completo text NOT NULL,
    nombre_usuario text NOT NULL,
    correo text NOT NULL,
    url_red_social text NOT NULL,
    motivacion text,
    url_doc_frontal text NOT NULL,
    url_doc_trasero text NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    mensaje_feedback text,
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone DEFAULT now()
);


--
-- Name: transacciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transacciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pago_id text,
    comprador_id uuid NOT NULL,
    vendedor_id uuid,
    producto_id text NOT NULL,
    tipo_producto text NOT NULL,
    nombre_producto text NOT NULL,
    precio_total numeric NOT NULL,
    moneda text DEFAULT 'MXN'::text NOT NULL,
    estado_pago text DEFAULT 'completado'::text NOT NULL,
    metodo_pago text DEFAULT 'stripe'::text NOT NULL,
    tipo_licencia text,
    metadatos jsonb DEFAULT '{}'::jsonb,
    cupon_id uuid,
    recibo_url text,
    fecha_creacion timestamp with time zone DEFAULT now(),
    orden_pedido text,
    codigo_cupon text,
    monto_descuento numeric DEFAULT 0,
    contract_url text,
    producto_uuid uuid,
    conteo_descargas integer DEFAULT 0,
    ultima_descarga_at timestamp with time zone,
    ip_descarga text
);


--
-- Name: COLUMN transacciones.conteo_descargas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transacciones.conteo_descargas IS 'Número total de veces que el usuario ha descargado los archivos de esta compra';


--
-- Name: COLUMN transacciones.ultima_descarga_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transacciones.ultima_descarga_at IS 'Fecha y hora de la última descarga exitosa';


--
-- Name: COLUMN transacciones.ip_descarga; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transacciones.ip_descarga IS 'Dirección IP desde la que se realizó la última descarga';


--
-- Name: usos_cupones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usos_cupones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cupon_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    fecha_uso timestamp with time zone DEFAULT timezone('utc'::text, now()),
    orden_id uuid
);


--
-- Name: analiticas_eventos analiticas_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analiticas_eventos
    ADD CONSTRAINT analiticas_eventos_pkey PRIMARY KEY (id);


--
-- Name: archivos_proyecto archivos_proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archivos_proyecto
    ADD CONSTRAINT archivos_proyecto_pkey PRIMARY KEY (id);


--
-- Name: beats beats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beats
    ADD CONSTRAINT beats_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_user_id_item_id_item_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_item_id_item_type_key UNIQUE (user_id, item_id, item_type);


--
-- Name: comentarios comentarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_pkey PRIMARY KEY (id);


--
-- Name: configuracion_global configuracion_global_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_global
    ADD CONSTRAINT configuracion_global_clave_key UNIQUE (clave);


--
-- Name: configuracion_global configuracion_global_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_global
    ADD CONSTRAINT configuracion_global_pkey PRIMARY KEY (id);


--
-- Name: cupones cupones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_pkey PRIMARY KEY (id);


--
-- Name: favoritos favoritos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_pkey PRIMARY KEY (id);


--
-- Name: favoritos favoritos_usuario_id_beat_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_usuario_id_beat_id_key UNIQUE (usuario_id, beat_id);


--
-- Name: kits_sonido kits_sonido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kits_sonido
    ADD CONSTRAINT kits_sonido_pkey PRIMARY KEY (id);


--
-- Name: licencias licencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencias
    ADD CONSTRAINT licencias_pkey PRIMARY KEY (id);


--
-- Name: licencias licencias_productor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencias
    ADD CONSTRAINT licencias_productor_id_key UNIQUE (productor_id);


--
-- Name: likes_comentarios likes_comentarios_comentario_id_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes_comentarios
    ADD CONSTRAINT likes_comentarios_comentario_id_usuario_id_key UNIQUE (comentario_id, usuario_id);


--
-- Name: likes_comentarios likes_comentarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes_comentarios
    ADD CONSTRAINT likes_comentarios_pkey PRIMARY KEY (id);


--
-- Name: listas_reproduccion_items listas_reproduccion_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listas_reproduccion_items
    ADD CONSTRAINT listas_reproduccion_items_pkey PRIMARY KEY (id);


--
-- Name: listas_reproduccion_items listas_reproduccion_items_playlist_id_beat_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listas_reproduccion_items
    ADD CONSTRAINT listas_reproduccion_items_playlist_id_beat_id_key UNIQUE (playlist_id, beat_id);


--
-- Name: listas_reproduccion listas_reproduccion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listas_reproduccion
    ADD CONSTRAINT listas_reproduccion_pkey PRIMARY KEY (id);


--
-- Name: mensajes_proyecto mensajes_proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_proyecto
    ADD CONSTRAINT mensajes_proyecto_pkey PRIMARY KEY (id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: ofertas_exclusivas ofertas_exclusivas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas_exclusivas
    ADD CONSTRAINT ofertas_exclusivas_pkey PRIMARY KEY (id);


--
-- Name: ofertas_volumen ofertas_volumen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas_volumen
    ADD CONSTRAINT ofertas_volumen_pkey PRIMARY KEY (id);


--
-- Name: perfiles perfiles_nombre_usuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfiles
    ADD CONSTRAINT perfiles_nombre_usuario_key UNIQUE (nombre_usuario);


--
-- Name: perfiles perfiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfiles
    ADD CONSTRAINT perfiles_pkey PRIMARY KEY (id);


--
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- Name: quejas_y_sugerencias quejas_y_sugerencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quejas_y_sugerencias
    ADD CONSTRAINT quejas_y_sugerencias_pkey PRIMARY KEY (id);


--
-- Name: seguidores seguidores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguidores
    ADD CONSTRAINT seguidores_pkey PRIMARY KEY (id);


--
-- Name: seguidores seguidores_seguidor_id_seguido_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguidores
    ADD CONSTRAINT seguidores_seguidor_id_seguido_id_key UNIQUE (seguidor_id, seguido_id);


--
-- Name: servicios servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_verificacion solicitudes_verificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_verificacion
    ADD CONSTRAINT solicitudes_verificacion_pkey PRIMARY KEY (id);


--
-- Name: transacciones transacciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacciones
    ADD CONSTRAINT transacciones_pkey PRIMARY KEY (id);


--
-- Name: transacciones unique_pago_producto; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacciones
    ADD CONSTRAINT unique_pago_producto UNIQUE (pago_id, producto_id);


--
-- Name: usos_cupones usos_cupones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usos_cupones
    ADD CONSTRAINT usos_cupones_pkey PRIMARY KEY (id);


--
-- Name: idx_analiticas_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analiticas_created_at ON public.analiticas_eventos USING btree (created_at);


--
-- Name: idx_analiticas_productor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analiticas_productor ON public.analiticas_eventos USING btree (productor_id);


--
-- Name: idx_analiticas_tipo_evento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analiticas_tipo_evento ON public.analiticas_eventos USING btree (tipo_evento);


--
-- Name: idx_beats_exclusiva_premium; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_beats_exclusiva_premium ON public.beats USING btree (es_exclusiva_premium_activa) WHERE (es_exclusiva_premium_activa = true);


--
-- Name: idx_comentarios_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comentarios_parent_id ON public.comentarios USING btree (parent_id);


--
-- Name: idx_comentarios_perfil_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comentarios_perfil_id ON public.comentarios USING btree (perfil_id);


--
-- Name: idx_cupones_codigo_productor; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_cupones_codigo_productor ON public.cupones USING btree (codigo, productor_id);


--
-- Name: idx_likes_comentarios_comentario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_comentarios_comentario ON public.likes_comentarios USING btree (comentario_id);


--
-- Name: idx_likes_comentarios_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_likes_comentarios_usuario ON public.likes_comentarios USING btree (usuario_id);


--
-- Name: idx_oe_beat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_oe_beat ON public.ofertas_exclusivas USING btree (beat_id);


--
-- Name: idx_oe_comprador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_oe_comprador ON public.ofertas_exclusivas USING btree (comprador_id);


--
-- Name: idx_oe_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_oe_estado ON public.ofertas_exclusivas USING btree (estado);


--
-- Name: idx_oe_productor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_oe_productor ON public.ofertas_exclusivas USING btree (productor_id);


--
-- Name: idx_ov_activa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ov_activa ON public.ofertas_volumen USING btree (es_activa) WHERE (es_activa = true);


--
-- Name: idx_ov_productor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ov_productor ON public.ofertas_volumen USING btree (productor_id);


--
-- Name: idx_playlist_items_playlist_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_playlist_items_playlist_id ON public.listas_reproduccion_items USING btree (playlist_id);


--
-- Name: idx_transacciones_comprador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacciones_comprador_id ON public.transacciones USING btree (comprador_id);


--
-- Name: idx_transacciones_orden_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacciones_orden_pedido ON public.transacciones USING btree (orden_pedido);


--
-- Name: idx_transacciones_producto_uuid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacciones_producto_uuid ON public.transacciones USING btree (producto_uuid);


--
-- Name: idx_transacciones_vendedor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacciones_vendedor_id ON public.transacciones USING btree (vendedor_id);


--
-- Name: cupones tr_clean_coupon_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_clean_coupon_code BEFORE INSERT OR UPDATE ON public.cupones FOR EACH ROW EXECUTE FUNCTION public.handle_coupon_upsert();


--
-- Name: transacciones tr_incrementar_ventas_beat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_incrementar_ventas_beat AFTER INSERT ON public.transacciones FOR EACH ROW EXECUTE FUNCTION public.incrementar_conteo_ventas_beat();


--
-- Name: transacciones trg_activar_membresia_auto; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_activar_membresia_auto AFTER INSERT OR UPDATE ON public.transacciones FOR EACH ROW EXECUTE FUNCTION public.fn_activar_membresia_desde_transaccion();


--
-- Name: licencias trg_actualizar_licencias_final; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_actualizar_licencias_final BEFORE UPDATE ON public.licencias FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp_licencias();


--
-- Name: perfiles trg_manejar_escalera_perfiles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_manejar_escalera_perfiles BEFORE INSERT OR UPDATE OF nivel_suscripcion ON public.perfiles FOR EACH ROW EXECUTE FUNCTION public.manejar_escalera_perfiles();


--
-- Name: ofertas_exclusivas trg_oe_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_oe_updated_at BEFORE UPDATE ON public.ofertas_exclusivas FOR EACH ROW EXECUTE FUNCTION public.update_oferta_exclusiva_ts();


--
-- Name: perfiles trg_perfiles_actualizacion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_perfiles_actualizacion BEFORE UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_mutacion();


--
-- Name: proyectos trg_proyectos_actualizacion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_proyectos_actualizacion BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_mutacion();


--
-- Name: likes_comentarios trg_recomputar_likes_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recomputar_likes_count AFTER INSERT OR DELETE ON public.likes_comentarios FOR EACH ROW EXECUTE FUNCTION public.recomputar_likes_count_comentario();


--
-- Name: favoritos trg_sincronizar_likes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sincronizar_likes AFTER INSERT OR DELETE ON public.favoritos FOR EACH ROW EXECUTE FUNCTION public.sincronizar_conteo_likes();


--
-- Name: beats trg_validar_beat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_beat BEFORE INSERT OR UPDATE ON public.beats FOR EACH ROW EXECUTE FUNCTION public.validar_beat_antes_insertar();


--
-- Name: analiticas_eventos analiticas_eventos_beat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analiticas_eventos
    ADD CONSTRAINT analiticas_eventos_beat_id_fkey FOREIGN KEY (beat_id) REFERENCES public.beats(id) ON DELETE SET NULL;


--
-- Name: analiticas_eventos analiticas_eventos_productor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analiticas_eventos
    ADD CONSTRAINT analiticas_eventos_productor_id_fkey FOREIGN KEY (productor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: analiticas_eventos analiticas_eventos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analiticas_eventos
    ADD CONSTRAINT analiticas_eventos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id) ON DELETE SET NULL;


--
-- Name: archivos_proyecto archivos_proyecto_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archivos_proyecto
    ADD CONSTRAINT archivos_proyecto_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON DELETE CASCADE;


--
-- Name: archivos_proyecto archivos_proyecto_subidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archivos_proyecto
    ADD CONSTRAINT archivos_proyecto_subidor_id_fkey FOREIGN KEY (subidor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: beats beats_productor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beats
    ADD CONSTRAINT beats_productor_id_fkey FOREIGN KEY (productor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: comentarios comentarios_beat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_beat_id_fkey FOREIGN KEY (beat_id) REFERENCES public.beats(id) ON DELETE CASCADE;


--
-- Name: comentarios comentarios_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comentarios(id) ON DELETE CASCADE;


--
-- Name: comentarios comentarios_perfil_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_perfil_id_fkey FOREIGN KEY (perfil_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: comentarios comentarios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: cupones cupones_productor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_productor_id_fkey FOREIGN KEY (productor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: favoritos favoritos_beat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_beat_id_fkey FOREIGN KEY (beat_id) REFERENCES public.beats(id) ON DELETE CASCADE;


--
-- Name: favoritos favoritos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: kits_sonido kits_sonido_productor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kits_sonido
    ADD CONSTRAINT kits_sonido_productor_id_fkey FOREIGN KEY (productor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: licencias licencias_productor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencias
    ADD CONSTRAINT licencias_productor_id_fkey FOREIGN KEY (productor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: likes_comentarios likes_comentarios_comentario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes_comentarios
    ADD CONSTRAINT likes_comentarios_comentario_id_fkey FOREIGN KEY (comentario_id) REFERENCES public.comentarios(id) ON DELETE CASCADE;


--
-- Name: likes_comentarios likes_comentarios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes_comentarios
    ADD CONSTRAINT likes_comentarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: listas_reproduccion_items listas_reproduccion_items_beat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listas_reproduccion_items
    ADD CONSTRAINT listas_reproduccion_items_beat_id_fkey FOREIGN KEY (beat_id) REFERENCES public.beats(id) ON DELETE CASCADE;


--
-- Name: listas_reproduccion_items listas_reproduccion_items_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listas_reproduccion_items
    ADD CONSTRAINT listas_reproduccion_items_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.listas_reproduccion(id) ON DELETE CASCADE;


--
-- Name: listas_reproduccion listas_reproduccion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listas_reproduccion
    ADD CONSTRAINT listas_reproduccion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: mensajes_proyecto mensajes_proyecto_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_proyecto
    ADD CONSTRAINT mensajes_proyecto_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON DELETE CASCADE;


--
-- Name: mensajes_proyecto mensajes_proyecto_remitente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_proyecto
    ADD CONSTRAINT mensajes_proyecto_remitente_id_fkey FOREIGN KEY (remitente_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: ofertas_exclusivas ofertas_exclusivas_beat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas_exclusivas
    ADD CONSTRAINT ofertas_exclusivas_beat_id_fkey FOREIGN KEY (beat_id) REFERENCES public.beats(id) ON DELETE CASCADE;


--
-- Name: ofertas_exclusivas ofertas_exclusivas_comprador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas_exclusivas
    ADD CONSTRAINT ofertas_exclusivas_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: ofertas_exclusivas ofertas_exclusivas_productor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas_exclusivas
    ADD CONSTRAINT ofertas_exclusivas_productor_id_fkey FOREIGN KEY (productor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: ofertas_volumen ofertas_volumen_productor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas_volumen
    ADD CONSTRAINT ofertas_volumen_productor_id_fkey FOREIGN KEY (productor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: perfiles perfiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfiles
    ADD CONSTRAINT perfiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: proyectos proyectos_comprador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: proyectos proyectos_productor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_productor_id_fkey FOREIGN KEY (productor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: quejas_y_sugerencias quejas_y_sugerencias_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quejas_y_sugerencias
    ADD CONSTRAINT quejas_y_sugerencias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id) ON DELETE SET NULL;


--
-- Name: seguidores seguidores_seguido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguidores
    ADD CONSTRAINT seguidores_seguido_id_fkey FOREIGN KEY (seguido_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: seguidores seguidores_seguidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguidores
    ADD CONSTRAINT seguidores_seguidor_id_fkey FOREIGN KEY (seguidor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: servicios servicios_productor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_productor_id_fkey FOREIGN KEY (productor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: solicitudes_verificacion solicitudes_verificacion_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_verificacion
    ADD CONSTRAINT solicitudes_verificacion_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: transacciones transacciones_comprador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacciones
    ADD CONSTRAINT transacciones_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: transacciones transacciones_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacciones
    ADD CONSTRAINT transacciones_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;


--
-- Name: usos_cupones usos_cupones_cupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usos_cupones
    ADD CONSTRAINT usos_cupones_cupon_id_fkey FOREIGN KEY (cupon_id) REFERENCES public.cupones(id) ON DELETE CASCADE;


--
-- Name: usos_cupones usos_cupones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usos_cupones
    ADD CONSTRAINT usos_cupones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comentarios Actualizar likes comentarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Actualizar likes comentarios" ON public.comentarios FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: cupones Admin gestiona todos los cupones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin gestiona todos los cupones" ON public.cupones USING ((EXISTS ( SELECT 1
   FROM public.perfiles
  WHERE ((perfiles.id = auth.uid()) AND ((perfiles.es_admin = true) OR (perfiles.es_soporte = true))))));


--
-- Name: perfiles Administradores gestionan todo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Administradores gestionan todo" ON public.perfiles USING (public.soy_admin());


--
-- Name: solicitudes_verificacion Admins gestion completa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins gestion completa" ON public.solicitudes_verificacion TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.perfiles
  WHERE ((perfiles.id = auth.uid()) AND (perfiles.es_admin = true)))));


--
-- Name: cupones Admins tienen acceso total a cupones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins tienen acceso total a cupones" ON public.cupones TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.perfiles
  WHERE ((perfiles.id = auth.uid()) AND ((perfiles.es_admin = true) OR (perfiles.es_soporte = true))))));


--
-- Name: comentarios Autor o dueño puede eliminar su comentario; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autor o dueño puede eliminar su comentario" ON public.comentarios FOR DELETE USING (((auth.uid() = usuario_id) OR (auth.uid() = perfil_id)));


--
-- Name: comentarios Autor puede editar su comentario; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autor puede editar su comentario" ON public.comentarios FOR UPDATE USING ((auth.uid() = usuario_id)) WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: listas_reproduccion Control total listas propietario; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Control total listas propietario" ON public.listas_reproduccion TO authenticated USING ((auth.uid() = usuario_id)) WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: cupones Cupones visibles para todos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cupones visibles para todos" ON public.cupones FOR SELECT USING (true);


--
-- Name: cupones Everyone can view active cupones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active cupones" ON public.cupones FOR SELECT USING ((es_activo = true));


--
-- Name: beats Gestión beats propios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestión beats propios" ON public.beats USING ((auth.uid() = productor_id));


--
-- Name: perfiles Gestión de propio perfil; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestión de propio perfil" ON public.perfiles USING ((auth.uid() = id));


--
-- Name: favoritos Gestión favoritos propios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestión favoritos propios" ON public.favoritos USING ((auth.uid() = usuario_id));


--
-- Name: kits_sonido Gestión kits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestión kits" ON public.kits_sonido USING ((auth.uid() = productor_id));


--
-- Name: seguidores Gestión seguidores propios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestión seguidores propios" ON public.seguidores USING ((auth.uid() = seguidor_id));


--
-- Name: servicios Gestión servicios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gestión servicios" ON public.servicios USING ((auth.uid() = productor_id));


--
-- Name: beats Lectura beats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura beats" ON public.beats FOR SELECT USING (true);


--
-- Name: favoritos Lectura favoritos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura favoritos" ON public.favoritos FOR SELECT USING (true);


--
-- Name: kits_sonido Lectura kits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura kits" ON public.kits_sonido FOR SELECT USING (true);


--
-- Name: transacciones Lectura propia comprador; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura propia comprador" ON public.transacciones FOR SELECT USING ((auth.uid() = comprador_id));


--
-- Name: transacciones Lectura propia vendedor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura propia vendedor" ON public.transacciones FOR SELECT USING ((auth.uid() = vendedor_id));


--
-- Name: listas_reproduccion Lectura publica listas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura publica listas" ON public.listas_reproduccion FOR SELECT USING (((es_publica = true) AND (es_privada = false)));


--
-- Name: likes_comentarios Lectura pública de likes_comentarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura pública de likes_comentarios" ON public.likes_comentarios FOR SELECT USING (true);


--
-- Name: perfiles Lectura pública de perfiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura pública de perfiles" ON public.perfiles FOR SELECT USING (true);


--
-- Name: transacciones Lectura pública para verificación QR; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura pública para verificación QR" ON public.transacciones FOR SELECT USING ((estado_pago = ANY (ARRAY['completado'::text, 'completed'::text, 'valido'::text])));


--
-- Name: seguidores Lectura seguidores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura seguidores" ON public.seguidores FOR SELECT USING (true);


--
-- Name: servicios Lectura servicios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lectura servicios" ON public.servicios FOR SELECT USING (true);


--
-- Name: quejas_y_sugerencias Permitir actualización a administradores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir actualización a administradores" ON public.quejas_y_sugerencias FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.perfiles
  WHERE ((perfiles.id = auth.uid()) AND (perfiles.es_admin = true)))));


--
-- Name: comentarios Permitir borrar sus propios comentarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir borrar sus propios comentarios" ON public.comentarios FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: comentarios Permitir creación a usuarios autenticados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir creación a usuarios autenticados" ON public.comentarios FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: analiticas_eventos Permitir inserción de eventos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserción de eventos" ON public.analiticas_eventos FOR INSERT WITH CHECK (true);


--
-- Name: quejas_y_sugerencias Permitir inserción pública; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserción pública" ON public.quejas_y_sugerencias FOR INSERT WITH CHECK (true);


--
-- Name: quejas_y_sugerencias Permitir lectura a administradores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir lectura a administradores" ON public.quejas_y_sugerencias FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.perfiles
  WHERE ((perfiles.id = auth.uid()) AND (perfiles.es_admin = true)))));


--
-- Name: licencias Permitir lectura de licencias para todos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir lectura de licencias para todos" ON public.licencias FOR SELECT USING (true);


--
-- Name: comentarios Permitir lectura pública de comentarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir lectura pública de comentarios" ON public.comentarios FOR SELECT USING (true);


--
-- Name: licencias Productores gestionan sus propias licencias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Productores gestionan sus propias licencias" ON public.licencias USING ((auth.uid() = productor_id));


--
-- Name: cupones Productores gestionan sus propios cupones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Productores gestionan sus propios cupones" ON public.cupones USING ((auth.uid() = productor_id)) WITH CHECK ((auth.uid() = productor_id));


--
-- Name: cupones Productores pueden actualizar sus propios cupones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Productores pueden actualizar sus propios cupones" ON public.cupones FOR UPDATE USING ((auth.uid() = productor_id));


--
-- Name: cupones Productores pueden crear sus propios cupones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Productores pueden crear sus propios cupones" ON public.cupones FOR INSERT WITH CHECK ((auth.uid() = productor_id));


--
-- Name: cupones Productores pueden eliminar sus propios cupones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Productores pueden eliminar sus propios cupones" ON public.cupones FOR DELETE USING ((auth.uid() = productor_id));


--
-- Name: analiticas_eventos Productores pueden ver sus propias analíticas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Productores pueden ver sus propias analíticas" ON public.analiticas_eventos FOR SELECT USING (((auth.uid() = productor_id) OR (EXISTS ( SELECT 1
   FROM public.perfiles
  WHERE ((perfiles.id = auth.uid()) AND ((perfiles.es_admin = true) OR (perfiles.es_soporte = true)))))));


--
-- Name: usos_cupones Productores ven usos de sus cupones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Productores ven usos de sus cupones" ON public.usos_cupones FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cupones
  WHERE ((cupones.id = usos_cupones.cupon_id) AND ((cupones.productor_id = auth.uid()) OR ( SELECT perfiles.es_admin
           FROM public.perfiles
          WHERE (perfiles.id = auth.uid())))))));


--
-- Name: proyectos Proyectos para involucrados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Proyectos para involucrados" ON public.proyectos FOR SELECT USING (((auth.uid() = comprador_id) OR (auth.uid() = productor_id)));


--
-- Name: listas_reproduccion_items Users can manage items of their own playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage items of their own playlists" ON public.listas_reproduccion_items USING ((EXISTS ( SELECT 1
   FROM public.listas_reproduccion pl
  WHERE ((pl.id = listas_reproduccion_items.playlist_id) AND (pl.usuario_id = auth.uid())))));


--
-- Name: listas_reproduccion_items Users can view public playlist items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view public playlist items" ON public.listas_reproduccion_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.listas_reproduccion pl
  WHERE ((pl.id = listas_reproduccion_items.playlist_id) AND ((pl.es_publica = true) OR (pl.usuario_id = auth.uid()))))));


--
-- Name: likes_comentarios Usuario gestiona sus likes_comentarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuario gestiona sus likes_comentarios" ON public.likes_comentarios USING ((auth.uid() = usuario_id)) WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: comentarios Usuarios autenticados pueden publicar comentarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios autenticados pueden publicar comentarios" ON public.comentarios FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: solicitudes_verificacion Usuarios pueden crear propias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios pueden crear propias" ON public.solicitudes_verificacion FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: cart_items Usuarios pueden gestionar sus propios items del carrito; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios pueden gestionar sus propios items del carrito" ON public.cart_items USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: solicitudes_verificacion Usuarios pueden ver propias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios pueden ver propias" ON public.solicitudes_verificacion FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: analiticas_eventos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analiticas_eventos ENABLE ROW LEVEL SECURITY;

--
-- Name: archivos_proyecto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.archivos_proyecto ENABLE ROW LEVEL SECURITY;

--
-- Name: beats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;

--
-- Name: cart_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

--
-- Name: comentarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

--
-- Name: cupones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;

--
-- Name: favoritos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

--
-- Name: kits_sonido; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kits_sonido ENABLE ROW LEVEL SECURITY;

--
-- Name: licencias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;

--
-- Name: likes_comentarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.likes_comentarios ENABLE ROW LEVEL SECURITY;

--
-- Name: listas_reproduccion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listas_reproduccion ENABLE ROW LEVEL SECURITY;

--
-- Name: listas_reproduccion_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listas_reproduccion_items ENABLE ROW LEVEL SECURITY;

--
-- Name: mensajes_proyecto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mensajes_proyecto ENABLE ROW LEVEL SECURITY;

--
-- Name: notificaciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

--
-- Name: ofertas_exclusivas oe_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY oe_insert ON public.ofertas_exclusivas FOR INSERT WITH CHECK (((auth.uid() = comprador_id) AND (auth.uid() <> productor_id)));


--
-- Name: ofertas_exclusivas oe_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY oe_select ON public.ofertas_exclusivas FOR SELECT USING (((auth.uid() = productor_id) OR (auth.uid() = comprador_id)));


--
-- Name: ofertas_exclusivas oe_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY oe_update ON public.ofertas_exclusivas FOR UPDATE USING ((auth.uid() = productor_id)) WITH CHECK ((auth.uid() = productor_id));


--
-- Name: ofertas_exclusivas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ofertas_exclusivas ENABLE ROW LEVEL SECURITY;

--
-- Name: ofertas_volumen; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ofertas_volumen ENABLE ROW LEVEL SECURITY;

--
-- Name: ofertas_volumen ov_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ov_delete ON public.ofertas_volumen FOR DELETE USING ((auth.uid() = productor_id));


--
-- Name: ofertas_volumen ov_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ov_insert ON public.ofertas_volumen FOR INSERT WITH CHECK ((auth.uid() = productor_id));


--
-- Name: ofertas_volumen ov_select_activas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ov_select_activas ON public.ofertas_volumen FOR SELECT USING (((es_activa = true) OR (auth.uid() = productor_id)));


--
-- Name: ofertas_volumen ov_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ov_update ON public.ofertas_volumen FOR UPDATE USING ((auth.uid() = productor_id)) WITH CHECK ((auth.uid() = productor_id));


--
-- Name: perfiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

--
-- Name: proyectos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;

--
-- Name: quejas_y_sugerencias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quejas_y_sugerencias ENABLE ROW LEVEL SECURITY;

--
-- Name: seguidores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seguidores ENABLE ROW LEVEL SECURITY;

--
-- Name: servicios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;

--
-- Name: solicitudes_verificacion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.solicitudes_verificacion ENABLE ROW LEVEL SECURITY;

--
-- Name: transacciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

--
-- Name: usos_cupones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usos_cupones ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict PIXwplO4W4ba71pQ0u7hgfKsU7I5bdsDypoQ07H02XVchdMUdrXkoibRuo45MDX

