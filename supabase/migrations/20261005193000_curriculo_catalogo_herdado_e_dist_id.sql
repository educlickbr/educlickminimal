-- ============================================================
-- RPC: lms_get_curriculo_conteudos
-- Data: 2026-10-05
-- Descrição:
--   Atualiza lms_get_curriculo_conteudos para devolver herdado e dist_id
--   tanto no array de conteudos (árvore) quanto no catalogo (navegador).
--   Permite que o navegador exiba o check de itens da distribuição
--   com total fidelidade e que seja possível desassociar.
-- ============================================================

DROP FUNCTION IF EXISTS public.lms_get_curriculo_conteudos(UUID, UUID, TEXT, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.lms_get_curriculo_conteudos(UUID, UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.lms_get_curriculo_conteudos(
    p_id_programa UUID,
    p_id_entidade UUID,
    p_escopo_tipo TEXT,
    p_escopo_id UUID,
    p_incluir_catalogo BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_conteudos JSONB;
    v_catalogo JSONB := '[]'::JSONB;
BEGIN
    -- 1. Lista curta da árvore (conteúdos do escopo)
    WITH escopo_operacional AS MATERIALIZED (
        SELECT op.*
        FROM public.lms_conteudo_operacional op
        WHERE op.id_entidade = p_id_entidade
          AND op.id_programa = p_id_programa
          AND (
              (p_escopo_tipo = 'programa' AND op.id_area IS NULL AND op.id_componente IS NULL AND op.id_modulo IS NULL AND op.id_ciclo IS NULL AND op.id_calendario IS NULL)
              OR (p_escopo_tipo = 'area' AND op.id_area = p_escopo_id)
              OR (p_escopo_tipo = 'componente' AND op.id_componente = p_escopo_id)
              OR (p_escopo_tipo = 'modulo' AND op.id_modulo = p_escopo_id)
              OR (p_escopo_tipo = 'ciclo' AND op.id_ciclo = p_escopo_id)
              OR (p_escopo_tipo = 'calendario' AND op.id_calendario = p_escopo_id)
          )
    ),
    escopo_distribuicao AS MATERIALIZED (
        SELECT d.id AS dist_id, d.id_conteudo
        FROM public.lms_distribuicao d
        WHERE d.id_entidade = p_id_entidade
          AND (
              (p_escopo_tipo = 'area' AND d.id_area = p_escopo_id)
              OR (p_escopo_tipo = 'componente' AND d.id_componente = p_escopo_id)
              OR (p_escopo_tipo = 'modulo' AND d.id_modulo = p_escopo_id)
          )
    ),
    fonte AS (
        SELECT
            op.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
            op.ativo, COALESCE(op.destaque, false) AS destaque,
            false AS herdado, op.id AS op_id, dist.dist_id AS dist_id,
            op.data_disponivel, op.data_entrega_limite, op.duracao_minutos,
            op.tentativas_permitidas, op.pontuacao_maxima, 0 AS prioridade
        FROM escopo_operacional op
        JOIN public.lms_conteudo c ON c.id = op.id_conteudo
        LEFT JOIN escopo_distribuicao dist ON dist.id_conteudo = op.id_conteudo

        UNION ALL

        SELECT
            d.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
            true AS ativo, false AS destaque, true AS herdado, NULL::UUID AS op_id, d.dist_id AS dist_id,
            NULL::TIMESTAMPTZ AS data_disponivel, NULL::TIMESTAMPTZ AS data_entrega_limite,
            NULL::INTEGER AS duracao_minutos, NULL::INTEGER AS tentativas_permitidas,
            NULL::NUMERIC AS pontuacao_maxima, 1 AS prioridade
        FROM escopo_distribuicao d
        JOIN public.lms_conteudo c ON c.id = d.id_conteudo
    ),
    conteudos_escopo AS MATERIALIZED (
        SELECT DISTINCT ON (id_conteudo) *
        FROM fonte
        ORDER BY id_conteudo, prioridade, op_id DESC NULLS LAST
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id_conteudo', id_conteudo,
        'titulo', titulo,
        'tipo', tipo,
        'id_arquivo', id_arquivo,
        'url', url,
        'ativo', ativo,
        'destaque', destaque,
        'herdado', herdado,
        'op_id', op_id,
        'dist_id', dist_id,
        'data_disponivel', data_disponivel,
        'data_entrega_limite', data_entrega_limite,
        'duracao_minutos', duracao_minutos,
        'tentativas_permitidas', tentativas_permitidas,
        'pontuacao_maxima', pontuacao_maxima
    ) ORDER BY titulo), '[]'::JSONB)
    INTO v_conteudos
    FROM conteudos_escopo;

    -- 2. Catálogo completo do repositório com o estado deste escopo
    IF p_incluir_catalogo THEN
        WITH escopo_operacional AS MATERIALIZED (
            SELECT op.*
            FROM public.lms_conteudo_operacional op
            WHERE op.id_entidade = p_id_entidade
              AND op.id_programa = p_id_programa
              AND (
                  (p_escopo_tipo = 'programa' AND op.id_area IS NULL AND op.id_componente IS NULL AND op.id_modulo IS NULL AND op.id_ciclo IS NULL AND op.id_calendario IS NULL)
                  OR (p_escopo_tipo = 'area' AND op.id_area = p_escopo_id)
                  OR (p_escopo_tipo = 'componente' AND op.id_componente = p_escopo_id)
                  OR (p_escopo_tipo = 'modulo' AND op.id_modulo = p_escopo_id)
                  OR (p_escopo_tipo = 'ciclo' AND op.id_ciclo = p_escopo_id)
                  OR (p_escopo_tipo = 'calendario' AND op.id_calendario = p_escopo_id)
              )
        ),
        escopo_distribuicao AS MATERIALIZED (
            SELECT d.id AS dist_id, d.id_conteudo
            FROM public.lms_distribuicao d
            WHERE d.id_entidade = p_id_entidade
              AND (
                  (p_escopo_tipo = 'area' AND d.id_area = p_escopo_id)
                  OR (p_escopo_tipo = 'componente' AND d.id_componente = p_escopo_id)
                  OR (p_escopo_tipo = 'modulo' AND d.id_modulo = p_escopo_id)
              )
        ),
        catalogo AS MATERIALIZED (
            SELECT c.*, op.id AS op_id, op.ativo AS op_ativo,
                dist.dist_id AS dist_id,
                (op.id IS NULL AND dist.dist_id IS NOT NULL) AS herdado,
                op.data_disponivel AS op_data_disponivel,
                op.data_entrega_limite AS op_data_entrega_limite,
                op.duracao_minutos AS op_duracao_minutos,
                op.tentativas_permitidas AS op_tentativas_permitidas,
                op.pontuacao_maxima AS op_pontuacao_maxima,
                u.nome_completo AS criador_nome, u.email AS criador_email
            FROM public.lms_conteudo c
            LEFT JOIN escopo_operacional op ON op.id_conteudo = c.id
            LEFT JOIN escopo_distribuicao dist ON dist.id_conteudo = c.id
            LEFT JOIN public.user_expandido u ON u.id = c.criado_por
            WHERE c.id_entidade = p_id_entidade
            ORDER BY c.titulo
            LIMIT 200
        )
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', c.id,
            'titulo', c.titulo,
            'tipo', c.tipo,
            'descricao', c.descricao,
            'blocos', COALESCE((
                SELECT jsonb_agg(jsonb_build_object('id', b.id, 'titulo', b.titulo) ORDER BY b.titulo)
                FROM public.lms_conteudo_bloco cb
                JOIN public.lms_bloco b ON b.id = cb.id_bloco
                WHERE cb.id_conteudo = c.id
            ), '[]'::JSONB),
            'ativo', COALESCE(c.op_ativo, true),
            'op_id', c.op_id,
            'dist_id', c.dist_id,
            'herdado', c.herdado,
            'id_arquivo', c.id_arquivo,
            'url', c.url,
            'data_disponivel', c.op_data_disponivel,
            'data_entrega_limite', c.op_data_entrega_limite,
            'duracao_minutos', c.op_duracao_minutos,
            'tentativas_permitidas', c.op_tentativas_permitidas,
            'pontuacao_maxima', c.op_pontuacao_maxima,
            'criado_por', c.criado_por,
            'criado_por_nome', COALESCE(c.criador_nome, c.criador_email),
            'criado_em', c.criado_em
        ) ORDER BY c.titulo), '[]'::JSONB)
        INTO v_catalogo
        FROM catalogo c;
    END IF;

    RETURN jsonb_build_object('conteudos', v_conteudos, 'catalogo', v_catalogo);
END;
$$;
