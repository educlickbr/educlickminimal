-- ============================================================
-- Migration: com_oferta_elegivel_rpcs
-- Data: 2026-07-03
-- Descrição: RPCs para CRUD de elegíveis de ofertas
-- ============================================================

-- ============================================================
-- 1. Listar elegíveis de uma oferta
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_get_elegiveis(
    p_id_oferta UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'success', true,
        'itens', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'id_oferta', id_oferta,
                    'email', email,
                    'cpf', cpf,
                    'utilizado_em', utilizado_em,
                    'expirado_em', expirado_em,
                    'criado_em', criado_em
                )
                ORDER BY criado_em DESC
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM public.com_oferta_elegivel
    WHERE id_oferta = p_id_oferta AND id_entidade = p_id_entidade;

    RETURN v_result;
END;
$$;


-- ============================================================
-- 2. Adicionar elegível
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_upsert_elegivel(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_oferta UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_cpf TEXT DEFAULT NULL,
    p_expirado_em TIMESTAMPTZ DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id_entidade IS NULL OR p_id_oferta IS NULL THEN
        RAISE EXCEPTION 'Entidade e oferta são obrigatórios';
    END IF;

    IF p_email IS NULL OR trim(p_email) = '' THEN
        RAISE EXCEPTION 'Email é obrigatório';
    END IF;

    -- Validar email simples
    IF p_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Email inválido';
    END IF;

    INSERT INTO public.com_oferta_elegivel (
        id, id_entidade, id_oferta, email, cpf, expirado_em, criado_por
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade, p_id_oferta, lower(trim(p_email)),
        NULLIF(trim(p_cpf), ''), p_expirado_em, p_usuario_id
    )
    ON CONFLICT (id_oferta, email) DO UPDATE SET
        cpf = COALESCE(NULLIF(trim(p_cpf), ''), com_oferta_elegivel.cpf),
        expirado_em = COALESCE(p_expirado_em, com_oferta_elegivel.expirado_em),
        utilizado_em = CASE
            WHEN p_expirado_em IS NOT NULL AND p_expirado_em <= now() THEN now()
            ELSE com_oferta_elegivel.utilizado_em
        END
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Este email já está cadastrado para esta oferta';
    WHEN OTHERS THEN
        RAISE;
END;
$$;


-- ============================================================
-- 3. Remover elegível
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_delete_elegivel(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    DELETE FROM public.com_oferta_elegivel
    WHERE id = p_id AND id_entidade = p_id_entidade;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registro não encontrado';
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Elegível removido com sucesso');
END;
$$;


-- ============================================================
-- 4. Verificar elegibilidade (público)
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_verificar_elegibilidade(
    p_slug TEXT,
    p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_oferta_id UUID;
    v_count INTEGER;
BEGIN
    -- Buscar oferta pelo slug
    SELECT id INTO v_oferta_id FROM public.com_oferta
    WHERE slug = p_slug AND is_ativa = true
    LIMIT 1;

    IF v_oferta_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Oferta não encontrada');
    END IF;

    -- Verificar se o email está na lista
    SELECT COUNT(*) INTO v_count
    FROM public.com_oferta_elegivel
    WHERE id_oferta = v_oferta_id
      AND email = lower(trim(p_email))
      AND (expirado_em IS NULL OR expirado_em > now())
      AND utilizado_em IS NULL;

    RETURN jsonb_build_object(
        'success', true,
        'elegivel', v_count > 0
    );
END;
$$;
