-- ==========================================================================
-- 🔒 FIX RLS — ofertas_exclusivas (Mesa de Negociación)
-- ==========================================================================
-- Contexto / bug:
--   La única policy de UPDATE existente (oe_update) solo permite actualizar
--   al PRODUCTOR:
--       USING (auth.uid() = productor_id) WITH CHECK (auth.uid() = productor_id)
--
--   Pero el flujo del COMPRADOR en la UI hace UPDATEs sobre su propia oferta:
--     - handleReSubmitOffer()  → cambia monto_ofertado y estado='pendiente'
--                                 (renegociar / contraoferta)
--     - handleSendMessage()    → agrega a historial_chat (chat de negociación)
--
--   Como el comprador NO es el productor, RLS bloquea silenciosamente ambos
--   UPDATEs. Resultado: "la mesa de negociación ya no funciona" — el comprador
--   no puede renegociar ni mandar mensajes.
--
-- Solución:
--   Añadir una policy de UPDATE para el comprador SOBRE SU PROPIA oferta, pero
--   con un WITH CHECK que impida que el comprador se "auto-acepte" una oferta
--   (lo que le permitiría comprar a un precio negociado a su antojo). El
--   comprador solo puede dejar la oferta en 'pendiente' o 'rechazada'.
--   La aceptación sigue siendo exclusiva del productor (policy oe_update).
--
--   Como ambas son policies PERMISSIVE, Postgres combina los USING con OR y los
--   WITH CHECK con OR:
--     - Productor acepta (estado='aceptada')  → oe_update permite ✔
--     - Comprador renegocia (estado='pendiente') → oe_update_comprador permite ✔
--     - Comprador intenta auto-aceptar (estado='aceptada') → ninguna WITH CHECK
--       pasa → bloqueado ✔
-- ==========================================================================

BEGIN;

-- Nota: usamos (SELECT auth.uid()) en vez de auth.uid() para que el planner lo
-- evalúe una sola vez por query (optimización "initplan"), igual que el resto
-- de políticas tras la migración de hardening_y_rendimiento.
DROP POLICY IF EXISTS oe_update_comprador ON public.ofertas_exclusivas;
CREATE POLICY oe_update_comprador ON public.ofertas_exclusivas
    FOR UPDATE
    USING ((SELECT auth.uid()) = comprador_id)
    WITH CHECK (
        (SELECT auth.uid()) = comprador_id
        AND estado = ANY (ARRAY['pendiente'::text, 'rechazada'::text])
    );

COMMIT;
