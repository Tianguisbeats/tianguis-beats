CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR,
    nombre VARCHAR,
    email VARCHAR,
    mensaje TEXT,
    user_id UUID REFERENCES public.profiles(id),
    estado VARCHAR DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to feedback"
    ON public.feedback
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow admin read feedback"
    ON public.feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );
    
CREATE POLICY "Allow admin update feedback"
    ON public.feedback
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );
