-- =========================================================
-- TIANGUIS BEATS - PURCHASES & PROJECTS (v6.0)
-- =========================================================

-- 1) ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'failed'
    payment_intent_id TEXT, -- Stripe/PayPal ID
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL, -- Может ссылаться на beats.id, sound_kits.id или services.id
    product_type TEXT NOT NULL, -- 'beat', 'sound_kit', 'service', 'plan'
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    license_type TEXT, -- Для битов
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) SERVICE PROJECTS (Professional Service tracking)
CREATE TABLE IF NOT EXISTS public.service_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id),
    producer_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'paid', -- 'paid', 'requirements_sent', 'in_production', 'review', 'delivered', 'completed'
    requirements JSONB,
    final_delivery_url TEXT,
    delivery_date TIMESTAMPTZ,
    auto_release_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) PROJECT MESSGES (Chat System)
CREATE TABLE IF NOT EXISTS public.project_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.service_projects(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) PROJECT FILES (File Management)
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.service_projects(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES public.profiles(id),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'reference', 'final'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) RLS POLICIES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own order items" ON public.order_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

ALTER TABLE public.service_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can see project" ON public.service_projects FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = producer_id);
CREATE POLICY "Buyer can update requirements" ON public.service_projects FOR UPDATE 
USING (auth.uid() = buyer_id);
CREATE POLICY "Producer can update production status" ON public.service_projects FOR UPDATE 
USING (auth.uid() = producer_id);

ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can see messages" ON public.project_messages FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.service_projects WHERE id = project_id AND (buyer_id = auth.uid() OR producer_id = auth.uid())));
CREATE POLICY "Participants can insert messages" ON public.project_messages FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.service_projects WHERE id = project_id AND (buyer_id = auth.uid() OR producer_id = auth.uid())));

-- 6) BUCKETS
-- (You should create these in Supabase Dashboard or via API)
-- 'project-files' bucket
