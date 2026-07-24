-- ============================================================
-- Migration: 20260724000012 — fix aca_atribuir_docente_ciclo v2
-- Descrição: Dropa AMBAS as assinaturas e recria só a correta.
-- ============================================================

DROP FUNCTION IF EXISTS public.aca_atribuir_docente_ciclo(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.aca_atribuir_docente_ciclo(UUID, UUID, UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.aca_atribuir_docente_ciclo(
    p_id_ciclo UUID,
    p_id_modulo_componente UUID,
    p_id_docente UUID,
    p_tipo TEXT DEFAULT 'titular'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_existing_id UUID;
    v_user_expandido UUID;
BEGIN
    IF p_tipo NOT IN ('titular', 'substituto', 'auxiliar') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tipo inválido.');
    END IF;

    SELECT id INTO v_user_expandido
    FROM public.user_expandido
    WHERE id_user = auth.uid()
    LIMIT 1;

    SELECT id INTO v_existing_id
    FROM public.aca_docente_modulo_componente_ciclo
    WHERE id_ciclo = p_id_ciclo
      AND id_modulo_componente = p_id_modulo_componente
      AND id_docente = p_id_docente;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.aca_docente_modulo_componente_ciclo
        SET tipo = p_tipo, modificado_por = v_user_expandido, modificado_em = NOW()
        WHERE id = v_existing_id;

        RETURN jsonb_build_object('success', true, 'id', v_existing_id, 'message', 'Atualizado.');
    ELSE
        INSERT INTO public.aca_docente_modulo_componente_ciclo (
            id_ciclo, id_modulo_componente, id_docente, tipo, criado_por, modificado_por
        ) VALUES (
            p_id_ciclo, p_id_modulo_componente, p_id_docente, p_tipo,
            v_user_expandido, v_user_expandido
        ) RETURNING id INTO v_existing_id;

        RETURN jsonb_build_object('success', true, 'id', v_existing_id, 'message', 'Criado.');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
