-- ============================================================
-- Migration: 20260713100012 — Public RPC as SECURITY DEFINER
-- ============================================================
-- A RPC aca_inserir_proposta_publica precisa ser acessível
-- por usuários não autenticados (página /trabalhe-conosco).
-- SECURITY DEFINER é mais seguro que grant anon pois a função
-- roda com permissões do definidor (postgres) sem expor a
-- tabela diretamente ao público.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_inserir_proposta_publica(
    p_id_entidade UUID,
    p_nome TEXT,
    p_email TEXT,
    p_telefone TEXT DEFAULT NULL,
    p_minibio TEXT DEFAULT NULL,
    p_id_curriculo UUID DEFAULT NULL,
    p_id_edital UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.aca_docente_proposta
        (id_entidade, nome, telefone, email, minibio, id_curriculo, id_edital)
    VALUES
        (p_id_entidade, p_nome, p_telefone, p_email, p_minibio, p_id_curriculo, p_id_edital)
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- Remove grant anon (não necessário com SECURITY DEFINER)
REVOKE EXECUTE ON FUNCTION public.aca_inserir_proposta_publica(UUID, TEXT, TEXT, TEXT, TEXT, UUID, UUID) FROM anon;
-- Mantém grant para authenticated (pode ser chamada por admin também)
GRANT EXECUTE ON FUNCTION public.aca_inserir_proposta_publica(UUID, TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;
