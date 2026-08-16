-- ============================================================
-- Migration: admin_fechamento (timing + imagens + ordem)
-- Data: 2026-08-06
-- Descrição: Fechamento do lado admin da Programação de Atividades:
--   1. lms_upsert_operacional — aceita campos de timing
--      (data_disponivel, data_entrega_limite, duracao_minutos,
--       tentativas_permitidas, pontuacao_maxima)
--   2. lms_get_curriculo_conteudos — retorna os campos de timing
--   3. lms_upsert_avaliacao_completa — aceita p_ordem_perguntas
--      e grava id_arquivo nas alternativas
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- 1. lms_upsert_operacional (com timing)
-- ═══════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.lms_upsert_operacional(
    p_id_entidade UUID,
    p_id_conteudo UUID,
    p_id_programa UUID,
    p_id_ciclo UUID,
    p_id_calendario UUID,
    p_ativo BOOLEAN,
    p_destaque BOOLEAN,
    p_usuario_id UUID
);

CREATE OR REPLACE FUNCTION public.lms_upsert_operacional(
    p_id_entidade UUID,
    p_id_conteudo UUID,
    p_id_programa UUID DEFAULT NULL,
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
    INSERT INTO public.lms_conteudo_operacional
        (id_entidade, id_conteudo, id_programa, id_ciclo, id_calendario,
         ativo, destaque, data_disponivel, data_entrega_limite,
         duracao_minutos, tentativas_permitidas, pontuacao_maxima, criado_por)
    VALUES
        (p_id_entidade, p_id_conteudo, p_id_programa, p_id_ciclo, p_id_calendario,
         COALESCE(p_ativo, true), COALESCE(p_destaque, false),
         p_data_disponivel, p_data_entrega_limite,
         p_duracao_minutos, p_tentativas_permitidas, p_pontuacao_maxima, p_usuario_id)
    ON CONFLICT (id_conteudo, id_programa, COALESCE(id_ciclo, '00000000-0000-0000-0000-000000000000'),
                COALESCE(id_calendario, '00000000-0000-0000-0000-000000000000')) DO UPDATE SET
        ativo               = COALESCE(p_ativo, lms_conteudo_operacional.ativo),
        destaque            = COALESCE(p_destaque, lms_conteudo_operacional.destaque),
        data_disponivel     = COALESCE(p_data_disponivel, lms_conteudo_operacional.data_disponivel),
        data_entrega_limite = COALESCE(p_data_entrega_limite, lms_conteudo_operacional.data_entrega_limite),
        duracao_minutos     = COALESCE(p_duracao_minutos, lms_conteudo_operacional.duracao_minutos),
        tentativas_permitidas = COALESCE(p_tentativas_permitidas, lms_conteudo_operacional.tentativas_permitidas),
        pontuacao_maxima    = COALESCE(p_pontuacao_maxima, lms_conteudo_operacional.pontuacao_maxima),
        modificado_por = p_usuario_id,
        modificado_em  = NOW()
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
        SELECT id INTO v_id FROM public.lms_conteudo_operacional
        WHERE id_conteudo = p_id_conteudo AND id_programa = p_id_programa
          AND (id_ciclo IS NULL OR id_ciclo = p_id_ciclo)
          AND (id_calendario IS NULL OR id_calendario = p_id_calendario)
        LIMIT 1;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Operacional atualizado');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 2. lms_get_curriculo_conteudos (com timing)
-- ═══════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.lms_get_curriculo_conteudos(
    p_id_programa UUID,
    p_id_entidade UUID,
    p_escopo_tipo TEXT,
    p_escopo_id UUID
);

CREATE OR REPLACE FUNCTION public.lms_get_curriculo_conteudos(
    p_id_programa UUID,
    p_id_entidade UUID,
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
    IF p_escopo_tipo = 'programa' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (op.id_conteudo)
                op.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                op.ativo, COALESCE(op.destaque, false) AS destaque,
                false AS herdado, op.id AS op_id,
                op.data_disponivel, op.data_entrega_limite,
                op.duracao_minutos, op.tentativas_permitidas, op.pontuacao_maxima
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            WHERE op.id_programa = p_id_programa
              AND op.id_ciclo IS NULL
              AND op.id_calendario IS NULL
            ORDER BY op.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'area' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (d.id_conteudo)
                d.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                COALESCE(op.ativo, true) AS ativo,
                COALESCE(op.destaque, false) AS destaque,
                CASE WHEN op.id IS NULL THEN true ELSE false END AS herdado,
                op.id AS op_id,
                op.data_disponivel, op.data_entrega_limite,
                op.duracao_minutos, op.tentativas_permitidas, op.pontuacao_maxima
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            WHERE d.id_area = p_escopo_id
            ORDER BY d.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'componente' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (d.id_conteudo)
                d.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                COALESCE(op.ativo, true) AS ativo,
                COALESCE(op.destaque, false) AS destaque,
                CASE WHEN op.id IS NULL THEN true ELSE false END AS herdado,
                op.id AS op_id,
                op.data_disponivel, op.data_entrega_limite,
                op.duracao_minutos, op.tentativas_permitidas, op.pontuacao_maxima
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            WHERE d.id_componente = p_escopo_id AND d.id_modulo IS NULL
            ORDER BY d.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'modulo' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (d.id_conteudo)
                d.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                COALESCE(op.ativo, true) AS ativo,
                COALESCE(op.destaque, false) AS destaque,
                CASE WHEN op.id IS NULL THEN true ELSE false END AS herdado,
                op.id AS op_id,
                op.data_disponivel, op.data_entrega_limite,
                op.duracao_minutos, op.tentativas_permitidas, op.pontuacao_maxima
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            WHERE d.id_modulo = p_escopo_id
            ORDER BY d.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'ciclo' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (op.id_conteudo)
                op.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                op.ativo, COALESCE(op.destaque, false) AS destaque,
                false AS herdado, op.id AS op_id,
                op.data_disponivel, op.data_entrega_limite,
                op.duracao_minutos, op.tentativas_permitidas, op.pontuacao_maxima
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            WHERE op.id_programa = p_id_programa
              AND op.id_ciclo = p_escopo_id
              AND op.id_calendario IS NULL
            ORDER BY op.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'calendario' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (op.id_conteudo)
                op.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                op.ativo, COALESCE(op.destaque, false) AS destaque,
                false AS herdado, op.id AS op_id,
                op.data_disponivel, op.data_entrega_limite,
                op.duracao_minutos, op.tentativas_permitidas, op.pontuacao_maxima
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            WHERE op.id_programa = p_id_programa
              AND op.id_calendario = p_escopo_id
            ORDER BY op.id_conteudo, op.id DESC
        ) sub;

    ELSE
        v_conteudos := '[]'::jsonb;
    END IF;

    RETURN jsonb_build_object('conteudos', COALESCE(v_conteudos, '[]'::jsonb));
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 3. lms_upsert_avaliacao_completa (ordem + id_arquivo nas alternativas)
-- ═══════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.lms_upsert_avaliacao_completa(
    p_id_conteudo UUID,
    p_id_entidade UUID,
    p_nome TEXT,
    p_descricao TEXT,
    p_perguntas JSONB,
    p_usuario_id UUID
);

CREATE OR REPLACE FUNCTION public.lms_upsert_avaliacao_completa(
    p_id_conteudo UUID,
    p_id_entidade UUID,
    p_nome TEXT,
    p_descricao TEXT DEFAULT NULL,
    p_ordem_perguntas TEXT DEFAULT 'fixa',
    p_perguntas JSONB DEFAULT '[]'::jsonb,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_avaliacao_id UUID;
    v_pergunta RECORD;
    v_alternativa RECORD;
    v_nome TEXT;
    v_descricao TEXT;
    v_tipo TEXT;
    v_enunciado TEXT;
    v_pontuacao NUMERIC;
    v_obrigatoria BOOLEAN;
    v_ordem INTEGER;
    v_id_arquivo UUID;
    v_alt_id_arquivo UUID;
    v_pergunta_id UUID;
    v_alt_ordem INTEGER;
BEGIN
    -- Garante que o conteúdo pertence à entidade
    IF NOT EXISTS (
        SELECT 1 FROM public.lms_conteudo
        WHERE id = p_id_conteudo AND id_entidade = p_id_entidade
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Conteúdo não encontrado');
    END IF;

    -- Nome/descrição: usa os valores enviados ou os do conteúdo
    SELECT COALESCE(p_nome, titulo), COALESCE(p_descricao, descricao)
    INTO v_nome, v_descricao
    FROM public.lms_conteudo
    WHERE id = p_id_conteudo;

    -- Upsert da avaliação (1:1 com conteúdo)
    INSERT INTO public.lms_avaliacao (id_conteudo, nome, descricao, ordem_perguntas)
    VALUES (p_id_conteudo, v_nome, v_descricao, COALESCE(p_ordem_perguntas, 'fixa'))
    ON CONFLICT (id_conteudo) DO UPDATE
        SET nome = EXCLUDED.nome,
            descricao = EXCLUDED.descricao,
            ordem_perguntas = COALESCE(EXCLUDED.ordem_perguntas, lms_avaliacao.ordem_perguntas),
            modificado_em = NOW()
    RETURNING id INTO v_avaliacao_id;

    -- REPLACE: remove perguntas antigas (CASCADE apaga alternativas)
    DELETE FROM public.lms_pergunta WHERE id_avaliacao = v_avaliacao_id;

    -- Insere as novas perguntas (value AS p: alias correto do jsonb_array_elements)
    v_ordem := 0;
    FOR v_pergunta IN SELECT value AS p FROM jsonb_array_elements(p_perguntas)
    LOOP
        v_tipo := v_pergunta.p->>'tipo';
        v_enunciado := v_pergunta.p->>'enunciado';
        v_pontuacao := COALESCE((v_pergunta.p->>'pontuacao')::NUMERIC, 0);
        v_obrigatoria := COALESCE((v_pergunta.p->>'obrigatoria')::BOOLEAN, true);
        v_id_arquivo := NULLIF(v_pergunta.p->>'id_arquivo', '')::UUID;

        INSERT INTO public.lms_pergunta (
            id_avaliacao, tipo, enunciado, pontuacao, obrigatoria, ordem, id_arquivo
        )
        VALUES (
            v_avaliacao_id,
            COALESCE(v_tipo, 'dissertativa')::lms_tipo_pergunta,
            COALESCE(v_enunciado, ''),
            v_pontuacao,
            v_obrigatoria,
            v_ordem,
            v_id_arquivo
        )
        RETURNING id INTO v_pergunta_id;

        -- Alternativas (se múltipla escolha)
        IF v_tipo = 'multipla_escolha' THEN
            v_alt_ordem := 0;
            FOR v_alternativa IN SELECT value AS alt FROM jsonb_array_elements(
                COALESCE(v_pergunta.p->'alternativas', '[]'::jsonb)
            )
            LOOP
                v_alt_id_arquivo := NULLIF(v_alternativa.alt->>'id_arquivo', '')::UUID;
                INSERT INTO public.lms_resposta_possivel (
                    id_pergunta, texto, correta, ordem, id_arquivo
                )
                VALUES (
                    v_pergunta_id,
                    COALESCE(v_alternativa.alt->>'texto', ''),
                    COALESCE((v_alternativa.alt->>'correta')::BOOLEAN, false),
                    v_alt_ordem,
                    v_alt_id_arquivo
                );
                v_alt_ordem := v_alt_ordem + 1;
            END LOOP;
        END IF;

        v_ordem := v_ordem + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'id', v_avaliacao_id, 'qtd_perguntas', jsonb_array_length(p_perguntas));
END;
$$;
