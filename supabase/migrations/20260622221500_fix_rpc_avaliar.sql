-- ============================================================
-- RPC: aca_avaliar_inscricao (CORREÇÃO)
-- Data: 2026-06-22
-- Descrição: Corrige verificação de existência — EXECUTE não
--            seta FOUND, então usamos SELECT EXISTS antes.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_avaliar_inscricao(
    p_id_inscricao UUID,
    p_campo TEXT,
    p_valor TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_existe BOOLEAN;
BEGIN
    IF p_campo NOT IN ('status_dados', 'status_documentacao', 'status_candidatura') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Campo inválido');
    END IF;

    IF p_valor NOT IN ('pendente', 'aprovado', 'reprovado') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Valor inválido');
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.aca_processo_seletivo_inscricoes WHERE id = p_id_inscricao
    ) INTO v_existe;

    IF NOT v_existe THEN
        RETURN jsonb_build_object('success', false, 'message', 'Inscrição não encontrada');
    END IF;

    EXECUTE format(
        'UPDATE public.aca_processo_seletivo_inscricoes SET %I = $1, modificado_em = now() WHERE id = $2',
        p_campo
    ) USING p_valor, p_id_inscricao;

    RETURN jsonb_build_object('success', true, 'campo', p_campo, 'valor', p_valor);
END;
$$;
