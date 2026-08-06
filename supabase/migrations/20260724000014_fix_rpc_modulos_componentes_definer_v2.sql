-- ============================================================
-- Migration: 20260724000014 — fix aca_get_modulos_componentes v2
-- Descrição: Recria com SECURITY DEFINER, mantendo a query
--            ORIGINAL da versão que funciona (20260724000001).
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_modulos_componentes_por_programa(
    p_id_programa UUID,
    p_id_entidade UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.aca_get_modulos_componentes_por_programa(UUID, UUID) TO authenticated;
