-- ============================================================
-- Migration: fix_lms_get_avaliacao_completa
-- Data: 2026-08-06
-- Descrição: Corrige lms_get_avaliacao_completa — os ORDER BY
--   sub.criado_em e alt.criado_em referenciavam campos que
--   não estavam no SELECT das subqueries.
--   Fix: adiciona p.criado_em e rp.criado_em aos SELECTs.
-- ============================================================

DROP FUNCTION IF EXISTS public.lms_get_avaliacao_completa(
    p_id_conteudo UUID,
    p_id_entidade UUID
);

CREATE OR REPLACE FUNCTION public.lms_get_avaliacao_completa(
    p_id_conteudo UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_avaliacao RECORD;
    v_perguntas JSONB;
    v_result JSONB;
BEGIN
    -- Garante que o conteúdo pertence à entidade
    SELECT av.*
    INTO v_avaliacao
    FROM public.lms_avaliacao av
    JOIN public.lms_conteudo c ON c.id = av.id_conteudo
    WHERE av.id_conteudo = p_id_conteudo
      AND c.id_entidade = p_id_entidade;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('avaliacao', 'null'::jsonb, 'perguntas', '[]'::jsonb);
    END IF;

    -- Perguntas com alternativas (padrão subquery com alias)
    SELECT COALESCE((
        SELECT jsonb_agg(sub ORDER BY sub.ordem, sub.criado_em) FROM (
            SELECT
                p.id, p.tipo, p.enunciado, p.pontuacao, p.obrigatoria, p.ordem, p.id_arquivo,
                p.criado_em,
                COALESCE((
                    SELECT jsonb_agg(alt ORDER BY alt.ordem, alt.criado_em) FROM (
                        SELECT rp.id, rp.texto, rp.correta, rp.ordem, rp.id_arquivo, rp.criado_em
                        FROM public.lms_resposta_possivel rp
                        WHERE rp.id_pergunta = p.id
                    ) alt
                ), '[]'::jsonb) AS alternativas
            FROM public.lms_pergunta p
            WHERE p.id_avaliacao = v_avaliacao.id
        ) sub
    ), '[]'::jsonb)
    INTO v_perguntas;

    SELECT jsonb_build_object(
        'avaliacao', jsonb_build_object(
            'id', v_avaliacao.id,
            'nome', v_avaliacao.nome,
            'descricao', v_avaliacao.descricao,
            'id_arquivo_referencia', v_avaliacao.id_arquivo_referencia,
            'ordem_perguntas', v_avaliacao.ordem_perguntas
        ),
        'perguntas', v_perguntas
    ) INTO v_result;

    RETURN v_result;
END;
$$;
