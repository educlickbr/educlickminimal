-- ============================================================
-- RPC: aca_mover_aula (FIX)
-- Data: 2026-05-04
-- Descrição: Corrige o erro de cast de timetz para interval.
--            Extrai o time em UTC e combina com a nova data.
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
BEGIN
    UPDATE public.aca_calendario
    SET
        -- Extrai a hora exata em UTC e aplica sobre a nova data, garantindo a timezone UTC
        dt_hora_ini   = (p_nova_data + (dt_hora_ini AT TIME ZONE 'UTC')::time) AT TIME ZONE 'UTC',
        dt_hora_fim   = (p_nova_data + (dt_hora_fim AT TIME ZONE 'UTC')::time) AT TIME ZONE 'UTC',
        modificado_em = NOW()
    WHERE id = p_id_aula
      AND id_entidade = p_id_entidade;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Aula não encontrada ou sem permissão.');
    END IF;

    RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
