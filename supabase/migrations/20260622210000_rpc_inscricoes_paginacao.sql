-- ============================================================
-- RPC: aca_get_inscricoes_filtradas (v3 — paginação)
-- Data: 2026-06-22
-- Descrição: Adiciona paginação (página/limite) e retorna total.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_inscricoes_filtradas(
    p_id_entidade UUID,
    p_id_area UUID DEFAULT NULL,
    p_ano_semestre TEXT DEFAULT NULL,
    p_busca TEXT DEFAULT NULL,
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
    -- Pergunta global da foto
    SELECT id INTO v_id_pergunta_foto
    FROM public.cmct_pergunta_form
    WHERE nome_interno = 'sua_foto' AND global = true
    LIMIT 1;

    v_offset := (p_pagina - 1) * p_limite;

    -- Contagem total
    SELECT COUNT(*) INTO v_total
    FROM public.aca_processo_seletivo_inscricoes ins
    JOIN public.user_expandido ue ON ue.id = ins.id_usuario
    JOIN public.aca_processo_seletivo ps ON ps.id = ins.id_processo AND ps.id_entidade = p_id_entidade
    JOIN public.aca_programa prog ON prog.id = ins.id_programa AND prog.id_entidade = p_id_entidade
    WHERE ins.id_entidade = p_id_entidade
      AND (p_id_area IS NULL OR prog.id_area = p_id_area)
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
          p_busca IS NULL
          OR ue.nome_completo ILIKE '%' || p_busca || '%'
          OR ue.email ILIKE '%' || p_busca || '%'
      );

    -- Itens paginados
    SELECT jsonb_agg(sub ORDER BY sub.criado_em DESC)
    INTO v_itens
    FROM (
        SELECT
            ins.id,
            ins.criado_em,
            ins.status_dados,
            ins.status_documentacao,
            ins.status_candidatura,
            ins.tipo_candidatura,
            ue.id AS id_usuario,
            ue.id_user AS id_auth,
            ue.nome_completo,
            ue.email,
            resp_foto.id_arquivo AS id_foto,
            prog.id AS id_programa,
            prog.descricao AS nome_display,
            a.nome_area,
            ps.id AS id_processo_seletivo,
            ps.nome_processo,
            (
                SELECT c.ano_semestre
                FROM public.aca_ciclo_programa cp
                JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
                WHERE cp.id_programa = prog.id
                ORDER BY c.data_ini ASC LIMIT 1
            ) AS ano_semestre
        FROM public.aca_processo_seletivo_inscricoes ins
        JOIN public.user_expandido ue ON ue.id = ins.id_usuario
        JOIN public.aca_processo_seletivo ps ON ps.id = ins.id_processo AND ps.id_entidade = p_id_entidade
        JOIN public.aca_programa prog ON prog.id = ins.id_programa AND prog.id_entidade = p_id_entidade
        LEFT JOIN public.aca_area a ON a.id = prog.id_area
        LEFT JOIN public.aca_resposta_form resp_foto
            ON resp_foto.id_user_expandido = ins.id_usuario
            AND resp_foto.id_pergunta = v_id_pergunta_foto
        WHERE ins.id_entidade = p_id_entidade
          AND (p_id_area IS NULL OR prog.id_area = p_id_area)
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
              p_busca IS NULL
              OR ue.nome_completo ILIKE '%' || p_busca || '%'
              OR ue.email ILIKE '%' || p_busca || '%'
          )
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
