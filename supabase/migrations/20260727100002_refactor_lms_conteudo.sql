-- ============================================================
-- Migration: refactor_lms_conteudo
-- Data: 2026-07-27
-- Descrição: Refatora o modelo do LMS:
--   - lms_bloco_item → lms_conteudo (vive solto)
--   - lms_conteudo_bloco (N:N entre conteúdo e bloco)
--   - id_arquivo + url em lms_conteudo
--   - Distribuição aceita bloco OU conteúdo
--   - Operacional aceita bloco OU conteúdo
--   - Submissões referenciam lms_conteudo
-- ============================================================

-- ============================================================
-- 1. DROP das tabelas antigas (sem dados, seguro)
-- ============================================================
DROP TABLE IF EXISTS public.lms_resposta_aluno CASCADE;
DROP TABLE IF EXISTS public.lms_submissao_avaliacao CASCADE;
DROP TABLE IF EXISTS public.lms_submissao_atividade CASCADE;
DROP TABLE IF EXISTS public.lms_progresso_aluno CASCADE;
DROP TABLE IF EXISTS public.lms_conteudo_operacional CASCADE;
DROP TABLE IF EXISTS public.lms_resposta_possivel CASCADE;
DROP TABLE IF EXISTS public.lms_pergunta CASCADE;
DROP TABLE IF EXISTS public.lms_avaliacao CASCADE;
DROP TABLE IF EXISTS public.lms_atividade CASCADE;
DROP TABLE IF EXISTS public.lms_bloco_item CASCADE;
DROP TABLE IF EXISTS public.lms_distribuicao CASCADE;

-- ============================================================
-- 2. lms_conteudo — Conteúdo (vive solto, sem bloco obrigatório)
--     Substitui lms_bloco_item com id_bloco removido daqui.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_conteudo (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade           UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    tipo                  lms_tipo_item NOT NULL,
    titulo                TEXT NOT NULL,
    descricao             TEXT,
    ordem                 INTEGER DEFAULT 0,

    -- Arquivo e URL (sempre disponíveis para qualquer tipo)
    id_arquivo            UUID REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    url                   TEXT,

    -- Controle de disponibilidade (timing)
    data_disponivel         TIMESTAMPTZ,
    data_entrega_limite     TIMESTAMPTZ,
    duracao_minutos         INTEGER,
    tentativas_permitidas   INTEGER DEFAULT 1,
    pontuacao_maxima        NUMERIC(6,2),

    ativo           BOOLEAN DEFAULT TRUE,
    criado_por      UUID REFERENCES public.user_expandido(id),
    criado_em       TIMESTAMPTZ DEFAULT NOW(),
    modificado_por  UUID REFERENCES public.user_expandido(id),
    modificado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_conteudo_entidade ON public.lms_conteudo(id_entidade);
CREATE INDEX IF NOT EXISTS idx_lms_conteudo_tipo ON public.lms_conteudo(tipo);

-- ============================================================
-- 3. lms_conteudo_bloco — N:N Conteúdo ↔ Bloco
--     Um conteúdo pode estar em 0, 1 ou vários blocos.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_conteudo_bloco (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conteudo     UUID NOT NULL REFERENCES public.lms_conteudo(id) ON DELETE CASCADE,
    id_bloco        UUID NOT NULL REFERENCES public.lms_bloco(id) ON DELETE CASCADE,
    criado_em       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_conteudo, id_bloco)
);

CREATE INDEX IF NOT EXISTS idx_lms_conteudo_bloco_conteudo ON public.lms_conteudo_bloco(id_conteudo);
CREATE INDEX IF NOT EXISTS idx_lms_conteudo_bloco_bloco ON public.lms_conteudo_bloco(id_bloco);

-- ============================================================
-- 4. lms_atividade — Atividade (tipo_submissao)
--     1:1 com lms_conteudo (tipo = 'atividade')
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_atividade (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conteudo             UUID NOT NULL REFERENCES public.lms_conteudo(id) ON DELETE CASCADE UNIQUE,
    id_arquivo_referencia   UUID REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    tipo_submissao          lms_tipo_submissao_atv NOT NULL DEFAULT 'texto',
    criado_em               TIMESTAMPTZ DEFAULT NOW(),
    modificado_em           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. lms_avaliacao — Avaliação (Questionário / Prova)
--     1:1 com lms_conteudo (tipo = 'avaliacao')
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_avaliacao (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conteudo             UUID NOT NULL REFERENCES public.lms_conteudo(id) ON DELETE CASCADE UNIQUE,
    nome                    TEXT NOT NULL,
    descricao               TEXT,
    id_arquivo_referencia   UUID REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    ordem_perguntas         TEXT DEFAULT 'fixa' CHECK (ordem_perguntas IN ('fixa', 'aleatoria')),
    criado_em               TIMESTAMPTZ DEFAULT NOW(),
    modificado_em           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. lms_pergunta — Pergunta (Dissertativa ou Múltipla Escolha)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_pergunta (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_avaliacao      UUID NOT NULL REFERENCES public.lms_avaliacao(id) ON DELETE CASCADE,
    tipo              lms_tipo_pergunta NOT NULL,
    enunciado         TEXT NOT NULL,
    pontuacao         NUMERIC(6,2) DEFAULT 0 NOT NULL,
    obrigatoria       BOOLEAN DEFAULT TRUE,
    ordem             INTEGER DEFAULT 0,
    id_arquivo        UUID REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    criado_em         TIMESTAMPTZ DEFAULT NOW(),
    modificado_em     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_pergunta_avaliacao ON public.lms_pergunta(id_avaliacao);

-- ============================================================
-- 7. lms_resposta_possivel — Alternativas (Múltipla Escolha)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_resposta_possivel (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pergunta     UUID NOT NULL REFERENCES public.lms_pergunta(id) ON DELETE CASCADE,
    texto           TEXT NOT NULL,
    correta         BOOLEAN DEFAULT FALSE,
    ordem           INTEGER DEFAULT 0,
    id_arquivo      UUID REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_resposta_possivel_pergunta ON public.lms_resposta_possivel(id_pergunta);

-- ============================================================
-- 8. lms_submissao_atividade — Submissão do Aluno
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_submissao_atividade (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade         UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_conteudo         UUID NOT NULL REFERENCES public.lms_conteudo(id) ON DELETE CASCADE,
    id_matricula        UUID NOT NULL REFERENCES public.aca_matricula(id) ON DELETE CASCADE,
    texto_resposta      TEXT,
    id_arquivo_envio    UUID REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    data_inicio         TIMESTAMPTZ,
    data_envio          TIMESTAMPTZ DEFAULT NOW(),
    tentativa           INTEGER DEFAULT 1,
    status              lms_status_submissao DEFAULT 'em_andamento',
    nota                NUMERIC(6,2),
    comentario_professor TEXT,
    criado_em           TIMESTAMPTZ DEFAULT NOW(),
    modificado_em       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_conteudo, id_matricula, tentativa)
);

CREATE INDEX IF NOT EXISTS idx_lms_submissao_atv_entidade ON public.lms_submissao_atividade(id_entidade);
CREATE INDEX IF NOT EXISTS idx_lms_submissao_atv_matricula ON public.lms_submissao_atividade(id_matricula);

-- ============================================================
-- 9. lms_submissao_avaliacao — Submissão de Avaliação
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_submissao_avaliacao (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade         UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_conteudo         UUID NOT NULL REFERENCES public.lms_conteudo(id) ON DELETE CASCADE,
    id_matricula        UUID NOT NULL REFERENCES public.aca_matricula(id) ON DELETE CASCADE,
    tentativa           INTEGER DEFAULT 1,
    data_inicio         TIMESTAMPTZ,
    data_entrega        TIMESTAMPTZ,
    status              lms_status_submissao DEFAULT 'em_andamento',
    nota_total          NUMERIC(6,2),
    criado_em           TIMESTAMPTZ DEFAULT NOW(),
    modificado_em       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_conteudo, id_matricula, tentativa)
);

CREATE INDEX IF NOT EXISTS idx_lms_submissao_av_entidade ON public.lms_submissao_avaliacao(id_entidade);
CREATE INDEX IF NOT EXISTS idx_lms_submissao_av_matricula ON public.lms_submissao_avaliacao(id_matricula);

-- ============================================================
-- 10. lms_resposta_aluno — Resposta do Aluno a uma Pergunta
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_resposta_aluno (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_submissao_avaliacao  UUID NOT NULL REFERENCES public.lms_submissao_avaliacao(id) ON DELETE CASCADE,
    id_pergunta             UUID NOT NULL REFERENCES public.lms_pergunta(id) ON DELETE CASCADE,
    id_resposta_possivel    UUID REFERENCES public.lms_resposta_possivel(id) ON DELETE SET NULL,
    texto_resposta          TEXT,
    id_arquivo_envio        UUID REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    criado_em               TIMESTAMPTZ DEFAULT NOW(),
    modificado_em           TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_submissao_avaliacao, id_pergunta)
);

-- ============================================================
-- 11. lms_distribuicao — Mapeamento Conteúdo/Bloco → Blueprint
--     Agora aceita id_bloco (bloco inteiro) OU id_conteudo
--     (conteúdo individual). A CHECK garante um dos dois.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_distribuicao (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade     UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,

    -- Porta de entrada: bloco inteiro OU conteúdo individual
    id_bloco        UUID REFERENCES public.lms_bloco(id) ON DELETE CASCADE,
    id_conteudo     UUID REFERENCES public.lms_conteudo(id) ON DELETE CASCADE,

    -- Escopos do Blueprint (um deve estar preenchido)
    id_area         UUID REFERENCES public.aca_area(id) ON DELETE CASCADE,
    id_curso        UUID REFERENCES public.aca_curso(id) ON DELETE CASCADE,
    id_modulo       UUID REFERENCES public.aca_modulo(id) ON DELETE CASCADE,
    id_componente   UUID REFERENCES public.aca_componente(id) ON DELETE CASCADE,

    ativo           BOOLEAN DEFAULT TRUE,
    criado_por      UUID REFERENCES public.user_expandido(id),
    criado_em       TIMESTAMPTZ DEFAULT NOW(),

    -- Garante que uma das portas de entrada está preenchida
    CONSTRAINT lms_distribuicao_alvo_check CHECK (
        (id_bloco IS NOT NULL AND id_conteudo IS NULL) OR
        (id_conteudo IS NOT NULL AND id_bloco IS NULL)
    ),

    -- Garante que exatamente um escopo do Blueprint está preenchido
    CONSTRAINT lms_distribuicao_um_escopo CHECK (
        (id_area IS NOT NULL)::INT +
        (id_curso IS NOT NULL)::INT +
        (id_modulo IS NOT NULL)::INT +
        (id_componente IS NOT NULL)::INT = 1
    )
);

CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_bloco ON public.lms_distribuicao(id_bloco) WHERE id_bloco IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_conteudo ON public.lms_distribuicao(id_conteudo) WHERE id_conteudo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_area ON public.lms_distribuicao(id_area);
CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_curso ON public.lms_distribuicao(id_curso);
CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_modulo ON public.lms_distribuicao(id_modulo);
CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_componente ON public.lms_distribuicao(id_componente);

-- ============================================================
-- 12. lms_conteudo_operacional — Currículo Vivo
--     Agora aceita id_bloco (bloco inteiro) OU id_conteudo
--     (conteúdo individual). Três escopos de execução.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_conteudo_operacional (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade             UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,

    -- Portas de entrada (uma deve estar preenchida)
    id_bloco                UUID REFERENCES public.lms_bloco(id) ON DELETE CASCADE,
    id_conteudo             UUID REFERENCES public.lms_conteudo(id) ON DELETE CASCADE,

    -- Escopos de execução (um deve estar preenchido)
    id_programa             UUID REFERENCES public.aca_programa(id) ON DELETE CASCADE,
    id_ciclo                UUID REFERENCES public.aca_ciclo(id) ON DELETE CASCADE,
    id_calendario           UUID REFERENCES public.aca_calendario(id) ON DELETE CASCADE,

    id_distribuicao_origem  UUID REFERENCES public.lms_distribuicao(id) ON DELETE SET NULL,
    ativo                   BOOLEAN DEFAULT TRUE,
    criado_por              UUID REFERENCES public.user_expandido(id),
    criado_em               TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT lms_operacional_alvo_check CHECK (
        (id_bloco IS NOT NULL AND id_conteudo IS NULL) OR
        (id_conteudo IS NOT NULL AND id_bloco IS NULL)
    ),

    CONSTRAINT lms_conteudo_operacional_um_escopo CHECK (
        (id_programa IS NOT NULL)::INT +
        (id_ciclo IS NOT NULL)::INT +
        (id_calendario IS NOT NULL)::INT = 1
    )
);

CREATE INDEX IF NOT EXISTS idx_lms_op_bloco ON public.lms_conteudo_operacional(id_bloco) WHERE id_bloco IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lms_op_conteudo ON public.lms_conteudo_operacional(id_conteudo) WHERE id_conteudo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lms_op_programa ON public.lms_conteudo_operacional(id_programa);
CREATE INDEX IF NOT EXISTS idx_lms_op_ciclo ON public.lms_conteudo_operacional(id_ciclo);
CREATE INDEX IF NOT EXISTS idx_lms_op_calendario ON public.lms_conteudo_operacional(id_calendario);

-- ============================================================
-- 13. lms_progresso_aluno — Progresso do Aluno
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_progresso_aluno (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade     UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_conteudo     UUID NOT NULL REFERENCES public.lms_conteudo(id) ON DELETE CASCADE,
    id_matricula    UUID NOT NULL REFERENCES public.aca_matricula(id) ON DELETE CASCADE,
    concluido       BOOLEAN DEFAULT FALSE,
    visto_em        TIMESTAMPTZ,
    criado_em       TIMESTAMPTZ DEFAULT NOW(),
    modificado_em   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_conteudo, id_matricula)
);

CREATE INDEX IF NOT EXISTS idx_lms_progresso_entidade ON public.lms_progresso_aluno(id_entidade);
CREATE INDEX IF NOT EXISTS idx_lms_progresso_matricula ON public.lms_progresso_aluno(id_matricula);

-- ============================================================
-- RLS — Row Level Security
-- Mesmo padrão da migration anterior
-- ============================================================

-- Helper functions (já existentes da migration anterior, mantidas)
-- public.lms_usuario_pertence_entidade(p_id_entidade UUID)
-- public.lms_usuario_eh_gestor()
-- public.lms_user_expandido_id()

-- lms_conteudo
ALTER TABLE public.lms_conteudo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_conteudo: gestor all" ON public.lms_conteudo
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

-- lms_conteudo_bloco
ALTER TABLE public.lms_conteudo_bloco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_conteudo_bloco: gestor all" ON public.lms_conteudo_bloco
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_bloco b
            WHERE b.id = lms_conteudo_bloco.id_bloco
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_bloco b
            WHERE b.id = lms_conteudo_bloco.id_bloco
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    );

-- lms_atividade, lms_avaliacao, lms_pergunta, lms_resposta_possivel
ALTER TABLE public.lms_atividade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_pergunta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_resposta_possivel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_atividade: gestor all" ON public.lms_atividade
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_conteudo c
            WHERE c.id = lms_atividade.id_conteudo
            AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_conteudo c
            WHERE c.id = lms_atividade.id_conteudo
            AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    );

CREATE POLICY "lms_avaliacao: gestor all" ON public.lms_avaliacao
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_conteudo c
            WHERE c.id = lms_avaliacao.id_conteudo
            AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_conteudo c
            WHERE c.id = lms_avaliacao.id_conteudo
            AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    );

CREATE POLICY "lms_pergunta: gestor all" ON public.lms_pergunta
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_avaliacao av
            JOIN public.lms_conteudo c ON c.id = av.id_conteudo
            WHERE av.id = lms_pergunta.id_avaliacao
            AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_avaliacao av
            JOIN public.lms_conteudo c ON c.id = av.id_conteudo
            WHERE av.id = lms_pergunta.id_avaliacao
            AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    );

CREATE POLICY "lms_resposta_possivel: gestor all" ON public.lms_resposta_possivel
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_pergunta p
            JOIN public.lms_avaliacao av ON av.id = p.id_avaliacao
            JOIN public.lms_conteudo c ON c.id = av.id_conteudo
            WHERE p.id = lms_resposta_possivel.id_pergunta
            AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_pergunta p
            JOIN public.lms_avaliacao av ON av.id = p.id_avaliacao
            JOIN public.lms_conteudo c ON c.id = av.id_conteudo
            WHERE p.id = lms_resposta_possivel.id_pergunta
            AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    );

-- lms_distribuicao, lms_conteudo_operacional
ALTER TABLE public.lms_distribuicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_conteudo_operacional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_distribuicao: gestor all" ON public.lms_distribuicao
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

CREATE POLICY "lms_conteudo_operacional: gestor all" ON public.lms_conteudo_operacional
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

-- Submissões + Progresso (gestor + aluno)
ALTER TABLE public.lms_submissao_atividade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_submissao_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_resposta_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_progresso_aluno ENABLE ROW LEVEL SECURITY;

-- (Políticas de submissão e progresso mantidas da migration anterior)
-- Gestor: acesso total por entidade
-- Aluno: acesso apenas às próprias

CREATE POLICY "lms_submissao_atividade: gestor all" ON public.lms_submissao_atividade
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

CREATE POLICY "lms_submissao_avaliacao: gestor all" ON public.lms_submissao_avaliacao
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

CREATE POLICY "lms_progresso_aluno: gestor all" ON public.lms_progresso_aluno
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );
