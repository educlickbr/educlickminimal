-- ============================================================
-- Migration: elegivel_simplify_to_cpf
-- Data: 2026-07-03
-- Descrição: Simplifica elegível para usar CPF como identificador
-- ============================================================

-- 1. Drop a constraint antiga e adiciona nova baseada em CPF
ALTER TABLE public.com_oferta_elegivel
  DROP CONSTRAINT IF EXISTS com_oferta_elegivel_oferta_email_key;

-- Remove registros sem CPF (caso existam)
DELETE FROM public.com_oferta_elegivel WHERE cpf IS NULL OR trim(cpf) = '';

-- Adiciona constraint UNIQUE por CPF
ALTER TABLE public.com_oferta_elegivel
  ADD CONSTRAINT com_oferta_elegivel_oferta_cpf_key UNIQUE (id_oferta, cpf);

-- Torna email opcional (pode ser nulo)
ALTER TABLE public.com_oferta_elegivel
  ALTER COLUMN email DROP NOT NULL;

-- ============================================================
-- 2. Atualizar RPC: com_upsert_elegivel (agora baseado em CPF)
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

    IF p_cpf IS NULL OR trim(p_cpf) = '' THEN
        RAISE EXCEPTION 'CPF é obrigatório';
    END IF;

    -- Limpar CPF (só números)
    p_cpf := regexp_replace(p_cpf, '[^0-9]', '', 'g');

    IF length(p_cpf) NOT IN (11, 14) THEN
        RAISE EXCEPTION 'CPF/CNPJ inválido';
    END IF;

    INSERT INTO public.com_oferta_elegivel (
        id, id_entidade, id_oferta, email, cpf, expirado_em, criado_por
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade, p_id_oferta, p_email, p_cpf, p_expirado_em, p_usuario_id
    )
    ON CONFLICT (id_oferta, cpf) DO UPDATE SET
        email = COALESCE(p_email, com_oferta_elegivel.email),
        expirado_em = COALESCE(p_expirado_em, com_oferta_elegivel.expirado_em),
        utilizado_em = CASE
            WHEN p_expirado_em IS NOT NULL AND p_expirado_em <= now() THEN now()
            ELSE com_oferta_elegivel.utilizado_em
        END
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Este CPF já está cadastrado para esta oferta';
    WHEN OTHERS THEN
        RAISE;
END;
$$;


-- ============================================================
-- 3. Atualizar RPC: com_get_elegiveis
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
