-- ============================================================
-- Migration: aca_programa_area
-- Data: 2026-05-07
-- Descrição: Adiciona relacionamento de Área aos Programas e 
--            atualiza as RPCs de criação e upsert para herança.
-- ============================================================

-- 1. Adicionar coluna id_area na tabela aca_programa
ALTER TABLE public.aca_programa ADD COLUMN IF NOT EXISTS id_area UUID NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'aca_programa_id_area_fkey'
    ) THEN
        ALTER TABLE public.aca_programa 
        ADD CONSTRAINT aca_programa_id_area_fkey 
        FOREIGN KEY (id_area) REFERENCES public.aca_area(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- 2. Atualizar RPC: aca_upsert_programa
-- ============================================================
CREATE OR REPLACE FUNCTION public.aca_upsert_programa(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_curso UUID DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL,
    p_ciclos UUID[] DEFAULT NULL,
    p_id_area UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
    v_ciclo_id UUID;
    v_id_area UUID;
BEGIN
    IF p_id_entidade IS NULL THEN
        RAISE EXCEPTION 'ID da entidade é obrigatório';
    END IF;

    -- Lógica de Herança Inteligente de Área
    IF p_id_curso IS NOT NULL THEN
        SELECT id_area INTO v_id_area FROM public.aca_curso WHERE id = p_id_curso;
    ELSE
        v_id_area := p_id_area;
    END IF;

    IF p_id IS NULL THEN
        INSERT INTO public.aca_programa (
            id,
            id_entidade,
            id_curso,
            descricao,
            criado_por,
            modificado_por,
            modificado_em,
            id_area
        )
        VALUES (
            gen_random_uuid(),
            p_id_entidade,
            p_id_curso,
            p_descricao,
            p_usuario_id,
            p_usuario_id,
            now(),
            v_id_area
        )
        RETURNING id INTO v_id;
    ELSE
        UPDATE public.aca_programa
        SET
            id_curso = p_id_curso,
            descricao = p_descricao,
            modificado_por = p_usuario_id,
            modificado_em = now(),
            id_area = v_id_area
        WHERE id = p_id AND id_entidade = p_id_entidade
        RETURNING id INTO v_id;
        
        IF v_id IS NULL THEN
            RAISE EXCEPTION 'Programa não encontrado ou sem permissão de edição';
        END IF;
    END IF;

    IF p_ciclos IS NOT NULL THEN
        DELETE FROM public.aca_ciclo_programa WHERE id_programa = v_id AND id_entidade = p_id_entidade;
        
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


-- ============================================================
-- 3. Atualizar RPC: aca_create_programas_lote
-- ============================================================
CREATE OR REPLACE FUNCTION public.aca_create_programas_lote(
    p_id_entidade UUID,
    p_id_curso UUID,
    p_descricao TEXT,
    p_ciclos UUID[],
    p_estrategia TEXT,
    p_usuario_id UUID,
    p_descricoes JSONB DEFAULT NULL,
    p_id_area UUID DEFAULT NULL
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
    v_id_area UUID;
BEGIN
    IF array_length(p_ciclos, 1) IS NULL THEN
        RAISE EXCEPTION 'Nenhum ciclo selecionado para compor o programa.';
    END IF;

    -- Lógica de Herança Inteligente de Área
    IF p_id_curso IS NOT NULL THEN
        SELECT id_area INTO v_id_area FROM public.aca_curso WHERE id = p_id_curso;
    ELSE
        v_id_area := p_id_area;
    END IF;

    IF p_estrategia = 'unica' THEN
        INSERT INTO public.aca_programa (id_entidade, id_curso, descricao, criado_por, id_area)
        VALUES (p_id_entidade, p_id_curso, p_descricao, p_usuario_id, v_id_area)
        RETURNING id INTO v_programa_id;

        FOREACH v_ciclo_id IN ARRAY p_ciclos
        LOOP
            INSERT INTO public.aca_ciclo_programa (id_entidade, id_ciclo, id_programa, criado_por)
            VALUES (p_id_entidade, v_ciclo_id, v_programa_id, p_usuario_id);
        END LOOP;
        
    ELSIF p_estrategia = 'separada' THEN
        FOREACH v_ciclo_id IN ARRAY p_ciclos
        LOOP
            IF p_descricoes IS NOT NULL AND p_descricoes ? v_ciclo_id::text THEN
                v_nome_personalizado := p_descricoes->>v_ciclo_id::text;
            ELSE
                v_nome_personalizado := NULL;
            END IF;

            IF v_nome_personalizado IS NOT NULL AND trim(v_nome_personalizado) <> '' THEN
                v_descricao_final := v_nome_personalizado;
            ELSE
                SELECT m.nome_modulo INTO v_nome_modulo
                FROM public.aca_ciclo c
                JOIN public.aca_modulo m ON c.id_modulo = m.id
                WHERE c.id = v_ciclo_id;

                v_descricao_final := CASE 
                    WHEN array_length(p_ciclos, 1) > 1 AND v_nome_modulo IS NOT NULL THEN p_descricao || ' - ' || v_nome_modulo
                    ELSE p_descricao 
                END;
            END IF;

            INSERT INTO public.aca_programa (id_entidade, id_curso, descricao, criado_por, id_area)
            VALUES (
                p_id_entidade, 
                p_id_curso, 
                v_descricao_final, 
                p_usuario_id,
                v_id_area
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
