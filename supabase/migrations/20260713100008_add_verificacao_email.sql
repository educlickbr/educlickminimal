-- ============================================================
-- Migration: 20260713100008 — Código de verificação para docente
-- ============================================================
-- Adiciona colunas em user_expandido para verificação por código
-- enviado ao email. O código é armazenado como hash SHA-256
-- com expiração e controle de tentativas.
-- ============================================================

ALTER TABLE public.user_expandido
ADD COLUMN IF NOT EXISTS codigo_verificacao_hash TEXT,
ADD COLUMN IF NOT EXISTS codigo_verificacao_expira TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS codigo_verificacao_tentativas INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT false;

-- -------------------------------------------------------
-- RPC: aca_gerar_codigo_verificacao
-- -------------------------------------------------------
-- Gera um código de 6 dígitos, armazena o hash e retorna
-- o código limpo (para enviar ao email via Power Automate).
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_gerar_codigo_verificacao(
    p_id_user_expandido UUID,
    p_validade_minutos INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_codigo TEXT;
    v_hash TEXT;
BEGIN
    -- Gera código aleatório de 6 dígitos
    v_codigo := LPAD(floor(random() * 1000000)::TEXT, 6, '0');

    -- Gera hash SHA-256
    v_hash := encode(sha256(v_codigo::bytea), 'hex');

    -- Armazena hash, expiração e reseta tentativas
    UPDATE public.user_expandido
    SET codigo_verificacao_hash = v_hash,
        codigo_verificacao_expira = NOW() + (p_validade_minutos || ' minutes')::INTERVAL,
        codigo_verificacao_tentativas = 0
    WHERE id = p_id_user_expandido;

    -- Retorna o código limpo (quem chamar esta RPC deve
    -- enviá-lo ao email do usuário, NÃO expor na tela)
    RETURN jsonb_build_object(
        'success', true,
        'codigo', v_codigo,
        'expira_em', to_char(NOW() + (p_validade_minutos || ' minutes')::INTERVAL, 'HH24:MI')
    );
END;
$$;

-- -------------------------------------------------------
-- RPC: aca_verificar_codigo
-- -------------------------------------------------------
-- Verifica se o código informado corresponde ao hash armazenado.
-- Respeita expiração e limite de tentativas.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_verificar_codigo(
    p_id_user_expandido UUID,
    p_codigo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_user RECORD;
    v_hash_input TEXT;
BEGIN
    -- Busca dados do usuário
    SELECT codigo_verificacao_hash, codigo_verificacao_expira,
           codigo_verificacao_tentativas, email_verificado
    INTO v_user
    FROM public.user_expandido
    WHERE id = p_id_user_expandido;

    -- Já verificado?
    IF v_user.email_verificado THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Email já foi verificado.'
        );
    END IF;

    -- Código não gerado?
    IF v_user.codigo_verificacao_hash IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum código de verificação foi gerado.'
        );
    END IF;

    -- Expirado?
    IF v_user.codigo_verificacao_expira < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Código expirado. Solicite um novo.'
        );
    END IF;

    -- Limite de tentativas (5)
    IF v_user.codigo_verificacao_tentativas >= 5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Muitas tentativas. Solicite um novo código.'
        );
    END IF;

    -- Incrementa tentativas
    UPDATE public.user_expandido
    SET codigo_verificacao_tentativas = codigo_verificacao_tentativas + 1
    WHERE id = p_id_user_expandido;

    -- Compara hash
    v_hash_input := encode(sha256(p_codigo::bytea), 'hex');

    IF v_hash_input = v_user.codigo_verificacao_hash THEN
        -- Código correto! Marca como verificado e limpa hash
        UPDATE public.user_expandido
        SET email_verificado = true,
            codigo_verificacao_hash = NULL,
            codigo_verificacao_expira = NULL,
            codigo_verificacao_tentativas = 0
        WHERE id = p_id_user_expandido;

        RETURN jsonb_build_object('success', true, 'message', 'Email verificado com sucesso!');
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Código inválido. Tentativas restantes: ' || (5 - v_user.codigo_verificacao_tentativas - 1)
        );
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_gerar_codigo_verificacao(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aca_verificar_codigo(UUID, TEXT) TO authenticated;
