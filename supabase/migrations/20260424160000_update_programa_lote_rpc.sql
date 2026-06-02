-- ============================================================
-- RPC: aca_create_programas_lote
-- Data: 2026-04-24
-- Descrição: Cria programas (ofertas) baseados em ciclos selecionados.
-- Suporta estratégia 'unica' (1 programa engloba todos os ciclos)
-- Ou 'separada' (1 programa gerado para cada ciclo com suporte a nomes customizados por ciclo)
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_create_programas_lote(
    p_id_entidade UUID,
    p_id_curso UUID,
    p_descricao TEXT,
    p_ciclos UUID[],
    p_estrategia TEXT,
    p_usuario_id UUID,
    p_descricoes JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_programa_id UUID;
    v_ciclo_id UUID;
    v_nome_modulo TEXT;
    v_nome_personalizado TEXT;
    v_descricao_final TEXT;
BEGIN
    IF array_length(p_ciclos, 1) IS NULL THEN
        RAISE EXCEPTION 'Nenhum ciclo selecionado para compor o programa.';
    END IF;

    IF p_estrategia = 'unica' THEN
        -- Cria 1 Programa consolidado
        INSERT INTO public.aca_programa (id_entidade, id_curso, descricao, criado_por)
        VALUES (p_id_entidade, p_id_curso, p_descricao, p_usuario_id)
        RETURNING id INTO v_programa_id;

        -- Vincula todos os ciclos a esse único programa
        FOREACH v_ciclo_id IN ARRAY p_ciclos
        LOOP
            INSERT INTO public.aca_ciclo_programa (id_entidade, id_ciclo, id_programa, criado_por)
            VALUES (p_id_entidade, v_ciclo_id, v_programa_id, p_usuario_id);
        END LOOP;
        
    ELSIF p_estrategia = 'separada' THEN
        -- Para cada ciclo selecionado, cria 1 programa e o vincula
        FOREACH v_ciclo_id IN ARRAY p_ciclos
        LOOP
            -- Verifica se há um nome específico para esse ciclo no payload JSONB
            IF p_descricoes IS NOT NULL AND p_descricoes ? v_ciclo_id::text THEN
                v_nome_personalizado := p_descricoes->>v_ciclo_id::text;
            ELSE
                v_nome_personalizado := NULL;
            END IF;

            IF v_nome_personalizado IS NOT NULL AND trim(v_nome_personalizado) <> '' THEN
                v_descricao_final := v_nome_personalizado;
            ELSE
                -- Tenta obter o nome do módulo para concatenar na descrição comercial (Fallback)
                SELECT m.nome_modulo INTO v_nome_modulo
                FROM public.aca_ciclo c
                JOIN public.aca_modulo m ON c.id_modulo = m.id
                WHERE c.id = v_ciclo_id;

                v_descricao_final := CASE 
                    WHEN array_length(p_ciclos, 1) > 1 AND v_nome_modulo IS NOT NULL THEN p_descricao || ' - ' || v_nome_modulo
                    ELSE p_descricao 
                END;
            END IF;

            INSERT INTO public.aca_programa (id_entidade, id_curso, descricao, criado_por)
            VALUES (
                p_id_entidade, 
                p_id_curso, 
                v_descricao_final, 
                p_usuario_id
            )
            RETURNING id INTO v_programa_id;

            INSERT INTO public.aca_ciclo_programa (id_entidade, id_ciclo, id_programa, criado_por)
            VALUES (p_id_entidade, v_ciclo_id, v_programa_id, p_usuario_id);
        END LOOP;
    ELSE
        RAISE EXCEPTION 'Estratégia de agrupamento inválida: %', p_estrategia;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Programa(s) e vínculos criados com sucesso');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
