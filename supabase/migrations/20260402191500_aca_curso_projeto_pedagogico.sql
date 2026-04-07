-- ============================================================
-- Migration: Evolução do Curso e Projeto Pedagógico
-- Data: 2026-04-02
-- Descrição: Adiciona Projeto Pedagógico e Vagas Sugeridas ao Curso
-- ============================================================

-- 1. Evolução da tabela aca_curso
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='aca_curso' AND column_name='projeto_pedagogico') THEN
        ALTER TABLE public.aca_curso ADD COLUMN projeto_pedagogico TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='aca_curso' AND column_name='vagas_sugeridas') THEN
        ALTER TABLE public.aca_curso ADD COLUMN vagas_sugeridas INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. RPC: aca_upsert_curso_v1 (Update para v2 logic)
-- Substituindo a anterior para incluir os novos campos
CREATE OR REPLACE FUNCTION public.aca_upsert_curso_v1(
    p_id uuid DEFAULT NULL,
    p_id_entidade uuid DEFAULT NULL,
    p_nome_curso text DEFAULT NULL,
    p_descricao text DEFAULT NULL,
    p_projeto_pedagogico text DEFAULT NULL,
    p_vagas_sugeridas integer DEFAULT 0,
    p_usuario_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id uuid;
BEGIN
    INSERT INTO public.aca_curso (
        id, id_entidade, nome_curso, descricao, projeto_pedagogico, vagas_sugeridas, criado_por, modificado_por, modificado_em
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()), p_id_entidade, p_nome_curso, p_descricao, p_projeto_pedagogico, p_vagas_sugeridas, p_usuario_id, p_usuario_id, now()
    )
    ON CONFLICT (id) DO UPDATE SET
        nome_curso = EXCLUDED.nome_curso,
        descricao = EXCLUDED.descricao,
        projeto_pedagogico = EXCLUDED.projeto_pedagogico,
        vagas_sugeridas = EXCLUDED.vagas_sugeridas,
        modificado_por = EXCLUDED.modificado_por,
        modificado_em = now()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 3. RPC: aca_get_modulos_do_curso
CREATE OR REPLACE FUNCTION public.aca_get_modulos_do_curso(
    p_id_curso uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens jsonb;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'id_vinculo', cm.id,
        'id_modulo', m.id,
        'nome_modulo', m.nome_modulo,
        'carga_horaria', m.carga_horaria,
        'ordem', cm.ordem
    ) ORDER BY cm.ordem ASC)
    INTO v_itens
    FROM public.aca_curso_modulo cm
    JOIN public.aca_modulo m ON m.id = cm.id_modulo
    WHERE cm.id_curso = p_id_curso;

    RETURN jsonb_build_object('success', true, 'itens', COALESCE(v_itens, '[]'::jsonb));
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. RPC: aca_vincular_modulo_ao_curso
CREATE OR REPLACE FUNCTION public.aca_vincular_modulo_ao_curso(
    p_id_curso uuid,
    p_id_modulo uuid,
    p_id_entidade uuid,
    p_usuario_id uuid,
    p_ordem integer DEFAULT 0,
    p_remover boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    IF p_remover THEN
        DELETE FROM public.aca_curso_modulo 
        WHERE id_curso = p_id_curso AND id_modulo = p_id_modulo;
        RETURN jsonb_build_object('success', true, 'message', 'Módulo removido da trilha');
    END IF;

    INSERT INTO public.aca_curso_modulo (
        id_curso, id_modulo, id_entidade, ordem, criado_por, modificado_por
    ) VALUES (
        p_id_curso, p_id_modulo, p_id_entidade, p_ordem, p_usuario_id, p_usuario_id
    )
    ON CONFLICT (id_curso, id_modulo) DO UPDATE SET
        ordem = EXCLUDED.ordem,
        modificado_por = EXCLUDED.modificado_por,
        modificado_em = now();

    RETURN jsonb_build_object('success', true, 'message', 'Módulo vinculado à trilha');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
