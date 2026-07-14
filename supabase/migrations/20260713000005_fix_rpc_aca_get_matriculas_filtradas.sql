-- ============================================================
-- Fix: RPC aca_get_matriculas_filtradas — corrige ORDER BY
-- Data: 2026-07-13
-- Descrição: O ORDER BY no jsonb_agg referenciava m.criado_em
--            mas 'm' não é visível no outer query. Corrigido
--            para sub.criado_em (alias da subquery).
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_matriculas_filtradas(
    p_id_entidade UUID,
    p_id_area UUID DEFAULT NULL,
    p_ano_semestre TEXT DEFAULT NULL,
    p_id_turma UUID DEFAULT NULL,
    p_busca TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id_pergunta_foto UUID;
    v_offset INTEGER;
    v_total INTEGER;
    v_itens JSONB;
BEGIN
    -- Pergunta global da foto (mesma usada em processos)
    SELECT id INTO v_id_pergunta_foto
    FROM public.cmct_pergunta_form
    WHERE nome_interno = 'sua_foto' AND global = true
    LIMIT 1;

    v_offset := (p_pagina - 1) * p_limite;

    -- Contagem total
    SELECT COUNT(*) INTO v_total
    FROM public.aca_matricula m
    JOIN public.user_expandido ue ON ue.id = m.id_usuario
    JOIN public.aca_programa prog ON prog.id = m.id_programa AND prog.id_entidade = p_id_entidade
    LEFT JOIN public.aca_area a ON a.id = prog.id_area
    WHERE m.id_entidade = p_id_entidade
      AND (p_id_area IS NULL OR prog.id_area = p_id_area)
      AND (p_status IS NULL OR m.status = p_status)
      AND (
          p_ano_semestre IS NULL
          OR EXISTS (
              SELECT 1 FROM public.aca_ciclo_programa cp
              JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
              WHERE cp.id_programa = prog.id AND c.ano_semestre = p_ano_semestre
              ORDER BY c.data_ini ASC LIMIT 1
          )
      )
      AND (
          p_id_turma IS NULL
          OR EXISTS (
              SELECT 1 FROM public.aca_ciclo_programa cp
              WHERE cp.id_programa = prog.id AND cp.id_ciclo = p_id_turma
          )
      )
      AND (
          p_busca IS NULL
          OR ue.nome_completo ILIKE '%' || p_busca || '%'
          OR ue.email ILIKE '%' || p_busca || '%'
      );

    -- Itens paginados (corrigido: ORDER BY usa sub.criado_em, não m.criado_em)
    SELECT jsonb_agg(sub ORDER BY sub.criado_em DESC)
    INTO v_itens
    FROM (
        SELECT
            m.id,
            m.id_programa,
            m.id_usuario,
            m.id_pedido,
            m.status,
            m.declaracao_matricula,
            m.criado_em,

            ue.nome_completo,
            ue.email,
            resp_foto.id_arquivo AS id_foto,

            prog.descricao AS programa_descricao,
            a.nome_area,

            -- Primeira turma do programa (para exibição no card)
            (
                SELECT jsonb_build_object(
                    'id_turma', c.id,
                    'nome_turma', c.descricao,
                    'ano_semestre', c.ano_semestre
                )
                FROM public.aca_ciclo_programa cp
                JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
                WHERE cp.id_programa = prog.id
                ORDER BY c.data_ini ASC
                LIMIT 1
            ) AS turma,

            -- Ano/semestre do programa (para filtro)
            (
                SELECT c.ano_semestre
                FROM public.aca_ciclo_programa cp
                JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
                WHERE cp.id_programa = prog.id
                ORDER BY c.data_ini ASC
                LIMIT 1
            ) AS ano_semestre,

            -- Valor pago (se veio de pedido)
            pd.valor_pago_centavos,
            pd.status AS pedido_status

        FROM public.aca_matricula m
        JOIN public.user_expandido ue ON ue.id = m.id_usuario
        JOIN public.aca_programa prog ON prog.id = m.id_programa AND prog.id_entidade = p_id_entidade
        LEFT JOIN public.aca_area a ON a.id = prog.id_area
        LEFT JOIN public.com_pedido pd ON pd.id = m.id_pedido
        LEFT JOIN public.aca_resposta_form resp_foto
            ON resp_foto.id_user_expandido = m.id_usuario
            AND resp_foto.id_pergunta = v_id_pergunta_foto
        WHERE m.id_entidade = p_id_entidade
          AND (p_id_area IS NULL OR prog.id_area = p_id_area)
          AND (p_status IS NULL OR m.status = p_status)
          AND (
              p_ano_semestre IS NULL
              OR EXISTS (
                  SELECT 1 FROM public.aca_ciclo_programa cp
                  JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
                  WHERE cp.id_programa = prog.id AND c.ano_semestre = p_ano_semestre
                  ORDER BY c.data_ini ASC LIMIT 1
              )
          )
          AND (
              p_id_turma IS NULL
              OR EXISTS (
                  SELECT 1 FROM public.aca_ciclo_programa cp
                  WHERE cp.id_programa = prog.id AND cp.id_ciclo = p_id_turma
              )
          )
          AND (
              p_busca IS NULL
              OR ue.nome_completo ILIKE '%' || p_busca || '%'
              OR ue.email ILIKE '%' || p_busca || '%'
          )
        ORDER BY m.criado_em DESC
        LIMIT p_limite OFFSET v_offset
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
