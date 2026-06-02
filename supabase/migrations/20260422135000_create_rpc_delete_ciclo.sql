-- ============================================================
-- RPC: aca_delete_ciclo
-- Data: 2026-04-22
-- Descrição: Remove um ciclo acadêmico. Verifica dependências
-- primárias (Turmas Master) antes de prosseguir. Trata a limpeza
-- de aca_calendario (sem restrição em cascata) automaticamente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_delete_ciclo(
    p_id_entidade UUID,
    p_id_ciclo UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    v_qtd_programas INTEGER;
BEGIN
    -- 1. Verifica se o ciclo está atrelado a um programa
    SELECT count(*) INTO v_qtd_programas
    FROM public.aca_ciclo_programa
    WHERE id_ciclo = p_id_ciclo;

    IF v_qtd_programas > 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este ciclo já está vinculado a um programa/turma e não pode ser excluído.');
    END IF;

    -- 2. Limpeza prévia: Remover dias do calendário que dependem deste ciclo
    -- (Necessário pois aca_calendario tem restrição NOT NULL sem CASCADE)
    DELETE FROM public.aca_calendario 
    WHERE id_ciclo = p_id_ciclo;

    -- 3. Exclusão principal do Ciclo
    DELETE FROM public.aca_ciclo 
    WHERE id = p_id_ciclo 
      AND id_entidade = p_id_entidade;

    -- Verifica se algo foi deletado
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ciclo não encontrado ou você não tem permissão para excluí-lo.');
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Ciclo excluído com sucesso.');

EXCEPTION WHEN OTHERS THEN
    -- Erros de constraint (como uma dependência futura não tratada acima)
    IF SQLSTATE = '23503' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Não é possível excluir o ciclo pois ele possui dependências externas (Ex: presenças, notas ou planos de aula vinculados).');
    END IF;
    
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
