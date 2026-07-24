-- ============================================================
-- RPCs: aca_atribuicao_docente — CRUD de atribuições
-- Data: 2026-07-24
-- Descrição: Funções para gerenciar vínculo de docentes a
--            (ciclo × módulo_componente) com papel (titular,
--            substituto, auxiliar).
-- ============================================================

-- -------------------------------------------------------
-- RPC: aca_listar_atribuicoes
-- Descrição: Lista atribuições de docentes filtradas por
--            programa ou ciclo, com dados do docente e
--            componente.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_listar_atribuicoes(
    p_id_entidade UUID,
    p_id_programa UUID DEFAULT NULL,
    p_id_ciclo UUID DEFAULT NULL,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_offset INTEGER;
    v_itens JSONB;
    v_total INTEGER;
    v_ciclo_ids UUID[];
BEGIN
    v_offset := (p_pagina - 1) * p_limite;

    -- Determinar quais ciclos considerar
    IF p_id_ciclo IS NOT NULL THEN
        v_ciclo_ids := ARRAY[p_id_ciclo];
    ELSIF p_id_programa IS NOT NULL THEN
        SELECT array_agg(cp.id_ciclo) INTO v_ciclo_ids
        FROM public.aca_ciclo_programa cp
        WHERE cp.id_programa = p_id_programa;
    ELSE
        -- Todos os ciclos da entidade
        SELECT array_agg(c.id) INTO v_ciclo_ids
        FROM public.aca_ciclo c
        WHERE c.id_entidade = p_id_entidade;
    END IF;

    -- Total
    SELECT COUNT(*) INTO v_total
    FROM public.aca_docente_modulo_componente_ciclo ad
    WHERE ad.id_ciclo = ANY(v_ciclo_ids);

    -- Itens paginados
    SELECT jsonb_agg(sub ORDER BY sub.nome_modulo, sub.nome_componente, sub.tipo)
    INTO v_itens
    FROM (
        SELECT jsonb_build_object(
            'id', ad.id,
            'id_ciclo', ad.id_ciclo,
            'id_modulo_componente', ad.id_modulo_componente,
            'id_docente', ad.id_docente,
            'tipo', ad.tipo,
            'docente_nome', COALESCE(uex.nome_completo, '—'),
            'docente_email', uex.email,
            'componente_nome', c.nome_componente,
            'modulo_nome', m.nome_modulo,
            'ciclo_descricao', COALESCE(ci.descricao, '—'),
            'primario', CASE WHEN ad.tipo = 'titular' THEN true ELSE false END,
            'criado_em', ad.criado_em,
            'modificado_em', ad.modificado_em
        ) AS sub,
        m.nome_modulo,
        c.nome_componente,
        ad.tipo
        FROM public.aca_docente_modulo_componente_ciclo ad
        INNER JOIN public.aca_ciclo ci ON ci.id = ad.id_ciclo
        INNER JOIN public.aca_modulo m ON m.id = ci.id_modulo
        INNER JOIN public.aca_modulo_componente mc ON mc.id = ad.id_modulo_componente
        INNER JOIN public.aca_componente c ON c.id = mc.id_componente
        LEFT JOIN public.aca_docente d ON d.id = ad.id_docente
        LEFT JOIN public.user_expandido uex ON uex.id = d.id_user_expandido
        WHERE ad.id_ciclo = ANY(v_ciclo_ids)
        ORDER BY m.nome_modulo, c.nome_componente, ad.tipo
        LIMIT p_limite OFFSET v_offset
    ) sub;

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_itens, '[]'::jsonb),
        'total', v_total
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- -------------------------------------------------------
-- RPC: aca_atribuir_docente_ciclo
-- Descrição: Cria ou atualiza atribuição de um docente a
--            um (ciclo, modulo_componente). Se já existe
--            atribuição para este docente, atualiza o tipo.
--            Retorna o id da atribuição.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_atribuir_docente_ciclo(
    p_id_ciclo UUID,
    p_id_modulo_componente UUID,
    p_id_docente UUID,
    p_tipo TEXT DEFAULT 'titular',
    p_usuario_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_existing_id UUID;
BEGIN
    -- Valida tipo
    IF p_tipo NOT IN ('titular', 'substituto', 'auxiliar') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Tipo inválido. Use: titular, substituto ou auxiliar.'
        );
    END IF;

    -- Verifica se já existe atribuição para este docente
    SELECT id INTO v_existing_id
    FROM public.aca_docente_modulo_componente_ciclo
    WHERE id_ciclo = p_id_ciclo
      AND id_modulo_componente = p_id_modulo_componente
      AND id_docente = p_id_docente;

    IF v_existing_id IS NOT NULL THEN
        -- Atualiza tipo
        UPDATE public.aca_docente_modulo_componente_ciclo
        SET tipo = p_tipo,
            modificado_por = p_usuario_id,
            modificado_em = NOW()
        WHERE id = v_existing_id;

        RETURN jsonb_build_object(
            'success', true,
            'id', v_existing_id,
            'message', 'Atribuição atualizada com sucesso.'
        );
    ELSE
        -- Cria nova
        INSERT INTO public.aca_docente_modulo_componente_ciclo (
            id_ciclo, id_modulo_componente, id_docente, tipo,
            criado_por, modificado_por
        ) VALUES (
            p_id_ciclo, p_id_modulo_componente, p_id_docente, p_tipo,
            p_usuario_id, p_usuario_id
        ) RETURNING id INTO v_existing_id;

        RETURN jsonb_build_object(
            'success', true,
            'id', v_existing_id,
            'message', 'Atribuição criada com sucesso.'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- -------------------------------------------------------
-- RPC: aca_remover_atribuicao_docente
-- Descrição: Remove uma atribuição de docente do ciclo.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_remover_atribuicao_docente(
    p_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    DELETE FROM public.aca_docente_modulo_componente_ciclo
    WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Atribuição não encontrada.'
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Atribuição removida com sucesso.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- -------------------------------------------------------
-- RPC: aca_get_modulos_componentes_por_programa
-- Descrição: Retorna todos os (módulo, componente) de um
--            programa, organizados por ciclo, pronto para
--            serem usados na UI de atribuição.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_modulos_componentes_por_programa(
    p_id_programa UUID,
    p_id_entidade UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id_ciclo', ci.id,
            'ciclo_descricao', COALESCE(ci.descricao, 'Ciclo'),
            'modulo_nome', m.nome_modulo,
            'data_ini', ci.data_ini,
            'data_fim', ci.data_fim,
            'componentes', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id_modulo_componente', mc.id,
                        'componente_nome', c.nome_componente,
                        'carga_horaria', mc.carga_horaria,
                        'obrigatorio', mc.obrigatorio,
                        'docentes', COALESCE((
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id_atribuicao', ad.id,
                                    'id_docente', ad.id_docente,
                                    'docente_nome', COALESCE(uex.nome_completo, '—'),
                                    'docente_email', uex.email,
                                    'tipo', ad.tipo
                                ) ORDER BY ad.tipo
                            )
                            FROM public.aca_docente_modulo_componente_ciclo ad
                            LEFT JOIN public.aca_docente d ON d.id = ad.id_docente
                            LEFT JOIN public.user_expandido uex ON uex.id = d.id_user_expandido
                            WHERE ad.id_ciclo = ci.id
                              AND ad.id_modulo_componente = mc.id
                        ), '[]'::jsonb)
                    ) ORDER BY mc.ordem, c.nome_componente
                )
                FROM public.aca_modulo_componente mc
                INNER JOIN public.aca_componente c ON c.id = mc.id_componente
                WHERE mc.id_modulo = ci.id_modulo
                  AND mc.id_entidade = p_id_entidade
            )
        ) ORDER BY ci.data_ini, ci.descricao
    ) INTO v_result
    FROM public.aca_ciclo ci
    INNER JOIN public.aca_ciclo_programa cp ON cp.id_ciclo = ci.id
    INNER JOIN public.aca_modulo m ON m.id = ci.id_modulo
    WHERE cp.id_programa = p_id_programa;

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_result, '[]'::jsonb)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- -------------------------------------------------------
-- RPC: aca_get_docentes_por_entidade
-- Descrição: Lista docentes ativos de uma entidade para
--            usar nos dropdowns de atribuição.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_docentes_por_entidade(
    p_id_entidade UUID,
    p_busca TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', d.id,
            'id_user_expandido', d.id_user_expandido,
            'nome', COALESCE(uex.nome_completo, '—'),
            'email', uex.email
        ) ORDER BY uex.nome_completo
    ) INTO v_itens
    FROM public.aca_docente d
    INNER JOIN public.user_expandido uex ON uex.id = d.id_user_expandido
    WHERE d.id_entidade = p_id_entidade
      AND d.ativo = true
      AND (
          p_busca IS NULL
          OR uex.nome_completo ILIKE '%' || p_busca || '%'
          OR uex.email ILIKE '%' || p_busca || '%'
      );

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_itens, '[]'::jsonb)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
