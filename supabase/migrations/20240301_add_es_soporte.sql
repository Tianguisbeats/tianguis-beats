-- Migration: Add es_soporte to perfiles
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS es_soporte BOOLEAN DEFAULT false;
