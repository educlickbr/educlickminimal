-- ============================================================
-- Migration: aca_form_engine_infrastructure
-- Data: 2026-05-07
-- Descrição: Cria infraestrutura para o motor de formulários dinâmicos.
--            Inclui gestão global de arquivos e persistência de respostas.
-- ============================================================

-- 1. Tabela Global de Arquivos (Centraliza auditoria e storage)
CREATE TABLE IF NOT EXISTS public.glb_arquivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    bucket TEXT NOT NULL,
    tamanho_bytes BIGINT,
    mimetype TEXT,
    nome_original TEXT,
    escopo TEXT, -- Ex: 'matricula_arquivo', 'perfil_foto'
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Respostas do Formulário (Persistência reativa)
CREATE TABLE IF NOT EXISTS public.aca_resposta_form (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_user_expandido UUID NOT NULL REFERENCES public.user_expandido(id) ON DELETE CASCADE,
    id_pergunta UUID NOT NULL REFERENCES public.cmct_pergunta_form(id) ON DELETE CASCADE,
    resposta TEXT, -- Resposta em texto ou stringificada
    id_arquivo UUID REFERENCES public.glb_arquivo(id) ON DELETE SET NULL,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT aca_resposta_form_user_pergunta_unique UNIQUE (id_user_expandido, id_pergunta)
);

-- Habilitar RLS
ALTER TABLE public.glb_arquivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_resposta_form ENABLE ROW LEVEL SECURITY;

-- Políticas para glb_arquivo
CREATE POLICY "glb_arquivo: select para admin e membros da entidade"
    ON public.glb_arquivo FOR SELECT
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent) WHERE glb_arquivo.id_entidade = e.ent::uuid))
        OR (auth.uid() = criado_por) -- Dono do arquivo
    );

CREATE POLICY "glb_arquivo: insert para autenticados"
    ON public.glb_arquivo FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "glb_arquivo: update/delete para admin e dono"
    ON public.glb_arquivo FOR ALL
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (auth.uid() = criado_por)
    );

-- Políticas para aca_resposta_form
CREATE POLICY "aca_resposta_form: select para admin e membros da entidade"
    ON public.aca_resposta_form FOR SELECT
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent) WHERE aca_resposta_form.id_entidade = e.ent::uuid))
        OR (id_user_expandido IN (SELECT id FROM public.user_expandido WHERE id_user = auth.uid()))
    );

CREATE POLICY "aca_resposta_form: insert/update para todos"
    ON public.aca_resposta_form FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. RPC: Buscar Configuração de Formulário (Com Herança Programa -> Área)
CREATE OR REPLACE FUNCTION public.aca_get_form_config_completo(
    p_id_entidade UUID,
    p_programa_id UUID DEFAULT NULL,
    p_area_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Necessário para visualização pública
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_target_programa_id UUID := p_programa_id;
    v_target_area_id UUID := p_area_id;
BEGIN
    -- Se informou programa, verifica se existem perguntas configuradas para ele
    IF v_target_programa_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.aca_form_config WHERE programa_id = v_target_programa_id) THEN
            -- Se não tem no programa, tenta herdar da área do programa
            SELECT id_area INTO v_target_area_id FROM public.aca_programa WHERE id = v_target_programa_id;
            v_target_programa_id := NULL;
        END IF;
    END IF;

    -- CTE para buscar e estruturar os blocos e perguntas
    WITH config_data AS (
        SELECT 
            fc.bloco_nome,
            fc.bloco_ordem,
            jsonb_agg(
                jsonb_build_object(
                    'config_id', fc.id,
                    'pergunta_id', p.id,
                    'nome_interno', p.nome_interno,
                    'label', p.label,
                    'placeholder', p.placeholder,
                    'tipo_pergunta', p.tipo_pergunta,
                    'opcoes', p.opcoes,
                    'largura', fc.largura,
                    'altura', fc.altura,
                    'obrigatorio', fc.obrigatorio,
                    'pergunta_ordem', fc.pergunta_ordem,
                    'depende_de_pergunta_id', fc.depende_de_pergunta_id,
                    'resposta_esperada', fc.resposta_esperada
                ) ORDER BY fc.pergunta_ordem ASC
            ) as perguntas
        FROM public.aca_form_config fc
        JOIN public.cmct_pergunta_form p ON p.id = fc.pergunta_id
        WHERE fc.id_entidade = p_id_entidade
          AND (
            (v_target_programa_id IS NOT NULL AND fc.programa_id = v_target_programa_id)
            OR (v_target_programa_id IS NULL AND v_target_area_id IS NOT NULL AND fc.area_id = v_target_area_id)
          )
        GROUP BY fc.bloco_nome, fc.bloco_ordem
        ORDER BY fc.bloco_ordem ASC
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'bloco', bloco_nome,
            'ordem', bloco_ordem,
            'perguntas', perguntas
        )
    ) INTO v_result
    FROM config_data;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 4. RPC: Upsert Resposta (Salva no blur)
CREATE OR REPLACE FUNCTION public.aca_upsert_resposta_form(
    p_id_entidade UUID,
    p_id_user_expandido UUID,
    p_id_pergunta UUID,
    p_resposta TEXT DEFAULT NULL,
    p_id_arquivo UUID DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.aca_resposta_form (
        id_entidade,
        id_user_expandido,
        id_pergunta,
        resposta,
        id_arquivo,
        criado_por,
        modificado_por,
        modificado_em
    )
    VALUES (
        p_id_entidade,
        p_id_user_expandido,
        p_id_pergunta,
        p_resposta,
        p_id_arquivo,
        p_usuario_id,
        p_usuario_id,
        NOW()
    )
    ON CONFLICT (id_user_expandido, id_pergunta) DO UPDATE SET
        resposta = COALESCE(EXCLUDED.resposta, aca_resposta_form.resposta),
        id_arquivo = COALESCE(EXCLUDED.id_arquivo, aca_resposta_form.id_arquivo),
        modificado_por = p_usuario_id,
        modificado_em = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true, 
        'id', v_id, 
        'salvo_em', to_char(NOW(), 'HH24:MI')
    );
END;
$$;

-- 5. RPC: Buscar Respostas Atuais do Usuário
CREATE OR REPLACE FUNCTION public.aca_get_respostas_usuario(
    p_id_user_expandido UUID,
    p_pergunta_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_object_agg(id_pergunta, jsonb_build_object(
        'resposta', resposta,
        'id_arquivo', id_arquivo,
        'modificado_em', modificado_em
    )) INTO v_result
    FROM public.aca_resposta_form
    WHERE id_user_expandido = p_id_user_expandido
      AND id_pergunta = ANY(p_pergunta_ids);

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.aca_get_form_config_completo(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aca_upsert_resposta_form(UUID, UUID, UUID, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aca_get_respostas_usuario(UUID, UUID[]) TO authenticated;
