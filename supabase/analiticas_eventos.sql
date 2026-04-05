-- Tabla para registrar eventos de analíticas detallados
CREATE TABLE IF NOT EXISTS public.analiticas_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    productor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    beat_id UUID REFERENCES public.beats(id) ON DELETE SET NULL,
    tipo_evento TEXT NOT NULL, -- 'add_to_cart', 'free_download', 'key_search', 'play_retention', 'geo_traffic'
    valor_numerico NUMERIC DEFAULT 0, -- por ejemplo, segundos de retención
    metadatos JSONB DEFAULT '{}'::jsonb, -- país, ciudad, tonalidad buscada, etc.
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL -- quien generó el evento (nulo si es invitado)
);

-- Índices para mejorar el rendimiento de las consultas de analíticas
CREATE INDEX IF NOT EXISTS idx_analiticas_productor ON public.analiticas_eventos(productor_id);
CREATE INDEX IF NOT EXISTS idx_analiticas_tipo_evento ON public.analiticas_eventos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_analiticas_created_at ON public.analiticas_eventos(created_at);

-- Habilitar RLS
ALTER TABLE public.analiticas_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Permitir inserción desde cualquier lugar (cliente/backend)
CREATE POLICY "Permitir inserción de eventos" ON public.analiticas_eventos
    FOR INSERT WITH CHECK (true);

-- Solo el productor dueño o admin puede ver sus analíticas
CREATE POLICY "Productores pueden ver sus propias analíticas" ON public.analiticas_eventos
    FOR SELECT USING (
        auth.uid() = productor_id OR 
        EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND (es_admin = true OR es_soporte = true))
    );
