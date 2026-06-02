-- ============================================================
-- Fix: Adicionar id_entidade em cmct_pergunta_form e RLS
-- ============================================================

-- 1. Adicionar id_entidade
ALTER TABLE public.cmct_pergunta_form
ADD COLUMN id_entidade uuid REFERENCES public.user_entidades(id) ON DELETE CASCADE;

-- 2. Remover a constraint unique antiga (como o nome é gerado, vamos pegar pela tabela)
ALTER TABLE public.cmct_pergunta_form DROP CONSTRAINT IF EXISTS cmct_pergunta_form_nome_interno_key;

-- 3. Adicionar nova constraint unique composta
ALTER TABLE public.cmct_pergunta_form
ADD CONSTRAINT cmct_pergunta_form_entidade_nome_key UNIQUE (id_entidade, nome_interno);

-- ============================================================
-- Políticas RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.cmct_pergunta_form ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_form_config ENABLE ROW LEVEL SECURITY;

-- Policies para cmct_pergunta_form
CREATE POLICY "cmct_pergunta_form: select para membros da entidade"
    ON public.cmct_pergunta_form FOR SELECT
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE cmct_pergunta_form.id_entidade = e.ent::uuid
        ))
    );

CREATE POLICY "cmct_pergunta_form: insert para membros da entidade"
    ON public.cmct_pergunta_form FOR INSERT
    WITH CHECK (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE cmct_pergunta_form.id_entidade = e.ent::uuid
        ))
    );

CREATE POLICY "cmct_pergunta_form: update para membros da entidade"
    ON public.cmct_pergunta_form FOR UPDATE
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE cmct_pergunta_form.id_entidade = e.ent::uuid
        ))
    );

CREATE POLICY "cmct_pergunta_form: delete para membros da entidade"
    ON public.cmct_pergunta_form FOR DELETE
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE cmct_pergunta_form.id_entidade = e.ent::uuid
        ))
    );

-- Policies para aca_form_config
CREATE POLICY "aca_form_config: select para membros da entidade"
    ON public.aca_form_config FOR SELECT
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE aca_form_config.id_entidade = e.ent::uuid
        ))
    );

CREATE POLICY "aca_form_config: insert para membros da entidade"
    ON public.aca_form_config FOR INSERT
    WITH CHECK (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE aca_form_config.id_entidade = e.ent::uuid
        ))
    );

CREATE POLICY "aca_form_config: update para membros da entidade"
    ON public.aca_form_config FOR UPDATE
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE aca_form_config.id_entidade = e.ent::uuid
        ))
    );

CREATE POLICY "aca_form_config: delete para membros da entidade"
    ON public.aca_form_config FOR DELETE
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE aca_form_config.id_entidade = e.ent::uuid
        ))
    );

-- ============================================================
-- RPC: frm_upsert_pergunta
-- ============================================================
CREATE OR REPLACE FUNCTION public.frm_upsert_pergunta(
    p_id uuid,
    p_id_entidade uuid,
    p_nome_interno text,
    p_label text,
    p_placeholder text,
    p_tipo_pergunta text,
    p_opcoes jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id uuid;
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO public.cmct_pergunta_form (id_entidade, nome_interno, label, placeholder, tipo_pergunta, opcoes)
        VALUES (p_id_entidade, p_nome_interno, p_label, p_placeholder, p_tipo_pergunta, p_opcoes)
        RETURNING id INTO v_id;
    ELSE
        UPDATE public.cmct_pergunta_form
        SET nome_interno = p_nome_interno,
            label = p_label,
            placeholder = p_placeholder,
            tipo_pergunta = p_tipo_pergunta,
            opcoes = p_opcoes
        WHERE id = p_id AND id_entidade = p_id_entidade
        RETURNING id INTO v_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- ============================================================
-- RPC: frm_get_perguntas
-- ============================================================
CREATE OR REPLACE FUNCTION public.frm_get_perguntas(
    p_id_entidade uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT COALESCE(jsonb_agg(row_to_json(p) ORDER BY p.created_at DESC), '[]'::jsonb)
    INTO v_result
    FROM public.cmct_pergunta_form p
    WHERE p.id_entidade = p_id_entidade;

    RETURN jsonb_build_object('success', true, 'data', v_result);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- ============================================================
-- RPC: frm_delete_pergunta
-- ============================================================
CREATE OR REPLACE FUNCTION public.frm_delete_pergunta(
    p_id uuid,
    p_id_entidade uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    DELETE FROM public.cmct_pergunta_form
    WHERE id = p_id AND id_entidade = p_id_entidade;
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Pergunta não encontrada.');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
