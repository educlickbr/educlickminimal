-- Migration: Padronização do retorno da RPC aca_get_modulos_do_curso
-- Data: 2026-04-08

CREATE OR REPLACE FUNCTION public.aca_get_modulos_do_curso(p_id_curso UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT jsonb_agg(sub)
    INTO v_itens
    FROM (
        SELECT 
            cm.id as id_vinculo,
            cm.id_modulo,
            m.nome_modulo,
            m.descricao,
            m.carga_horaria,
            cm.ordem
        FROM public.aca_curso_modulo cm
        JOIN public.aca_modulo m ON m.id = cm.id_modulo
        WHERE cm.id_curso = p_id_curso
        ORDER BY cm.ordem ASC
    ) sub;

    RETURN COALESCE(v_itens, '[]'::jsonb);
END;
$$;
