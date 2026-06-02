-- ============================================================
-- RPC: aca_mover_aula
-- Data: 2026-05-04
-- Descrição: Move uma aula para outra data, preservando o horário.
--            Troca apenas a parte de data em dt_hora_ini e dt_hora_fim.
--            Segurança garantida pelo RLS de aca_calendario.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_mover_aula(
    p_id_aula     uuid,
    p_nova_data   date,
    p_id_entidade uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_hora_ini timetz;
    v_hora_fim timetz;
BEGIN
    -- Captura os horários atuais antes de alterar
    SELECT
        dt_hora_ini::timetz,
        dt_hora_fim::timetz
    INTO v_hora_ini, v_hora_fim
    FROM public.aca_calendario
    WHERE id = p_id_aula
      AND id_entidade = p_id_entidade;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Aula não encontrada ou sem permissão.');
    END IF;

    -- Atualiza combinando a nova data com os horários originais
    UPDATE public.aca_calendario
    SET
        dt_hora_ini   = (p_nova_data::timestamp + v_hora_ini::interval) AT TIME ZONE 'UTC',
        dt_hora_fim   = (p_nova_data::timestamp + v_hora_fim::interval) AT TIME ZONE 'UTC',
        modificado_em = NOW()
    WHERE id = p_id_aula
      AND id_entidade = p_id_entidade;

    RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
