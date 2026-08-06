-- ============================================================
-- Migration: 20260727000100 — is_intervalo em acd_horario
-- Descrição: Adiciona flag para marcar horários como intervalo
--            (almoço, jantar, etc.). Esses slots são ignorados
--            no escopo "Período inteiro" e "Dia inteiro".
-- ============================================================

-- -------------------------------------------------------
-- 1. Adicionar coluna is_intervalo
-- -------------------------------------------------------
ALTER TABLE public.acd_horario
    ADD COLUMN IF NOT EXISTS is_intervalo BOOLEAN NOT NULL DEFAULT false;

-- -------------------------------------------------------
-- 2. Backfill: marcar índices 3 e 6 como intervalo (caso existam)
-- -------------------------------------------------------
UPDATE public.acd_horario
SET is_intervalo = true
WHERE indice IN (3, 6) AND is_intervalo = false;

-- -------------------------------------------------------
-- 3. Atualizar RPC acd_get_horarios (incluir is_intervalo)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_get_horarios(
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'indice', indice,
            'nome_turno', nome_turno,
            'hora_ini', hora_ini::text,
            'hora_fim', hora_fim::text,
            'ativo', ativo,
            'is_intervalo', is_intervalo
        )
        ORDER BY indice
    ) INTO v_result
    FROM public.acd_horario
    WHERE id_entidade = p_id_entidade;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- -------------------------------------------------------
-- 4. Atualizar RPC acd_get_salas_horarios (incluir is_intervalo)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_get_salas_horarios(
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id_sala', s.id,
            'id_horario', h.id,
            'slot_key', s.id::text || '_' || h.id::text,
            'sala_nome', s.nome,
            'sala_cor', s.cor,
            'sala_id', s.id,
            'horario_id', h.id,
            'indice', h.indice,
            'turno_nome', h.nome_turno,
            'hora_ini', h.hora_ini::text,
            'hora_fim', h.hora_fim::text,
            'horario_total', h.hora_ini::text || ' - ' || h.hora_fim::text,
            'is_intervalo', h.is_intervalo
        )
        ORDER BY s.nome, h.indice
    ) INTO v_result
    FROM public.acd_sala s
    CROSS JOIN public.acd_horario h
    WHERE s.id_entidade = p_id_entidade
      AND h.id_entidade = p_id_entidade
      AND s.ativo = true
      AND h.ativo = true;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- -------------------------------------------------------
-- 5. Atualizar RPC acd_upsert_horario (incluir p_is_intervalo)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_upsert_horario(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_indice INTEGER DEFAULT NULL,
    p_nome_turno TEXT DEFAULT NULL,
    p_hora_ini TIME DEFAULT NULL,
    p_hora_fim TIME DEFAULT NULL,
    p_ativo BOOLEAN DEFAULT true,
    p_is_intervalo BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id IS NOT NULL THEN
        UPDATE public.acd_horario
        SET indice = COALESCE(p_indice, indice),
            nome_turno = COALESCE(p_nome_turno, nome_turno),
            hora_ini = COALESCE(p_hora_ini, hora_ini),
            hora_fim = COALESCE(p_hora_fim, hora_fim),
            ativo = COALESCE(p_ativo, ativo),
            is_intervalo = COALESCE(p_is_intervalo, is_intervalo)
        WHERE id = p_id AND id_entidade = p_id_entidade
        RETURNING id INTO v_id;
    ELSE
        INSERT INTO public.acd_horario (id_entidade, indice, nome_turno, hora_ini, hora_fim, ativo, is_intervalo)
        VALUES (p_id_entidade, p_indice, p_nome_turno, p_hora_ini, p_hora_fim, p_ativo, p_is_intervalo)
        RETURNING id INTO v_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;
