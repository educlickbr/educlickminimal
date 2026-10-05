-- ============================================================
-- Currículo operacional por escopo
-- Data: 2026-10-05
-- Descrição:
--   Mantém o programa como dono do currículo e permite que uma
--   associação operacional pertença especificamente a área,
--   componente, módulo, ciclo ou aula.
-- ============================================================

-- O programa continua sendo o contexto da associação. Os campos abaixo
-- identificam o nível específico dentro daquele programa.
ALTER TABLE public.lms_conteudo_operacional
    ADD COLUMN IF NOT EXISTS id_area UUID REFERENCES public.aca_area(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS id_componente UUID REFERENCES public.aca_componente(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS id_modulo UUID REFERENCES public.aca_modulo(id) ON DELETE CASCADE;

ALTER TABLE public.lms_conteudo_operacional
    DROP CONSTRAINT IF EXISTS lms_conteudo_operacional_um_escopo;

ALTER TABLE public.lms_conteudo_operacional
    ADD CONSTRAINT lms_conteudo_operacional_um_escopo CHECK (
        (id_area IS NOT NULL)::INTEGER +
        (id_componente IS NOT NULL)::INTEGER +
        (id_modulo IS NOT NULL)::INTEGER +
        (id_ciclo IS NOT NULL)::INTEGER +
        (id_calendario IS NOT NULL)::INTEGER <= 1
    );

DROP INDEX IF EXISTS public.lms_conteudo_operacional_unique;

CREATE UNIQUE INDEX lms_conteudo_operacional_unique
    ON public.lms_conteudo_operacional (
        id_conteudo,
        id_programa,
        COALESCE(id_area, '00000000-0000-0000-0000-000000000000'::UUID),
        COALESCE(id_componente, '00000000-0000-0000-0000-000000000000'::UUID),
        COALESCE(id_modulo, '00000000-0000-0000-0000-000000000000'::UUID),
        COALESCE(id_ciclo, '00000000-0000-0000-0000-000000000000'::UUID),
        COALESCE(id_calendario, '00000000-0000-0000-0000-000000000000'::UUID)
    );

CREATE INDEX IF NOT EXISTS idx_lms_op_area
    ON public.lms_conteudo_operacional (id_programa, id_area)
    WHERE id_area IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lms_op_componente
    ON public.lms_conteudo_operacional (id_programa, id_componente)
    WHERE id_componente IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lms_op_modulo
    ON public.lms_conteudo_operacional (id_programa, id_modulo)
    WHERE id_modulo IS NOT NULL;

-- ============================================================
-- RPC: lms_upsert_operacional
-- ============================================================
DROP FUNCTION IF EXISTS public.lms_upsert_operacional(
    UUID, UUID, UUID, UUID, UUID, BOOLEAN, BOOLEAN,
    TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER, NUMERIC, UUID
);

CREATE OR REPLACE FUNCTION public.lms_upsert_operacional(
    p_id_entidade UUID,
    p_id_conteudo UUID,
    p_id_programa UUID DEFAULT NULL,
    p_id_area UUID DEFAULT NULL,
    p_id_componente UUID DEFAULT NULL,
    p_id_modulo UUID DEFAULT NULL,
    p_id_ciclo UUID DEFAULT NULL,
    p_id_calendario UUID DEFAULT NULL,
    p_ativo BOOLEAN DEFAULT NULL,
    p_destaque BOOLEAN DEFAULT NULL,
    p_data_disponivel TIMESTAMPTZ DEFAULT NULL,
    p_data_entrega_limite TIMESTAMPTZ DEFAULT NULL,
    p_duracao_minutos INTEGER DEFAULT NULL,
    p_tentativas_permitidas INTEGER DEFAULT NULL,
    p_pontuacao_maxima NUMERIC(6,2) DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id_programa IS NULL THEN
        RAISE EXCEPTION 'id_programa é obrigatório para o currículo operacional';
    END IF;

    IF (p_id_area IS NOT NULL)::INTEGER +
       (p_id_componente IS NOT NULL)::INTEGER +
       (p_id_modulo IS NOT NULL)::INTEGER +
       (p_id_ciclo IS NOT NULL)::INTEGER +
       (p_id_calendario IS NOT NULL)::INTEGER > 1 THEN
        RAISE EXCEPTION 'Informe no máximo um escopo específico por associação';
    END IF;

    INSERT INTO public.lms_conteudo_operacional (
        id_entidade, id_conteudo, id_programa,
        id_area, id_componente, id_modulo, id_ciclo, id_calendario,
        ativo, destaque, data_disponivel, data_entrega_limite,
        duracao_minutos, tentativas_permitidas, pontuacao_maxima, criado_por
    ) VALUES (
        p_id_entidade, p_id_conteudo, p_id_programa,
        p_id_area, p_id_componente, p_id_modulo, p_id_ciclo, p_id_calendario,
        COALESCE(p_ativo, true), COALESCE(p_destaque, false),
        p_data_disponivel, p_data_entrega_limite,
        p_duracao_minutos, p_tentativas_permitidas, p_pontuacao_maxima, p_usuario_id
    )
    ON CONFLICT (
        id_conteudo, id_programa,
        COALESCE(id_area, '00000000-0000-0000-0000-000000000000'::UUID),
        COALESCE(id_componente, '00000000-0000-0000-0000-000000000000'::UUID),
        COALESCE(id_modulo, '00000000-0000-0000-0000-000000000000'::UUID),
        COALESCE(id_ciclo, '00000000-0000-0000-0000-000000000000'::UUID),
        COALESCE(id_calendario, '00000000-0000-0000-0000-000000000000'::UUID)
    ) DO UPDATE SET
        ativo = COALESCE(p_ativo, lms_conteudo_operacional.ativo),
        destaque = COALESCE(p_destaque, lms_conteudo_operacional.destaque),
        data_disponivel = COALESCE(p_data_disponivel, lms_conteudo_operacional.data_disponivel),
        data_entrega_limite = COALESCE(p_data_entrega_limite, lms_conteudo_operacional.data_entrega_limite),
        duracao_minutos = COALESCE(p_duracao_minutos, lms_conteudo_operacional.duracao_minutos),
        tentativas_permitidas = COALESCE(p_tentativas_permitidas, lms_conteudo_operacional.tentativas_permitidas),
        pontuacao_maxima = COALESCE(p_pontuacao_maxima, lms_conteudo_operacional.pontuacao_maxima),
        modificado_por = p_usuario_id,
        modificado_em = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Operacional atualizado');
END;
$$;

-- ============================================================
-- RPC: lms_get_curriculo_conteudos
-- Uma chamada devolve a lista curta da árvore e, quando solicitado,
-- o catálogo com o estado daquele mesmo escopo.
-- ============================================================
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
    fonte AS (
        SELECT
            op.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
            op.ativo, COALESCE(op.destaque, false) AS destaque,
            false AS herdado, op.id AS op_id,
            op.data_disponivel, op.data_entrega_limite, op.duracao_minutos,
            op.tentativas_permitidas, op.pontuacao_maxima, 0 AS prioridade
        FROM escopo_operacional op
        JOIN public.lms_conteudo c ON c.id = op.id_conteudo

        UNION ALL

        SELECT
            d.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
            true AS ativo, false AS destaque, true AS herdado, NULL::UUID AS op_id,
            NULL::TIMESTAMPTZ AS data_disponivel, NULL::TIMESTAMPTZ AS data_entrega_limite,
            NULL::INTEGER AS duracao_minutos, NULL::INTEGER AS tentativas_permitidas,
            NULL::NUMERIC AS pontuacao_maxima, 1 AS prioridade
        FROM public.lms_distribuicao d
        JOIN public.lms_conteudo c ON c.id = d.id_conteudo
        WHERE d.id_entidade = p_id_entidade
          AND (
              (p_escopo_tipo = 'area' AND d.id_area = p_escopo_id)
              OR (p_escopo_tipo = 'componente' AND d.id_componente = p_escopo_id)
              OR (p_escopo_tipo = 'modulo' AND d.id_modulo = p_escopo_id)
          )
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
        'data_disponivel', data_disponivel,
        'data_entrega_limite', data_entrega_limite,
        'duracao_minutos', duracao_minutos,
        'tentativas_permitidas', tentativas_permitidas,
        'pontuacao_maxima', pontuacao_maxima
    ) ORDER BY titulo), '[]'::JSONB)
    INTO v_conteudos
    FROM conteudos_escopo;

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
        ), catalogo AS MATERIALIZED (
            SELECT c.*, op.id AS op_id, op.ativo AS op_ativo,
                op.data_disponivel AS op_data_disponivel,
                op.data_entrega_limite AS op_data_entrega_limite,
                op.duracao_minutos AS op_duracao_minutos,
                op.tentativas_permitidas AS op_tentativas_permitidas,
                op.pontuacao_maxima AS op_pontuacao_maxima,
                u.nome_completo AS criador_nome, u.email AS criador_email
            FROM public.lms_conteudo c
            LEFT JOIN escopo_operacional op ON op.id_conteudo = c.id
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

-- ============================================================
-- RPC: lms_get_conteudos_do_aluno
-- Mantém o consumo do aluno no mesmo escopo real do currículo.
-- ============================================================
CREATE OR REPLACE FUNCTION public.lms_get_conteudos_do_aluno(
    p_id_programa UUID,
    p_id_entidade UUID,
    p_id_matricula UUID,
    p_escopo_tipo TEXT,
    p_escopo_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_conteudos JSONB;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.aca_matricula
        WHERE id = p_id_matricula
          AND id_programa = p_id_programa
          AND id_usuario = public.lms_user_expandido_id()
    ) THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACESSO_NEGADO', 'message', 'Acesso negado');
    END IF;

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
    fonte AS (
        SELECT
            op.id_conteudo, c.titulo, c.tipo, c.descricao, c.id_arquivo, c.url,
            op.ativo, op.data_disponivel, op.data_entrega_limite,
            op.duracao_minutos, op.tentativas_permitidas, 0 AS prioridade
        FROM escopo_operacional op
        JOIN public.lms_conteudo c ON c.id = op.id_conteudo

        UNION ALL

        SELECT
            d.id_conteudo, c.titulo, c.tipo, c.descricao, c.id_arquivo, c.url,
            true AS ativo, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ,
            NULL::INTEGER, NULL::INTEGER, 1 AS prioridade
        FROM public.lms_distribuicao d
        JOIN public.lms_conteudo c ON c.id = d.id_conteudo
        WHERE d.id_entidade = p_id_entidade
          AND (
              (p_escopo_tipo = 'area' AND d.id_area = p_escopo_id)
              OR (p_escopo_tipo = 'componente' AND d.id_componente = p_escopo_id)
              OR (p_escopo_tipo = 'modulo' AND d.id_modulo = p_escopo_id)
          )
    ),
    conteudos_escopo AS MATERIALIZED (
        SELECT DISTINCT ON (id_conteudo) *
        FROM fonte
        ORDER BY id_conteudo, prioridade
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id_conteudo', ce.id_conteudo,
        'titulo', ce.titulo,
        'tipo', ce.tipo,
        'descricao', ce.descricao,
        'id_arquivo', ce.id_arquivo,
        'url', ce.url,
        'status_visibilidade', CASE
            WHEN ce.data_disponivel IS NOT NULL AND ce.data_disponivel > NOW() THEN 'agendado'
            WHEN ce.tipo IN ('atividade', 'avaliacao') AND ce.data_entrega_limite IS NOT NULL AND ce.data_entrega_limite < NOW() THEN 'prazo_encerrado'
            ELSE 'disponivel'
        END,
        'data_disponivel', ce.data_disponivel,
        'data_entrega_limite', ce.data_entrega_limite,
        'duracao_minutos', ce.duracao_minutos,
        'tentativas_permitidas', ce.tentativas_permitidas,
        'atividade_status', atividade.status,
        'atividade_nota', atividade.nota,
        'atividade_tentativa', atividade.tentativa,
        'atividade_texto', atividade.texto_resposta,
        'atividade_arquivo', atividade.id_arquivo_envio,
        'avaliacao_status', avaliacao.status,
        'avaliacao_nota', avaliacao.nota_total,
        'avaliacao_tentativa', avaliacao.tentativa,
        'concluido', COALESCE(progresso.concluido, false)
    ) ORDER BY ce.titulo), '[]'::JSONB)
    INTO v_conteudos
    FROM conteudos_escopo ce
    LEFT JOIN LATERAL (
        SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio
        FROM public.lms_submissao_atividade
        WHERE id_conteudo = ce.id_conteudo AND id_matricula = p_id_matricula
        ORDER BY tentativa DESC
        LIMIT 1
    ) atividade ON true
    LEFT JOIN LATERAL (
        SELECT status, nota_total, tentativa
        FROM public.lms_submissao_avaliacao
        WHERE id_conteudo = ce.id_conteudo AND id_matricula = p_id_matricula
        ORDER BY tentativa DESC
        LIMIT 1
    ) avaliacao ON true
    LEFT JOIN public.lms_progresso_aluno progresso
        ON progresso.id_conteudo = ce.id_conteudo
       AND progresso.id_matricula = p_id_matricula
    WHERE ce.ativo = true;

    RETURN jsonb_build_object('conteudos', v_conteudos);
END;
$$;
