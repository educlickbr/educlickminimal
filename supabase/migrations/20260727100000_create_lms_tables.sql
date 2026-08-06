-- ============================================================
-- Migration: create_lms_tables
-- Data: 2026-07-27
-- Descrição: Criação das tabelas do módulo LMS (Learning
--            Management System) — pipeline de conteúdo:
--            Repositório → Distribuição → Currículo → Submissões
-- Padrão: SECURITY INVOKER, RLS por entidade via JWT claims
-- ============================================================

-- ============================================================
-- Tipos ENUM
-- ============================================================
DO $$ BEGIN
    CREATE TYPE lms_tipo_item AS ENUM ('material', 'atividade', 'avaliacao');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE lms_tipo_pergunta AS ENUM ('dissertativa', 'multipla_escolha');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE lms_status_submissao AS ENUM ('em_andamento', 'entregue', 'corrigido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE lms_tipo_submissao_atv AS ENUM ('texto', 'arquivo', 'texto_e_arquivo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 1. lms_bloco — Bloco de Conteúdo (a "pasta" do Repositório)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_bloco (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade     UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    titulo          TEXT NOT NULL,
    descricao       TEXT,
    cor_ident       TEXT,
    ativo           BOOLEAN DEFAULT TRUE,
    criado_por      UUID REFERENCES public.user_expandido(id),
    criado_em       TIMESTAMPTZ DEFAULT NOW(),
    modificado_por  UUID REFERENCES public.user_expandido(id),
    modificado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_bloco_entidade ON public.lms_bloco(id_entidade);

-- ============================================================
-- 2. lms_bloco_item — Item dentro de um Bloco
--     Ponto central do pipeline: define a disponibilidade e o
--     tipo (material = exibição, atividade = submissão,
--     avaliacao = perguntas + respostas).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_bloco_item (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_bloco              UUID NOT NULL REFERENCES public.lms_bloco(id) ON DELETE CASCADE,
    tipo                  lms_tipo_item NOT NULL,
    titulo                TEXT NOT NULL,
    descricao             TEXT,
    ordem                 INTEGER DEFAULT 0,

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

CREATE INDEX IF NOT EXISTS idx_lms_bloco_item_bloco ON public.lms_bloco_item(id_bloco);

-- ============================================================
-- 3. lms_atividade — Atividade com Arquivo de Referência
--     Ligada 1:1 a lms_bloco_item (tipo = 'atividade').
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_atividade (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_bloco_item           UUID NOT NULL REFERENCES public.lms_bloco_item(id) ON DELETE CASCADE UNIQUE,
    id_arquivo_referencia   UUID REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    tipo_submissao          lms_tipo_submissao_atv NOT NULL DEFAULT 'texto',
    criado_em               TIMESTAMPTZ DEFAULT NOW(),
    modificado_em           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. lms_avaliacao — Avaliação (Questionário / Prova)
--     Ligada 1:1 a lms_bloco_item (tipo = 'avaliacao').
--     Também pode conter arquivo de referência (material de apoio).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_avaliacao (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_bloco_item           UUID NOT NULL REFERENCES public.lms_bloco_item(id) ON DELETE CASCADE UNIQUE,
    nome                    TEXT NOT NULL,
    descricao               TEXT,
    id_arquivo_referencia   UUID REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    ordem_perguntas         TEXT DEFAULT 'fixa' CHECK (ordem_perguntas IN ('fixa', 'aleatoria')),
    criado_em               TIMESTAMPTZ DEFAULT NOW(),
    modificado_em           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. lms_pergunta — Pergunta (Dissertativa ou Múltipla Escolha)
--     Pode conter arquivo de suporte (ex: imagem no enunciado).
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
-- 6. lms_resposta_possivel — Alternativas (Múltipla Escolha)
--     Cada alternativa pode ter um arquivo (imagem, áudio, etc.).
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
-- 7. lms_submissao_atividade — Submissão do Aluno (Atividade)
--     "O aluno pode enviar texto, arquivo, ou ambos."
--     Suporta múltiplas tentativas com UNIQUE composto.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_submissao_atividade (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade         UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_bloco_item       UUID NOT NULL REFERENCES public.lms_bloco_item(id) ON DELETE CASCADE,
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
    UNIQUE (id_bloco_item, id_matricula, tentativa)
);

CREATE INDEX IF NOT EXISTS idx_lms_submissao_atv_entidade ON public.lms_submissao_atividade(id_entidade);
CREATE INDEX IF NOT EXISTS idx_lms_submissao_atv_matricula ON public.lms_submissao_atividade(id_matricula);

-- ============================================================
-- 8. lms_submissao_avaliacao — Submissão de Avaliação
--     Agrupa todas as respostas do aluno a uma avaliação.
--     A UNIQUE com tentativa controla as tentativas permitidas.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_submissao_avaliacao (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade         UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_bloco_item       UUID NOT NULL REFERENCES public.lms_bloco_item(id) ON DELETE CASCADE,
    id_matricula        UUID NOT NULL REFERENCES public.aca_matricula(id) ON DELETE CASCADE,
    tentativa           INTEGER DEFAULT 1,
    data_inicio         TIMESTAMPTZ,
    data_entrega        TIMESTAMPTZ,
    status              lms_status_submissao DEFAULT 'em_andamento',
    nota_total          NUMERIC(6,2),
    criado_em           TIMESTAMPTZ DEFAULT NOW(),
    modificado_em       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_bloco_item, id_matricula, tentativa)
);

CREATE INDEX IF NOT EXISTS idx_lms_submissao_av_entidade ON public.lms_submissao_avaliacao(id_entidade);
CREATE INDEX IF NOT EXISTS idx_lms_submissao_av_matricula ON public.lms_submissao_avaliacao(id_matricula);

-- ============================================================
-- 9. lms_resposta_aluno — Resposta do Aluno a uma Pergunta
--     Ligada a lms_submissao_avaliacao.
--     Suporta: resposta textual, id de resposta possível (ME),
--     ou upload de arquivo (ex: anexo na dissertativa).
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
-- 10. lms_distribuicao — Mapeamento Bloco → Blueprint
--      Camada Conceitual: associa blocos à estrutura perene
--      (Área, Curso, Módulo ou Componente).
--      A CHECK garante exatamente um escopo preenchido.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_distribuicao (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade     UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_bloco        UUID NOT NULL REFERENCES public.lms_bloco(id) ON DELETE CASCADE,
    id_area         UUID REFERENCES public.aca_area(id) ON DELETE CASCADE,
    id_curso        UUID REFERENCES public.aca_curso(id) ON DELETE CASCADE,
    id_modulo       UUID REFERENCES public.aca_modulo(id) ON DELETE CASCADE,
    id_componente   UUID REFERENCES public.aca_componente(id) ON DELETE CASCADE,
    ativo           BOOLEAN DEFAULT TRUE,
    criado_por      UUID REFERENCES public.user_expandido(id),
    criado_em       TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT lms_distribuicao_um_escopo CHECK (
        (id_area IS NOT NULL)::INT +
        (id_curso IS NOT NULL)::INT +
        (id_modulo IS NOT NULL)::INT +
        (id_componente IS NOT NULL)::INT = 1
    )
);

CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_area ON public.lms_distribuicao(id_area);
CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_curso ON public.lms_distribuicao(id_curso);
CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_modulo ON public.lms_distribuicao(id_modulo);
CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_componente ON public.lms_distribuicao(id_componente);
CREATE INDEX IF NOT EXISTS idx_lms_distribuicao_bloco ON public.lms_distribuicao(id_bloco);

-- ============================================================
-- 11. lms_conteudo_operacional — Currículo Vivo
--      Duas portas de entrada:
--        Cenário A: id_bloco preenchido → ativa o Bloco inteiro
--        Cenário B: id_bloco_item preenchido → item específico
--      Três escopos de execução: Programa, Ciclo ou Aula.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_conteudo_operacional (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade             UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,

    -- Duas portas de entrada (uma deve estar preenchida)
    id_bloco                UUID REFERENCES public.lms_bloco(id) ON DELETE CASCADE,
    id_bloco_item           UUID REFERENCES public.lms_bloco_item(id) ON DELETE CASCADE,

    -- Escopos de execução (um deve estar preenchido)
    id_programa             UUID REFERENCES public.aca_programa(id) ON DELETE CASCADE,
    id_ciclo                UUID REFERENCES public.aca_ciclo(id) ON DELETE CASCADE,
    id_calendario           UUID REFERENCES public.aca_calendario(id) ON DELETE CASCADE,

    id_distribuicao_origem  UUID REFERENCES public.lms_distribuicao(id) ON DELETE SET NULL,
    ativo                   BOOLEAN DEFAULT TRUE,
    criado_por              UUID REFERENCES public.user_expandido(id),
    criado_em               TIMESTAMPTZ DEFAULT NOW(),

    -- Garante que uma das duas portas de entrada está preenchida
    CONSTRAINT lms_operacional_alvo_check CHECK (
        (id_bloco IS NOT NULL AND id_bloco_item IS NULL) OR
        (id_bloco_item IS NOT NULL AND id_bloco IS NULL)
    ),

    -- Garante que um dos escopos de execução está preenchido
    CONSTRAINT lms_conteudo_operacional_um_escopo CHECK (
        (id_programa IS NOT NULL)::INT +
        (id_ciclo IS NOT NULL)::INT +
        (id_calendario IS NOT NULL)::INT = 1
    )
);

CREATE INDEX IF NOT EXISTS idx_lms_conteudo_op_bloco ON public.lms_conteudo_operacional(id_bloco) WHERE id_bloco IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lms_conteudo_op_item ON public.lms_conteudo_operacional(id_bloco_item) WHERE id_bloco_item IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lms_conteudo_op_programa ON public.lms_conteudo_operacional(id_programa);
CREATE INDEX IF NOT EXISTS idx_lms_conteudo_op_ciclo ON public.lms_conteudo_operacional(id_ciclo);
CREATE INDEX IF NOT EXISTS idx_lms_conteudo_op_calendario ON public.lms_conteudo_operacional(id_calendario);

-- ============================================================
-- 12. lms_progresso_aluno — Progresso do Aluno
--      Marca itens como concluídos/vistos pelo aluno.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_progresso_aluno (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade     UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_bloco_item   UUID NOT NULL REFERENCES public.lms_bloco_item(id) ON DELETE CASCADE,
    id_matricula    UUID NOT NULL REFERENCES public.aca_matricula(id) ON DELETE CASCADE,
    concluido       BOOLEAN DEFAULT FALSE,
    visto_em        TIMESTAMPTZ,
    criado_em       TIMESTAMPTZ DEFAULT NOW(),
    modificado_em   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_bloco_item, id_matricula)
);

CREATE INDEX IF NOT EXISTS idx_lms_progresso_entidade ON public.lms_progresso_aluno(id_entidade);
CREATE INDEX IF NOT EXISTS idx_lms_progresso_matricula ON public.lms_progresso_aluno(id_matricula);

-- ============================================================
-- RLS — Row Level Security
-- Padrão: acesso por entidade via JWT claims
--   - Professores/coordenadores: papel = 'admin' ou 'aca_%'
--   - Membros da entidade: via jsonb_array_elements_text(JWT -> 'entidades')
--   - Alunos: acesso restrito a dados próprios e conteúdo disponível
-- ============================================================

-- Helper: verifica se o usuário autenticado pertence à entidade
CREATE OR REPLACE FUNCTION public.lms_usuario_pertence_entidade(p_id_entidade UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
        WHERE e.ent::uuid = p_id_entidade
    );
$$;

-- Helper: verifica se o usuário tem papel administrativo (admin ou aca_%)
CREATE OR REPLACE FUNCTION public.lms_usuario_eh_gestor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT (auth.jwt() ->> 'papel') IN ('admin') OR (auth.jwt() ->> 'papel') LIKE 'aca_%';
$$;

-- Helper: retorna o user_expandido.id do usuário logado
CREATE OR REPLACE FUNCTION public.lms_user_expandido_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT id FROM public.user_expandido WHERE id_user = auth.uid();
$$;

-- ============================================================
-- RLS: Tabelas de Repositório (lms_bloco, lms_bloco_item ...)
-- Gestores da entidade têm acesso total (SELECT, INSERT, UPDATE, DELETE)
-- ============================================================

-- lms_bloco
ALTER TABLE public.lms_bloco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_bloco: gestor select" ON public.lms_bloco
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

CREATE POLICY "lms_bloco: gestor insert" ON public.lms_bloco
    FOR INSERT TO authenticated
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

CREATE POLICY "lms_bloco: gestor update" ON public.lms_bloco
    FOR UPDATE TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

CREATE POLICY "lms_bloco: gestor delete" ON public.lms_bloco
    FOR DELETE TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

-- lms_bloco_item
ALTER TABLE public.lms_bloco_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_bloco_item: gestor all" ON public.lms_bloco_item
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_bloco b
            WHERE b.id = lms_bloco_item.id_bloco
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_bloco b
            WHERE b.id = lms_bloco_item.id_bloco
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    );

-- lms_atividade
ALTER TABLE public.lms_atividade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_atividade: gestor all" ON public.lms_atividade
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_bloco_item bi
            JOIN public.lms_bloco b ON b.id = bi.id_bloco
            WHERE bi.id = lms_atividade.id_bloco_item
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_bloco_item bi
            JOIN public.lms_bloco b ON b.id = bi.id_bloco
            WHERE bi.id = lms_atividade.id_bloco_item
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    );

-- lms_avaliacao
ALTER TABLE public.lms_avaliacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_avaliacao: gestor all" ON public.lms_avaliacao
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_bloco_item bi
            JOIN public.lms_bloco b ON b.id = bi.id_bloco
            WHERE bi.id = lms_avaliacao.id_bloco_item
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_bloco_item bi
            JOIN public.lms_bloco b ON b.id = bi.id_bloco
            WHERE bi.id = lms_avaliacao.id_bloco_item
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    );

-- lms_pergunta
ALTER TABLE public.lms_pergunta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_pergunta: gestor all" ON public.lms_pergunta
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_avaliacao av
            JOIN public.lms_bloco_item bi ON bi.id = av.id_bloco_item
            JOIN public.lms_bloco b ON b.id = bi.id_bloco
            WHERE av.id = lms_pergunta.id_avaliacao
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_avaliacao av
            JOIN public.lms_bloco_item bi ON bi.id = av.id_bloco_item
            JOIN public.lms_bloco b ON b.id = bi.id_bloco
            WHERE av.id = lms_pergunta.id_avaliacao
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    );

-- lms_resposta_possivel
ALTER TABLE public.lms_resposta_possivel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_resposta_possivel: gestor all" ON public.lms_resposta_possivel
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_pergunta p
            JOIN public.lms_avaliacao av ON av.id = p.id_avaliacao
            JOIN public.lms_bloco_item bi ON bi.id = av.id_bloco_item
            JOIN public.lms_bloco b ON b.id = bi.id_bloco
            WHERE p.id = lms_resposta_possivel.id_pergunta
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_pergunta p
            JOIN public.lms_avaliacao av ON av.id = p.id_avaliacao
            JOIN public.lms_bloco_item bi ON bi.id = av.id_bloco_item
            JOIN public.lms_bloco b ON b.id = bi.id_bloco
            WHERE p.id = lms_resposta_possivel.id_pergunta
            AND public.lms_usuario_pertence_entidade(b.id_entidade)
        )
    );

-- ============================================================
-- RLS: lms_distribuicao e lms_conteudo_operacional
-- Gestores têm acesso total por entidade
-- ============================================================

-- lms_distribuicao
ALTER TABLE public.lms_distribuicao ENABLE ROW LEVEL SECURITY;

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

-- lms_conteudo_operacional
ALTER TABLE public.lms_conteudo_operacional ENABLE ROW LEVEL SECURITY;

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

-- ============================================================
-- RLS: Submissões e Progresso (Aluno + Gestor)
--   - Aluno: vê e gerencia apenas as próprias submissões
--   - Gestor: vê e corrige submissões da entidade
-- ============================================================

-- lms_submissao_atividade
ALTER TABLE public.lms_submissao_atividade ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "lms_submissao_atividade: aluno select own" ON public.lms_submissao_atividade
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_submissao_atividade: aluno insert own" ON public.lms_submissao_atividade
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_submissao_atividade: aluno update own" ON public.lms_submissao_atividade
    FOR UPDATE TO authenticated
    USING (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    )
    WITH CHECK (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

-- lms_submissao_avaliacao (mesmo padrão)
ALTER TABLE public.lms_submissao_avaliacao ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "lms_submissao_avaliacao: aluno select own" ON public.lms_submissao_avaliacao
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_submissao_avaliacao: aluno insert own" ON public.lms_submissao_avaliacao
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_submissao_avaliacao: aluno update own" ON public.lms_submissao_avaliacao
    FOR UPDATE TO authenticated
    USING (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    )
    WITH CHECK (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

-- lms_resposta_aluno
ALTER TABLE public.lms_resposta_aluno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_resposta_aluno: gestor all" ON public.lms_resposta_aluno
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_submissao_avaliacao sa
            WHERE sa.id = lms_resposta_aluno.id_submissao_avaliacao
            AND public.lms_usuario_pertence_entidade(sa.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_submissao_avaliacao sa
            WHERE sa.id = lms_resposta_aluno.id_submissao_avaliacao
            AND public.lms_usuario_pertence_entidade(sa.id_entidade)
        )
    );

CREATE POLICY "lms_resposta_aluno: aluno insert own" ON public.lms_resposta_aluno
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND EXISTS (
            SELECT 1 FROM public.lms_submissao_avaliacao sa
            JOIN public.aca_matricula m ON m.id = sa.id_matricula
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE sa.id = lms_resposta_aluno.id_submissao_avaliacao
            AND ue.id_user = auth.uid()
        )
    );

-- lms_progresso_aluno
ALTER TABLE public.lms_progresso_aluno ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "lms_progresso_aluno: aluno select own" ON public.lms_progresso_aluno
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_progresso_aluno: aluno upsert" ON public.lms_progresso_aluno
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'papel') = 'aluno'
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

-- ============================================================
-- Nota: As RPCs de CRUD serão criadas em migrations separadas,
-- seguindo o padrão SECURITY INVOKER do projeto.
-- As policies de INSERT/UPDATE com WITH CHECK já garantem
-- que o usuário só consegue operar dentro da própria entidade
-- ou em dados próprios (aluno).
-- ============================================================
