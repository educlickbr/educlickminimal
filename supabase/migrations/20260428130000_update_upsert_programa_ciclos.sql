-- ============================================================
-- RPC: aca_upsert_programa
-- Data: 2026-04-28
-- Descrição: Insere ou atualiza um programa. Agora suporta atualização
--            dos ciclos acadêmicos vinculados via parâmetro p_ciclos.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_upsert_programa(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_curso UUID DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL,
    p_ciclos UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
    v_ciclo_id UUID;
BEGIN
    IF p_id_entidade IS NULL THEN
        RAISE EXCEPTION 'ID da entidade é obrigatório';
    END IF;

    IF p_id IS NULL THEN
        INSERT INTO public.aca_programa (
            id,
            id_entidade,
            id_curso,
            descricao,
            criado_por,
            modificado_por,
            modificado_em
        )
        VALUES (
            gen_random_uuid(),
            p_id_entidade,
            p_id_curso,
            p_descricao,
            p_usuario_id,
            p_usuario_id,
            now()
        )
        RETURNING id INTO v_id;
    ELSE
        UPDATE public.aca_programa
        SET
            id_curso = p_id_curso,
            descricao = p_descricao,
            modificado_por = p_usuario_id,
            modificado_em = now()
        WHERE id = p_id AND id_entidade = p_id_entidade
        RETURNING id INTO v_id;
        
        IF v_id IS NULL THEN
            RAISE EXCEPTION 'Programa não encontrado ou sem permissão de edição';
        END IF;
    END IF;

    -- Se o array de ciclos for enviado (mesmo que vazio), atualiza os relacionamentos
    IF p_ciclos IS NOT NULL THEN
        -- Remove todos os vínculos antigos
        DELETE FROM public.aca_ciclo_programa WHERE id_programa = v_id AND id_entidade = p_id_entidade;
        
        -- Insere os novos vínculos baseados no array
        FOREACH v_ciclo_id IN ARRAY p_ciclos
        LOOP
            INSERT INTO public.aca_ciclo_programa (id_entidade, id_ciclo, id_programa, criado_por)
            VALUES (p_id_entidade, v_ciclo_id, v_id, p_usuario_id);
        END LOOP;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
