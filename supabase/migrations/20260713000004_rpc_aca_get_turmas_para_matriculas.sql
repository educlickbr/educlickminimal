-- ============================================================
-- Migration: RPC aca_get_turmas_para_matriculas
-- Data: 2026-07-13
-- Descrição: Retorna as turmas (ciclos) disponíveis para filtro
--            na página de matrículas. Lista turmas vinculadas a
--            programas da entidade.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_turmas_para_matriculas(
    p_id_entidade UUID
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
            'id', c.id,
            'nome_turma', c.descricao,
            'ano_semestre', c.ano_semestre,
            'programa_descricao', prog.descricao,
            'nome_area', a.nome_area
        )
        ORDER BY c.data_ini DESC
    ) INTO v_itens
    FROM public.aca_ciclo c
    JOIN public.aca_ciclo_programa cp ON cp.id_ciclo = c.id
    JOIN public.aca_programa prog ON prog.id = cp.id_programa AND prog.id_entidade = p_id_entidade
    LEFT JOIN public.aca_area a ON a.id = prog.id_area
    WHERE c.id_entidade = p_id_entidade
      -- Só turmas vinculadas a programas que têm matrículas
      AND EXISTS (
          SELECT 1 FROM public.aca_matricula m
          WHERE m.id_programa = prog.id
      )
    GROUP BY c.id, c.descricao, c.ano_semestre, c.data_ini
    ORDER BY c.data_ini DESC;

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_itens, '[]'::jsonb)
    );
END;
$$;
