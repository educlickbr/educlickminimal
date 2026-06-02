-- ============================================================
-- Migration: Adicionar coluna ano_semestre em aca_ciclo
-- Data: 2026-04-24
-- Descrição: Adiciona controle de ano/semestre acadêmico (ex: 26Is, 26IIs)
-- ============================================================

-- 1. Adicionar a coluna à tabela
ALTER TABLE public.aca_ciclo ADD COLUMN IF NOT EXISTS ano_semestre VARCHAR(10);

-- 2. Atualizar a RPC para aceitar o novo campo
CREATE OR REPLACE FUNCTION public.aca_upsert_ciclo_v1(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_modulo UUID DEFAULT NULL,
    p_id_programa UUID DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_ano_semestre VARCHAR DEFAULT NULL,
    p_data_ini DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id_ciclo UUID;
BEGIN
    IF p_id_entidade IS NULL OR p_id_modulo IS NULL THEN
        RAISE EXCEPTION 'ID da entidade e do módulo são obrigatórios';
    END IF;

    -- 1. Upsert no Ciclo
    INSERT INTO public.aca_ciclo (
        id,
        id_entidade,
        id_modulo,
        descricao,
        ano_semestre,
        data_ini,
        data_fim,
        criado_por,
        modificado_por,
        modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade,
        p_id_modulo,
        p_descricao,
        p_ano_semestre,
        p_data_ini,
        p_data_fim,
        p_usuario_id,
        p_usuario_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        id_modulo      = COALESCE(p_id_modulo, aca_ciclo.id_modulo),
        descricao     = COALESCE(p_descricao, aca_ciclo.descricao),
        ano_semestre  = p_ano_semestre,
        data_ini      = COALESCE(p_data_ini, aca_ciclo.data_ini),
        data_fim      = COALESCE(p_data_fim, aca_ciclo.data_fim),
        modificado_por = p_usuario_id,
        modificado_em  = NOW()
    RETURNING id INTO v_id_ciclo;

    -- 2. Vincular ao Programa (se solicitado)
    IF p_id_programa IS NOT NULL THEN
        INSERT INTO public.aca_ciclo_programa (id_ciclo, id_programa, id_entidade, criado_por)
        VALUES (v_id_ciclo, p_id_programa, p_id_entidade, p_usuario_id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_id_ciclo,
        'message', 'Ciclo salvo com sucesso'
    );
END;
$$;
