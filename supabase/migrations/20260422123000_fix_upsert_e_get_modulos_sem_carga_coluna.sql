-- ============================================================
-- RPC: aca_upsert_modulo + aca_get_modulos_paginado
-- Data: 2026-04-22
-- Descrição:
--   - aca_upsert_modulo:  remove referência à coluna carga_horaria
--     (que não é mais a fonte verdade; a carga é a soma dos componentes)
--   - aca_get_modulos_paginado: retorna carga_horaria como SUM dos
--     componentes em aca_modulo_componente, ignorando a coluna legada.
-- ============================================================


-- 1. UPSERT MODULO — sem carga_horaria (calculada pelos componentes)
CREATE OR REPLACE FUNCTION public.aca_upsert_modulo(
    p_id          UUID    DEFAULT NULL,
    p_id_entidade UUID    DEFAULT NULL,
    p_nome_modulo TEXT    DEFAULT NULL,
    p_descricao   TEXT    DEFAULT NULL,
    p_carga_horaria INTEGER DEFAULT NULL,   -- parâmetro mantido por compatibilidade, mas ignorado no INSERT/UPDATE
    p_usuario_id  UUID    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id_entidade IS NULL THEN
        RAISE EXCEPTION 'ID da entidade é obrigatório';
    END IF;

    IF p_nome_modulo IS NULL AND p_id IS NULL THEN
        RAISE EXCEPTION 'Nome do módulo é obrigatório para novos registros';
    END IF;

    INSERT INTO public.aca_modulo (
        id,
        id_entidade,
        nome_modulo,
        descricao,
        -- carga_horaria não é mais gravada aqui; é calculada pela soma dos componentes
        criado_por,
        modificado_por,
        modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade,
        p_nome_modulo,
        p_descricao,
        p_usuario_id,
        p_usuario_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        nome_modulo    = COALESCE(p_nome_modulo, aca_modulo.nome_modulo),
        descricao      = COALESCE(p_descricao,   aca_modulo.descricao),
        -- carga_horaria não é atualizada aqui propositalmente
        modificado_por = p_usuario_id,
        modificado_em  = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true,
        'id',      v_id,
        'message', 'Módulo salvo com sucesso'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;


-- 2. GET MODULOS PAGINADO — carga calculada via componentes
CREATE OR REPLACE FUNCTION public.aca_get_modulos_paginado(
    p_id_entidade uuid,
    p_pagina      integer DEFAULT 1,
    p_limite      integer DEFAULT 20,
    p_busca       text    DEFAULT NULL
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
            m.id,
            m.nome_modulo,
            m.descricao,
            m.criado_em,
            m.id_entidade,
            -- carga horária calculada como soma dos componentes vinculados
            COALESCE((
                SELECT SUM(mc.carga_horaria)
                FROM public.aca_modulo_componente mc
                WHERE mc.id_modulo = m.id
            ), 0) AS carga_horaria,
            (SELECT COUNT(*) FROM public.aca_plano_de_aula      WHERE id_modulo = m.id) AS qtd_planos,
            (SELECT COUNT(*) FROM public.aca_modulo_componente  WHERE id_modulo = m.id) AS qtd_componentes,
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
                    'id',              id,
                    'nome_modulo',     nome_modulo,
                    'descricao',       descricao,
                    'carga_horaria',   carga_horaria,
                    'qtd_componentes', qtd_componentes,
                    'qtd_planos',      qtd_planos,
                    'criado_em',       criado_em
                )
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
