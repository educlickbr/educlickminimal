-- ============================================================
-- RPC: aca_criar_matricula
-- Cria matrícula do aluno no programa.
-- Pode ser chamada do webhook (pago) ou do checkout (grátis).
-- ============================================================
CREATE OR REPLACE FUNCTION public.aca_criar_matricula(
    p_id_entidade UUID,
    p_id_programa UUID,
    p_id_usuario UUID,
    p_id_pedido UUID DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
    v_existente UUID;
BEGIN
    -- Verificar se já existe matrícula
    SELECT id INTO v_existente
    FROM public.aca_matricula
    WHERE id_programa = p_id_programa AND id_usuario = p_id_usuario;

    IF v_existente IS NOT NULL THEN
        -- Já matriculado, retorna sucesso
        RETURN jsonb_build_object('success', true, 'id', v_existente, 'message', 'Aluno já matriculado');
    END IF;

    INSERT INTO public.aca_matricula (
        id_entidade, id_programa, id_usuario, id_pedido,
        criado_por, modificado_por
    )
    VALUES (
        p_id_entidade, p_id_programa, p_id_usuario, p_id_pedido,
        COALESCE(p_usuario_id, p_id_usuario), COALESCE(p_usuario_id, p_id_usuario)
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- ============================================================
-- RPC: aca_get_minhas_matriculas
-- Retorna matrículas do aluno logado com dados do programa
-- ============================================================
CREATE OR REPLACE FUNCTION public.aca_get_minhas_matriculas()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_user_expandido_id UUID;
    v_itens JSONB;
BEGIN
    SELECT id INTO v_user_expandido_id
    FROM public.user_expandido
    WHERE id_user = auth.uid()
    LIMIT 1;

    IF v_user_expandido_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Usuário não encontrado');
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', m.id,
            'id_programa', m.id_programa,
            'id_pedido', m.id_pedido,
            'criado_em', m.criado_em,
            'programa_descricao', prog.descricao,
            'programa_gratuito', prog.gratuito,
            'oferta_slug', of.slug,
            'id_oferta', of.id,
            'valor_pago_centavos', pd.valor_pago_centavos
        )
        ORDER BY m.criado_em DESC
    ) INTO v_itens
    FROM public.aca_matricula m
    JOIN public.aca_programa prog ON prog.id = m.id_programa
    LEFT JOIN public.com_pedido pd ON pd.id = m.id_pedido AND pd.status::text = 'concluido'
    LEFT JOIN public.com_oferta of ON of.id = pd.id_oferta
    WHERE m.id_usuario = v_user_expandido_id;

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_itens, '[]'::jsonb)
    );
END;
$$;
