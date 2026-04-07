-- ============================================================
-- RPCs para aca_modulo_componente
-- 1. aca_get_componentes_do_modulo  — lista componentes de um módulo
-- 2. aca_add_componente_ao_modulo   — adiciona/atualiza componente no módulo
-- 3. aca_remove_componente_do_modulo — remove componente do módulo
-- 4. aca_get_modulos_paginado       — atualizado com qtd_componentes
-- ============================================================


-- 1. aca_get_componentes_do_modulo
CREATE OR REPLACE FUNCTION public.aca_get_componentes_do_modulo(
    p_id_modulo uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id',              mc.id,
            'id_componente',   mc.id_componente,
            'nome_componente', c.nome_componente,
            'descricao',       c.descricao,
            'carga_horaria',   mc.carga_horaria,
            'ordem',           mc.ordem,
            'obrigatorio',     mc.obrigatorio
        ) ORDER BY mc.ordem ASC, c.nome_componente ASC
    )
    INTO v_result
    FROM public.aca_modulo_componente mc
    INNER JOIN public.aca_componente c ON c.id = mc.id_componente
    WHERE mc.id_modulo = p_id_modulo;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


-- 2. aca_add_componente_ao_modulo
CREATE OR REPLACE FUNCTION public.aca_add_componente_ao_modulo(
    p_id_modulo      uuid,
    p_id_componente  uuid,
    p_id_entidade    uuid,
    p_carga_horaria  integer DEFAULT NULL,
    p_ordem          integer DEFAULT 0,
    p_obrigatorio    boolean DEFAULT true,
    p_usuario_id     uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_existing_id uuid;
BEGIN
    SELECT id INTO v_existing_id
    FROM public.aca_modulo_componente
    WHERE id_modulo = p_id_modulo
      AND id_componente = p_id_componente;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.aca_modulo_componente
        SET
            carga_horaria  = COALESCE(p_carga_horaria, carga_horaria),
            ordem          = COALESCE(p_ordem, ordem),
            obrigatorio    = COALESCE(p_obrigatorio, obrigatorio),
            modificado_por = p_usuario_id,
            modificado_em  = NOW()
        WHERE id = v_existing_id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Componente atualizado no módulo',
            'id', v_existing_id
        );
    ELSE
        INSERT INTO public.aca_modulo_componente (
            id_modulo, id_componente, id_entidade,
            carga_horaria, ordem, obrigatorio,
            criado_por, criado_em, modificado_por, modificado_em
        ) VALUES (
            p_id_modulo, p_id_componente, p_id_entidade,
            p_carga_horaria, COALESCE(p_ordem, 0), COALESCE(p_obrigatorio, true),
            p_usuario_id, NOW(), p_usuario_id, NOW()
        );

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Componente adicionado ao módulo'
        );
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


-- 3. aca_remove_componente_do_modulo
CREATE OR REPLACE FUNCTION public.aca_remove_componente_do_modulo(
    p_id_modulo     uuid,
    p_id_componente uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    DELETE FROM public.aca_modulo_componente
    WHERE id_modulo = p_id_modulo
      AND id_componente = p_id_componente;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Associação não encontrada'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Componente removido do módulo'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


-- 4. aca_get_modulos_paginado — atualizado com qtd_componentes
CREATE OR REPLACE FUNCTION public.aca_get_modulos_paginado(
    p_id_entidade uuid,
    p_pagina      integer DEFAULT 1,
    p_limite      integer DEFAULT 20,
    p_busca       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_offset integer := (p_pagina - 1) * p_limite;
    v_result jsonb;
BEGIN
    WITH base AS (
        SELECT
            m.*,
            (SELECT COUNT(*) FROM public.aca_plano_de_aula WHERE id_modulo = m.id)       AS qtd_planos,
            (SELECT COUNT(*) FROM public.aca_modulo_componente WHERE id_modulo = m.id)    AS qtd_componentes,
            COUNT(*) OVER() AS total_registros
        FROM public.aca_modulo m
        WHERE m.id_entidade = p_id_entidade
          AND (
              p_busca IS NULL
              OR unaccent(m.nome_modulo) ILIKE unaccent('%' || p_busca || '%')
              OR unaccent(m.descricao)   ILIKE unaccent('%' || p_busca || '%')
          )
    ),
    ordenado AS (
        SELECT * FROM base
        ORDER BY nome_modulo ASC
        LIMIT p_limite OFFSET v_offset
    )
    SELECT jsonb_build_object(
        'pagina_atual', p_pagina,
        'qtd_total',    COALESCE(MAX(total_registros), 0),
        'itens',        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id',               id,
                    'nome_modulo',      nome_modulo,
                    'descricao',        descricao,
                    'carga_horaria',    carga_horaria,
                    'qtd_componentes',  qtd_componentes,
                    'qtd_planos',       qtd_planos,
                    'criado_em',        criado_em
                )
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;
END;
$$;
