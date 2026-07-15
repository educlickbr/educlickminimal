-- ============================================================
-- Migration: 20260713100013 — Add convite_enviado
-- ============================================================
ALTER TABLE public.aca_docente_convite
ADD COLUMN IF NOT EXISTS convite_enviado BOOLEAN NOT NULL DEFAULT false;

-- RPC para marcar convite como enviado
CREATE OR REPLACE FUNCTION public.aca_marcar_convite_enviado(
    p_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE public.aca_docente_convite
    SET convite_enviado = true
    WHERE id = p_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_marcar_convite_enviado(UUID) TO authenticated;
