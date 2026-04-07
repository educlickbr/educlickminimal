-- ============================================================
-- RPCs para Gestão de Ciclos (Instâncias de Módulos)
-- Data: 2026-04-01
-- ============================================================

-- 1. Buscar Ciclos de um Programa
CREATE OR REPLACE FUNCTION public.aca_get_ciclos_do_programa(p_id_programa UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id_ciclo', c.id,
                'id_modulo', c.id_modulo,
                'nome_modulo', m.nome_modulo,
                'descricao', c.descricao,
                'data_ini', c.data_ini,
                'data_fim', c.data_fim,
                'id_vinculo', cp.id
            )
            ORDER BY c.data_ini ASC
        )
        FROM public.aca_ciclo_programa cp
        JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
        JOIN public.aca_modulo m ON m.id = c.id_modulo
        WHERE cp.id_programa = p_id_programa
    ), '[]'::jsonb);
END;
$$;

-- 2. Upsert Ciclo Completo (Cria Ciclo e já vincula ao Programa)
CREATE OR REPLACE FUNCTION public.aca_upsert_ciclo_v1(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_modulo UUID DEFAULT NULL,
    p_id_programa UUID DEFAULT NULL, -- Se enviado, faz o vínculo
    p_descricao TEXT DEFAULT NULL,
    p_data_ini DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id_ciclo UUID;
BEGIN
    IF p_id_entidade IS NULL OR p_id_modulo IS NULL THEN
        RAISE EXCEPTION 'ID da entidade e do módulo são obrigatórios';
    END IF;

    -- 1. Upsert no Ciclo
    INSERT INTO public.aca_ciclo (
        id,
        id_entidade,
        id_modulo,
        descricao,
        data_ini,
        data_fim,
        criado_por,
        modificado_por,
        modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade,
        p_id_modulo,
        p_descricao,
        p_data_ini,
        p_data_fim,
        p_usuario_id,
        p_usuario_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        id_modulo      = COALESCE(p_id_modulo, aca_ciclo.id_modulo),
        descricao     = COALESCE(p_descricao, aca_ciclo.descricao),
        data_ini      = COALESCE(p_data_ini, aca_ciclo.data_ini),
        data_fim      = COALESCE(p_data_fim, aca_ciclo.data_fim),
        modificado_por = p_usuario_id,
        modificado_em  = NOW()
    RETURNING id INTO v_id_ciclo;

    -- 2. Vincular ao Programa (se solicitado)
    IF p_id_programa IS NOT NULL THEN
        INSERT INTO public.aca_ciclo_programa (id_ciclo, id_programa, id_entidade, criado_por)
        VALUES (v_id_ciclo, p_id_programa, p_id_entidade, p_usuario_id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_id_ciclo,
        'message', 'Ciclo salvo com sucesso'
    );
END;
$$;
