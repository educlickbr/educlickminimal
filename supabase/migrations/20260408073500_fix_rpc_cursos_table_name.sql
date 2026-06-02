-- Migration: Correção do nome da tabela de relação curso/módulo
-- Data: 2026-04-08

-- 1. Corrigir aca_get_cursos_paginado
CREATE OR REPLACE FUNCTION public.aca_get_cursos_paginado(
  p_id_entidade uuid,
  p_pagina integer DEFAULT 1,
  p_limite integer DEFAULT 20,
  p_busca text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_offset integer;
  v_total integer;
  v_itens jsonb;
  v_result jsonb;
BEGIN
  v_offset := (p_pagina - 1) * p_limite;

  -- Contagem total com busca
  SELECT count(*) INTO v_total
  FROM public.aca_curso c
  WHERE c.id_entidade = p_id_entidade
    AND (p_busca IS NULL OR p_busca = '' OR c.nome_curso ILIKE '%' || p_busca || '%');

  -- Busca itens corrigindo para public.aca_curso_modulo
  SELECT jsonb_agg(sub) INTO v_itens
  FROM (
    SELECT 
      c.*,
      a.nome_area,
      (SELECT count(*) FROM public.aca_curso_modulo mc WHERE mc.id_curso = c.id) as qtd_modulos
    FROM public.aca_curso c
    LEFT JOIN public.aca_area a ON a.id = c.id_area
    WHERE c.id_entidade = p_id_entidade
      AND (p_busca IS NULL OR p_busca = '' OR c.nome_curso ILIKE '%' || p_busca || '%')
    ORDER BY c.nome_curso ASC
    LIMIT p_limite OFFSET v_offset
  ) sub;

  SELECT jsonb_build_object(
    'success', true,
    'itens', COALESCE(v_itens, '[]'::jsonb),
    'total', v_total,
    'pagina', p_pagina,
    'limite', p_limite
  ) INTO v_result;

  RETURN v_result;
END;
$$;
