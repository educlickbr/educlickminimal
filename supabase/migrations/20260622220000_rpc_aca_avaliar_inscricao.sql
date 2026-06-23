-- ============================================================
-- RPC: aca_avaliar_inscricao
-- Data: 2026-06-22
-- Descrição: Atualiza um campo de status da inscrição
--            (status_dados, status_documentacao, status_candidatura).
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
BEGIN
    -- Valida o campo
    IF p_campo NOT IN ('status_dados', 'status_documentacao', 'status_candidatura') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Campo inválido');
    END IF;

    -- Valida o valor
    IF p_valor NOT IN ('pendente', 'aprovado', 'reprovado') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Valor inválido');
    END IF;

    -- Atualização dinâmica
    EXECUTE format(
        'UPDATE public.aca_processo_seletivo_inscricoes SET %I = $1, modificado_em = now() WHERE id = $2',
        p_campo
    ) USING p_valor, p_id_inscricao;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Inscrição não encontrada');
    END IF;

    RETURN jsonb_build_object('success', true, 'campo', p_campo, 'valor', p_valor);
END;
$$;
