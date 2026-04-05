-- Migración: Hacer obligatoria la identificación trasera
ALTER TABLE public.solicitudes_verificacion 
ALTER COLUMN url_doc_trasero SET NOT NULL;
