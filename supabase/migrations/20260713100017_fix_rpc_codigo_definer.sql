-- ============================================================
-- Migration: 20260713100017 — Fix RPCs codigo como DEFINER
-- ============================================================
-- aca_gerar_codigo_verificacao e aca_verificar_codigo precisam
-- ser SECURITY DEFINER porque:
--   1. Gerar código: UPDATE user_expandido (bloqueado por RLS)
--   2. Verificar código: SELECT user_expandido (bloqueado por RLS)
-- Ambos são chamados por usuários não-admin (docente no login).
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_gerar_codigo_verificacao(
    p_id_user_expandido UUID,
    p_validade_minutos INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_codigo TEXT;
    v_hash TEXT;
BEGIN
    v_codigo := LPAD(floor(random() * 1000000)::TEXT, 6, '0');
    v_hash := encode(sha256(v_codigo::bytea), 'hex');

    UPDATE public.user_expandido
    SET codigo_verificacao_hash = v_hash,
        codigo_verificacao_expira = NOW() + (p_validade_minutos || ' minutes')::INTERVAL,
        codigo_verificacao_tentativas = 0,
        email_verificado = false
    WHERE id = p_id_user_expandido;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuário não encontrado.'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'codigo', v_codigo,
        'expira_em', to_char(NOW() + (p_validade_minutos || ' minutes')::INTERVAL, 'HH24:MI')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.aca_verificar_codigo(
    p_id_user_expandido UUID,
    p_codigo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_hash_input TEXT;
BEGIN
    SELECT codigo_verificacao_hash, codigo_verificacao_expira,
           codigo_verificacao_tentativas, email_verificado
    INTO v_user
    FROM public.user_expandido
    WHERE id = p_id_user_expandido;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuário não encontrado.'
        );
    END IF;

    IF v_user.codigo_verificacao_hash IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum código de verificação foi gerado.'
        );
    END IF;

    IF v_user.codigo_verificacao_expira < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Código expirado. Solicite um novo.'
        );
    END IF;

    IF v_user.codigo_verificacao_tentativas >= 5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Muitas tentativas. Solicite um novo código.'
        );
    END IF;

    UPDATE public.user_expandido
    SET codigo_verificacao_tentativas = codigo_verificacao_tentativas + 1
    WHERE id = p_id_user_expandido;

    v_hash_input := encode(sha256(p_codigo::bytea), 'hex');

    IF v_hash_input = v_user.codigo_verificacao_hash THEN
        UPDATE public.user_expandido
        SET codigo_verificacao_hash = NULL,
            codigo_verificacao_expira = NULL,
            codigo_verificacao_tentativas = 0
        WHERE id = p_id_user_expandido;

        RETURN jsonb_build_object('success', true, 'message', 'Código verificado com sucesso!');
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Código inválido. Tentativas restantes: ' || (5 - v_user.codigo_verificacao_tentativas)
        );
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_gerar_codigo_verificacao(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aca_verificar_codigo(UUID, TEXT) TO authenticated;
