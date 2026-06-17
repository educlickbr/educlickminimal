-- ============================================================
-- Migration: rpc_inscricao_seletivo
-- Data: 2026-06-16
-- Descrição: RPCs para verificação e criação de inscrições
--            em processos seletivos com proteção anti-duplicidade.
-- ============================================================

-- -----------------------------------------------------------
-- RPC: aca_verificar_inscricao
-- Verifica se o usuário autenticado já possui inscrição
-- ativa para um determinado processo seletivo.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_verificar_inscricao(
    p_id_processo UUID,
    p_tipo_processo public.tipo_processo,
    p_tipo_candidatura public.tipo_candidatura
)
RETURNS TABLE(
    id UUID,
    id_usuario UUID,
    id_programa UUID,
    id_processo UUID,
    status_dados TEXT,
    status_documentacao TEXT,
    status_candidatura TEXT,
    tipo_processo public.tipo_processo,
    tipo_candidatura public.tipo_candidatura,
    criado_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_expandido_id UUID;
BEGIN
    -- Obtém o user_expandido_id do usuário autenticado
    SELECT ue.id INTO v_user_expandido_id
    FROM public.user_expandido ue
    WHERE ue.id_user = auth.uid()
    LIMIT 1;

    IF v_user_expandido_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado ou perfil não encontrado';
    END IF;

    RETURN QUERY
    SELECT
        psi.id,
        psi.id_usuario,
        psi.id_programa,
        psi.id_processo,
        psi.status_dados,
        psi.status_documentacao,
        psi.status_candidatura,
        psi.tipo_processo,
        psi.tipo_candidatura,
        psi.criado_em
    FROM public.aca_processo_seletivo_inscricoes psi
    WHERE psi.id_usuario = v_user_expandido_id
      AND psi.id_processo = p_id_processo
      AND psi.tipo_processo = p_tipo_processo
      AND psi.tipo_candidatura = p_tipo_candidatura
    LIMIT 1;
END;
$$;


-- -----------------------------------------------------------
-- RPC: aca_criar_inscricao
-- Cria uma nova inscrição em processo seletivo.
-- Verifica duplicidade antes de inserir.
-- O trigger aca_sync_processo_seletivo_inscricao_context
-- preenche automaticamente id_programa e id_entidade.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_criar_inscricao(
    p_id_processo UUID,
    p_tipo_processo public.tipo_processo,
    p_tipo_candidatura public.tipo_candidatura
)
RETURNS TABLE(
    id UUID,
    id_usuario UUID,
    id_programa UUID,
    id_processo UUID,
    status_dados TEXT,
    status_documentacao TEXT,
    status_candidatura TEXT,
    tipo_processo public.tipo_processo,
    tipo_candidatura public.tipo_candidatura,
    criado_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_expandido_id UUID;
    v_existing_id UUID;
    v_new_id UUID;
BEGIN
    -- Obtém o user_expandido_id do usuário autenticado
    SELECT ue.id INTO v_user_expandido_id
    FROM public.user_expandido ue
    WHERE ue.id_user = auth.uid()
    LIMIT 1;

    IF v_user_expandido_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado ou perfil não encontrado';
    END IF;

    -- Verifica duplicidade
    SELECT psi.id INTO v_existing_id
    FROM public.aca_processo_seletivo_inscricoes psi
    WHERE psi.id_usuario = v_user_expandido_id
      AND psi.id_processo = p_id_processo
      AND psi.tipo_processo = p_tipo_processo
      AND psi.tipo_candidatura = p_tipo_candidatura
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Já existe: retorna a inscrição existente em vez de dar erro
        RETURN QUERY
        SELECT
            psi.id,
            psi.id_usuario,
            psi.id_programa,
            psi.id_processo,
            psi.status_dados,
            psi.status_documentacao,
            psi.status_candidatura,
            psi.tipo_processo,
            psi.tipo_candidatura,
            psi.criado_em
        FROM public.aca_processo_seletivo_inscricoes psi
        WHERE psi.id = v_existing_id;
        RETURN;
    END IF;

    -- Insere nova inscrição (trigger preenche id_programa, id_entidade)
    INSERT INTO public.aca_processo_seletivo_inscricoes (
        id_usuario,
        id_processo,
        tipo_processo,
        tipo_candidatura,
        criado_por
    ) VALUES (
        v_user_expandido_id,
        p_id_processo,
        p_tipo_processo,
        p_tipo_candidatura,
        v_user_expandido_id
    )
    RETURNING aca_processo_seletivo_inscricoes.id INTO v_new_id;

    -- Retorna o registro criado
    RETURN QUERY
    SELECT
        psi.id,
        psi.id_usuario,
        psi.id_programa,
        psi.id_processo,
        psi.status_dados,
        psi.status_documentacao,
        psi.status_candidatura,
        psi.tipo_processo,
        psi.tipo_candidatura,
        psi.criado_em
    FROM public.aca_processo_seletivo_inscricoes psi
    WHERE psi.id = v_new_id;
END;
$$;
