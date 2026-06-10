-- =============================================================
-- SEGURIDAD DE STORAGE — cierre de políticas con fuga
-- Tianguis Beats — 2026-06-10 (versión corregida tras auditoría real)
-- =============================================================
-- Auditoría contra producción (pg_policies + storage.buckets):
--
--   YA RESUELTO ANTES (las políticas ya no existen en prod; los DROP
--   quedan como no-op idempotente por documentación):
--     - "Authenticated Update Delete"            (acceso total sin filtro)
--     - "Acceso_Compradores_Archivos_Maestros"   (EXISTS sin vincular compra)
--     - "Lectura pública para verificación QR"   (transacciones expuestas)
--
--   FUGAS REALES DETECTADAS Y CERRADAS AQUÍ:
--
--   1. "Select_licencias_generadas" (SELECT, rol public):
--        QUAL: bucket_id = 'licencias_generadas'  ← SIN filtro de dueño.
--      Cualquier usuario con la anon key podía listar y descargar TODOS
--      los PDFs de licencias/contratos (datos personales de compradores).
--      La entrega legítima no la necesita: los PDFs se generan con
--      service role (webhook de Stripe) y se entregan por signed URLs
--      desde la API. El dueño conserva lectura directa vía
--      "All_licencias_generadas" (carpeta = nombre_usuario),
--      "Gestión propia licencias_generadas" (carpeta = uid) y
--      "Acceso_Propietario_Documentos_Privados" (carpeta = uid).
--
--   2. "Acceso_Dueno_Archivos" (ALL, authenticated, SIN filtro de bucket):
--        QUAL/CHECK: carpeta[1] = uid
--      Permitía a cualquier usuario autenticado escribir/borrar en
--      CUALQUIER bucket bajo su carpeta uid — incluidos
--      `activos_plataforma` (público: hosting gratuito de archivos
--      arbitrarios servidos por la plataforma) y `licencias_generadas`
--      (posibilidad de plantar PDFs falsos). Ningún flujo de la app lo
--      usa: todas las subidas usan carpeta `nombre_usuario`, cubiertas
--      por las políticas por bucket "All_<bucket>", y los flujos con
--      carpeta uid (avatar en /studio/cuenta) están cubiertos por
--      "Gestión propia <bucket>". Se elimina sin pérdida funcional.
--
--   3. "Subida Muestras Autenticados" (INSERT, rol public):
--        CHECK: bucket = 'muestra_soundkit' AND authenticated  ← sin dueño.
--      Cualquier autenticado podía subir archivos (hasta 100 MB) a
--      cualquier carpeta del bucket de muestras de sound kits.
--      La subida legítima usa carpeta `nombre_usuario` y está cubierta
--      por "All_muestra_soundkit". Se elimina la política suelta.
--
--   4. "Soporte de subida para dueños" (INSERT, authenticated, SIN bucket):
--        CHECK: carpeta[1] = uid
--      Permitía a cualquier autenticado subir a CUALQUIER bucket bajo su
--      carpeta uid, incluido `activos_plataforma` (público, hasta 500 MB):
--      hosting gratuito de archivos arbitrarios servidos desde el dominio
--      de la plataforma. Los flujos legítimos con carpeta uid (avatar y
--      portada en /studio/cuenta y /[username]) están cubiertos por
--      "Gestión propia fotos_perfil" y "Gestión propia fotos_portada"
--      (verificado con ensayo RLS). Se elimina sin pérdida funcional.
--
--   SE CONSERVAN (verificadas como necesarias para los flujos de la app):
--     - Familia "All_<bucket>" (carpeta = nombre_usuario): subir/editar/
--       borrar beats (mp3/wav/stems), kits, muestras, portadas, fotos,
--       documentos de verificación. Es la que usan upload/page.tsx,
--       studio/beats/edit, studio/soundkits y studio/verification.
--     - Familia "Gestión propia <bucket>" (carpeta = uid): avatar en
--       studio/cuenta y archivos legados con carpeta uid.
--     - Lectura pública SOLO de buckets públicos (muestras, portadas,
--       fotos, activos de plataforma): el reproductor sigue funcionando.
--     - Política de archivos de proyecto por involucrados.
--     - Acceso total de administradores.
-- =============================================================

BEGIN;

-- No-ops documentales (ya eliminadas en prod con anterioridad)
DROP POLICY IF EXISTS "Authenticated Update Delete" ON storage.objects;
DROP POLICY IF EXISTS "Acceso_Compradores_Archivos_Maestros" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública de licencias_generadas" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública para verificación QR" ON public.transacciones;

-- Fugas reales detectadas en la auditoría del 2026-06-10
DROP POLICY IF EXISTS "Select_licencias_generadas" ON storage.objects;
DROP POLICY IF EXISTS "Acceso_Dueno_Archivos" ON storage.objects;
DROP POLICY IF EXISTS "Subida Muestras Autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Soporte de subida para dueños" ON storage.objects;

COMMIT;
