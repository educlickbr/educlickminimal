-- ============================================================
-- Migration: 20260713100019 — Remove check email_verificado
-- ============================================================
-- Sobrescreve a RPC aca_verificar_codigo sem o bloqueio
-- de email_verificado. Esse campo não é mais usado neste
-- fluxo — a verificação é só do código, não do email.
-- ============================================================

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
            'message', 'Nenhum código de verificação foi gerado. Solicite um novo.'
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

GRANT EXECUTE ON FUNCTION public.aca_verificar_codigo(UUID, TEXT) TO authenticated;
