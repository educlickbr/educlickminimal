-- ======================================================
-- REFACTOR: Substituição de id_empresa por id_entidade
-- ======================================================

-- 1. Modificação das Tabelas Acadêmicas
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'aca_componente',
        'aca_modulo',
        'aca_carga_horaria',
        'aca_curso',
        'aca_curso_modulo',
        'aca_plano_de_aula',
        'aca_ref_plano_de_aula',
        'aca_programa',
        'aca_ciclo',
        'aca_ciclo_programa',
        'aca_ciclo_dia_semana',
        'aca_calendario'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Adiciona a nova coluna
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS id_entidade UUID REFERENCES public.user_entidades(id) ON DELETE CASCADE', t);
        
        -- Remove a coluna antiga e sua constraint de FK associada
        EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS id_empresa', t);
        
        -- Define como NOT NULL (Ajuste se houver dados pré-existentes que não foram mapeados)
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id_entidade SET NOT NULL', t);
    END LOOP;
END $$;

-- ======================================================
-- 2. Atualização dos RPCs (Substituindo id_empresa por id_entidade)
-- ======================================================

-- Limpar funções antigas antes de recriar (evita conflitos de assinatura/parâmetros nomeados)
DROP FUNCTION IF EXISTS public.aca_upsert_componente(UUID, UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.aca_get_componentes_paginado(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.aca_delete_componente(UUID, UUID);

-- Atualizar UPSERT COMPONENTE
CREATE OR REPLACE FUNCTION public.aca_upsert_componente(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_nome_componente TEXT DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_result JSONB;
BEGIN
    IF p_id_entidade IS NULL THEN
        RAISE EXCEPTION 'ID da entidade é obrigatório';
    END IF;

    IF p_nome_componente IS NULL AND p_id IS NULL THEN
        RAISE EXCEPTION 'Nome do componente é obrigatório para novos registros';
    END IF;

    INSERT INTO public.aca_componente (
        id,
        id_entidade,
        nome_componente,
        descricao,
        criado_por,
        modificado_por,
        modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade,
        p_nome_componente,
        p_descricao,
        p_usuario_id,
        p_usuario_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        nome_componente = COALESCE(p_nome_componente, aca_componente.nome_componente),
        descricao = COALESCE(p_descricao, aca_componente.descricao),
        modificado_por = p_usuario_id,
        modificado_em = NOW()
    RETURNING id INTO v_id;

    SELECT jsonb_build_object(
        'success', true,
        'id', v_id,
        'message', 'Componente salvo com sucesso'
    ) INTO v_result;

    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;

-- Atualizar GET COMPONENTES PAGINADO
CREATE OR REPLACE FUNCTION public.aca_get_componentes_paginado(
    p_id_entidade UUID,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20,
    p_busca TEXT DEFAULT NULL,
    p_ordenar_por TEXT DEFAULT 'nome_componente',
    p_ordenar_como TEXT DEFAULT 'ASC'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_offset INTEGER := (p_pagina - 1) * p_limite;
    v_result JSONB;
BEGIN
    WITH base AS (
        SELECT 
            c.*,
            COALESCE(ux_criado.nome || ' ' || ux_criado.sobrenome, ux_criado.email) as criado_por_nome,
            COUNT(*) OVER() AS total_registros
        FROM public.aca_componente c
        LEFT JOIN public.user_expandido ux_criado ON ux_criado.id = c.criado_por
        WHERE c.id_entidade = p_id_entidade
          AND (
            p_busca IS NULL 
            OR unaccent(c.nome_componente) ILIKE unaccent('%' || p_busca || '%')
            OR unaccent(c.descricao) ILIKE unaccent('%' || p_busca || '%')
          )
    ),
    ordenado AS (
        SELECT * FROM base
        ORDER BY
            CASE WHEN p_ordenar_como = 'ASC' AND p_ordenar_por = 'nome_componente' THEN nome_componente END ASC,
            CASE WHEN p_ordenar_como = 'DESC' AND p_ordenar_por = 'nome_componente' THEN nome_componente END DESC,
            CASE WHEN p_ordenar_como = 'ASC' AND p_ordenar_por = 'criado_em' THEN criado_em END ASC,
            CASE WHEN p_ordenar_como = 'DESC' AND p_ordenar_por = 'criado_em' THEN criado_em END DESC,
            nome_componente ASC
        LIMIT p_limite OFFSET v_offset
    )
    SELECT jsonb_build_object(
        'pagina_atual', p_pagina,
        'qtd_paginas', CEIL(COALESCE(MAX(total_registros), 0) / p_limite::numeric),
        'qtd_total', COALESCE(MAX(total_registros), 0),
        'itens', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'id_entidade', id_entidade,
                    'nome_componente', nome_componente,
                    'descricao', descricao,
                    'criado_por', criado_por,
                    'criado_por_nome', criado_por_nome,
                    'criado_em', criado_em,
                    'modificado_em', modificado_em
                )
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;
END;
$$;

-- Atualizar DELETE COMPONENTE
CREATE OR REPLACE FUNCTION public.aca_delete_componente(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_id UUID;
BEGIN
    DELETE FROM public.aca_componente
    WHERE id = p_id 
      AND id_entidade = p_id_entidade
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Componente não encontrado ou sem permissão para excluir'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_deleted_id,
        'message', 'Componente excluído com sucesso'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;
