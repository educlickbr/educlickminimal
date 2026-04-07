-- ======================================================
-- BUGFIX: Replace ux_criado.nome with ux_criado.nome_completo
-- Context: The user_expandido table has nome_completo, not nome/sobrenome.
-- ======================================================

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
            COALESCE(ux_criado.nome_completo, ux_criado.email) as criado_por_nome,
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
