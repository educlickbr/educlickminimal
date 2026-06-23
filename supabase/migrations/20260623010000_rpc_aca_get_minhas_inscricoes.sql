-- ============================================================
-- RPC: aca_get_minhas_inscricoes
-- Data: 2026-06-23
-- Descrição: Retorna as inscrições do próprio aluno logado
--            (auth.uid() → user_expandido), com dados do processo,
--            programa, área, ano_semestre, turno e status.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_minhas_inscricoes(
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_user_expandido_id UUID;
    v_total INTEGER;
    v_offset INTEGER;
    v_itens JSONB;
BEGIN
    -- 1. Resolver o user_expandido_id a partir do auth.uid()
    SELECT id INTO v_user_expandido_id
    FROM public.user_expandido
    WHERE id_user = auth.uid()
    LIMIT 1;

    IF v_user_expandido_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuário não encontrado'
        );
    END IF;

    v_offset := (p_pagina - 1) * p_limite;

    -- 2. Contar total
    SELECT COUNT(*)
    INTO v_total
    FROM public.aca_processo_seletivo_inscricoes ins
    WHERE ins.id_usuario = v_user_expandido_id;

    -- 3. Buscar itens paginados
    SELECT jsonb_agg(sub ORDER BY sub.criado_em DESC)
    INTO v_itens
    FROM (
        SELECT
            ins.id AS id_inscricao,
            ins.criado_em AS data_inscricao,
            ins.status_dados,
            ins.status_documentacao,
            ins.status_candidatura,
            ins.tipo_candidatura,
            ps.id AS id_processo_seletivo,
            ps.nome_processo,
            prog.id AS id_programa,
            prog.descricao AS nome_curso,
            a.nome_area,
            (
                SELECT c.ano_semestre
                FROM public.aca_ciclo_programa cp
                JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
                WHERE cp.id_programa = prog.id
                ORDER BY c.data_ini ASC
                LIMIT 1
            ) AS ano_semestre,
            (
                SELECT c.turno::text
                FROM public.aca_ciclo_programa cp
                JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
                WHERE cp.id_programa = prog.id
                ORDER BY c.data_ini ASC
                LIMIT 1
            ) AS turno
        FROM public.aca_processo_seletivo_inscricoes ins
        JOIN public.aca_processo_seletivo ps ON ps.id = ins.id_processo
        JOIN public.aca_programa prog ON prog.id = ins.id_programa
        LEFT JOIN public.aca_area a ON a.id = prog.id_area
        WHERE ins.id_usuario = v_user_expandido_id
        ORDER BY ins.criado_em DESC
        OFFSET v_offset
        LIMIT p_limite
    ) sub;

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_itens, '[]'::jsonb),
        'total', v_total,
        'pagina', p_pagina,
        'limite', p_limite
    );
END;
$$;
