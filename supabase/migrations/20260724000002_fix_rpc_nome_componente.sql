-- ============================================================
-- Migration: 20260724000002 — fix RPCs column nome → nome_componente
-- + nova RPC para filtrar docentes por componente (vínculo)
-- ============================================================

-- -------------------------------------------------------
-- 1. Corrige aca_get_componentes_para_vinculo
--    Coluna 'nome' não existe → usar nome_componente AS nome
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_componentes_para_vinculo(
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.nome), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT id, nome_componente AS nome
        FROM public.aca_componente
        WHERE id_entidade = p_id_entidade
        ORDER BY nome_componente
    ) sub;

    RETURN JSONB_BUILD_OBJECT('success', true, 'itens', v_itens);
END;
$$;

-- -------------------------------------------------------
-- 2. Corrige aca_get_vinculos_docente
--    Usar nome_componente ao invés de nome
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_vinculos_docente(
    p_id_docente UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.componente_nome), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            dv.id,
            dv.id_componente,
            comp.nome_componente AS componente_nome,
            dv.elegivel
        FROM public.aca_docente_vinculo dv
        JOIN public.aca_componente comp ON comp.id = dv.id_componente
        WHERE dv.id_docente = p_id_docente
    ) sub;

    RETURN JSONB_BUILD_OBJECT('success', true, 'itens', v_itens);
END;
$$;

-- -------------------------------------------------------
-- 3. Atualiza aca_get_modulos_componentes_por_programa
--    para retornar id_componente (necessário para filtrar
--    docentes elegíveis por vínculo).
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
                        'id_componente', mc.id_componente,
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
-- 4. aca_get_docentes_por_entidade com filtro opcional
--    por componente (via aca_docente_vinculo)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_docentes_por_entidade(
    p_id_entidade UUID,
    p_busca TEXT DEFAULT NULL,
    p_id_componente UUID DEFAULT NULL
)
RETURNS JSONB
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
      )
      -- Se um componente foi especificado, filtra apenas docentes
      -- que têm vínculo (aca_docente_vinculo) com ele
      AND (
          p_id_componente IS NULL
          OR EXISTS (
              SELECT 1 FROM public.aca_docente_vinculo dv
              WHERE dv.id_docente = d.id
                AND dv.id_componente = p_id_componente
                AND dv.elegivel = true
          )
      );

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_itens, '[]'::jsonb)
    );
END;
$$;
